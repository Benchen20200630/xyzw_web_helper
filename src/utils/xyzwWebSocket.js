/**
 * XYZW WebSocket 客户端
 * 基于 readable-xyzw-ws.js 重构，适配本项目架构
 */

import { bonProtocol, g_utils } from './bonProtocol.js'

/** 生成 [min,max] 的随机整数 */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/** Promise 版 sleep */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

/**
 * 命令注册器：保存每个 cmd 的默认体，发送时与 params 合并
 */
export class CommandRegistry {
  constructor(encoder, enc) {
    this.encoder = encoder
    this.enc = enc
    this.commands = new Map()
  }

  /** 注册命令 */
  register(cmd, defaultBody = {}) {
    this.commands.set(cmd, (ack = 0, seq = 0, params = {}) => ({
      cmd,
      ack,
      seq,
      code: 0,
      rtt: randInt(0, 500),
      time: Date.now(),
      body: this.encoder?.bon?.encode
        ? this.encoder.bon.encode({ ...defaultBody, ...params })
        : undefined,
      c: undefined,
      hint: undefined,
    }))
    return this
  }

  /** 特例：系统心跳的 ack 用的是 "_sys/ack" */
  registerHeartbeat() {
    this.commands.set("heart_beat", (ack, seq) => ({
      cmd: "_sys/ack",
      ack,
      seq,
      time: Date.now(),
      body: undefined,
      c: undefined,
      hint: undefined,
    }))
    return this
  }

  /** 生成最终可发送的二进制 */
  encodePacket(raw) {
    if (this.encoder?.encode && this.enc) {
      // 使用加密编码
      return this.encoder.encode(raw, this.enc)
    } else {
      // 降级到JSON字符串
      return JSON.stringify(raw)
    }
  }

  /** 构造报文 */
  build(cmd, ack, seq, params) {
    const fn = this.commands.get(cmd)
    if (!fn) throw new Error(`Unknown cmd: ${cmd}`)
    return fn(ack, seq, params)
  }
}

/** 预注册游戏命令 */
export function registerDefaultCommands(reg) {
  return reg.registerHeartbeat()
    // 角色/系统
    .register("role_getroleinfo", {
      clientVersion: "1.65.3-wx",
      inviteUid: 0,
      platform: "hortor",
      platformExt: "mix",
      scene: "",
    })
    .register("system_getdatabundlever", { isAudit: false })
    .register("system_buygold", { buyNum: 1 })
    .register("system_claimhangupreward")
    .register("system_signinreward")
    .register("system_mysharecallback", { isSkipShareCard: true, type: 2 })

    // 任务相关
    .register("task_claimdailypoint", { taskId: 1 })
    .register("task_claimdailyreward", { rewardId: 0 })
    .register("task_claimweekreward", { rewardId: 0 })

    // 好友/招募
    .register("friend_batch", { friendId: 0 })
    .register("hero_recruit", { byClub: false, recruitNumber: 1, recruitType: 3 })
    .register("item_openbox", { itemId: 2001, number: 10 })

    // 竞技场
    .register("arena_startarea")
    .register("arena_getareatarget", { refresh: false })
    .register("fight_startareaarena", { targetId: 530479307 })
    .register("arena_getarearank", { rankType: 0 })

    // 商店
    .register("store_goodslist", { storeId: 1 })
    .register("store_buy", { goodsId: 1 })
    .register("store_purchase", { goodsId: 1 })
    .register("store_refresh", { storeId: 1 })

    // 军团
    .register("legion_getinfo")
    .register("legion_signin")
    .register("legion_getwarrank")

    // 邮件
    .register("mail_getlist", { category: [0, 4, 5], lastId: 0, size: 60 })
    .register("mail_claimallattachment", { category: 0 })

    // 学习问答
    .register("study_startgame")
    .register("study_answer")
    .register("study_claimreward", { rewardId: 1 })

    // 战斗相关
    .register("fight_starttower")
    .register("fight_startboss")
    .register("fight_startlegionboss")
    .register("fight_startdungeon")
    .register("fight_startpvp")

    // 瓶子机器人
    .register("bottlehelper_claim")
    .register("bottlehelper_start", { bottleType: -1 })
    .register("bottlehelper_stop", { bottleType: -1 })

    // 军团匹配和签到
    .register("legionmatch_rolesignup")
    .register("legion_signin")

    // 神器抽奖
    .register("artifact_lottery", { lotteryNumber: 1, newFree: true, type: 1 })
    
    // 灯神相关
    .register("genie_sweep", { genieId: 1 })
    .register("genie_buysweep")
    
    // 礼包相关
    .register("discount_claimreward", { discountId: 1 })
    .register("card_claimreward", { cardId: 1 })

    // 爬塔相关
    .register("tower_getinfo")
    .register("tower_claimreward")

    // 队伍相关
    .register("presetteam_getinfo")
    .register("presetteam_getteam")
    .register("presetteam_setteam")
    .register("presetteam_saveteam", { teamId: 1 })
    .register("role_gettargetteam")

    // 排名相关
    .register("rank_getroleinfo")
    
    // 梦魇相关
    .register("nightmare_getroleinfo")
}

/**
 * XYZW WebSocket 客户端
 */
export class XyzwWebSocketClient {
  constructor({ url, utils, heartbeatMs = 5000 }) {
    this.url = url
    this.utils = utils || g_utils
    this.enc = this.utils?.getEnc ? this.utils.getEnc("auto") : undefined

    this.socket = null
    this.ack = 1
    this.seq = 0
    this.sendQueue = []
    this.sendQueueTimer = null
    this.heartbeatTimer = null
    this.heartbeatInterval = heartbeatMs

    this.dialogStatus = false
    this.messageListener = null
    this.showMsg = false
    this.connected = false

    this.promises = Object.create(null)
    this.registry = registerDefaultCommands(new CommandRegistry(this.utils, this.enc))

    // WebSocket客户端初始化

    // 状态回调
    this.onConnect = null
    this.onDisconnect = null
    this.onError = null
  }

  /** 初始化连接 */
  init() {
    console.log(`🔗 连接: ${this.url.split('?')[0]}`)

    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      console.log(`✅ 连接成功`)
      this.connected = true
      // 启动心跳机制
      this._setupHeartbeat()
      // 启动消息队列处理
      this._processQueueLoop()
      if (this.onConnect) this.onConnect()
    }

    this.socket.onmessage = (evt) => {
      try {
        let packet
        if (typeof evt.data === "string") {
          packet = JSON.parse(evt.data)
        } else if (evt.data instanceof ArrayBuffer) {
          // 二进制数据需要自动检测并解码
          packet = this.utils?.parse ? this.utils.parse(evt.data, "auto") : evt.data
        } else if (evt.data instanceof Blob) {
          // 处理Blob数据
          // 收到Blob数据
          evt.data.arrayBuffer().then(buffer => {
            try {
              packet = this.utils?.parse ? this.utils.parse(buffer, "auto") : buffer
              // Blob解析完成
              
              // 处理消息体解码（ProtoMsg会自动解码）
              if (packet instanceof Object && packet.rawData !== undefined) {
                // ProtoMsg消息
              } else if (packet.body && packet.body instanceof Uint8Array) {
                try {
                  if (this.utils && this.utils.bon && this.utils.bon.decode) {
                    const decodedBody = this.utils.bon.decode(packet.body)
                    // 手动解码成功
                    // 不修改packet.body，而是创建一个新的属性存储解码后的数据
                    packet.decodedBody = decodedBody
                  } else {
                    // BON解码器不可用
                  }
                } catch (error) {
                  // 消息体解码失败
                }
              }
              
              if (this.showMsg) {
                // 收到Blob消息
              }
              
              // 回调处理
              if (this.messageListener) {
                this.messageListener(packet)
              }
              
              // Promise 响应处理
              this._handlePromiseResponse(packet)
              
            } catch (error) {
              console.error('Blob解析失败:', error.message)
            }
          })
          return // 异步处理，直接返回
        } else {
          console.warn('⚠️ 未知数据类型:', typeof evt.data, evt.data)
          packet = evt.data
        }

        if (this.showMsg) {
          console.log(`📨 收到消息:`, packet)
        }

        // 处理消息体解码（ProtoMsg会自动解码）
        if (packet instanceof Object && packet.rawData !== undefined) {
          console.log('✅ ProtoMsg消息，使用rawData:', packet.rawData)
        } else if (packet.body && packet.body instanceof Uint8Array) {
          try {
            if (this.utils && this.utils.bon && this.utils.bon.decode) {
              const decodedBody = this.utils.bon.decode(packet.body)
              // 手动解码成功
              // 不修改packet.body，而是创建一个新的属性存储解码后的数据
              packet.decodedBody = decodedBody
            } else {
              // BON解码器不可用
            }
          } catch (error) {
            // 消息体解码失败
          }
        }

        // 回调处理
        if (this.messageListener) {
          this.messageListener(packet)
        }

        // Promise 响应处理
        this._handlePromiseResponse(packet)

      } catch (error) {
        console.error(`消息处理失败:`, error.message)
      }
    }

    this.socket.onclose = (evt) => {
      console.log(`🔌 WebSocket 连接关闭:`, evt.code, evt.reason)
      console.log(`🔍 关闭详情:`, {
        code: evt.code,
        reason: evt.reason || '未提供原因',
        wasClean: evt.wasClean,
        timestamp: new Date().toISOString()
      })
      this.connected = false
      this._clearTimers()
      if (this.onDisconnect) this.onDisconnect(evt)
    }

    this.socket.onerror = (error) => {
      console.error(`❌ WebSocket 错误:`, error)
      this.connected = false
      this._clearTimers()
      if (this.onError) this.onError(error)
    }
  }

  /** 注册消息回调 */
  setMessageListener(fn) {
    this.messageListener = fn
  }

  /** 控制台消息开关 */
  setShowMsg(val) {
    this.showMsg = !!val
  }

  /** 重连 */
  reconnect() {
    this.disconnect()
    setTimeout(() => this.init(), 1000)
  }

  /** 断开连接 */
  disconnect() {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
    this.connected = false
    this._clearTimers()
  }

  /** 发送消息 */
  send(cmd, params = {}, options = {}) {
    if (!this.connected) {
      console.warn(`⚠️ WebSocket 未连接，消息已入队: ${cmd}`)
      if (!this.dialogStatus) {
        this.dialogStatus = true
        this.reconnect()
        setTimeout(() => { this.dialogStatus = false }, 2000)
      }
    }

    const task = {
      cmd,
      params,
      respKey: options.respKey || cmd,
      sleep: options.sleep || 0,
      onSent: options.onSent
    }

    this.sendQueue.push(task)
    return task
  }

  /** Promise 版发送 */
  sendWithPromise(cmd, params = {}, timeoutMs = 5000) {
    const respKey = `${cmd}_${this.seq + 1}`

    return new Promise((resolve, reject) => {
      if (!this.connected && !this.socket) {
        return reject(new Error("WebSocket 连接已关闭"))
      }

      // 设置 Promise 状态
      this.promises[respKey] = { resolve, reject }

      // 超时处理
      const timer = setTimeout(() => {
        delete this.promises[respKey]
        reject(new Error(`请求超时: ${cmd} (${timeoutMs}ms)`))
      }, timeoutMs)

      // 发送消息
      this.send(cmd, params, {
        respKey,
        onSent: () => {
          clearTimeout(timer)
        }
      })
    })
  }

  /** 发送心跳 */
  sendHeartbeat() {
    console.log('💓 发送心跳消息')
    this.send("heart_beat", {}, { respKey: "_sys/ack" })
  }

  /** 获取角色信息 */
  getRoleInfo(params = {}) {
    return this.sendWithPromise("role_getroleinfo", params)
  }

  /** 获取数据版本 */
  getDataBundleVersion(params = {}) {
    return this.sendWithPromise("system_getdatabundlever", params)
  }

  /** 签到 */
  signIn() {
    return this.sendWithPromise("system_signinreward")
  }

  /** 领取日常任务奖励 */
  claimDailyReward(rewardId = 0) {
    return this.sendWithPromise("task_claimdailyreward", { rewardId })
  }

  /** =============== 内部方法 =============== */

  /** 设置心跳 */
  _setupHeartbeat() {
    // 延迟3秒后开始发送第一个心跳，避免连接刚建立就发送
    setTimeout(() => {
      if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
        console.log('💓 开始发送首次心跳')
        this.sendHeartbeat()
      }
    }, 3000)
    
    // 设置定期心跳
    this.heartbeatTimer = setInterval(() => {
      if (this.connected && this.socket?.readyState === WebSocket.OPEN) {
        this.sendHeartbeat()
      } else {
        console.log('⚠️ 心跳检查失败: 连接状态异常')
      }
    }, this.heartbeatInterval)
  }

  /** 队列处理循环 */
  _processQueueLoop() {
    if (this.sendQueueTimer) clearInterval(this.sendQueueTimer)

    this.sendQueueTimer = setInterval(async () => {
      if (!this.sendQueue.length) return
      if (!this.connected || this.socket?.readyState !== WebSocket.OPEN) return

      const task = this.sendQueue.shift()
      if (!task) return

      try {
        // 构建报文
        const raw = this.registry.build(task.cmd, this.ack, this.seq, task.params)
            if (task.cmd !== "heart_beat") this.seq++

        // 编码并发送
        const bin = this.registry.encodePacket(raw)
        this.socket?.send(bin)

        if (this.showMsg || task.cmd === "heart_beat") {
          console.log(`📤 发送消息: ${task.cmd}`, task.params)
          if (this.showMsg) {
            console.log(`🔐 原始数据:`, raw)
            console.log(`🚀 编码后数据:`, bin)
            console.log(`🔧 编码类型:`, typeof bin, bin instanceof Uint8Array ? '✅ Uint8Array (加密)' : '❌ String (明文)')
            if (bin instanceof Uint8Array && bin.length > 0) {
              console.log(`🎯 加密验证: 前8字节 [${Array.from(bin.slice(0, 8)).join(', ')}]`)
            }
          }
        }

        // 触发发送回调
        if (task.onSent) {
          try {
            task.onSent(task.respKey, task.cmd)
          } catch (error) {
            console.warn('发送回调执行失败:', error)
          }
        }

        // 可选延时
        if (task.sleep) await sleep(task.sleep)

      } catch (error) {
        console.error(`❌ 发送消息失败: ${task.cmd}`, error)
      }
    }, 50)
  }

  /** 处理 Promise 响应 */
  _handlePromiseResponse(packet) {
    const cmd = packet.cmd
    if (!cmd) return

    // 命令到响应的映射 - 处理响应命令与原始命令不匹配的情况
    const responseToCommandMap = {
      'role_getroleinforesp': 'role_getroleinfo',
      'system_signinrewardresp': 'system_signinreward',
      'hero_recruitresp': 'hero_recruit',
      'friend_batchresp': 'friend_batch',
      'system_claimhanguprewardresp': 'system_claimhangupreward',
      'task_claimdailyrewardresp': 'task_claimdailyreward',
      'task_claimweekrewardresp': 'task_claimweekreward',
      'item_openboxresp': 'item_openbox',
      'bottlehelper_claimresp': 'bottlehelper_claim',
      'bottlehelper_startresp': 'bottlehelper_start',
      'bottlehelper_stopresp': 'bottlehelper_stop',
      'legion_signinresp': 'legion_signin',
      'fight_startbossresp': 'fight_startboss',
      'fight_startlegionbossresp': 'fight_startlegionboss',
      'fight_startareaarenaresp': 'fight_startareaarena',
      'arena_startarearesp': 'arena_startarea',
      'arena_getareatargetresp': 'arena_getareatarget',
      'presetteam_getinforesp': 'presetteam_getinfo',
      'presetteam_saveteamresp': 'presetteam_saveteam',
      'mail_claimallattachmentresp': 'mail_claimallattachment',
      'store_buyresp': 'store_purchase'
    }

    // 获取原始命令名
    const originalCmd = responseToCommandMap[cmd] || cmd

    // 查找对应的 Promise
    for (const [key, promise] of Object.entries(this.promises)) {
      // 检查是否匹配原始命令或响应命令
      if (key.startsWith(originalCmd) || key.startsWith(cmd) || cmd === key) {
        delete this.promises[key]

        if (packet.code === 0 || packet.code === undefined) {
          promise.resolve(packet.body || packet)
        } else {
          promise.reject(new Error(`服务器错误: ${packet.code} - ${packet.hint || '未知错误'}`))
        }
        break
      }
    }
  }

  /** 清理定时器 */
  _clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.sendQueueTimer) {
      clearInterval(this.sendQueueTimer)
      this.sendQueueTimer = null
    }
  }
}

/** 默认导出 */
export default XyzwWebSocketClient

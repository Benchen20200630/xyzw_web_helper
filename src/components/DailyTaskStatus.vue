<template>
  <div class="daily-task-container">
    <div class="task-header">
      <div class="header-left">
        <img
          src="/icons/174023274867420.png"
          alt="每日任务"
          class="task-icon"
        >
        <div class="title-container">
          <h3>每日任务</h3>
          <p>当前进度</p>
        </div>
      </div>
      
      <div class="header-right">
        <div 
          class="status-indicator"
          :class="{ completed: isFull }"
          @click="showTaskDetails = true"
        >
          <div
            class="status-dot"
            :class="{ completed: isFull }"
          />
          <span>任务详情</span>
        </div>
        
        <button
          class="settings-button"
          @click="showSettings = true"
        >
          <n-icon><Settings /></n-icon>
        </button>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="progress-container">
      <n-progress
        type="line"
        :percentage="dailyPoint"
        :height="8"
        :border-radius="4"
        :color="progressColor"
        rail-color="#f3f4f6"
      />
    </div>

    <!-- 提示信息 -->
    <div class="info-container">
      右上角小齿轮有惊喜
    </div>

    <!-- 一键执行按钮 -->
    <button 
      class="execute-button"
      :disabled="busy"
      @click="runDailyFix"
    >
      <span
        v-if="busy"
        class="loading-text"
      >
        <svg
          class="loading-icon"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
          />
        </svg>
        执行中...
      </span>
      <span v-else>一键补差</span>
    </button>

    <!-- 任务设置模态框 -->
    <n-modal
      v-model:show="showSettings"
      preset="card"
      title="任务设置"
      style="width: 400px"
    >
      <template #header>
        <div class="modal-header">
          <n-icon><Settings /></n-icon>
          <span>任务设置</span>
        </div>
      </template>
      
      <div class="settings-content">
        <div class="settings-grid">
          <!-- 竞技场设置 -->
          <div class="setting-item">
            <label class="setting-label">竞技场阵容</label>
            <n-select
              v-model:value="settings.arenaFormation"
              :options="formationOptions"
              size="small"
            />
          </div>
          
          <!-- BOSS设置 -->
          <div class="setting-item">
            <label class="setting-label">BOSS阵容</label>
            <n-select
              v-model:value="settings.bossFormation"
              :options="formationOptions"
              size="small"
            />
          </div>
          
          <!-- BOSS次数 -->
          <div class="setting-item">
            <label class="setting-label">BOSS次数</label>
            <n-select
              v-model:value="settings.bossTimes"
              :options="bossTimesOptions"
              size="small"
            />
          </div>
          
          <!-- 功能开关 -->
          <div class="setting-switches">
            <div class="switch-row">
              <span class="switch-label">领罐子</span>
              <n-switch
                v-model:value="settings.claimBottle"
              />
            </div>
            
            <div class="switch-row">
              <span class="switch-label">领挂机</span>
              <n-switch
                v-model:value="settings.claimHangUp"
              />
            </div>
            
            <div class="switch-row">
              <span class="switch-label">竞技场</span>
              <n-switch
                v-model:value="settings.arenaEnable"
              />
            </div>
            
            <div class="switch-row">
              <span class="switch-label">开宝箱</span>
              <n-switch
                v-model:value="settings.openBox"
              />
            </div>
            
            <div class="switch-row">
              <span class="switch-label">领取邮件奖励</span>
              <n-switch
                v-model:value="settings.claimEmail"
              />
            </div>
            
            <div class="switch-row">
              <span class="switch-label">付费招募</span>
              <n-switch
                v-model:value="settings.payRecruit"
              />
            </div>
          </div>
        </div>
      </div>
    </n-modal>

    <!-- 任务详情模态框 -->
    <n-modal
      v-model:show="showTaskDetails"
      preset="card"
      title="每日任务详情"
      style="width: 400px"
    >
      <template #header>
        <div class="modal-header">
          <n-icon><Calendar /></n-icon>
          <span>每日任务详情</span>
        </div>
      </template>
      
      <div class="task-list">
        <div 
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
        >
          <div class="task-item-left">
            <n-icon 
              class="task-status-icon"
              :class="{ completed: task.completed }"
            >
              <CheckmarkCircle v-if="task.completed" />
              <EllipseOutline v-else />
            </n-icon>
            <span class="task-name">{{ task.name }}</span>
          </div>
          <n-tag
            :type="task.completed ? 'success' : 'default'"
            size="small"
          >
            {{ task.completed ? '已完成' : '未完成' }}
          </n-tag>
        </div>
      </div>
    </n-modal>

    <!-- 执行日志模态框 -->
    <n-modal
      v-model:show="showLog"
      preset="card"
      title="任务执行日志"
      style="width: 500px"
    >
      <template #header>
        <div class="modal-header">
          <n-icon><DocumentText /></n-icon>
          <span>任务执行日志</span>
        </div>
      </template>
      
      <div
        ref="logContainer"
        class="log-container"
      >
        <div 
          v-for="logItem in logList"
          :key="logItem.time + logItem.message"
          class="log-item"
        >
          <span class="log-time">{{ logItem.time }}</span>
          <span 
            class="log-message"
            :class="{
              error: logItem.type === 'error',
              success: logItem.type === 'success'
            }"
          >
            {{ logItem.message }}
          </span>
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { 
  Settings, 
  Calendar,
  CheckmarkCircle,
  EllipseOutline,
  DocumentText
} from '@vicons/ionicons5'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const showSettings = ref(false)
const showTaskDetails = ref(false)
const showLog = ref(false)
const busy = ref(false)
const logContainer = ref(null)

// 任务设置 - 基于参考代码
const settings = reactive({
  arenaFormation: 1,
  bossFormation: 1,
  bossTimes: 4,
  claimBottle: true,
  payRecruit: true,
  openBox: true,
  arenaEnable: true,
  claimHangUp: true,
  claimEmail: true
})

// 每日任务列表 - 基于参考代码
const tasks = ref([
  { id: 1, name: '登录一次游戏', completed: false, loading: false },
  { id: 2, name: '分享一次游戏', completed: false, loading: false },
  { id: 3, name: '赠送好友3次金币', completed: false, loading: false },
  { id: 4, name: '进行2次招募', completed: false, loading: false },
  { id: 5, name: '领取5次挂机奖励', completed: false, loading: false },
  { id: 6, name: '进行3次点金', completed: false, loading: false },
  { id: 7, name: '开启3次宝箱', completed: false, loading: false },
  { id: 12, name: '黑市购买1次物品（请设置采购清单）', completed: false, loading: false },
  { id: 13, name: '进行1场竞技场战斗', completed: false, loading: false },
  { id: 14, name: '收获1个任意盐罐', completed: false, loading: false }
])

// 选项配置
const formationOptions = [1,2,3,4].map(v => ({ label: `阵容${v}`, value: v }))
const bossTimesOptions = [0,1,2,3,4].map(v => ({ label: `${v}次`, value: v }))

// 计算属性 - 基于参考代码逻辑
const roleInfo = computed(() => {
  return tokenStore.selectedTokenRoleInfo
})

const roleDailyPoint = computed(() => {
  return roleInfo.value?.role?.dailyTask?.dailyPoint ?? 0
})

// 进度 - 基于参考代码
const dailyPoint = computed(() => Math.min(roleDailyPoint.value, 100))
const isFull = computed(() => dailyPoint.value >= 100)
const progressColor = computed(() => isFull.value ? '#10b981' : '#3b82f6')

// 日志系统 - 基于参考代码的log函数
const logList = ref([])
const LOG_MAX = 500

const log = (message, type = 'info') => {
  const time = new Date().toLocaleTimeString()
  logList.value.push({ time, message, type })
  
  if (logList.value.length > LOG_MAX) {
    logList.value.splice(0, logList.value.length - LOG_MAX)
  }
  
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// 超时执行器 - 基于参考代码的 callWithRetry 函数
const callWithRetry = async (fn, opt = {}) => {
  const timeoutMs = opt?.timeoutMs ?? 30000
  const retries = opt?.retries ?? 1
  const delayMs = opt?.delayMs ?? 600

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await Promise.race([
        fn(),
        new Promise((_, rej) => setTimeout(() => rej(new Error(`请求超时(${timeoutMs}ms)`)), timeoutMs))
      ])
      return r
    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(res => setTimeout(res, delayMs * (attempt + 1)))
    }
  }
  throw new Error('unexpected')
}

// 消息错误处理 - 基于参考代码的onRaw函数
const onRaw = (evt) => {
  const err = evt?._raw?.error
  if (err) log(String(err), 'error')
}

// 同步服务器任务完成状态 - 基于参考代码的 syncCompleteFromServer 函数
const syncCompleteFromServer = (resp) => {
  if (!resp?.role?.dailyTask?.complete) return
  const complete = resp.role.dailyTask.complete
  const isDone = (v) => v === -1
  
  Object.keys(complete).forEach(k => {
    const id = Number(k)
    const idx = tasks.value.findIndex(t => t.id === id)
    if (idx >= 0) tasks.value[idx].completed = isDone(complete[k])
  })
}

// 刷新角色信息 - 基于参考代码
const refreshRoleInfo = async () => {
  if (!tokenStore.selectedToken) {
    throw new Error('没有选中的Token')
  }
  const tokenId = tokenStore.selectedToken.id
  const e = await callWithRetry(() => 
    tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {})
  )
  return e
}

// 一键补差 - 基于参考代码的runDailyFix函数  
const runDailyFix = async () => {
  if (!tokenStore.selectedToken || busy.value) return
  
  // 设置消息监听和禁用显示
  tokenStore.setMessageListener(onRaw)
  tokenStore.setShowMsg(false)
  
  busy.value = true
  showLog.value = true
  logList.value = []
  
  log('开始执行任务...')
  
  try {
    const e = await refreshRoleInfo()
    log('获取角色信息成功')
    
    await U(e, log)
    
    log('任务执行完成', 'success')
    message.success('任务处理完成')
    
  } catch (e) {
    const msg = e?.message ?? (typeof e === 'string' ? e : JSON.stringify(e))
    log(`任务执行失败: ${msg}`, 'error')
    message.error('任务执行失败')
  } finally {
    tokenStore.setShowMsg(true)
    busy.value = false
  }
}

// 执行器U函数 - 基于完整参考代码重写
const U = async (roleInfoResp, logFn, progress) => {
  const tokenId = tokenStore.selectedToken.id
  
  logFn?.('检查每日任务完成情况')

  // 1) 已完成任务 → 生成要跳过的指令"指纹"
  const officialList = [
    { id: 1,  name: '登录一次游戏', cmds: [] },
    { id: 2,  name: '分享一次游戏', cmds: ['system_mysharecallback'] },
    { id: 3,  name: '赠送好友3次金币', cmds: ['friend_batch'] },
    { id: 4,  name: '进行2次招募', cmds: ['hero_recruit'] },
    { id: 5,  name: '领取5次挂机奖励', cmds: ['system_claimhangupreward'] },
    { id: 6,  name: '进行3次点金', cmds: ['system_buygold'] },
    { id: 7,  name: '开启3次宝箱', cmds: ['item_openbox'] },
    { id: 12, name: '黑市购买1次物品（请设置采购清单）', cmds: ['store_purchase'] },
    { id: 13, name: '进行1场竞技场战斗' },
    { id: 14, name: '收获1个任意盐罐', cmds: ['bottlehelper_stop', 'bottlehelper_start', 'bottlehelper_claim'] }
  ]

  const completedMap = roleInfoResp.role?.dailyTask?.complete ?? {}
  const doneIds = new Set()
  const skipFp = new Set()
  for (const k of Object.keys(completedMap)) {
    const id = Number(k)
    if (completedMap[k] === -1) {
      doneIds.add(id)
      const found = officialList.find(x => x.id === id)
      if (found?.cmds) {
        for (const c of found.cmds) skipFp.add(fpOf({ cmd: c, respKey: '' }))
      }
      logFn?.(`${officialList.find(x=>x.id===id)?.name ?? id} 完成`, 'success')
    }
  }

  // 2) 组装动态命令段（依据统计与设置）
  const cmds = []

  // 2.1 切换 BOSS 阵容
  cmds.push({ cmd: 'presetteam_getinfo', respKey: 'presetteam_getinforesp', sendMsg: '准备切换阵容' })
  cmds.push({ cmd: 'presetteam_saveteam', respKey: 'presetteam_saveteamresp', params: { teamId: settings.bossFormation }, sendMsg: '切换攻打BOSS阵容中', successMsg: `成功切换阵容 ${settings.bossFormation}` })

  // 2.2 军团 BOSS 次数
  const alreadyLegion = Number(roleInfoResp.role?.statistics?.['legion:boss'] ?? 0)
  const leftLegion = isTodayAvailable(roleInfoResp.role?.statisticsTime?.['legion:boss']) ? settings.bossTimes : Math.max(settings.bossTimes - alreadyLegion, 0)
  for (let i = 0; i < leftLegion; i++) cmds.push({ cmd: 'fight_startlegionboss', respKey: 'fight_startlegionbossresp', sendMsg: '攻打每日俱乐部BOSS', successMsg: '攻打每日俱乐部BOSS成功' })

  // 2.3 免费"钓鱼"
  if (isTodayAvailable(roleInfoResp.role?.statisticsTime?.['artifact:normal:lottery:time'])) {
    for (let i = 0; i < 3; i++) cmds.push({ cmd: 'artifact_lottery', respKey: 'syncrewardresp', sendMsg: '每日免费钓鱼', successMsg: '每日免费钓鱼成功' })
  }

  // 2.4 灯神免费扫荡（1..4）
  const kingdoms = ['魏国','蜀国','吴国','群雄']
  for (let gid = 1; gid <= 4; gid++) {
    if (isTodayAvailable(roleInfoResp.role?.statisticsTime?.[`genie: daily: free: ${gid}`])) {
      cmds.push({ cmd: 'genie_sweep', respKey: 'syncrewardresp', params: { genieId: gid }, sendMsg: `领取 ${kingdoms[gid-1]} 免费灯神扫荡`, successMsg: `领取 ${kingdoms[gid-1]} 免费灯神扫荡成功` })
    }
  }

  // 2.5 用户开关
  if (settings.claimBottle) cmds.push({ cmd: 'bottlehelper_claim', respKey: 'syncrewardresp', sendMsg: '领取盐罐奖励', successMsg: '领取盐罐奖励成功' })
  if (settings.payRecruit) cmds.push({ cmd: 'hero_recruit', respKey: 'hero_recruitresp', params: { recruitType: 1 }, sendMsg: '招募付费1次', successMsg: '招募1次成功' })
  if (settings.openBox) cmds.push({ cmd: 'item_openbox', respKey: 'item_openboxresp', params: { itemId: 2001, number: 10 }, sendMsg: '开启木质宝箱10个', successMsg: '开启木质宝箱10个成功' })

  if (isTodayAvailable(roleInfoResp.role?.statisticsTime?.['buy:gold'])) {
    for (let i = 0; i < 3; i++) cmds.push({ cmd: 'system_buygold', respKey: 'syncrewardresp', sendMsg: '免费点金', successMsg: '免费点金成功' })
  }

  if (settings.claimHangUp) {
    for (let i = 0; i < 4; i++) cmds.push({ cmd: 'system_mysharecallback', respKey: 'syncresp', params: { isSkipShareCard: true, type: 2 }, sendMsg: '挂机加钟', successMsg: '加钟成功' })
    cmds.push({ cmd: 'system_claimhangupreward', respKey: 'system_claimhanguprewardresp', sendMsg: '领取挂机奖励', successMsg: '领取挂机奖励成功' })
    cmds.push({ cmd: 'system_mysharecallback', respKey: 'syncresp', params: { isSkipShareCard: true, type: 2 }, sendMsg: '挂机加钟', successMsg: '加钟成功' })
  }

  if (settings.claimEmail) cmds.push({ cmd: 'mail_claimallattachment', respKey: 'mail_claimallattachmentresp', sendMsg: '领取邮件奖励', successMsg: '邮件奖励领取成功' })

  // 2.6 固定段
  const dow = new Date().getDay()
  const DAY_BOSS_MAP = [9904, 9905, 9901, 9902, 9903, 9904, 9905]
  for (let i = 0; i < 3; i++) cmds.push({ cmd: 'fight_startboss', respKey: 'fight_startbossresp', params: { bossId: DAY_BOSS_MAP[dow] }, sendMsg: '攻打每日BOSS', successMsg: '攻打每日BOSS成功' })
  for (let i = 0; i < 3; i++) cmds.push({ cmd: 'genie_buysweep', respKey: 'syncrewardresp', sendMsg: '领取每日免费扫荡卷', successMsg: '领取每日免费扫荡卷成功' })

  cmds.push(
    { cmd: 'system_signinreward', respKey: 'syncrewardresp', sendMsg: '福利签到', successMsg: '同步奖励' },
    { cmd: 'discount_claimreward', respKey: 'syncrewardresp', sendMsg: '领取每日礼包', successMsg: '同步奖励' },
    { cmd: 'legion_signin', respKey: 'legion_signinresp', sendMsg: '俱乐部签到', successMsg: '同步奖励' },
    { cmd: 'card_claimreward', respKey: 'syncrewardresp', sendMsg: '领取每日免费礼包', successMsg: '同步奖励' },
    { cmd: 'card_claimreward', respKey: 'syncrewardresp', params: { cardId: 4003 }, sendMsg: '领取永久卡礼包', successMsg: '同步奖励' },
    { cmd: 'system_mysharecallback', respKey: 'syncresp', sendMsg: '分享一次游戏', successMsg: '分享一次游戏成功' },
    { cmd: 'friend_batch', respKey: 'friend_batchresp', sendMsg: '赠送好友金币', successMsg: '赠送好友金币成功' },
    { cmd: 'hero_recruit', respKey: 'hero_recruitresp', sendMsg: '免费招募1次', successMsg: '招募1次成功' }
  )

  // 领取积分：taskId 1..10
  for (let i = 1; i <= 10; i++) cmds.push({ cmd: 'task_claimdailypoint', respKey: 'syncresp', params: { taskId: i }, sendMsg: '领取任务奖励', successMsg: '领取任务奖励成功' })
  // 领取日/周奖励
  cmds.push({ cmd: 'task_claimdailyreward', respKey: 'syncrewardresp', sendMsg: '领取任务奖励', successMsg: '领取任务奖励成功' })
  cmds.push({ cmd: 'task_claimweekreward',  respKey: 'syncrewardresp', sendMsg: '领取任务奖励', successMsg: '领取任务奖励成功' })

  // 3) 过滤掉"已完成任务对应的指令"与真正重复项（按指纹）
  const uniq = new Map()
  for (const it of cmds) {
    const fp = fpOf(it)
    if (skipFp.has(fpOf({ cmd: it.cmd, respKey: '', params: it.params }))) continue
    if (!uniq.has(fp)) uniq.set(fp, it)
  }
  const queue = Array.from(uniq.values())

  // 4) 竞技场（单独先跑）
  if (settings.arenaEnable && completedMap[13] !== -1) {
    logFn?.('竞技场自动战斗')
    await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, 'presetteam_getinfo', {}))
      .then(async (resp) => {
        if (resp?.presetTeamInfo?.useTeamId === settings.arenaFormation) {
          logFn?.(`当前阵容为阵容 ${settings.arenaFormation}`)
        } else {
          await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, 'presetteam_saveteam', { teamId: settings.arenaFormation }))
          logFn?.(`切换竞技场阵容为阵容 ${settings.arenaFormation}`)
        }
      })
    await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, 'arena_startarea', {}))
    for (let i = 0; i < 3; i++) {
      const target = await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', {}))
      const targetId = target?.roleList?.[0]?.roleId
      if (targetId) await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, 'fight_startareaarena', { targetId }))
    }
  } else {
    logFn?.('今日竞技场任务已完成', 'success')
  }

  // 5) 依次执行队列 + 进度
  const total = queue.length || 1
  let done = 0
  for (const it of queue) {
    if (it.sendMsg) logFn?.(it.sendMsg)
    try {
      await callWithRetry(() => tokenStore.sendMessageWithPromise(tokenId, it.cmd, it.params || {}))
      if (it.successMsg) logFn?.(it.successMsg, 'success')
    } catch (err) {
      logFn?.('任务执行失败', 'error')
    } finally {
      done += 1
      const pct = Math.min(100, Math.floor(done * 100 / total))
      if (progress && tokenId) progress(tokenId, pct)
    }
  }

  // 收尾：确保 100%
  if (progress && tokenId) progress(tokenId, 100)
}

// 辅助函数 - 基于参考代码
const fpOf = (item) => {
  return `${item.cmd}|${JSON.stringify(item.params ?? {})}`
}

const getCurrentRole = () => {
  return tokenStore.selectedToken ? { roleId: tokenStore.selectedToken.id } : null
}

const loadSettings = (roleId) => {
  try {
    const raw = localStorage.getItem(`daily-settings:${roleId}`)
    return raw ? JSON.parse(raw) : null
  } catch (error) { 
    console.error('Failed to load settings:', error)
    return null 
  }
}

const saveSettings = (roleId, s) => {
  try { 
    localStorage.setItem(`daily-settings:${roleId}`, JSON.stringify(s)) 
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const isTodayAvailable = (v) => { return !!v }

// 监听设置变化 - 基于参考代码的watch逻辑
watch(settings, (cur) => {
  const role = getCurrentRole()
  if (role) saveSettings(role.roleId, cur)
}, { deep: true })

// 监听token选择变化
watch(() => tokenStore.selectedToken, async (newToken, oldToken) => {
  if (newToken && newToken !== oldToken) {
    // 加载新token的设置
    const saved = loadSettings(newToken.id)
    if (saved) Object.assign(settings, saved)
    
    // 同步任务状态
    syncCompleteFromServer(tokenStore.selectedTokenRoleInfo)
  }
}, { immediate: true })

// 生命周期 - 基于参考代码的onMounted函数
onMounted(async () => {
  // 首次拉取角色信息（如果有选中的token）
  if (tokenStore.selectedToken) {
    try {
      await refreshRoleInfo()
    } catch (error) {
      console.warn('初始化时获取角色信息失败:', error.message)
      // 如果获取失败，尝试发送普通消息（不等待响应）
      try {
        tokenStore.sendMessage(tokenStore.selectedToken.id, 'role_getroleinfo', {})
      } catch (sendError) {
        console.warn('发送角色信息请求失败:', sendError.message)
      }
    }
  }

  const role = getCurrentRole()
  if (role) {
    const saved = loadSettings(role.roleId)
    if (saved) Object.assign(settings, saved)
  }

  // 同步完成态（使用现有的角色信息）
  syncCompleteFromServer(tokenStore.selectedTokenRoleInfo)
})

// 清理监听 - 基于参考代码的onBeforeUnmount
onBeforeUnmount(() => {
  tokenStore.setMessageListener(undefined)
})
</script>

<style scoped lang="scss">
.daily-task-container {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid var(--primary-color);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.task-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.title-container {
  h3 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  p {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin: 0;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-secondary);
  }

  &.completed {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success-color);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.settings-button {
  padding: var(--spacing-xs);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--border-radius-medium);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }
}

.progress-container {
  margin-bottom: var(--spacing-md);
}

.info-container {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
  text-align: center;
}

.execute-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-medium);
  background: var(--primary-color);
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: var(--primary-color-hover);
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 模态框样式
.modal-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.settings-content {
  padding: var(--spacing-md) 0;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.setting-switches {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.switch-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }
}

.task-item-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.task-status-icon {
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);

  &.completed {
    color: var(--success-color);
  }
}

.task-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.log-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}

.log-time {
  color: var(--text-tertiary);
  min-width: 80px;
  flex-shrink: 0;
}

.log-message {
  color: var(--text-secondary);

  &.error {
    color: var(--error-color);
  }

  &.success {
    color: var(--success-color);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .task-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .header-right {
    justify-content: center;
  }
}
</style>
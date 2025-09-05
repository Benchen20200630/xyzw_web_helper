import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { bonProtocol, GameMessages, g_utils } from '../utils/bonProtocol.js'
import { XyzwWebSocketClient } from '../utils/xyzwWebSocket.js'
import { findAnswer } from '../utils/studyQuestionsFromJSON.js'

/**
 * 重构后的Token管理存储
 * 以名称-token列表形式管理多个游戏角色
 */
export const useTokenStore = defineStore('tokens', () => {
  // 状态
  const gameTokens = ref(JSON.parse(localStorage.getItem('gameTokens') || '[]'))
  const selectedTokenId = ref(localStorage.getItem('selectedTokenId') || null)
  const wsConnections = ref({}) // WebSocket连接状态

  // 游戏数据存储
  const gameData = ref({
    roleInfo: null,
    legionInfo: null,
    presetTeam: null,
    studyStatus: {
      isAnswering: false,
      questionCount: 0,
      answeredCount: 0,
      status: '', // '', 'starting', 'answering', 'claiming_rewards', 'completed'
      timestamp: null
    },
    lastUpdated: null
  })

  // 计算属性
  const hasTokens = computed(() => gameTokens.value.length > 0)
  const selectedToken = computed(() =>
    gameTokens.value.find(token => token.id === selectedTokenId.value)
  )
  
  // 获取当前选中token的角色信息
  const selectedTokenRoleInfo = computed(() => {
    return gameData.value.roleInfo
  })

  // Token管理
  const addToken = (tokenData) => {
    const newToken = {
      id: 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: tokenData.name,
      token: tokenData.token, // 保存原始Base64 token
      wsUrl: tokenData.wsUrl || null, // 可选的自定义WebSocket URL
      server: tokenData.server || '',
      level: tokenData.level || 1,
      profession: tokenData.profession || '',
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isActive: true,
      // URL获取相关信息
      sourceUrl: tokenData.sourceUrl || null, // Token来源URL（用于刷新）
      importMethod: tokenData.importMethod || 'manual' // 导入方式：manual 或 url
    }

    gameTokens.value.push(newToken)
    saveTokensToStorage()

    return newToken
  }

  const updateToken = (tokenId, updates) => {
    const index = gameTokens.value.findIndex(token => token.id === tokenId)
    if (index !== -1) {
      gameTokens.value[index] = {
        ...gameTokens.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      saveTokensToStorage()
      return true
    }
    return false
  }

  const removeToken = (tokenId) => {
    gameTokens.value = gameTokens.value.filter(token => token.id !== tokenId)
    saveTokensToStorage()

    // 关闭对应的WebSocket连接
    if (wsConnections.value[tokenId]) {
      closeWebSocketConnection(tokenId)
    }

    // 如果删除的是当前选中token，清除选中状态
    if (selectedTokenId.value === tokenId) {
      selectedTokenId.value = null
      localStorage.removeItem('selectedTokenId')
    }

    return true
  }

  const selectToken = (tokenId) => {
    const token = gameTokens.value.find(t => t.id === tokenId)
    if (token) {
      selectedTokenId.value = tokenId
      localStorage.setItem('selectedTokenId', tokenId)

      // 更新最后使用时间
      updateToken(tokenId, { lastUsed: new Date().toISOString() })

      // 自动建立WebSocket连接
      createWebSocketConnection(tokenId, token.token, token.wsUrl)

      return token
    }
    return null
  }

  // 辅助函数：分析数据结构
  const analyzeDataStructure = (obj, depth = 0, maxDepth = 3) => {
    if (depth > maxDepth || !obj || typeof obj !== 'object') {
      return typeof obj
    }
    
    const structure = {}
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        structure[key] = `Array[${value.length}]${value.length > 0 ? `: ${analyzeDataStructure(value[0], depth + 1, maxDepth)}` : ''}`
      } else if (typeof value === 'object' && value !== null) {
        structure[key] = analyzeDataStructure(value, depth + 1, maxDepth)
      } else {
        structure[key] = typeof value
      }
    }
    return structure
  }

  // 辅助函数：尝试解析队伍数据
  const tryParseTeamData = (data, cmd) => {
    // 静默解析，不打印详细日志
    
    // 查找队伍相关字段
    const teamFields = []
    const scanForTeamData = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (key.toLowerCase().includes('team') || 
            key.toLowerCase().includes('preset') ||
            key.toLowerCase().includes('formation') ||
            key.toLowerCase().includes('lineup')) {
          teamFields.push({
            path: currentPath,
            key: key,
            value: value,
            type: typeof value,
            isArray: Array.isArray(value)
          })
        }
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          scanForTeamData(value, currentPath)
        }
      }
    }
    
    scanForTeamData(data)
    
    if (teamFields.length > 0) {
      console.log(`👥 找到 ${teamFields.length} 个队伍相关字段:`, teamFields)
      
      // 尝试更新游戏数据
      teamFields.forEach(field => {
        if (field.key === 'presetTeamInfo' || field.path.includes('presetTeamInfo')) {
          console.log(`👥 发现预设队伍信息，准备更新:`, field.value)
          if (!gameData.value.presetTeam) {
            gameData.value.presetTeam = {}
          }
          gameData.value.presetTeam.presetTeamInfo = field.value
          gameData.value.lastUpdated = new Date().toISOString()
        }
      })
    } else {
      // 未找到队伍数据
    }
  }

  // 处理学习答题响应的核心函数
  const handleStudyResponse = async (tokenId, body) => {
    try {
      console.log('📚 开始处理学习答题响应:', body)
      
      const connection = wsConnections.value[tokenId]
      if (!connection || connection.status !== 'connected' || !connection.client) {
        console.error('❌ WebSocket连接不可用，无法进行答题')
        return
      }
      
      // 获取题目列表和学习ID
      const questionList = body.questionList
      const studyId = body.role?.study?.id
      
      if (!questionList || !Array.isArray(questionList)) {
        console.error('❌ 未找到题目列表')
        return
      }
      
      if (!studyId) {
        console.error('❌ 未找到学习ID')
        return
      }
      
      console.log(`📝 找到 ${questionList.length} 道题目，学习ID: ${studyId}`)
      
      // 更新答题状态
      gameData.value.studyStatus = {
        isAnswering: true,
        questionCount: questionList.length,
        answeredCount: 0,
        status: 'answering',
        timestamp: Date.now()
      }
      
      // 遍历题目并回答
      for (let i = 0; i < questionList.length; i++) {
        const question = questionList[i]
        const questionText = question.question
        const questionId = question.id
        
        console.log(`📖 题目 ${i + 1}: ${questionText}`)
        
        // 查找答案（异步）
        let answer = await findAnswer(questionText)
        
        if (answer === null) {
          // 如果没有找到答案，默认选择选项1
          answer = 1
          console.log(`⚠️ 未找到匹配答案，使用默认答案: ${answer}`)
        } else {
          console.log(`✅ 找到答案: ${answer}`)
        }
        
        // 发送答案
        try {
          connection.client.send('study_answer', {
            id: studyId,
            option: [answer],
            questionId: [questionId]
          })
          console.log(`📤 已提交题目 ${i + 1} 的答案: ${answer}`)
        } catch (error) {
          console.error(`❌ 提交答案失败 (题目 ${i + 1}):`, error)
        }
        
        // 更新已回答题目数量
        gameData.value.studyStatus.answeredCount = i + 1
        
        // 添加短暂延迟，避免请求过快
        if (i < questionList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // 等待一下让所有答案提交完成，然后领取奖励
      setTimeout(() => {
        console.log('🎁 开始领取答题奖励...')
        
        // 更新状态为正在领取奖励
        gameData.value.studyStatus.status = 'claiming_rewards'
        
        // 领取所有等级的奖励 (1-10)
        const rewardPromises = []
        for (let rewardId = 1; rewardId <= 10; rewardId++) {
          try {
            const promise = connection.client.send('study_claimreward', { 
              rewardId: rewardId 
            })
            rewardPromises.push(promise)
            console.log(`🎯 已发送奖励领取请求: rewardId=${rewardId}`)
          } catch (error) {
            console.error(`❌ 发送奖励领取请求失败 (rewardId=${rewardId}):`, error)
          }
        }
        
        console.log('🎊 一键答题完成！已尝试领取所有奖励')
        
        // 更新状态为完成
        gameData.value.studyStatus.status = 'completed'
        
        // 3秒后重置状态
        setTimeout(() => {
          gameData.value.studyStatus = {
            isAnswering: false,
            questionCount: 0,
            answeredCount: 0,
            status: '',
            timestamp: null
          }
        }, 3000)
        
        // 更新游戏数据
        setTimeout(() => {
          try {
            connection.client.send('role_getroleinfo', {})
            console.log('📊 已请求更新角色信息')
          } catch (error) {
            console.error('❌ 请求角色信息更新失败:', error)
          }
        }, 1000)
        
      }, 500) // 延迟500ms后领取奖励
      
    } catch (error) {
      console.error('❌ 处理学习答题响应失败:', error)
    }
  }

  // 游戏消息处理
  const handleGameMessage = (tokenId, message) => {
    try {
      if (!message || message.error) {
        console.warn(`⚠️ 消息处理跳过 [${tokenId}]:`, message?.error || '无效消息')
        return
      }

      const cmd = message.cmd?.toLowerCase()
      // 优先使用rawData（ProtoMsg自动解码），然后decodedBody（手动解码），最后body（原始数据）
      const body = message.rawData !== undefined ? message.rawData :
                   message.decodedBody !== undefined ? message.decodedBody :
                   message.body

      // 简化消息处理日志（移除详细结构信息）
      if (cmd !== '_sys/ack') { // 过滤心跳消息
        console.log(`📋 处理 [${tokenId}] ${cmd}`, body ? '✓' : '✗')
      }

      // 过滤塔相关消息的详细打印

      // 处理角色信息 - 支持多种可能的响应命令
      if (cmd === 'role_getroleinfo' || cmd === 'role_getroleinforesp' || cmd.includes('role') && cmd.includes('info')) {
        console.log(`📊 角色信息 [${tokenId}]`)
          
        if (body) {
          gameData.value.roleInfo = body
          gameData.value.lastUpdated = new Date().toISOString()
          console.log('📊 角色信息已更新')

          // 检查塔信息
          if (body.role?.tower) {
            // 塔信息已更新
          }
        } else {
          console.log('📊 角色信息响应为空')
        }
      }

      // 处理军团信息
      else if (cmd === 'legion_getinfo') {
        if (body) {
          gameData.value.legionInfo = body
          console.log('🏛️ 军团信息已更新')
        }
      }

      // 处理队伍信息 - 支持多种队伍相关响应
      else if (cmd === 'presetteam_getinfo' || cmd === 'presetteam_getinforesp' || 
               cmd === 'presetteam_setteam' || cmd === 'presetteam_setteamresp' ||
               cmd === 'presetteam_saveteam' || cmd === 'presetteam_saveteamresp' ||
               cmd === 'role_gettargetteam' || cmd === 'role_gettargetteamresp' ||
               (cmd && cmd.includes('presetteam')) || (cmd && cmd.includes('team'))) {
        console.log(`👥 队伍信息 [${tokenId}] ${cmd}`)
        
        if (body) {
          // 更新队伍数据
          if (!gameData.value.presetTeam) {
            gameData.value.presetTeam = {}
          }
          
          // 根据不同的响应类型处理数据
          if (cmd.includes('getteam')) {
            // 获取队伍信息响应
            gameData.value.presetTeam = { ...gameData.value.presetTeam, ...body }
          } else if (cmd.includes('setteam') || cmd.includes('saveteam')) {
            // 设置/保存队伍响应 - 可能只返回确认信息
            if (body.presetTeamInfo) {
              gameData.value.presetTeam.presetTeamInfo = body.presetTeamInfo
            }
            // 合并其他队伍相关数据
            Object.keys(body).forEach(key => {
              if (key.includes('team') || key.includes('Team')) {
                gameData.value.presetTeam[key] = body[key]
              }
            })
          } else {
            // 其他队伍相关响应
            gameData.value.presetTeam = { ...gameData.value.presetTeam, ...body }
          }
          
          gameData.value.lastUpdated = new Date().toISOString()
          console.log('👥 队伍信息已更新')
          
          // 简化队伍数据结构日志
          if (gameData.value.presetTeam.presetTeamInfo) {
            const teamCount = Object.keys(gameData.value.presetTeam.presetTeamInfo).length
            console.log(`👥 队伍数量: ${teamCount}`)
          }
        } else {
          console.log('👥 队伍信息响应为空')
        }
      }

      // 处理爬塔响应（静默处理，保持功能）
      else if (cmd === 'fight_starttower' || cmd === 'fight_starttowerresp') {
        if (body) {
          // 判断爬塔结果
          const battleData = body.battleData
          if (battleData) {
            const curHP = battleData.result?.sponsor?.ext?.curHP
            const isSuccess = curHP > 0
            
            // 保存爬塔结果到gameData中，供组件使用
            if (!gameData.value.towerResult) {
              gameData.value.towerResult = {}
            }
            gameData.value.towerResult = {
              success: isSuccess,
              curHP: curHP,
              towerId: battleData.options?.towerId,
              timestamp: Date.now()
            }
            gameData.value.lastUpdated = new Date().toISOString()
            
            if (isSuccess) {
              // 检查是否需要自动领取奖励
              const towerId = battleData.options?.towerId
              if (towerId !== undefined) {
                const layer = towerId % 10
                const floor = Math.floor(towerId / 10)
                
                // 如果是新层数的第一层(layer=0)，检查是否有奖励可领取
                if (layer === 0) {
                  setTimeout(() => {
                    const connection = wsConnections.value[tokenId]
                    if (connection && connection.status === 'connected' && connection.client) {
                      // 检查角色信息中的奖励状态
                      const roleInfo = gameData.value.roleInfo
                      const towerRewards = roleInfo?.role?.tower?.reward
                      
                      if (towerRewards && !towerRewards[floor]) {
                        // 保存奖励信息
                        gameData.value.towerResult.autoReward = true
                        gameData.value.towerResult.rewardFloor = floor
                        connection.client.send('tower_claimreward', { rewardId: floor })
                      }
                    }
                  }, 1500)
                }
              }
            }
          }
          
          // 爬塔后立即更新角色信息和塔信息
          setTimeout(() => {
            try {
              const connection = wsConnections.value[tokenId]
              if (connection && connection.status === 'connected' && connection.client) {
                connection.client.send('role_getroleinfo', {})
              }
            } catch (error) {
              // 忽略更新数据错误
            }
          }, 1000)
        }
      }

      // 处理奖励领取响应（静默处理）
      else if (cmd === 'tower_claimreward' || cmd === 'tower_claimrewardresp') {
        if (body) {
          // 奖励领取成功后更新角色信息
          setTimeout(() => {
            const connection = wsConnections.value[tokenId]
            if (connection && connection.status === 'connected' && connection.client) {
              connection.client.send('role_getroleinfo', {})
            }
          }, 500)
        }
      }

      // 处理学习答题响应 - 一键答题功能
      else if (cmd === 'studyresp' || cmd === 'study_startgame' || cmd === 'study_startgameresp') {
        if (body) {
          console.log(`📚 学习答题响应 [${tokenId}]`, body)
          handleStudyResponse(tokenId, body)
        }
      }

      // 处理加钟相关响应
      else if (cmd === 'system_mysharecallback' || cmd === 'syncresp' || cmd === 'system_claimhangupreward' || cmd === 'system_claimhanguprewardresp') {
        console.log(`🕐 加钟/挂机 [${tokenId}] ${cmd}`)
        
        // 加钟操作完成后，延迟更新角色信息
        if (cmd === 'syncresp' || cmd === 'system_mysharecallback') {
          setTimeout(() => {
            const connection = wsConnections.value[tokenId]
            if (connection && connection.status === 'connected' && connection.client) {
              connection.client.send('role_getroleinfo', {})
            }
          }, 800)
        }
        
        // 挂机奖励领取完成后更新角色信息
        if (cmd === 'system_claimhanguprewardresp') {
          setTimeout(() => {
            const connection = wsConnections.value[tokenId]
            if (connection && connection.status === 'connected' && connection.client) {
              connection.client.send('role_getroleinfo', {})
            }
          }, 500)
        }
      }

      // 处理心跳响应（静默处理，不打印日志）
      else if (cmd === '_sys/ack') {
        // 心跳响应 - 静默处理
        return
      }

      // 处理其他消息
      else {
        console.log(`📋 游戏消息 [${tokenId}] ${cmd}`)
        
        // 特别关注队伍相关的未处理消息
        if (cmd && (cmd.includes('team') || cmd.includes('preset') || cmd.includes('formation'))) {
          console.log(`👥 未处理队伍消息 [${tokenId}] ${cmd}`)
          
          // 尝试自动解析队伍数据
          if (body && typeof body === 'object') {
            tryParseTeamData(body, cmd)
          }
        }
        
        // 特别关注塔相关的未处理消息（静默处理）
        if (cmd && cmd.includes('tower')) {
          // 未处理塔消息
        }
      }

    } catch (error) {
      console.error(`处理消息失败 [${tokenId}]:`, error.message)
    }
  }

  // 验证token有效性
  const validateToken = (token) => {
    if (!token) return false
    if (typeof token !== 'string') return false
    if (token.trim().length === 0) return false
    // 简单检查：token应该至少有一定长度
    if (token.trim().length < 10) return false
    return true
  }

  // Base64解析功能（增强版）
  const parseBase64Token = (base64String) => {
    try {
      // 输入验证
      if (!base64String || typeof base64String !== 'string') {
        throw new Error('Token字符串无效')
      }

      // 移除可能的前缀和空格
      const cleanBase64 = base64String.replace(/^data:.*base64,/, '').trim()
      
      if (cleanBase64.length === 0) {
        throw new Error('Token字符串为空')
      }

      // 解码base64
      let decoded
      try {
        decoded = atob(cleanBase64)
      } catch (decodeError) {
        // 如果不是有效的Base64，作为纯文本token处理
        decoded = base64String.trim()
      }

      // 尝试解析为JSON
      let tokenData
      try {
        tokenData = JSON.parse(decoded)
      } catch {
        // 不是JSON格式，作为纯token处理
        tokenData = { token: decoded }
      }

      // 提取实际token
      const actualToken = tokenData.token || tokenData.gameToken || decoded

      // 验证token有效性
      if (!validateToken(actualToken)) {
        throw new Error(`提取的token无效: "${actualToken}"`)
      }

      return {
        success: true,
        data: {
          ...tokenData,
          actualToken // 添加提取出的实际token
        }
      }
    } catch (error) {
      return {
        success: false,
        error: '解析失败：' + error.message
      }
    }
  }

  const importBase64Token = (name, base64String, additionalInfo = {}) => {
    const parseResult = parseBase64Token(base64String)

    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error,
        message: `Token "${name}" 导入失败: ${parseResult.error}`
      }
    }

    const tokenData = {
      name,
      token: parseResult.data.actualToken, // 使用验证过的实际token
      ...additionalInfo,
      ...parseResult.data // 解析出的数据覆盖手动输入
    }

    try {
      const newToken = addToken(tokenData)
      
      // 添加更多验证信息到成功消息
      const tokenInfo = parseResult.data.actualToken
      const displayToken = tokenInfo.length > 20 ? 
        `${tokenInfo.substring(0, 10)}...${tokenInfo.substring(tokenInfo.length - 6)}` : 
        tokenInfo

      return {
        success: true,
        data: newToken,
        message: `Token "${name}" 导入成功`,
        details: `实际Token: ${displayToken}`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Token "${name}" 添加失败: ${error.message}`
      }
    }
  }

  // WebSocket连接管理
  const createWebSocketConnection = (tokenId, base64Token, customWsUrl = null) => {
    if (wsConnections.value[tokenId]) {
      closeWebSocketConnection(tokenId)
    }

    try {
      // 使用统一的token解析逻辑
      const parseResult = parseBase64Token(base64Token)
      
      let actualToken
      if (parseResult.success) {
        actualToken = parseResult.data.actualToken
        // Token解析成功
      } else {
        // Token解析失败，使用原始token
        // 如果解析失败，尝试直接使用原始token
        if (validateToken(base64Token)) {
          actualToken = base64Token
        } else {
          throw new Error(`Token无效: ${parseResult.error}`)
        }
      }

      // 使用固定的WebSocket基础地址，将token带入占位符
      const baseWsUrl = 'wss://xxz-xyzw.hortorgames.com/agent?p=%s&e=x&lang=chinese'
      const wsUrl = customWsUrl || baseWsUrl.replace('%s', encodeURIComponent(actualToken))

      console.log(`🔗 创建WebSocket连接:`, wsUrl)
      console.log(`🎯 Token ID: ${tokenId}`)
      console.log(`🔑 使用Token: ${actualToken.substring(0, 20)}...`)

      // 检查g_utils结构
      console.log('🔍 g_utils结构检查:', {
        hasGetEnc: !!g_utils.getEnc,
        hasEncode: !!g_utils.encode,
        hasParse: !!g_utils.parse,
        hasBon: !!g_utils.bon,
        bonHasDecode: !!(g_utils.bon && g_utils.bon.decode)
      })

      // 创建新的WebSocket客户端
      const wsClient = new XyzwWebSocketClient({
        url: wsUrl,
        utils: g_utils,
        heartbeatMs: 5000  // 5秒心跳间隔
      })

      // 设置连接状态
      wsConnections.value[tokenId] = {
        client: wsClient,
        status: 'connecting',
        tokenId,
        wsUrl,
        actualToken,
        connectedAt: null,
        lastMessage: null,
        lastError: null
      }

      // 设置事件监听
      wsClient.onConnect = () => {
        console.log(`✅ WebSocket连接已建立: ${tokenId}`)
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = 'connected'
          wsConnections.value[tokenId].connectedAt = new Date().toISOString()
        }
      }

      wsClient.onDisconnect = (event) => {
        console.log(`🔌 WebSocket连接已断开: ${tokenId}`, event)
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = 'disconnected'
        }
      }

      wsClient.onError = (error) => {
        console.error(`❌ WebSocket错误 [${tokenId}]:`, error)
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].status = 'error'
          wsConnections.value[tokenId].lastError = {
            timestamp: new Date().toISOString(),
            error: error.toString(),
            url: wsUrl
          }
        }
      }

      // 设置消息监听
      wsClient.setMessageListener((message) => {
        // 只打印消息命令，不打印完整结构
        const cmd = message?.cmd || 'unknown'
        if (cmd !== '_sys/ack') { // 过滤心跳消息
          console.log(`📨 [${tokenId}] ${cmd}`)
        }

        // 更新连接状态中的最后接收消息
        if (wsConnections.value[tokenId]) {
          wsConnections.value[tokenId].lastMessage = {
            timestamp: new Date().toISOString(),
            data: message, // 保存完整消息数据
            cmd: message?.cmd
          }
        }

        // 处理游戏消息
        handleGameMessage(tokenId, message)
      })

      // 开启调试模式
      wsClient.setShowMsg(true)

      // 初始化连接
      wsClient.init()

      return wsClient
    } catch (error) {
      console.error(`创建WebSocket连接失败 [${tokenId}]:`, error)
      return null
    }
  }

  const closeWebSocketConnection = (tokenId) => {
    const connection = wsConnections.value[tokenId]
    if (connection && connection.client) {
      connection.client.disconnect()
      delete wsConnections.value[tokenId]
    }
  }

  const getWebSocketStatus = (tokenId) => {
    return wsConnections.value[tokenId]?.status || 'disconnected'
  }

  // 获取WebSocket客户端
  const getWebSocketClient = (tokenId) => {
    return wsConnections.value[tokenId]?.client || null
  }
  
  // 设置消息监听器
  const setMessageListener = (listener) => {
    if (selectedToken.value) {
      const connection = wsConnections.value[selectedToken.value.id]
      if (connection && connection.client) {
        connection.client.setMessageListener(listener)
      }
    }
  }
  
  // 设置是否显示消息
  const setShowMsg = (show) => {
    if (selectedToken.value) {
      const connection = wsConnections.value[selectedToken.value.id]
      if (connection && connection.client) {
        connection.client.setShowMsg(show)
      }
    }
  }


  // 发送消息到WebSocket
  const sendMessage = (tokenId, cmd, params = {}, options = {}) => {
      const connection = wsConnections.value[tokenId]
    if (!connection || connection.status !== 'connected') {
      console.error(`❌ WebSocket未连接，无法发送消息 [${tokenId}]`)
      return false
    }

    try {
      const client = connection.client
      if (!client) {
        console.error(`❌ WebSocket客户端不存在 [${tokenId}]`)
        return false
      }

      client.send(cmd, params, options)
      console.log(`📤 [${tokenId}] ${cmd}`)

      return true
    } catch (error) {
      console.error(`❌ 发送失败 [${tokenId}] ${cmd}:`, error.message)
      return false
    }
  }

  // Promise版发送消息
  const sendMessageWithPromise = async (tokenId, cmd, params = {}, timeout = 5000) => {
    const connection = wsConnections.value[tokenId]
    if (!connection || connection.status !== 'connected') {
      return Promise.reject(new Error(`WebSocket未连接 [${tokenId}]`))
    }

    const client = connection.client
    if (!client) {
      return Promise.reject(new Error(`WebSocket客户端不存在 [${tokenId}]`))
    }

    try {
      return await client.sendWithPromise(cmd, params, timeout)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 发送心跳消息
  const sendHeartbeat = (tokenId) => {
    return sendMessage(tokenId, 'heart_beat')
  }

  // 发送获取角色信息请求（异步处理）
  const sendGetRoleInfo = async (tokenId, params = {}) => {
    try {
      const roleInfo = await sendMessageWithPromise(tokenId, 'role_getroleinfo', params, 10000)
      
      // 手动更新游戏数据（因为响应可能不会自动触发消息处理）
      if (roleInfo) {
        gameData.value.roleInfo = roleInfo
        gameData.value.lastUpdated = new Date().toISOString()
        console.log('📊 角色信息已通过 Promise 更新')
      }
      
      return roleInfo
    } catch (error) {
      console.error(`❌ 获取角色信息失败 [${tokenId}]:`, error.message)
      throw error
    }
  }

  // 发送获取数据版本请求
  const sendGetDataBundleVersion = (tokenId, params = {}) => {
    return sendMessageWithPromise(tokenId, 'system_getdatabundlever', params)
  }

  // 发送签到请求
  const sendSignIn = (tokenId) => {
    return sendMessageWithPromise(tokenId, 'system_signinreward')
  }

  // 发送领取日常任务奖励
  const sendClaimDailyReward = (tokenId, rewardId = 0) => {
    return sendMessageWithPromise(tokenId, 'task_claimdailyreward', { rewardId })
  }

  // 发送获取队伍信息
  const sendGetTeamInfo = (tokenId, params = {}) => {
    return sendMessageWithPromise(tokenId, 'presetteam_getinfo', params)
  }

  // 发送自定义游戏消息
  const sendGameMessage = (tokenId, cmd, params = {}, options = {}) => {
    if (options.usePromise) {
      return sendMessageWithPromise(tokenId, cmd, params, options.timeout)
    } else {
      return sendMessage(tokenId, cmd, params, options)
    }
  }

  // 获取当前塔层数
  const getCurrentTowerLevel = () => {
    try {
      // 从游戏数据中获取塔信息
      const roleInfo = gameData.value.roleInfo
      if (!roleInfo || !roleInfo.role) {
        console.warn('⚠️ 角色信息不存在')
        return null
      }

      const tower = roleInfo.role.tower
      if (!tower) {
        console.warn('⚠️ 塔信息不存在')
        return null
      }

      // 可能的塔层数字段（根据实际数据结构调整）
      const level = tower.level || tower.currentLevel || tower.floor || tower.stage

      // 当前塔层数
      return level
    } catch (error) {
      console.error('❌ 获取塔层数失败:', error)
      return null
    }
  }

  // 获取详细塔信息
  const getTowerInfo = () => {
    try {
      const roleInfo = gameData.value.roleInfo
      if (!roleInfo || !roleInfo.role) {
        return null
      }

      return roleInfo.role.tower || null
    } catch (error) {
      console.error('❌ 获取塔信息失败:', error)
      return null
    }
  }

  // 工具方法
  const exportTokens = () => {
    return {
      tokens: gameTokens.value,
      exportedAt: new Date().toISOString(),
      version: '2.0'
    }
  }

  const importTokens = (data) => {
    try {
      if (data.tokens && Array.isArray(data.tokens)) {
        gameTokens.value = data.tokens
        saveTokensToStorage()
        return { success: true, message: `成功导入 ${data.tokens.length} 个Token` }
      } else {
        return { success: false, message: '导入数据格式错误' }
      }
    } catch (error) {
      return { success: false, message: '导入失败：' + error.message }
    }
  }

  const clearAllTokens = () => {
    // 关闭所有WebSocket连接
    Object.keys(wsConnections.value).forEach(tokenId => {
      closeWebSocketConnection(tokenId)
    })

    gameTokens.value = []
    selectedTokenId.value = null
    localStorage.removeItem('gameTokens')
    localStorage.removeItem('selectedTokenId')
  }

  const cleanExpiredTokens = () => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const cleanedTokens = gameTokens.value.filter(token => {
      const lastUsed = new Date(token.lastUsed || token.createdAt)
      return lastUsed > oneDayAgo
    })

    const cleanedCount = gameTokens.value.length - cleanedTokens.length
    gameTokens.value = cleanedTokens
    saveTokensToStorage()

    return cleanedCount
  }

  const saveTokensToStorage = () => {
    localStorage.setItem('gameTokens', JSON.stringify(gameTokens.value))
  }

  // 初始化
  const initTokenStore = () => {
    // 恢复数据
    const savedTokens = localStorage.getItem('gameTokens')
    const savedSelectedId = localStorage.getItem('selectedTokenId')

    if (savedTokens) {
      try {
        gameTokens.value = JSON.parse(savedTokens)
      } catch (error) {
        console.error('解析Token数据失败:', error.message)
        gameTokens.value = []
      }
    }

    if (savedSelectedId) {
      selectedTokenId.value = savedSelectedId
    }

    // 清理过期token
    cleanExpiredTokens()
  }

  return {
    // 状态
    gameTokens,
    selectedTokenId,
    wsConnections,
    gameData,

    // 计算属性
    hasTokens,
    selectedToken,
    selectedTokenRoleInfo,

    // Token管理方法
    addToken,
    updateToken,
    removeToken,
    selectToken,

    // Base64解析方法
    parseBase64Token,
    importBase64Token,

    // WebSocket方法
    createWebSocketConnection,
    closeWebSocketConnection,
    getWebSocketStatus,
    getWebSocketClient,
    sendMessage,
    sendMessageWithPromise,
    setMessageListener,
    setShowMsg,
    sendHeartbeat,
    sendGetRoleInfo,
    sendGetDataBundleVersion,
    sendSignIn,
    sendClaimDailyReward,
    sendGetTeamInfo,
    sendGameMessage,

    // 工具方法
    exportTokens,
    importTokens,
    clearAllTokens,
    cleanExpiredTokens,
    initTokenStore,

    // 塔信息方法
    getCurrentTowerLevel,
    getTowerInfo,

    // 调试工具方法
    validateToken,
    debugToken: (tokenString) => {
      console.log('🔍 Token调试信息:')
      console.log('原始Token:', tokenString)
      const parseResult = parseBase64Token(tokenString)
      console.log('解析结果:', parseResult)
      if (parseResult.success) {
        console.log('实际Token:', parseResult.data.actualToken)
        console.log('Token有效性:', validateToken(parseResult.data.actualToken))
      }
      return parseResult
    }
  }
})

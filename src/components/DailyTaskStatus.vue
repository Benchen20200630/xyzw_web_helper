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

// 超时执行器 - 使用tokenStore的sendMessageWithPromise
const callWithRetry = async (fn, opt = {}) => {
  const timeoutMs = opt?.timeoutMs ?? 10000  // 降低超时时间到10秒
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

// 刷新角色信息 - 使用tokenStore的方法
const refreshRoleInfo = async () => {
  if (!tokenStore.selectedToken) {
    throw new Error('没有选中的Token')
  }
  const tokenId = tokenStore.selectedToken.id
  
  try {
    // 直接使用sendMessageWithPromise方法
    log('正在获取角色信息...')
    
    // 先检查tokenStore方法是否存在
    if (typeof tokenStore.sendMessageWithPromise !== 'function') {
      throw new Error('sendMessageWithPromise方法不存在')
    }
    
    const response = await tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {}, 8000)
    log('角色信息获取成功', 'success')
    
    // 更新gameData以便其他组件使用
    if (response) {
      tokenStore.gameData.roleInfo = response
    }
    
    return response
  } catch (error) {
    log(`获取角色信息失败: ${error.message}`, 'error')
    console.error('详细错误信息:', error)
    throw error
  }
}

// 一键补差 - 简化测试版本
const runDailyFix = async () => {
  if (!tokenStore.selectedToken || busy.value) {
    log('没有选中Token或正在执行中', 'error')
    return
  }
  
  busy.value = true
  showLog.value = true
  logList.value = []
  
  log('开始执行任务...')
  
  const tokenId = tokenStore.selectedToken.id
  log(`当前Token ID: ${tokenId}`)
  
  // 检查tokenStore方法
  log(`检查tokenStore方法:`)
  log(`- sendMessageWithPromise: ${typeof tokenStore.sendMessageWithPromise}`)
  log(`- getWebSocketStatus: ${typeof tokenStore.getWebSocketStatus}`)
  log(`- selectedToken: ${!!tokenStore.selectedToken}`)
  
  // 检查WebSocket连接状态
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  log(`WebSocket状态: ${JSON.stringify(wsStatus)}`)
  
  // 修复状态检查逻辑 - wsStatus可能直接是字符串，也可能是对象
  const actualStatus = typeof wsStatus === 'string' ? wsStatus : wsStatus?.status
  log(`实际状态: ${actualStatus}`)
  
  if (actualStatus !== 'connected') {
    log('WebSocket未连接，无法继续执行', 'error')
    busy.value = false
    return
  }
  
  try {
    log('尝试获取游戏内角色信息...')
    log('发送 role_getroleinfo 命令到游戏服务器...')
    log('期望响应: role_getroleinforesp')
    
    // 先检查WebSocket客户端是否能接收到消息
    tokenStore.setMessageListener((message) => {
      if (message?.cmd) {
        log(`收到游戏消息: ${message.cmd}`, 'info')
      }
    })
    
    // 增加超时时间，因为游戏服务器响应可能较慢
    const roleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'role_getroleinfo', {}, 10000)
    
    if (roleInfo) {
      log('游戏角色信息获取成功！', 'success')
      
      // 显示角色基本信息（如果存在）
      if (roleInfo.role) {
        log(`角色等级: ${roleInfo.role.level || '未知'}`)
        log(`角色名称: ${roleInfo.role.name || '未知'}`)
        log(`每日任务进度: ${roleInfo.role.dailyTask?.dailyPoint || 0}/100`)
      }
      
      // 现在尝试执行一个简单的游戏指令
      log('尝试执行游戏内签到...')
      const signInResult = await tokenStore.sendMessageWithPromise(tokenId, 'system_signinreward', {}, 8000)
      
      if (signInResult) {
        log('游戏签到执行成功！', 'success')
        log(`签到奖励: ${signInResult.reward ? '有奖励' : '无奖励或已签到'}`)
      }
      
      message.success('游戏指令测试成功！')
    } else {
      log('未收到游戏角色数据', 'error')
      message.warning('未收到游戏服务器响应')
    }
    
  } catch (error) {
    log(`游戏指令执行失败: ${error.message}`, 'error')
    
    // 分析可能的原因
    if (error.message.includes('超时') || error.message.includes('timeout')) {
      log('可能原因：游戏服务器响应超时', 'error')
      log('建议：检查网络连接或稍后重试', 'error')
    } else if (error.message.includes('Unknown cmd')) {
      log('可能原因：游戏指令未在WebSocket客户端中注册', 'error')
    } else {
      log('可能原因：WebSocket连接异常或游戏服务器拒绝请求', 'error')
    }
    
    message.error(`游戏指令执行失败: ${error.message}`)
  } finally {
    busy.value = false
  }
}

// 简化的执行器函数 - 直接使用tokenStore方法
const U = async (roleInfoResp, logFn, progress) => {
  const tokenId = tokenStore.selectedToken.id
  
  logFn?.('开始执行每日任务')

  // 检查已完成的任务
  const completedTasks = roleInfoResp.role?.dailyTask?.complete ?? {}
  const isTaskCompleted = (taskId) => completedTasks[taskId] === -1

  // 执行任务列表
  const taskList = []
  
  // 基础任务
  if (!isTaskCompleted(2)) { // 分享游戏
    taskList.push({ name: '分享一次游戏', cmd: 'system_mysharecallback', params: { isSkipShareCard: true, type: 2 } })
  }
  
  if (!isTaskCompleted(3)) { // 赠送好友
    taskList.push({ name: '赠送好友金币', cmd: 'friend_batch' })
  }
  
  if (!isTaskCompleted(4)) { // 招募
    taskList.push({ name: '免费招募', cmd: 'hero_recruit' })
  }
  
  if (!isTaskCompleted(6)) { // 点金
    taskList.push({ name: '免费点金', cmd: 'system_buygold' })
  }
  
  if (!isTaskCompleted(5) && settings.claimHangUp) { // 挂机奖励
    taskList.push({ name: '领取挂机奖励', cmd: 'system_claimhangupreward' })
  }
  
  if (!isTaskCompleted(7) && settings.openBox) { // 开宝箱
    taskList.push({ name: '开启宝箱', cmd: 'item_openbox', params: { itemId: 2001, number: 10 } })
  }
  
  if (!isTaskCompleted(14) && settings.claimBottle) { // 盐罐
    taskList.push({ name: '领取盐罐奖励', cmd: 'bottlehelper_claim' })
  }

  // 常规奖励
  taskList.push(
    { name: '福利签到', cmd: 'system_signinreward' },
    { name: '俱乐部签到', cmd: 'legion_signin' },
    { name: '领取每日礼包', cmd: 'discount_claimreward' },
    { name: '领取免费礼包', cmd: 'card_claimreward' }
  )
  
  if (settings.claimEmail) {
    taskList.push({ name: '领取邮件奖励', cmd: 'mail_claimallattachment' })
  }

  // 任务奖励领取
  for (let i = 1; i <= 10; i++) {
    taskList.push({ name: `领取任务奖励${i}`, cmd: 'task_claimdailypoint', params: { taskId: i } })
  }
  taskList.push(
    { name: '领取日常任务奖励', cmd: 'task_claimdailyreward' },
    { name: '领取周常任务奖励', cmd: 'task_claimweekreward' }
  )

  // 竞技场
  if (!isTaskCompleted(13) && settings.arenaEnable) {
    logFn?.('开始竞技场战斗')
    try {
      // 获取队伍信息
      const teamInfo = await tokenStore.sendMessageWithPromise(tokenId, 'presetteam_getinfo', {}, 5000)
      
      // 切换阵容（如果需要）
      if (teamInfo?.presetTeamInfo?.useTeamId !== settings.arenaFormation) {
        await tokenStore.sendMessageWithPromise(tokenId, 'presetteam_saveteam', { teamId: settings.arenaFormation }, 5000)
        logFn?.(`切换到竞技场阵容 ${settings.arenaFormation}`)
      }
      
      // 开始竞技场
      await tokenStore.sendMessageWithPromise(tokenId, 'arena_startarea', {}, 5000)
      
      // 进行3场战斗
      for (let i = 1; i <= 3; i++) {
        logFn?.(`竞技场战斗 ${i}/3`)
        const targets = await tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', {}, 5000)
        const targetId = targets?.roleList?.[0]?.roleId
        
        if (targetId) {
          await tokenStore.sendMessageWithPromise(tokenId, 'fight_startareaarena', { targetId }, 8000)
          logFn?.(`完成竞技场战斗 ${i}`, 'success')
        }
      }
    } catch (error) {
      logFn?.(`竞技场战斗失败: ${error.message}`, 'error')
    }
  }

  // 执行任务列表
  const total = taskList.length
  for (let i = 0; i < taskList.length; i++) {
    const task = taskList[i]
    logFn?.(task.name)
    
    try {
      await tokenStore.sendMessageWithPromise(tokenId, task.cmd, task.params || {}, 5000)
      logFn?.(`${task.name} 成功`, 'success')
    } catch (error) {
      logFn?.(`${task.name} 失败: ${error.message}`, 'error')
    }
    
    // 更新进度
    const progress_pct = Math.floor(((i + 1) / total) * 100)
    if (progress && tokenId) progress(tokenId, progress_pct)
    
    // 小延迟避免过快
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  // 确保进度为100%
  if (progress && tokenId) progress(tokenId, 100)
  logFn?.('所有任务执行完成', 'success')
}

// 辅助函数
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
<template>
  <div class="game-features-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">
              游戏功能
            </h1>
            <p class="page-subtitle">
              {{ tokenStore.selectedToken?.name || '未选择Token' }}
            </p>
          </div>

          <div class="header-actions">
            <div
              class="connection-status"
              :class="connectionStatus"
            >
              <n-icon><CloudDone /></n-icon>
              <span>{{ connectionStatusText }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈提示区域 -->
    <div
      v-if="showFeedback"
      class="feedback-section"
    />

    <!-- 功能模块网格 -->
    <div class="features-grid-section">
      <div class="container">
        <GameStatus />
      </div>
    </div>

    <!-- WebSocket 连接状态 -->
    <div class="ws-status-section">
      <div class="container">
        <div class="ws-status-card">
          <div class="status-header">
            <h3>连接状态</h3>
            <n-button
              text
              @click="toggleConnection"
            >
              {{ isConnected ? '断开连接' : '重新连接' }}
            </n-button>
          </div>
          <div class="status-content">
            <div class="status-item">
              <span>WebSocket状态:</span>
              <span :class="connectionClass">{{ connectionStatusText }}</span>
            </div>
            <div
              v-if="tokenStore.selectedToken"
              class="status-item"
            >
              <span>当前Token:</span>
              <span>{{ tokenStore.selectedToken.name }}</span>
            </div>
            <div
              v-if="lastActivity"
              class="status-item"
            >
              <span>最后活动:</span>
              <span>{{ lastActivity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import GameStatus from '@/components/GameStatus.vue'
import { CloudDone } from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const tokenStore = useTokenStore()

// 响应式数据
const showFeedback = ref(true)
const lastActivity = ref(null)

// 计算属性
const connectionStatus = computed(() => {
  if (!tokenStore.selectedToken) return 'disconnected'
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  return status === 'connected' ? 'connected' : 'disconnected'
})

const connectionStatusText = computed(() => {
  if (!tokenStore.selectedToken) return '未选择Token'
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  return status === 'connected' ? '已连接' : '未连接'
})

const connectionClass = computed(() => {
  return connectionStatus.value === 'connected' ? 'status-connected' : 'status-disconnected'
})

// 方法
const handleFeatureAction = (featureType) => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    router.push('/tokens')
    return
  }

  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  if (status !== 'connected') {
    message.warning('WebSocket未连接，请先建立连接')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  const actions = {
    'team-challenge': () => {
      message.info('开始执行队伍挑战...')
      tokenStore.sendMessage(tokenId, 'fight_startareaarena')
    },
    'daily-tasks': () => {
      message.info('启动每日任务服务...')
      tokenStore.sendMessage(tokenId, 'task_claimdailyreward')
    },
    'salt-robot': () => {
      message.info('领取盐罐机器人奖励...')
      tokenStore.sendMessage(tokenId, 'bottlehelper_claim')
    },
    'idle-time': () => {
      message.info('领取挂机时间奖励...')
      tokenStore.sendMessage(tokenId, 'system_claimhangupreward')
    },
    'power-switch': () => {
      message.info('执行威震大开关...')
      tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    },
    'club-ranking': () => {
      message.info('报名俱乐部排位...')
      tokenStore.sendMessage(tokenId, 'legionmatch_rolesignup')
    },
    'club-checkin': () => {
      message.info('执行俱乐部签到...')
      tokenStore.sendMessage(tokenId, 'legion_signin')
    },
    'tower-challenge': () => {
      message.info('开始爬塔挑战...')
      tokenStore.sendMessage(tokenId, 'fight_starttower')
    }
  }

  const action = actions[featureType]
  if (action) {
    action()
  } else {
    message.warning('功能暂未实现')
  }
}

// 已移除 sendWebSocketMessage，使用 tokenStore.sendMessage 代替

const connectWebSocket = () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择一个Token')
    router.push('/tokens')
    return
  }

  try {
    const tokenId = tokenStore.selectedToken.id
    const token = tokenStore.selectedToken.token

    // 使用 tokenStore 的 WebSocket 连接管理
    tokenStore.createWebSocketConnection(tokenId, token)
    message.info('正在建立 WebSocket 连接...')

    // 等待连接建立
    setTimeout(async () => {
      const status = tokenStore.getWebSocketStatus(tokenId)
      if (status === 'connected') {
        message.success('WebSocket 连接成功')
        // 连接成功后自动初始化游戏数据
        await initializeGameData()
      }
    }, 2000)

  } catch (error) {
    console.error('WebSocket连接失败:', error)
    message.error('WebSocket连接失败')
  }
}

const disconnectWebSocket = () => {
  if (tokenStore.selectedToken) {
    const tokenId = tokenStore.selectedToken.id
    tokenStore.closeWebSocketConnection(tokenId)
    message.info('WebSocket连接已断开')
  }
}

const toggleConnection = () => {
  if (connectionStatus.value === 'connected') {
    disconnectWebSocket()
  } else {
    connectWebSocket()
  }
}

// handleWebSocketMessage 已移除，消息处理由 tokenStore 负责

// 生命周期
onMounted(() => {
  // 检查是否需要连接 WebSocket
  if (tokenStore.selectedToken) {
    const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
    if (status !== 'connected') {
      connectWebSocket()
    } else {
      // 如果已连接，立即获取初始数据
      initializeGameData()
    }
  }
})

// 初始化游戏数据
const initializeGameData = async () => {
  if (!tokenStore.selectedToken) return
  
  try {
    const tokenId = tokenStore.selectedToken.id
    console.log('🎮 初始化游戏数据...')
    
    // 获取角色信息
    console.log('🎮 正在获取角色信息...')
    const roleResult = tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    console.log('🎮 角色信息请求结果:', roleResult)
    
    // 获取塔信息
    console.log('🎮 正在获取塔信息...')
    const towerResult = tokenStore.sendMessage(tokenId, 'tower_getinfo')
    console.log('🎮 塔信息请求结果:', towerResult)
    
    // 获取队伍信息
    console.log('🎮 正在获取队伍信息...')
    const teamResult = tokenStore.sendMessage(tokenId, 'presetteam_getteam')
    console.log('🎮 队伍信息请求结果:', teamResult)
    
    console.log('🎮 游戏数据初始化请求已发送')
  } catch (error) {
    console.warn('初始化游戏数据失败:', error)
  }
}

onUnmounted(() => {
  // WebSocket 连接由 tokenStore 管理，不需要手动清理
})
</script>

<style scoped lang="scss">
.game-features-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

// 页面头部
.page-header {
  background: white;
  border-bottom: 1px solid var(--border-light);
  padding: var(--spacing-lg) 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
  margin: 0;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &.connected {
    background: rgba(24, 160, 88, 0.1);
    color: var(--success-color);
  }

  &.disconnected {
    background: rgba(208, 48, 80, 0.1);
    color: var(--error-color);
  }
}

// 反馈提示区域
.feedback-section {
  padding: var(--spacing-md) 0;
}

// 功能模块网格
.features-grid-section {
  padding: var(--spacing-xl) 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  border-left: 4px solid var(--primary-color);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  // 不同功能的主题色
  &.team-challenge { border-left-color: #2080f0; }
  &.daily-tasks { border-left-color: #f0a020; }
  &.salt-robot { border-left-color: #18a058; }
  &.idle-time { border-left-color: #d03050; }
  &.power-switch { border-left-color: #7c3aed; }
  &.club-ranking { border-left-color: #f59e0b; }
  &.club-checkin { border-left-color: #10b981; }
  &.tower-challenge { border-left-color: #6366f1; }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-medium);
  background: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.feature-title {
  flex: 1;

  h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }
}

.feature-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.feature-badge, .feature-status {
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.feature-status {
  &.in-progress {
    background: rgba(240, 160, 32, 0.1);
    color: var(--warning-color);
  }

  &.completed {
    background: rgba(24, 160, 88, 0.1);
    color: var(--success-color);
  }

  &.waiting {
    background: rgba(32, 128, 240, 0.1);
    color: var(--info-color);
  }
}

.card-content {
  margin-bottom: var(--spacing-lg);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);

  .stage-text {
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  .progress-text {
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }
}

.time-display {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--spacing-sm);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.task-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.card-actions {
  margin-top: var(--spacing-lg);
}

// WebSocket状态区域
.ws-status-section {
  padding: 0 0 var(--spacing-xl) 0;
}

.ws-status-card {
  background: white;
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);

  h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0;
  }
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border-light);

  &:last-child {
    border-bottom: none;
  }

  span:first-child {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
  }

  span:last-child {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
  }
}

.status-connected {
  color: var(--success-color);
}

.status-disconnected {
  color: var(--error-color);
}

// 响应式设计
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: var(--spacing-md);
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}
</style>

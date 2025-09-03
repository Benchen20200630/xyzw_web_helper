<template>
  <div class="dashboard-page">
    <!-- 顶部导航 -->
    <nav class="dashboard-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <img
            src="/icons/xiaoyugan.png"
            alt="XYZW"
            class="brand-logo"
          >
          <span class="brand-text">XYZW 控制台</span>
        </div>

        <div class="nav-menu">
          <router-link
            to="/dashboard"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Home /></n-icon>
            <span>首页</span>
          </router-link>
          <router-link
            to="/game-features"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Cube /></n-icon>
            <span>游戏功能</span>
          </router-link>
          <router-link
            to="/tokens"
            class="nav-item"
            active-class="active"
          >
            <n-icon><PersonCircle /></n-icon>
            <span>Token管理</span>
          </router-link>
          <router-link
            to="/daily-tasks"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Settings /></n-icon>
            <span>任务管理</span>
          </router-link>
          <router-link
            to="/message-test"
            class="nav-item"
            active-class="active"
          >
            <n-icon><ChatBubbles /></n-icon>
            <span>消息测试</span>
          </router-link>
          <router-link
            to="/profile"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Settings /></n-icon>
            <span>个人设置</span>
          </router-link>
        </div>

        <div class="nav-user">
          <n-dropdown
            :options="userMenuOptions"
            @select="handleUserAction"
          >
            <div class="user-info">
              <n-avatar
                size="medium"
                fallback-src="/icons/xiaoyugan.png"
              />
              <span class="username">{{ tokenStore.selectedToken?.name || '未选择Token' }}</span>
              <n-icon><ChevronDown /></n-icon>
            </div>
          </n-dropdown>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="dashboard-main">
      <div class="main-container">
        <!-- 欢迎区域 -->
        <section class="welcome-section">
          <div class="welcome-content">
            <div class="welcome-text">
              <h1>欢迎回来，{{ tokenStore.selectedToken?.name || '游戏玩家' }}！</h1>
              <p>今天是 {{ currentDate }}，继续您的游戏管理之旅吧</p>
            </div>
            <div class="welcome-actions">
              <n-button
                type="primary"
                size="large"
                @click="router.push('/game-features')"
              >
                进入游戏功能
              </n-button>
              <n-button
                size="large"
                @click="handleManageTokens"
              >
                管理Token
              </n-button>
            </div>
          </div>
        </section>

        <!-- 统计卡片 -->
        <section class="stats-section">
          <div class="stats-grid">
            <div
              v-for="stat in statistics"
              :key="stat.id"
              class="stat-card"
            >
              <div
                class="stat-icon"
                :style="{ color: stat.color }"
              >
                <component :is="stat.icon" />
              </div>
              <div class="stat-content">
                <div class="stat-number">
                  {{ stat.value }}
                </div>
                <div class="stat-label">
                  {{ stat.label }}
                </div>
                <div
                  class="stat-change"
                  :class="stat.changeType"
                >
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 快速操作 -->
        <section class="quick-actions-section">
          <h2 class="section-title">
            快速操作
          </h2>
          <div class="actions-grid">
            <div
              v-for="action in quickActions"
              :key="action.id"
              class="action-card"
              @click="handleQuickAction(action)"
            >
              <div class="action-icon">
                <component :is="action.icon" />
              </div>
              <div class="action-content">
                <h3>{{ action.title }}</h3>
                <p>{{ action.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 最近活动 -->
        <section class="recent-activity-section">
          <div class="activity-header">
            <h2 class="section-title">
              最近活动
            </h2>
            <n-button
              text
              type="primary"
              @click="refreshActivity"
            >
              刷新
            </n-button>
          </div>

          <div
            v-if="recentActivities.length"
            class="activity-list"
          >
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div
                class="activity-icon"
                :class="activity.type"
              >
                <component :is="getActivityIcon(activity.type)" />
              </div>
              <div class="activity-content">
                <div class="activity-text">
                  {{ activity.message }}
                </div>
                <div class="activity-time">
                  {{ formatTime(activity.timestamp) }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="empty-activity"
          >
            <n-empty description="暂无活动记录" />
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import {
  Home,
  PersonCircle,
  Cube,
  Settings,
  ChevronDown,
  Ribbon,
  CheckmarkCircle,
  Time,
  TrendingUp,
  Add,
  Chatbubbles,
  Cloud
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const tokenStore = useTokenStore()

// 响应式数据
const recentActivities = ref([])

// 计算属性
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const statistics = computed(() => [
  {
    id: 1,
    icon: PersonCircle,
    label: '游戏Token',
    value: tokenStore.gameTokens.length,
    change: '+2 本月',
    changeType: 'positive',
    color: '#18a058'
  },
  {
    id: 2,
    icon: CheckmarkCircle,
    label: '已完成任务',
    value: '156',
    change: '+12 今日',
    changeType: 'positive',
    color: '#2080f0'
  },
  {
    id: 3,
    icon: Time,
    label: '节省时间',
    value: '24.5h',
    change: '+3.2h 本周',
    changeType: 'positive',
    color: '#f0a020'
  },
  {
    id: 4,
    icon: TrendingUp,
    label: '效率提升',
    value: '85%',
    change: '+15% 本月',
    changeType: 'positive',
    color: '#d03050'
  }
])

const quickActions = ref([
  {
    id: 1,
    icon: Cube,
    title: '游戏功能',
    description: '访问所有游戏功能模块',
    action: 'game-features'
  },
  {
    id: 2,
    icon: Add,
    title: '添加Token',
    description: '快速添加新的游戏Token',
    action: 'add-token'
  },
  {
    id: 3,
    icon: CheckmarkCircle,
    title: '执行任务',
    description: '一键执行所有待完成任务',
    action: 'execute-tasks'
  },
  {
    id: 4,
    icon: Cloud,
    title: 'WebSocket测试',
    description: '测试WebSocket连接和游戏命令',
    action: 'websocket-test'
  },
  {
    id: 5,
    icon: Settings,
    title: '系统设置',
    description: '配置个人偏好和系统选项',
    action: 'open-settings'
  }
])

const userMenuOptions = [
  {
    label: '个人资料',
    key: 'profile'
  },
  {
    label: '账户设置',
    key: 'settings'
  },
  {
    type: 'divider'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

// 方法
const handleUserAction = (key) => {
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      tokenStore.clearAllTokens()
      message.success('已清除所有Token')
      router.push('/tokens')
      break
  }
}

const handleManageTokens = () => {
  console.log('🔘 点击管理Token按钮')
  console.log('📊 当前Token状态:', {
    hasTokens: tokenStore.hasTokens,
    selectedToken: tokenStore.selectedToken?.name,
    tokenCount: tokenStore.gameTokens.length
  })
  
  try {
    router.push('/tokens')
    console.log('✅ 成功导航到 /tokens')
  } catch (error) {
    console.error('❌ 导航失败:', error)
    message.error('导航到Token管理页面失败')
  }
}

const handleQuickAction = (action) => {
  switch (action.action) {
    case 'game-features':
      router.push('/game-features')
      break
    case 'add-token':
      handleManageTokens()
      break
    case 'execute-tasks':
      router.push('/game-features')
      break
    case 'websocket-test':
      router.push('/websocket-test')
      break
    case 'open-settings':
      router.push('/profile')
      break
  }
}

const refreshActivity = () => {
  // 模拟刷新活动数据
  recentActivities.value = [
    {
      id: 1,
      type: 'success',
      message: '成功完成日常任务：每日签到',
      timestamp: Date.now() - 30 * 60 * 1000
    },
    {
      id: 2,
      type: 'info',
      message: '添加了新的游戏角色：剑士小明',
      timestamp: Date.now() - 2 * 60 * 60 * 1000
    },
    {
      id: 3,
      type: 'warning',
      message: '任务执行遇到错误，请检查网络连接',
      timestamp: Date.now() - 4 * 60 * 60 * 1000
    }
  ]
  message.success('活动数据已刷新')
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'success':
      return CheckmarkCircle
    case 'warning':
      return Time
    case 'info':
    default:
      return Cube
  }
}

const formatTime = (timestamp) => {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

// 生命周期
onMounted(async () => {
  // 确保有Token
  if (!tokenStore.hasTokens) {
    router.push('/tokens')
    return
  }

  // 初始化Token数据
  tokenStore.initTokenStore()
  refreshActivity()
})
</script>

<style scoped lang="scss">
.dashboard-page {
  min-height: 100vh;
  background: var(--bg-secondary);
}

// 导航栏
.dashboard-nav {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.nav-container {
  display: flex;
  align-items: center;
  height: 64px;
  max-width: 1400px;
  margin: 0 auto;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-right: var(--spacing-xl);
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-small);
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.nav-menu {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-medium);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  &.active {
    background: var(--primary-color-light);
    color: var(--primary-color);
  }
}

.nav-user {
  margin-left: auto;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }
}

.username {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

// 主要内容
.dashboard-main {
  padding: var(--spacing-xl);
}

.main-container {
  max-width: 1400px;
  margin: 0 auto;
}

// 欢迎区域
.welcome-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-xl);
  color: white;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.welcome-text {
  h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-sm);
  }

  p {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin: 0;
  }
}

.welcome-actions {
  display: flex;
  gap: var(--spacing-md);
}

// 统计区域
.stats-section {
  margin-bottom: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--spacing-md);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.stat-number {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.stat-change {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &.positive {
    color: var(--success-color);
  }

  &.negative {
    color: var(--error-color);
  }
}

// 快速操作区域
.quick-actions-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-lg);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
  cursor: pointer;
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }
}

.action-icon {
  width: 40px;
  height: 40px;
  color: var(--primary-color);
  margin-bottom: var(--spacing-md);

  :deep(svg) {
    width: 100%;
    height: 100%;
  }
}

.action-content {
  h3 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  p {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin: 0;
  }
}

// 最近活动区域
.recent-activity-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-light);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-medium);
  transition: background var(--transition-fast);

  &:hover {
    background: var(--bg-tertiary);
  }
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.success {
    background: rgba(24, 160, 88, 0.1);
    color: var(--success-color);
  }

  &.warning {
    background: rgba(240, 160, 32, 0.1);
    color: var(--warning-color);
  }

  &.info {
    background: rgba(32, 128, 240, 0.1);
    color: var(--info-color);
  }

  :deep(svg) {
    width: 16px;
    height: 16px;
  }
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.activity-time {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

.empty-activity {
  text-align: center;
  padding: var(--spacing-xl) 0;
}

// 响应式设计
@media (max-width: 1024px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-main {
    padding: var(--spacing-md);
  }

  .nav-menu {
    display: none;
  }

  .welcome-section {
    padding: var(--spacing-xl);
  }

  .welcome-text h1 {
    font-size: var(--font-size-2xl);
  }

  .welcome-actions {
    flex-direction: column;
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>

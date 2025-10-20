<template>
  <div class="default-layout">
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
            to="/admin/dashboard"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Home /></n-icon>
            <span>首页</span>
          </router-link>
          <router-link
            to="/admin/game-features"
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
            to="/admin/daily-tasks"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Settings /></n-icon>
            <span>任务管理</span>
          </router-link>
          <router-link
            to="/admin/message-test"
            class="nav-item"
            active-class="active"
          >
            <n-icon><ChatbubbleEllipsesSharp /></n-icon>
            <span>消息测试</span>
          </router-link>
          <router-link
            to="/admin/profile"
            class="nav-item"
            active-class="active"
          >
            <n-icon><Settings /></n-icon>
            <span>个人设置</span>
          </router-link>
        </div>

        <div class="nav-user">
          <!-- 主题切换按钮 -->
          <ThemeToggle />

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
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { useTokenStore } from '@/stores/tokenStore'
import ThemeToggle from '@/components/Common/ThemeToggle.vue'
import {
  Home,
  PersonCircle,
  Cube,
  Settings,
  ChevronDown,
  ChatbubbleEllipsesSharp
} from '@vicons/ionicons5'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'

const tokenStore = useTokenStore()
const router = useRouter()
const message = useMessage()

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
      router.push('/admin/profile')
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

</script>

<style scoped lang="scss">
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
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
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
</style>

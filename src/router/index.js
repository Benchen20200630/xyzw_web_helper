import { createRouter, createWebHistory } from 'vue-router'
import { useTokenStore } from '@/stores/tokenStore'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      requiresToken: false
    }
  },
  {
    path: '/tokens',
    name: 'TokenImport',
    component: () => import('@/views/TokenImport.vue'),
    meta: {
      title: 'Token管理',
      requiresToken: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '控制台',
      requiresToken: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '个人设置',
      requiresToken: true
    }
  },
  {
    path: '/daily-tasks',
    name: 'DailyTasks',
    component: () => import('@/views/DailyTasks.vue'),
    meta: {
      title: '日常任务',
      requiresToken: true
    }
  },
  {
    path: '/game-features',
    name: 'GameFeatures',
    component: () => import('@/views/GameFeatures.vue'),
    meta: {
      title: '游戏功能',
      requiresToken: true
    }
  },
  {
    path: '/message-test',
    name: 'MessageTest',
    component: () => import('@/components/MessageTester.vue'),
    meta: {
      title: '消息测试',
      requiresToken: true
    }
  },
  {
    path: '/websocket-test',
    name: 'WebSocketTest',
    component: () => import('@/components/WebSocketTester.vue'),
    meta: {
      title: 'WebSocket测试',
      requiresToken: true
    }
  },
  // 兼容旧路由，重定向到新的token管理页面
  {
    path: '/login',
    redirect: '/tokens'
  },
  {
    path: '/register',
    redirect: '/tokens'
  },
  {
    path: '/game-roles',
    redirect: '/tokens'
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 导航守卫
router.beforeEach((to, from, next) => {
  const tokenStore = useTokenStore()

  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - XYZW 游戏管理系统` : 'XYZW 游戏管理系统'

  // 检查是否需要Token
  if (to.meta.requiresToken && !tokenStore.hasTokens) {
    next('/tokens')
  } else if (to.path === '/' && tokenStore.hasTokens) {
    // 首页重定向逻辑
    if (tokenStore.selectedToken) {
      next('/dashboard')
    } else {
      next('/tokens')
    }
  } else {
    next()
  }
})

export default router

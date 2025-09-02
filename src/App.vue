<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <div id="app">
              <router-view />
            </div>
          </n-dialog-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { darkTheme } from 'naive-ui'

// 主题控制
const theme = ref(null)

// 检查用户偏好的主题
const checkThemePreference = () => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    theme.value = darkTheme
    document.documentElement.classList.add('dark')
  } else {
    theme.value = null
    document.documentElement.classList.remove('dark')
  }
}

// 监听系统主题变化
const setupThemeListener = () => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addListener(() => {
    const savedTheme = localStorage.getItem('theme')
    // 只有在用户没有手动设置主题时才跟随系统
    if (!savedTheme) {
      checkThemePreference()
    }
  })
}

onMounted(() => {
  checkThemePreference()
  setupThemeListener()
})
</script>

<style>
/* 主题变量 */
:root {
  --app-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --text-color: #333;
  --text-secondary: #666;
  --text-tertiary: #999;
  --bg-color: #ffffff;
  --border-color: #e0e0e0;
}

/* 深色主题变量 */
.dark {
  --app-background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  --text-color: #ffffff !important;
  --text-secondary: #cbd5e0 !important;
  --text-tertiary: #a0aec0 !important;
  --bg-color: #1a202c !important;
  --border-color: #4a5568 !important;
}

/* 强制深色主题样式 - 更具体的选择器 */
html.dark,
html.dark body,
html.dark #app,
html.dark * {
  color: #ffffff !important;
}

html.dark .n-form-item-label,
html.dark .n-form-item-label__text,
html.dark .n-input,
html.dark .n-input__input,
html.dark .n-input__textarea,
html.dark .n-collapse-item__header,
html.dark .n-radio-button,
html.dark .n-card,
html.dark .n-card__content,
html.dark h1,
html.dark h2,
html.dark h3,
html.dark p,
html.dark span,
html.dark div {
  color: #ffffff !important;
}

html.dark .n-input__placeholder,
html.dark ::placeholder {
  color: rgba(255, 255, 255, 0.6) !important;
}

#app {
  min-height: 100vh;
  background: var(--app-background);
  color: var(--text-color);
  transition: background 0.3s ease, color 0.3s ease;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: var(--text-color);
  transition: color 0.3s ease;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
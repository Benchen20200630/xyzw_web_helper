<template>
  <div class="token-import-page">
    <div class="container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-top">
            <img
              src="/icons/xiaoyugan.png"
              alt="XYZW"
              class="brand-logo"
            >
            <!-- 主题切换按钮 -->
            <n-button 
              circle 
              size="small" 
              class="theme-toggle"
              @click="toggleTheme"
            >
              <template #icon>
                <n-icon v-if="isDarkTheme">
                  <Sunny />
                </n-icon>
                <n-icon v-else>
                  <Moon />
                </n-icon>
              </template>
            </n-button>
          </div>
          <h1>游戏Token管理</h1>
        </div>
      </div>

      <!-- Token导入区域 -->
      <div
        v-if="!tokenStore.hasTokens || showImportForm"
        class="import-section"
      >
        <div class="import-card">
          <div class="card-header">
            <h2>
              <n-icon><Add /></n-icon>
              添加游戏Token
            </h2>
            
            <!-- 导入方式选择 -->
            <n-radio-group
              v-model:value="importMethod"
              class="import-method-tabs"
              size="small"
            >
              <n-radio-button value="manual">
                手动输入
              </n-radio-button>
              <n-radio-button value="url">
                URL获取
              </n-radio-button>
            </n-radio-group>
          </div>

          <!-- 手动输入表单 -->
          <n-form
            v-if="importMethod === 'manual'"
            ref="importFormRef"
            :model="importForm"
            :rules="importRules"
            :label-placement="'top'"
            :size="'large'"
            :show-label="true"
          >
            <n-form-item
              :label="'游戏角色名称'"
              :path="'name'"
              :show-label="true"
            >
              <n-input
                v-model:value="importForm.name"
                placeholder="例如：主号战士"
                clearable
              />
            </n-form-item>

            <n-form-item
              :label="'Token字符串'"
              :path="'base64Token'"
              :show-label="true"
            >
              <n-input
                v-model:value="importForm.base64Token"
                type="textarea"
                :rows="3"
                placeholder="粘贴Token字符串..."
                clearable
              />
            </n-form-item>

            <!-- 角色详情 -->
            <n-collapse>
              <n-collapse-item
                title="角色详情 (可选)"
                name="optional"
              >
                <div class="optional-fields">
                  <n-form-item label="服务器">
                    <n-input
                      v-model:value="importForm.server"
                      placeholder="服务器名称"
                    />
                  </n-form-item>

                  <n-form-item label="自定义连接地址">
                    <n-input
                      v-model:value="importForm.wsUrl"
                      placeholder="留空使用默认连接"
                    />
                  </n-form-item>
                </div>
              </n-collapse-item>
            </n-collapse>


            <div class="form-actions">
              <n-button
                type="primary"
                size="large"
                block
                :loading="isImporting"
                @click="handleImport"
              >
                <template #icon>
                  <n-icon><CloudUpload /></n-icon>
                </template>
                添加Token
              </n-button>

              <n-button
                v-if="tokenStore.hasTokens"
                size="large"
                block
                @click="showImportForm = false"
              >
                取消
              </n-button>
            </div>
          </n-form>

          <!-- URL获取表单 -->
          <n-form
            v-if="importMethod === 'url'"
            ref="urlFormRef"
            :model="urlForm"
            :rules="urlRules"
            label-placement="top"
            size="large"
          >
            <n-form-item
              label="游戏角色名称"
              path="name"
            >
              <n-input
                v-model:value="urlForm.name"
                placeholder="例如：主号战士"
                clearable
              />
            </n-form-item>

            <n-form-item
              label="Token获取地址"
              path="url"
            >
              <n-input
                v-model:value="urlForm.url"
                placeholder="输入API接口地址..."
                clearable
              />
              <template #feedback>
                <div class="form-tips">
                  <span class="form-tip">
                    接口应返回包含token字段的JSON数据
                  </span>
                  <span class="form-tip cors-tip">
                    注意：如果是跨域URL，服务器需要支持CORS，否则会被浏览器阻止
                  </span>
                </div>
              </template>
            </n-form-item>

            <!-- 角色详情 -->
            <n-collapse>
              <n-collapse-item
                title="角色详情 (可选)"
                name="optional"
              >
                <div class="optional-fields">
                  <n-form-item label="服务器">
                    <n-input
                      v-model:value="urlForm.server"
                      placeholder="服务器名称"
                    />
                  </n-form-item>

                  <n-form-item label="自定义连接地址">
                    <n-input
                      v-model:value="urlForm.wsUrl"
                      placeholder="留空使用默认连接"
                    />
                  </n-form-item>
                </div>
              </n-collapse-item>
            </n-collapse>

            <div class="form-actions">
              <n-button
                type="primary"
                size="large"
                block
                :loading="isImporting"
                @click="handleUrlImport"
              >
                <template #icon>
                  <n-icon><CloudUpload /></n-icon>
                </template>
                获取并添加Token
              </n-button>

              <n-button
                v-if="tokenStore.hasTokens"
                size="large"
                block
                @click="showImportForm = false"
              >
                取消
              </n-button>
            </div>
          </n-form>
        </div>
      </div>

      <!-- Token列表 -->
      <div
        v-if="tokenStore.hasTokens"
        class="tokens-section"
      >
        <div class="section-header">
          <h2>我的Token列表 ({{ tokenStore.gameTokens.length }}个)</h2>
          <div class="header-actions">
            <n-button
              v-if="tokenStore.selectedToken"
              type="success"
              @click="goToDashboard"
            >
              <template #icon>
                <n-icon><Home /></n-icon>
              </template>
              返回控制台
            </n-button>

            <n-button
              v-if="!showImportForm"
              type="primary"
              @click="showImportForm = true"
            >
              <template #icon>
                <n-icon><Add /></n-icon>
              </template>
              添加Token
            </n-button>

            <n-dropdown
              :options="bulkOptions"
              @select="handleBulkAction"
            >
              <n-button>
                <template #icon>
                  <n-icon><Menu /></n-icon>
                </template>
                批量操作
              </n-button>
            </n-dropdown>
          </div>
        </div>

        <div class="tokens-grid">
          <div
            v-for="token in tokenStore.gameTokens"
            :key="token.id"
            class="token-card"
            :class="{
              active: token.id === tokenStore.selectedTokenId,
              connected: getConnectionStatus(token.id) === 'connected'
            }"
            @click="selectToken(token)"
          >
            <div class="card-header">
              <div class="token-info">
                <h3 class="token-name">
                  {{ token.name }}
                </h3>
                <div class="token-meta">
                  <span
                    v-if="token.server"
                    class="meta-item"
                  >{{ token.server }}</span>
                </div>
              </div>

              <div class="card-actions">
                <n-dropdown
                  :options="getTokenActions(token)"
                  @select="(key) => handleTokenAction(key, token)"
                >
                  <n-button text>
                    <template #icon>
                      <n-icon><EllipsisHorizontal /></n-icon>
                    </template>
                  </n-button>
                </n-dropdown>
              </div>
            </div>

            <div class="card-body">
              <div class="token-display">
                <span class="token-label">Token:</span>
                <code class="token-value">{{ maskToken(token.token) }}</code>
              </div>

              <div class="connection-status">
                <div class="status-indicator">
                  <span
                    class="status-dot"
                    :class="getConnectionStatus(token.id)"
                  />
                  <span class="status-text">
                    {{ getConnectionStatusText(token.id) }}
                  </span>
                </div>

                <div class="connection-actions">
                  <n-button
                    v-if="token.sourceUrl"
                    size="small"
                    type="default"
                    :loading="refreshingTokens.has(token.id)"
                    @click.stop="refreshToken(token)"
                  >
                    <template #icon>
                      <n-icon><Refresh /></n-icon>
                    </template>
                    刷新
                  </n-button>
                  
                  <n-button
                    size="small"
                    :type="getConnectionStatus(token.id) === 'connected' ? 'warning' : 'primary'"
                    @click.stop="toggleConnection(token)"
                  >
                    {{ getConnectionStatus(token.id) === 'connected' ? '断开' : '连接' }}
                  </n-button>
                </div>
              </div>

              <div class="token-timestamps">
                <div class="timestamp-item">
                  <span class="timestamp-label">创建：</span>
                  <span class="timestamp-value">{{ formatTime(token.createdAt) }}</span>
                </div>
                <div class="timestamp-item">
                  <span class="timestamp-label">使用：</span>
                  <span class="timestamp-value">{{ formatTime(token.lastUsed) }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="token.id === tokenStore.selectedTokenId"
              class="card-footer"
            >
              <n-button
                type="primary"
                block
                @click="goToDashboard"
              >
                开始任务管理
              </n-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!tokenStore.hasTokens && !showImportForm"
        class="empty-state"
      >
        <n-empty
          size="large"
          description="还没有导入任何Token"
        >
          <template #icon>
            <n-icon size="64">
              <Key />
            </n-icon>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 编辑Token模态框 -->
    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="编辑Token"
      style="width: 500px"
    >
      <n-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-placement="left"
        label-width="80px"
      >
        <n-form-item
          label="名称"
          path="name"
        >
          <n-input v-model:value="editForm.name" />
        </n-form-item>
        <n-form-item label="服务器">
          <n-input v-model:value="editForm.server" />
        </n-form-item>
        <n-form-item label="WebSocket地址">
          <n-input v-model:value="editForm.wsUrl" />
        </n-form-item>
      </n-form>

      <template #footer>
        <div class="modal-actions">
          <n-button @click="showEditModal = false">
            取消
          </n-button>
          <n-button
            type="primary"
            @click="saveEdit"
          >
            保存
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NIcon } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import {
  Add,
  CloudUpload,
  Menu,
  EllipsisHorizontal,
  Key,
  Refresh,
  Sunny,
  Moon,
  Home,
  Create,
  Copy,
  SyncCircle,
  Link,
  TrashBin
} from '@vicons/ionicons5'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const tokenStore = useTokenStore()

// 响应式数据
const showImportForm = ref(false)
const isImporting = ref(false)
const showEditModal = ref(false)
const importFormRef = ref(null)
const urlFormRef = ref(null)
const editFormRef = ref(null)
const editingToken = ref(null)
const importMethod = ref('manual')
const refreshingTokens = ref(new Set())

// 主题控制
const isDarkTheme = computed(() => {
  return document.documentElement.classList.contains('dark')
})

const toggleTheme = () => {
  const isDark = document.documentElement.classList.contains('dark')
  if (isDark) {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  } else {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  }
  
  // 触发全局主题更新
  window.location.reload()
}

// 导入表单
const importForm = reactive({
  name: '',
  base64Token: '',
  server: '',
  wsUrl: ''
})

// URL表单
const urlForm = reactive({
  name: '',
  url: '',
  server: '',
  wsUrl: ''
})

// 编辑表单
const editForm = reactive({
  name: '',
  server: '',
  wsUrl: ''
})

// 验证规则
const importRules = {
  name: [
    { required: true, message: '请输入Token名称', trigger: 'blur' }
  ],
  base64Token: [
    { required: true, message: '请输入Base64 Token', trigger: 'blur' }
  ]
}

const urlRules = {
  name: [
    { required: true, message: '请输入Token名称', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入Token获取地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ]
}

const editRules = {
  name: [
    { required: true, message: '请输入Token名称', trigger: 'blur' }
  ]
}


const bulkOptions = [
  { label: '导出所有Token', key: 'export' },
  { label: '导入Token文件', key: 'import' },
  { label: '清理过期Token', key: 'clean' },
  { label: '断开所有连接', key: 'disconnect' },
  { label: '清除所有Token', key: 'clear' }
]

// 方法
const handleImport = async () => {
  if (!importFormRef.value) return

  try {
    await importFormRef.value.validate()
    isImporting.value = true

    const result = tokenStore.importBase64Token(
      importForm.name,
      importForm.base64Token,
      {
        server: importForm.server,
        wsUrl: importForm.wsUrl,
        importMethod: 'manual'
      }
    )

    if (result.success) {
      message.success(result.message)
      // 显示token详情信息（如果有）
      if (result.details) {
        console.log('Token导入详情:', result.details)
      }
      resetImportForm()
      showImportForm.value = false
    } else {
      const errorMsg = result.error || result.message || 'Token导入失败'
      message.error(errorMsg)
      console.error('Token导入错误详情:', {
        error: result.error,
        message: result.message,
        originalToken: importForm.base64Token?.substring(0, 50) + '...'
      })
    }
  } catch (error) {
    // 表单验证失败
  } finally {
    isImporting.value = false
  }
}

// URL获取Token
const handleUrlImport = async () => {
  if (!urlFormRef.value) return

  try {
    await urlFormRef.value.validate()
    isImporting.value = true

    // 获取Token数据 - 处理跨域问题
    let response
    
    // 检查是否为本地或相同域名的URL
    const isLocalUrl = urlForm.url.startsWith(window.location.origin) || 
                      urlForm.url.startsWith('/') ||
                      urlForm.url.startsWith('http://localhost') ||
                      urlForm.url.startsWith('http://127.0.0.1')
    
    if (isLocalUrl) {
      // 本地URL直接请求
      response = await fetch(urlForm.url)
    } else {
      // 跨域URL - 尝试CORS请求
      try {
        response = await fetch(urlForm.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        })
      } catch (corsError) {
        throw new Error(`跨域请求被阻止。请确保目标服务器支持CORS，或使用浏览器扩展/代理服务器。错误详情: ${corsError.message}`)
      }
    }

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // 检查返回数据是否包含token
    if (!data.token) {
      throw new Error('返回数据中未找到token字段')
    }

    // 使用获取到的token创建新的token记录
    const result = tokenStore.importBase64Token(
      urlForm.name,
      data.token,
      {
        server: urlForm.server || data.server,
        wsUrl: urlForm.wsUrl,
        sourceUrl: urlForm.url, // 保存源URL用于刷新
        importMethod: 'url'
      }
    )

    if (result.success) {
      message.success(result.message)
      // 显示token详情信息（如果有）
      if (result.details) {
        console.log('URL Token导入详情:', result.details)
      }
      resetUrlForm()
      showImportForm.value = false
    } else {
      const errorMsg = result.error || result.message || 'URL Token导入失败'
      message.error(errorMsg)
      console.error('URL Token导入错误详情:', {
        error: result.error,
        message: result.message,
        sourceUrl: urlForm.url,
        receivedToken: data?.token?.substring(0, 50) + '...'
      })
    }
  } catch (error) {
    console.error('URL获取Token失败:', error)
    message.error(error.message || 'URL获取Token失败')
  } finally {
    isImporting.value = false
  }
}

// 刷新Token
const refreshToken = async (token) => {
  if (!token.sourceUrl) {
    message.warning('该Token未配置刷新地址')
    return
  }

  refreshingTokens.value.add(token.id)
  
  try {
    // 使用与导入相同的跨域处理逻辑
    let response
    
    const isLocalUrl = token.sourceUrl.startsWith(window.location.origin) || 
                      token.sourceUrl.startsWith('/') ||
                      token.sourceUrl.startsWith('http://localhost') ||
                      token.sourceUrl.startsWith('http://127.0.0.1')
    
    if (isLocalUrl) {
      response = await fetch(token.sourceUrl)
    } else {
      try {
        response = await fetch(token.sourceUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors'
        })
      } catch (corsError) {
        throw new Error(`跨域请求被阻止。请确保目标服务器支持CORS。错误详情: ${corsError.message}`)
      }
    }

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    if (!data.token) {
      throw new Error('返回数据中未找到token字段')
    }

    // 更新token信息
    tokenStore.updateToken(token.id, {
      token: data.token,
      server: data.server || token.server,
      lastRefreshed: Date.now()
    })

    // 如果当前token有连接，需要重新连接
    if (tokenStore.getWebSocketStatus(token.id) === 'connected') {
      tokenStore.closeWebSocketConnection(token.id)
      setTimeout(() => {
        tokenStore.createWebSocketConnection(token.id, data.token, token.wsUrl)
      }, 500)
    }

    message.success('Token刷新成功')
  } catch (error) {
    console.error('刷新Token失败:', error)
    message.error(error.message || 'Token刷新失败')
  } finally {
    refreshingTokens.value.delete(token.id)
  }
}

const resetImportForm = () => {
  Object.keys(importForm).forEach(key => {
    importForm[key] = ''
  })
}

const resetUrlForm = () => {
  Object.keys(urlForm).forEach(key => {
    urlForm[key] = ''
  })
}

const selectToken = (token) => {
  tokenStore.selectToken(token.id)
  message.success(`已选择：${token.name}`)
}

const getConnectionStatus = (tokenId) => {
  return tokenStore.getWebSocketStatus(tokenId)
}

const getConnectionStatusText = (tokenId) => {
  const status = getConnectionStatus(tokenId)
  switch (status) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中'
    case 'error': return '连接错误'
    default: return '未连接'
  }
}

const toggleConnection = (token) => {
  const status = getConnectionStatus(token.id)

  if (status === 'connected') {
    tokenStore.closeWebSocketConnection(token.id)
    message.info('WebSocket连接已断开')
  } else {
    tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
    message.success('正在建立WebSocket连接...')
  }
}

const getTokenActions = (token) => {
  const actions = [
    { 
      label: '编辑', 
      key: 'edit',
      icon: () => h(NIcon, null, { default: () => h(Create) })
    },
    { 
      label: '复制Token', 
      key: 'copy',
      icon: () => h(NIcon, null, { default: () => h(Copy) })
    }
  ]

  // 根据Token类型添加不同的刷新选项
  if (token.importMethod === 'url' && token.sourceUrl) {
    actions.push({ 
      label: '从URL刷新', 
      key: 'refresh-url',
      icon: () => h(NIcon, null, { default: () => h(SyncCircle) })
    })
  } else {
    actions.push({ 
      label: '刷新Token', 
      key: 'refresh',
      icon: () => h(NIcon, null, { default: () => h(Refresh) })
    })
  }

  actions.push(
    { 
      label: '重新连接', 
      key: 'reconnect',
      icon: () => h(NIcon, null, { default: () => h(Link) })
    },
    { type: 'divider' },
    { 
      label: '删除', 
      key: 'delete',
      icon: () => h(NIcon, null, { default: () => h(TrashBin) }),
      props: { style: { color: '#e74c3c' } }
    }
  )

  return actions
}

const handleTokenAction = async (key, token) => {
  switch (key) {
    case 'edit':
      editToken(token)
      break
    case 'copy':
      copyToken(token)
      break
    case 'refresh':
      // 手动添加的Token的刷新逻辑（暂时提示）
      message.info('手动添加的Token暂不支持刷新，请重新导入')
      break
    case 'refresh-url':
      // URL获取的Token刷新
      refreshToken(token)
      break
    case 'reconnect':
      reconnectToken(token)
      break
    case 'delete':
      deleteToken(token)
      break
  }
}

const editToken = (token) => {
  editingToken.value = token
  Object.assign(editForm, {
    name: token.name,
    server: token.server || '',
    wsUrl: token.wsUrl || ''
  })
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editFormRef.value || !editingToken.value) return

  try {
    await editFormRef.value.validate()

    tokenStore.updateToken(editingToken.value.id, {
      name: editForm.name,
      server: editForm.server,
      wsUrl: editForm.wsUrl
    })

    message.success('Token信息已更新')
    showEditModal.value = false
    editingToken.value = null
  } catch (error) {
    // 验证失败
  }
}

const copyToken = async (token) => {
  try {
    await navigator.clipboard.writeText(token.token)
    message.success('Token已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

const reconnectToken = (token) => {
  tokenStore.closeWebSocketConnection(token.id)
  setTimeout(() => {
    tokenStore.createWebSocketConnection(token.id, token.token, token.wsUrl)
    message.success('正在重新连接...')
  }, 500)
}

const deleteToken = (token) => {
  dialog.warning({
    title: '删除Token',
    content: `确定要删除Token "${token.name}" 吗？此操作无法恢复。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      tokenStore.removeToken(token.id)
      message.success('Token已删除')
    }
  })
}

const handleBulkAction = (key) => {
  switch (key) {
    case 'export':
      exportTokens()
      break
    case 'import':
      importTokenFile()
      break
    case 'clean':
      cleanExpiredTokens()
      break
    case 'disconnect':
      disconnectAll()
      break
    case 'clear':
      clearAllTokens()
      break
  }
}

const exportTokens = () => {
  try {
    const data = tokenStore.exportTokens()
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `tokens_backup_${new Date().toISOString().split('T')[0]}.json`
    link.click()

    message.success('Token数据已导出')
  } catch (error) {
    message.error('导出失败')
  }
}

const importTokenFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          const result = tokenStore.importTokens(data)
          if (result.success) {
            message.success(result.message)
          } else {
            message.error(result.message)
          }
        } catch (error) {
          message.error('文件格式错误')
        }
      }
      reader.readAsText(file)
    }
  }
  input.click()
}

const cleanExpiredTokens = () => {
  const count = tokenStore.cleanExpiredTokens()
  message.success(`已清理 ${count} 个过期Token`)
}

const disconnectAll = () => {
  tokenStore.gameTokens.forEach(token => {
    tokenStore.closeWebSocketConnection(token.id)
  })
  message.success('所有连接已断开')
}

const clearAllTokens = () => {
  dialog.error({
    title: '清除所有Token',
    content: '确定要清除所有Token吗？此操作无法恢复！',
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: () => {
      tokenStore.clearAllTokens()
      message.success('所有Token已清除')
    }
  })
}

const maskToken = (token) => {
  if (!token) return ''
  const len = token.length
  if (len <= 8) return token
  return token.substring(0, 4) + '***' + token.substring(len - 4)
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

// 生命周期
onMounted(() => {
  tokenStore.initTokenStore()

  // 如果没有token，显示导入表单
  if (!tokenStore.hasTokens) {
    showImportForm.value = true
  }
})
</script>

<style scoped lang="scss">
.token-import-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.header-top {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  position: relative;
  width: 100%;
  justify-content: center;
}

.theme-toggle {
  position: absolute;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius-medium);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.header-content h1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.header-content p {
  font-size: var(--font-size-lg);
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

.import-section {
  margin-bottom: var(--spacing-2xl);
}

.import-card {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-large);
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);

  h2 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    color: var(--text-primary);
    font-size: var(--font-size-xl);
    margin-bottom: var(--spacing-sm);
  }

  p {
    color: var(--text-secondary);
    margin: 0 0 var(--spacing-md) 0;
  }

  .subtitle {
    font-size: var(--font-size-md);
    color: var(--text-tertiary);
    margin: 0;
    font-weight: var(--font-weight-normal);
  }

  .import-method-tabs {
    margin-top: var(--spacing-md);
    display: flex;
    justify-content: center;
  }
}

.form-tips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-tip {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
}

.cors-tip {
  color: var(--warning-color);
  font-weight: var(--font-weight-medium);
}

.connection-actions {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

/* 深色主题强制覆盖 */
.dark .n-form-item-label,
.dark .n-form-item-label__text {
  color: #ffffff !important;
}

.dark .n-input__input,
.dark .n-input__textarea {
  color: #ffffff !important;
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.dark .n-input__placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}

.dark .n-card {
  background-color: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
}

.dark .import-card {
  background: rgba(45, 55, 72, 0.9) !important;
  color: #ffffff !important;
}

.dark .import-card h2 {
  color: #ffffff !important;
}

.dark .import-card .subtitle {
  color: rgba(255, 255, 255, 0.7) !important;
}

.dark .n-collapse-item__header {
  color: #ffffff !important;
}

.dark .n-collapse-item__content-wrapper {
  background-color: transparent !important;
}

.dark .n-radio-button {
  color: #ffffff !important;
}

.dark .n-radio-button--checked {
  background-color: rgba(16, 185, 129, 0.8) !important;
  color: #ffffff !important;
}

.dark .form-tip {
  color: rgba(255, 255, 255, 0.6) !important;
}

.optional-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.tokens-section {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-medium);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);

  h2 {
    color: var(--text-primary);
    font-size: var(--font-size-xl);
    margin: 0;
  }
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.tokens-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
}

.token-card {
  border: 2px solid var(--border-light);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }

  &.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  }

  &.connected {
    border-left: 4px solid var(--success-color);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.token-info {
  flex: 1;
}

.token-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.token-meta {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.meta-item {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-small);
}

.card-body {
  margin-bottom: var(--spacing-md);
}

.token-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
}

.token-label {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.token-value {
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  flex: 1;
}

.connection-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);

  &.connected {
    background: var(--success-color);
  }

  &.connecting {
    background: var(--warning-color);
  }

  &.error {
    background: var(--error-color);
  }
}

.status-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.token-timestamps {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.timestamp-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.timestamp-label {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.timestamp-value {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.card-footer {
  border-top: 1px solid var(--border-light);
  padding-top: var(--spacing-md);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-medium);
}

.modal-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .tokens-grid {
    grid-template-columns: 1fr;
  }

  .optional-fields {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }

  .token-timestamps {
    flex-direction: column;
  }
}
</style>

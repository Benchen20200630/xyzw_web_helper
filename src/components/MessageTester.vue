<template>
  <div class="message-tester">
    <n-card
      title="消息加解密测试"
      class="mb-4"
    >
      <div class="space-y-4">
        <!-- 选择Token -->
        <div>
          <n-select
            v-model:value="selectedTokenId"
            :options="tokenOptions"
            placeholder="选择要测试的游戏Token"
            class="w-full"
          />
        </div>

        <!-- WebSocket连接状态 -->
        <div v-if="selectedTokenId">
          <n-tag :type="wsStatusType">
            {{ wsStatusText }}
          </n-tag>
          <n-button 
            v-if="wsStatus !== 'connected'" 
            type="primary"
            size="small"
            class="ml-2"
            @click="connectWebSocket"
          >
            连接WebSocket
          </n-button>
          <n-button 
            type="info"
            size="small"
            class="ml-2"
            @click="testBONDecoding"
          >
            🔓 测试BON解码
          </n-button>
        </div>

        <!-- 预设消息测试 -->
        <n-divider title-placement="left">
          预设消息测试
        </n-divider>
        <div class="grid grid-cols-2 gap-2">
          <n-button
            :disabled="!canSendMessage"
            @click="sendHeartbeat"
          >
            💗 发送心跳
          </n-button>
          <n-button
            :disabled="!canSendMessage"
            @click="sendGetRoleInfo"
          >
            👤 获取角色信息
          </n-button>
          <n-button
            :disabled="!canSendMessage"
            @click="sendGetDataVersion"
          >
            📦 获取数据版本
          </n-button>
          <n-button
            :disabled="!canSendMessage"
            @click="sendSignIn"
          >
            📅 签到
          </n-button>
        </div>

        <!-- 自定义消息发送 -->
        <n-divider title-placement="left">
          自定义消息
        </n-divider>
        <div class="space-y-2">
          <n-input
            v-model:value="customCmd"
            placeholder="命令 (例如: role_getroleinfo)"
            class="w-full"
          />
          <n-input
            v-model:value="customBody"
            type="textarea"
            placeholder="消息体 JSON (例如: {&quot;clientVersion&quot;: &quot;1.65.3-wx&quot;})"
            :rows="3"
            class="w-full"
          />
          <n-button 
            :disabled="!canSendMessage || !customCmd" 
            type="primary"
            @click="sendCustomMessage"
          >
            🚀 发送自定义消息
          </n-button>
        </div>

        <!-- 消息历史 -->
        <n-divider title-placement="left">
          消息历史
        </n-divider>
        <div class="message-history max-h-96 overflow-y-auto">
          <div 
            v-for="(message, index) in messageHistory" 
            :key="index"
            class="message-item p-3 mb-2 rounded border"
            :class="message.type === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'"
          >
            <div class="flex justify-between items-center mb-2">
              <span class="font-semibold">
                {{ message.type === 'sent' ? '📤 发送' : '📨 接收' }}
                <span class="text-sm text-gray-500 ml-2">{{ formatTime(message.timestamp) }}</span>
              </span>
            </div>
            
            <div
              v-if="message.cmd"
              class="text-sm"
            >
              <strong>命令:</strong> {{ message.cmd }}
            </div>
            
            <div class="mt-2">
              <n-collapse>
                <n-collapse-item
                  title="查看详细数据"
                  name="detail"
                >
                  <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">{{ formatJSON(message.data) }}</pre>
                </n-collapse-item>
              </n-collapse>
            </div>
          </div>
          
          <div
            v-if="messageHistory.length === 0"
            class="text-center text-gray-500"
          >
            暂无消息历史
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTokenStore } from '../stores/tokenStore'
import { useMessage } from 'naive-ui'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const selectedTokenId = ref(null)
const customCmd = ref('')
const customBody = ref('{}')
const messageHistory = ref([])
const lastProcessedMessage = ref(null) // 追踪最后处理的消息

// 计算属性
const tokenOptions = computed(() => {
  return tokenStore.gameTokens.map(token => ({
    label: token.name,
    value: token.id
  }))
})

const wsStatus = computed(() => {
  return selectedTokenId.value ? tokenStore.getWebSocketStatus(selectedTokenId.value) : 'disconnected'
})

const wsStatusType = computed(() => {
  switch (wsStatus.value) {
    case 'connected': return 'success'
    case 'connecting': return 'warning'
    case 'error': return 'error'
    default: return 'default'
  }
})

const wsStatusText = computed(() => {
  switch (wsStatus.value) {
    case 'connected': return '🟢 已连接'
    case 'connecting': return '🟡 连接中'
    case 'error': return '🔴 连接错误'
    default: return '⚪ 未连接'
  }
})

const canSendMessage = computed(() => {
  return selectedTokenId.value && wsStatus.value === 'connected'
})

// 方法
const connectWebSocket = () => {
  if (!selectedTokenId.value) {
    message.error('请先选择一个token')
    return
  }
  
  const token = tokenStore.gameTokens.find(t => t.id === selectedTokenId.value)
  if (token) {
    console.log('🔧 MessageTester: 开始连接WebSocket', {
      tokenId: selectedTokenId.value,
      tokenName: token.name,
      hasToken: !!token.token
    })
    
    try {
      tokenStore.selectToken(selectedTokenId.value)
      message.success('正在建立WebSocket连接...')
    } catch (error) {
      console.error('❌ MessageTester: WebSocket连接失败', error)
      message.error('WebSocket连接失败: ' + error.message)
    }
  } else {
    message.error('找不到选中的token')
  }
}

const testBONDecoding = async () => {
  try {
    // 导入BON协议
    const { g_utils } = await import('../utils/bonProtocol.js')
    
    // 测试一些简单的数据
    const testData = new Uint8Array([8, 2, 5, 4, 114, 111, 108, 101])
    
    console.log('🧪 BON解码测试开始')
    console.log('🔍 g_utils可用性检查:', {
      hasGUtils: !!g_utils,
      hasBon: !!(g_utils && g_utils.bon),
      hasBonDecode: !!(g_utils && g_utils.bon && g_utils.bon.decode)
    })
    
    if (g_utils && g_utils.bon && g_utils.bon.decode) {
      console.log('📥 测试数据:', testData)
      const decoded = g_utils.bon.decode(testData)
      console.log('✅ BON解码成功:', decoded)
      message.success(`BON解码器工作正常: ${JSON.stringify(decoded)}`)
      
      // 添加测试结果到历史
      addToHistory('test', {
        testType: 'BON解码测试',
        input: Array.from(testData),
        output: decoded,
        status: 'success'
      }, 'bon_decode_test')
    } else {
      console.error('❌ BON解码器不可用')
      message.error('BON解码器不可用')
      
      // 添加错误结果到历史  
      addToHistory('test', {
        testType: 'BON解码测试',
        error: 'BON解码器不可用',
        status: 'error'
      }, 'bon_decode_test')
    }
  } catch (error) {
    console.error('❌ BON解码测试失败:', error)
    message.error('BON解码测试失败: ' + error.message)
    
    // 添加错误结果到历史
    addToHistory('test', {
      testType: 'BON解码测试',
      error: error.message,
      status: 'error'
    }, 'bon_decode_test')
  }
}

const addToHistory = (type, data, cmd = null) => {
  // 过滤心跳消息 (但保留test类型)
  if (type !== 'test' && (cmd === '_sys/ack' || cmd === 'heartbeat')) {
    return
  }
  
  messageHistory.value.unshift({
    type,
    timestamp: new Date().toISOString(),
    cmd,
    data
  })
  
  // 保持历史记录在合理范围内
  if (messageHistory.value.length > 50) {
    messageHistory.value = messageHistory.value.slice(0, 50)
  }
}

const sendHeartbeat = () => {
  if (!canSendMessage.value) return
  
  const success = tokenStore.sendHeartbeat(selectedTokenId.value)
  if (success) {
    // 不记录心跳消息到历史
    message.success('心跳消息已发送')
  } else {
    message.error('心跳消息发送失败')
  }
}

const sendGetRoleInfo = () => {
  if (!canSendMessage.value) return
  
  const success = tokenStore.sendGetRoleInfo(selectedTokenId.value)
  if (success) {
    addToHistory('sent', { cmd: 'role_getroleinfo' }, 'role_getroleinfo')
    message.success('角色信息请求已发送')
  } else {
    message.error('角色信息请求发送失败')
  }
}

const sendGetDataVersion = () => {
  if (!canSendMessage.value) return
  
  const success = tokenStore.sendGameMessage(selectedTokenId.value, 'system_getdatabundlever', { isAudit: false })
  if (success) {
    addToHistory('sent', { cmd: 'system_getdatabundlever' }, 'system_getdatabundlever')
    message.success('数据版本请求已发送')
  } else {
    message.error('数据版本请求发送失败')
  }
}

const sendSignIn = () => {
  if (!canSendMessage.value) return
  
  const success = tokenStore.sendGameMessage(selectedTokenId.value, 'system_signinreward', {})
  if (success) {
    addToHistory('sent', { cmd: 'system_signinreward' }, 'system_signinreward')
    message.success('签到请求已发送')
  } else {
    message.error('签到请求发送失败')
  }
}

const sendCustomMessage = () => {
  if (!canSendMessage.value || !customCmd.value) return
  
  try {
    const body = JSON.parse(customBody.value || '{}')
    const success = tokenStore.sendGameMessage(selectedTokenId.value, customCmd.value, body)
    
    if (success) {
      addToHistory('sent', { cmd: customCmd.value, body }, customCmd.value)
      message.success(`自定义消息 ${customCmd.value} 已发送`)
      
      // 清空输入
      customCmd.value = ''
      customBody.value = '{}'
    } else {
      message.error('自定义消息发送失败')
    }
  } catch (error) {
    message.error('消息体JSON格式错误: ' + error.message)
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 辅助方法：格式化body描述
const formatBodyDescription = (body) => {
  if (!body) return 'null'
  if (Array.isArray(body)) return `[Array: ${body.length} items]`
  if (body instanceof Uint8Array) return `[Uint8Array: ${body.length} bytes]`
  if (typeof body === 'object' && body.constructor === Object) {
    const keys = Object.keys(body)
    if (keys.every(key => !isNaN(parseInt(key)))) {
      return `[NumericObject: ${keys.length} entries]`
    }
  }
  return '[Unknown format]'
}

// 辅助方法：判断是否是原始body数据
const isRawBodyData = (body) => {
  if (!body) return false
  if (Array.isArray(body)) return true
  if (body instanceof Uint8Array) return true
  if (typeof body === 'object' && body.constructor === Object) {
    const keys = Object.keys(body)
    return keys.length > 0 && keys.every(key => !isNaN(parseInt(key)))
  }
  return false
}

const formatJSON = (data) => {
  try {
    if (!data) return 'null'
    
    // 处理BON解码数据：优先显示解码后的数据
    let displayData = data
    
    // 检查_raw结构中的解码数据
    const actualData = data._raw || data
    
    // 如果有解码后的数据，优先显示
    if (actualData.decodedBody || data.decodedBody) {
      const decodedBody = actualData.decodedBody || data.decodedBody
      const originalBody = actualData.body || data.body
      
      if (data._raw) {
        // 如果有_raw结构，更新_raw中的body
        displayData = {
          ...data,
          _raw: {
            ...data._raw,
            body: decodedBody,
            _originalBody: formatBodyDescription(originalBody),
            _note: 'body已自动BON解码'
          }
        }
      } else {
        // 直接结构，更新body
        displayData = {
          ...data,
          body: decodedBody,
          _originalBody: formatBodyDescription(originalBody),
          _note: 'body已自动BON解码'
        }
      }
    } else if (actualData.rawData || data.rawData) {
      // 如果是ProtoMsg格式，使用rawData
      const rawData = actualData.rawData || data.rawData
      
      if (data._raw) {
        displayData = {
          ...data,
          _raw: {
            ...data._raw,
            body: rawData,
            _note: 'body已使用rawData解码'
          }
        }
      } else {
        displayData = {
          ...data,
          body: rawData,
          _note: 'body已使用rawData解码'
        }
      }
    } else if ((actualData.body && isRawBodyData(actualData.body)) || (data.body && isRawBodyData(data.body))) {
      // 如果body是原始数据，添加提示
      displayData = {
        ...data,
        _note: 'body为原始数据，等待BON解码'
      }
    }
    
    // 处理循环引用和大型对象的JSON序列化
    const seen = new WeakSet()
    const replacer = (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[循环引用]'
        }
        seen.add(value)
      }
      
      // 限制字符串长度
      if (typeof value === 'string' && value.length > 200) {
        return value.substring(0, 200) + '...[截断]'
      }
      
      // 处理大数组显示
      if (Array.isArray(value) && value.length > 50) {
        return `[Array: ${value.length} items] ${JSON.stringify(value.slice(0, 10))}...[显示前10项]`
      }
      
      return value
    }
    
    const jsonString = JSON.stringify(displayData, replacer, 2)
    
    // 限制总体输出长度
    if (jsonString.length > 5000) {
      return jsonString.substring(0, 5000) + '\n...[内容过长已截断]'
    }
    
    return jsonString
  } catch (error) {
    return `[JSON序列化错误: ${error.message}]`
  }
}

// 监听WebSocket消息
watch(() => tokenStore.wsConnections, (connections) => {
  if (!selectedTokenId.value || !connections[selectedTokenId.value]) return
  
  const connection = connections[selectedTokenId.value]
  if (connection.lastMessage) {
    const lastMessage = connection.lastMessage
    
    // 避免重复处理相同的消息
    if (lastProcessedMessage.value && 
        lastProcessedMessage.value.timestamp === lastMessage.timestamp) {
      return
    }
    
    // 使用实际的消息数据而不是简化的数据结构
    const messageData = lastMessage.data || lastMessage
    const cmd = messageData.cmd || lastMessage.cmd
    
    // 过滤心跳消息
    if (cmd && cmd !== '_sys/ack' && cmd !== 'heartbeat') {
      addToHistory('received', messageData, cmd)
      lastProcessedMessage.value = lastMessage
    }
  }
}, { deep: true })
</script>

<style scoped>
.message-tester {
  max-width: 800px;
  margin: 0 auto;
}

.message-item {
  transition: all 0.2s ease;
}

.message-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
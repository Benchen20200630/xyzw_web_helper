<template>
  <div class="tower-status-card">
    <div class="card-header">
      <div class="header-info">
        <img
          src="/icons/1733492491706148.png"
          alt="爬塔图标"
          class="tower-icon"
        >
        <div class="tower-info">
          <h3>咸将塔</h3>
          <p>一个不小心就过了</p>
        </div>
      </div>
      <div class="energy-display">
        <img
          src="/icons/xiaoyugan.png"
          alt="小鱼干"
          class="energy-icon"
        >
        <span class="energy-count">{{ towerEnergy }}</span>
      </div>
    </div>

    <div class="card-content">
      <div class="tower-floor">
        <span class="label">当前层数</span>
        <span class="floor-number">{{ currentFloor }}</span>
      </div>
    </div>

    <div class="card-actions">
      <button
        :class="[
          'climb-button',
          {
            'active': canClimb,
            'disabled': !canClimb
          }
        ]"
        :disabled="!canClimb"
        @click="startTowerClimb"
      >
        {{ isClimbing.value ? '爬塔中...' : '开始爬塔' }}
      </button>

      <!-- 调试用的重置按钮，只在开发环境显示 -->
      <button
        v-if="isClimbing.value"
        class="reset-button"
        @click="resetClimbingState"
      >
        重置状态
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useTokenStore} from '@/stores/tokenStore'
import {useMessage} from 'naive-ui'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const isClimbing = ref(false)
const climbTimeout = ref(null) // 用于超时重置状态
const lastClimbResult = ref(null) // 最后一次爬塔结果

// 计算属性 - 从gameData中获取塔相关信息
const roleInfo = computed(() => {
  const data = tokenStore.gameData?.roleInfo || null
  return data
})

const currentFloor = computed(() => {
  const tower = roleInfo.value?.role?.tower


  if (!tower) {
    return "0 - 0"
  }

  if (!tower.id && tower.id !== 0) {
    return "0 - 0"
  }

  const towerId = tower.id
  const floor = Math.floor(towerId / 10) + 1
  const layer = towerId % 10 + 1
  return `${floor} - ${layer}`
})

const towerEnergy = computed(() => {
  const tower = roleInfo.value?.role?.tower


  const energy = tower?.energy || 0
  return energy
})

const canClimb = computed(() => {
  const hasEnergy = towerEnergy.value > 0
  const notClimbing = !isClimbing.value
  return hasEnergy && notClimbing
})

// 方法
const startTowerClimb = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }

  if (!canClimb.value) {
    message.warning('体力不足或正在爬塔中')
    return
  }

  // 清除之前的超时
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }

  // 确保在操作开始前设置状态
  isClimbing.value = true

  // 设置超时保护，15秒后自动重置状态
  climbTimeout.value = setTimeout(() => {
    isClimbing.value = false
    climbTimeout.value = null
  }, 15000)

  try {
    const tokenId = tokenStore.selectedToken.id

    // 发送爬塔命令
    await tokenStore.sendMessageWithPromise(tokenId, 'fight_starttower', {}, 10000)

    message.success('爬塔命令已发送')

    // 立即查询塔信息以获取最新状态
    await getTowerInfo()

    // 再延迟查询一次确保数据同步
    setTimeout(async () => {
      await getTowerInfo()

      // 清除超时并重置状态
      if (climbTimeout.value) {
        clearTimeout(climbTimeout.value)
        climbTimeout.value = null
      }
      isClimbing.value = false
    }, 2000)

  } catch (error) {
    message.error('爬塔失败: ' + (error.message || '未知错误'))

    // 发生错误时立即重置状态
    if (climbTimeout.value) {
      clearTimeout(climbTimeout.value)
      climbTimeout.value = null
    }
    isClimbing.value = false
  }

  // 注意：不要在这里设置 isClimbing.value = false
  // 因为我们要等待延迟查询完成后再重置状态
}

// 重置爬塔状态的方法
const resetClimbingState = () => {
  if (climbTimeout.value) {
    clearTimeout(climbTimeout.value)
    climbTimeout.value = null
  }
  isClimbing.value = false
  message.info('爬塔状态已重置')
}

const getTowerInfo = async () => {
  if (!tokenStore.selectedToken) {
    console.warn('🗼 getTowerInfo: 没有选中的Token')
    return
  }

  try {
    const tokenId = tokenStore.selectedToken.id
    // 检查WebSocket连接状态
    const wsStatus = tokenStore.getWebSocketStatus(tokenId)

    if (wsStatus !== 'connected') {
      return
    }
    // 首先获取角色信息，这包含了塔的数据
    const roleResult = tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    // 直接请求塔信息
    const towerResult = tokenStore.sendMessage(tokenId, 'tower_getinfo')
    if (!roleResult && !towerResult) {
      console.error('🗼 getTowerInfo: 所有请求都失败了')
    }
  } catch (error) {
    console.error('🗼 getTowerInfo: 获取塔信息失败:', error)
  }
}




// 监听WebSocket连接状态变化
const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return 'disconnected'
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
})

// 监听WebSocket连接状态，连接成功后自动获取塔信息
watch(wsStatus, (newStatus, oldStatus) => {
  console.log(`🗼 WebSocket状态变化: ${oldStatus} -> ${newStatus}`)

  if (newStatus === 'connected' && oldStatus !== 'connected') {
    console.log('🗼 WebSocket已连接，自动获取塔信息')
    // 延迟一点时间让WebSocket完全就绪
    setTimeout(() => {
      getTowerInfo()
    }, 1000)
  }
})

// 监听选中Token变化
watch(() => tokenStore.selectedToken, (newToken, oldToken) => {
  if (newToken && newToken.id !== oldToken?.id) {
    console.log('🗼 Token已切换，获取新的塔信息')
    // 检查WebSocket是否已连接
    const status = tokenStore.getWebSocketStatus(newToken.id)
    if (status === 'connected') {
      getTowerInfo()
    }
  }
})

// 监听爬塔结果
watch(() => tokenStore.gameData.towerResult, (newResult, oldResult) => {
  if (newResult && newResult.timestamp !== oldResult?.timestamp) {
    console.log('🗼 收到新的爬塔结果:', newResult)

    // 显示爬塔结果消息
    if (newResult.success) {
      message.success('咸将塔挑战成功！')

      if (newResult.autoReward) {
        setTimeout(() => {
          message.success(`自动领取第${newResult.rewardFloor}层奖励`)
        }, 1000)
      }
    } else {
      message.error('咸将塔挑战失败')
    }

    // 重置爬塔状态
    setTimeout(() => {
      console.log('🗼 爬塔结果处理完成，重置状态')
      if (climbTimeout.value) {
        clearTimeout(climbTimeout.value)
        climbTimeout.value = null
      }
      isClimbing.value = false
    }, 2000)
  }
}, { deep: true })

// 生命周期
onMounted(() => {


  // 检查WebSocket客户端
  if (tokenStore.selectedToken) {
    const client = tokenStore.getWebSocketClient(tokenStore.selectedToken.id)
  }

  // 组件挂载时获取塔信息
  if (tokenStore.selectedToken && wsStatus.value === 'connected') {
    getTowerInfo()
  } else if (!tokenStore.selectedToken) {
    console.log('🗼 没有选中的Token，无法获取塔信息')
  } else {
    console.log('🗼 WebSocket未连接，等待连接后自动获取塔信息')
  }
})
</script>

<style scoped lang="scss">

.tower-status-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  border-left: 4px solid #6366f1;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.header-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tower-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.tower-info {
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

.energy-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--bg-tertiary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-medium);
}

.energy-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.energy-count {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.card-content {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.tower-floor {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .label {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
  }

  .floor-number {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-primary);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  }
}

.card-actions {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}


.climb-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border: none;
  border-radius: var(--border-radius-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &.active {
    background: #6366f1;
    color: white;

    &:hover {
      background: #5855eb;
    }
  }

  &.disabled {
    background: var(--bg-secondary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }
}

.reset-button {
  width: 100%;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border: 1px solid var(--warning-color);
  border-radius: var(--border-radius-small);
  background: transparent;
  color: var(--warning-color);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--warning-color);
    color: white;
  }
}

.debug-info {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-xs);
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-small);
  font-family: monospace;
  word-break: break-all;

  small {
    color: var(--text-secondary);
    font-size: 10px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .energy-display {
    align-self: center;
  }
}
</style>

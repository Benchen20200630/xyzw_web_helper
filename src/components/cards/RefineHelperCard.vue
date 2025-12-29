<template>
  <MyCard class="refine-helper" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img src="/icons/ta.png" alt="洗练图标" />
    </template>
    <template #title>
      <h3>洗练助手</h3>
      <p>装备洗练、锁定孔位、自动洗练</p>
    </template>
    <template #badge>
      <span>{{ state.isRunning ? '运行中' : '已停止' }}</span>
    </template>
    <template #default>
      <div class="settings">
        <div class="setting-item">
          <span class="label">延迟(ms)</span>
          <n-input-number v-model:value="delay" :min="0" :step="100" size="small" />
        </div>
        <div class="status-row">
          <span>英雄数量：{{ heroIds.length }}</span>
        </div>
      </div>
      <div class="progress-row">
        <n-progress type="line" :percentage="percent" :show-indicator="false" />
        <span class="progress-text">{{ state.done }}/{{ state.total }} {{ percent }}%</span>
      </div>
    </template>
    <template #action>
      <div class="action-row">
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startRefineOnce">洗练一次</a-button>
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startRefineContinuous">连续洗练</a-button>
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startAutoRefine">自动洗练</a-button>
        <a-button size="small" :disabled="!state.isRunning" @click="stopRunning">停止</a-button>
      </div>
    </template>
  </MyCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import MyCard from '../Common/MyCard.vue'

const tokenStore = useTokenStore()
const message = useMessage()

const delay = ref(300)
const logs = ref([])
const state = ref({ isRunning: false, showConfirm: false, progressText: '待开始', stopRequested: false, total: 0, done: 0 })

// 属性映射
const attrMap = {
  1: '攻击',
  2: '血量',
  3: '防御',
  4: '速度',
  5: '破甲',
  6: '破甲抵抗',
  7: '精准',
  8: '格挡',
  9: '减伤',
  10: '暴击',
  11: '暴击抵抗',
  12: '爆伤',
  13: '爆伤抵抗',
  14: '技能伤害',
  15: '免控',
  16: '眩晕免疫',
  17: '冰冻免疫',
  18: '沉默免疫',
  19: '流血免疫',
  20: '中毒免疫',
  21: '灼烧免疫'
}

// 装备部位映射
const partMap = {
  1: '武器',
  2: '铠甲',
  3: '头冠',
  4: '坐骑'
}

// 英雄ID列表
const heroIds = computed(() => [
  ...Array.from({ length: 20 }, (_, i) => 101 + i),
  ...Array.from({ length: 28 }, (_, i) => 201 + i),
  ...Array.from({ length: 14 }, (_, i) => 301 + i)
])

const percent = computed(() => state.value.total > 0 ? Math.min(100, Math.round((state.value.done / state.value.total) * 100)) : 0)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** 开始洗练一次 */
const startRefineOnce = async () => {
  state.value.stopRequested = false
  state.value.total = 1
  state.value.done = 0
  await runRefineOnce({ delay: delay.value })
}

/** 开始连续洗练 */
const startRefineContinuous = async () => {
  state.value.stopRequested = false
  state.value.total = heroIds.value.length
  state.value.done = 0
  await runRefineContinuous({ delay: delay.value })
}

/** 开始自动洗练 */
const startAutoRefine = async () => {
  state.value.stopRequested = false
  state.value.total = 10
  state.value.done = 0
  await runAutoRefine({ delay: delay.value })
}

const stopRunning = () => {
  state.value.stopRequested = true
}

/**
 * 执行一次洗练
 * @param {{ delay: number }} mod 延迟设置（毫秒）
 * @returns {Promise<void>}
 */
const runRefineOnce = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    message.error('WebSocket未连接，无法执行')
    return
  }

  try {
    state.value.isRunning = true
    message.success('开始洗练')

    // 这里需要根据实际的API调整
    await tokenStore.sendMessageWithPromise(tokenId, 'equipment_quench', {
      heroId: 101, // 默认英雄ID，实际应该让用户选择
      part: 1, // 默认部位，实际应该让用户选择
      lockedSlot: [] // 默认不锁定孔位
    })

    await sleep(mod.delay)
    await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    
    state.value.done++
    message.success('洗练完成')
  } catch (error) {
    message.error(`洗练失败: ${error.message}`)
  } finally {
    state.value.isRunning = false
  }
}

/**
 * 执行连续洗练
 * @param {{ delay: number }} mod 延迟设置（毫秒）
 * @returns {Promise<void>}
 */
const runRefineContinuous = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    message.error('WebSocket未连接，无法执行')
    return
  }

  try {
    state.value.isRunning = true
    message.success('开始连续洗练')

    for (let i = 0; i < state.value.total; i++) {
      if (state.value.stopRequested) break
      
      try {
        await tokenStore.sendMessageWithPromise(tokenId, 'equipment_quench', {
          heroId: 101,
          part: 1,
          lockedSlot: []
        })
        await sleep(mod.delay)
        state.value.done++
      } catch (error) {
        message.error(`洗练第${i + 1}次失败: ${error.message}`)
        continue
      }
    }
    
    await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    message.success(state.value.stopRequested ? '已停止' : '连续洗练完成')
  } finally {
    state.value.isRunning = false
  }
}

/**
 * 执行自动洗练
 * @param {{ delay: number }} mod 延迟设置（毫秒）
 * @returns {Promise<void>}
 */
const runAutoRefine = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    message.error('WebSocket未连接，无法执行')
    return
  }

  try {
    state.value.isRunning = true
    message.success('开始自动洗练')

    for (let i = 0; i < state.value.total; i++) {
      if (state.value.stopRequested) break
      
      try {
        await tokenStore.sendMessageWithPromise(tokenId, 'equipment_quench', {
          heroId: 101,
          part: 1,
          lockedSlot: []
        })
        await sleep(mod.delay)
        state.value.done++
      } catch (error) {
        message.error(`自动洗练第${i + 1}次失败: ${error.message}`)
        continue
      }
    }
    
    await tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    message.success(state.value.stopRequested ? '已停止' : '自动洗练完成')
  } finally {
    state.value.isRunning = false
  }
}
</script>

<style scoped lang="scss">
.settings {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.setting-item .n-input-number { width: 110px; }

.status-row {
  display: flex;
  gap: var(--spacing-lg);
}

.progress-row { display: flex; align-items: center; gap: var(--spacing-sm); flex-wrap: nowrap; }

.progress-row .n-progress { flex: 1; }

.progress-text { color: var(--text-secondary); font-size: var(--font-size-sm); white-space: nowrap; }

.log-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-item {
  display: flex;
  gap: 8px;
}

.action-row { display: flex; gap: 8px; }

.log-item.success { color: var(--success-color); }

.log-item.error { color: var(--error-color); }

.time { color: var(--text-tertiary); font-size: var(--font-size-xs); }
</style>
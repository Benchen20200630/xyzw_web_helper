<template>
  <MyCard class="star-upgrade" :statusClass="{ active: state.isRunning }">
    <template #icon>
      <img src="/icons/ta.png" alt="升星图标" />
    </template>
    <template #title>
      <h3>升星助手</h3>
      <p>升星、图鉴升星、领取奖励</p>
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
          <span>进度：{{ state.progressText }}</span>
        </div>
      </div>
      <div v-if="logs.length" class="log-container">
        <div v-for="log in logs.slice(-6)" :key="log.id" class="log-item" :class="log.type">
          <span class="time">{{ formatTime(log.timestamp) }}</span>
          <span class="msg">{{ log.message }}</span>
        </div>
      </div>
    </template>
    <template #action>
      <div class="action-row">
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startHeroUpgrade">升星</a-button>
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startBookUpgrade">图鉴</a-button>
        <a-button type="primary" size="small" :disabled="state.isRunning" @click="startClaimRewards">领奖</a-button>
      </div>
    </template>
  </MyCard>
  <n-modal v-model:show="state.showConfirm" preset="dialog" title="确认执行" content="将对预设英雄执行升星、图鉴升星并领取奖励。" positive-text="开始" negative-text="取消" @positive-click="confirmStart" />
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
const state = ref({ isRunning: false, showConfirm: false, progressText: '待开始' })

const heroIds = computed(() => [
  ...Array.from({ length: 20 }, (_, i) => 101 + i),
  ...Array.from({ length: 28 }, (_, i) => 201 + i),
  ...Array.from({ length: 14 }, (_, i) => 301 + i)
])

const addLog = (messageText, type = 'info') => {
  logs.value.push({ id: Date.now() + Math.random(), timestamp: Date.now(), type, message: messageText })
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** 启动仅英雄升星 */
const startHeroUpgrade = async () => {
  await runHeroUpgrade({ delay: delay.value })
}

/** 启动仅图鉴升星 */
const startBookUpgrade = async () => {
  await runBookUpgrade({ delay: delay.value })
}

/** 启动仅领取奖励 */
const startClaimRewards = async () => {
  await runClaimRewards({ delay: delay.value })
}

/**
 * 执行升星、图鉴升星与奖励领取的组合任务
 * @param {{ delay: number }} mod 延迟设置（毫秒）
 * @returns {Promise<void>}
 */
const executeUpgradeStarTask = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) {
    message.warning('请先选择Token')
    return
  }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') {
    message.error('WebSocket未连接，无法执行')
    addLog('WebSocket连接缺失', 'error')
    return
  }

  try {
    state.value.isRunning = true
    state.value.progressText = '开始升星'
    message.success('开始升星')
    addLog('升星任务启动', 'success')

    await runHeroUpgrade(mod)

    state.value.progressText = '图鉴升星'
    message.success('英雄升星完成，开始图鉴升星')
    addLog('英雄升星全部完成', 'success')

    await runBookUpgrade(mod)

    state.value.progressText = '领取奖励'
    message.success('图鉴升星完成，开始领取奖励')
    addLog('图鉴升星全部完成', 'success')

    await runClaimRewards(mod)

    state.value.progressText = '完成'
    message.success('升星全部完成')
    addLog('升星任务全部完成', 'success')
  } catch (error) {
    addLog(`升星任务执行出错: ${error.message}`, 'error')
    message.error('升星任务执行出错')
  } finally {
    state.value.isRunning = false
  }
}

/**
 * 仅执行英雄升星
 * @param {{ delay: number }} mod
 */
const runHeroUpgrade = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) { message.warning('请先选择Token'); return }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') { message.error('WebSocket未连接'); return }
  try {
    state.value.isRunning = true
    for (const heroId of heroIds.value) {
      let skip = false
      for (let i = 1; i <= 10; i++) {
        try {
          const res = await tokenStore.sendMessageWithPromise(tokenId, 'hero_heroupgradestar', { heroId }, 8000)
          const ok = res && (res.code === 0 || res.success === true || res.result === 0)
          addLog(`英雄ID:${heroId} 升星第${i}/10次`, ok ? 'success' : 'error')
          if (!ok) throw new Error('升星失败')
        } catch (err) {
          addLog(`英雄ID:${heroId} 升星第${i}/10次失败，跳过剩余次数`, 'error')
          skip = true
          break
        }
        await sleep(mod.delay)
      }
      if (skip) continue
    }
    message.success('英雄升星完成')
  } finally { state.value.isRunning = false }
}

/**
 * 仅执行图鉴升星
 * @param {{ delay: number }} mod
 */
const runBookUpgrade = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) { message.warning('请先选择Token'); return }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') { message.error('WebSocket未连接'); return }
  try {
    state.value.isRunning = true
    for (const heroId of heroIds.value) {
      let skip = false
      for (let i = 1; i <= 10; i++) {
        try {
          const res = await tokenStore.sendMessageWithPromise(tokenId, 'book_upgrade', { heroId }, 8000)
          const ok = res && (res.code === 0 || res.success === true || res.result === 0)
          addLog(`英雄ID:${heroId} 图鉴升星第${i}/10次`, ok ? 'success' : 'error')
          if (!ok) throw new Error('图鉴升星失败')
        } catch (err) {
          addLog(`英雄ID:${heroId} 图鉴升星第${i}/10次失败，跳过剩余次数`, 'error')
          skip = true
          break
        }
        await sleep(mod.delay)
      }
      if (skip) continue
    }
    message.success('图鉴升星完成')
  } finally { state.value.isRunning = false }
}

/**
 * 仅执行领取奖励
 * @param {{ delay: number }} mod
 */
const runClaimRewards = async (mod) => {
  const token = tokenStore.selectedToken
  if (!token) { message.warning('请先选择Token'); return }
  const tokenId = token.id
  const status = tokenStore.getWebSocketStatus(tokenId)
  if (status !== 'connected') { message.error('WebSocket未连接'); return }
  try {
    state.value.isRunning = true
    for (let i = 1; i <= 10; i++) {
      try {
        const res = await tokenStore.sendMessageWithPromise(tokenId, 'book_claimpointreward', {}, 8000)
        const ok = res && (res.code === 0 || res.success === true || res.result === 0)
        addLog(`领取图鉴奖励第${i}/10次`, ok ? 'success' : 'error')
        if (!ok) throw new Error('领取奖励失败')
      } catch (err) {
        addLog(`领取图鉴奖励第${i}/10次失败，跳过剩余次数`, 'error')
        break
      }
      await sleep(mod.delay)
    }
    message.success('领取奖励完成')
  } finally { state.value.isRunning = false }
}

const formatTime = (ts) => new Date(ts).toLocaleTimeString('zh-CN')
</script>

<style scoped lang="scss">
.settings {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.setting-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}
.status-row {
  display: flex;
  gap: var(--spacing-lg);
}
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
.msg { color: var(--text-secondary); }
</style>

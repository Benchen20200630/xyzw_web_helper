<template>
  <div class="team-status-card">
    <div class="card-header">
      <img
          src="/icons/Ob7pyorzmHiJcbab2c25af264d0758b527bc1b61cc3b.png"
          alt="队伍图标"
          class="team-icon"
      >
      <div class="team-info">
        <h3>队伍阵容</h3>
        <p>当前使用的战斗阵容</p>
      </div>

      <div class="team-selector">
        <button
            v-for="teamId in availableTeams"
            :key="teamId"
            :disabled="loading || switching"
            :class="['team-button', { active: currentTeam === teamId }]"
            @click="selectTeam(teamId)"
        >
          {{ teamId }}
        </button>
        <button
            class="refresh-button"
            :disabled="loading"
            title="刷新队伍数据"
            @click="refreshTeamData(true)"
        >
          <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M3 21v-5h5"/>
          </svg>
          <span class="refresh-text">刷新</span>
        </button>
      </div>
    </div>

    <div class="card-content">
      <div class="team-display">
        <div class="current-team-info">
          <span class="label">当前阵容</span>
          <span class="team-number">
            <template v-if="!loading">阵容 {{ currentTeam }}</template>
            <template v-else>加载中…</template>
          </span>
        </div>

        <div class="heroes-container">
          <div v-if="!loading" class="heroes-inline">
            <div
                v-for="hero in currentTeamHeroes"
                :key="hero.id || hero.name"
                class="hero-item"
            >
              <div class="hero-circle">
                <img
                    v-if="hero.avatar"
                    :src="hero.avatar"
                    :alt="hero.name"
                    class="hero-avatar"
                >
                <div v-else class="hero-placeholder">
                  {{ hero.name?.substring(0, 2) || '?' }}
                </div>
              </div>
              <span class="hero-name">{{ hero.name || '未知' }}</span>
            </div>
          </div>

          <div v-if="!loading && !currentTeamHeroes.length" class="empty-team">
            <p>暂无队伍信息</p>
          </div>

          <div v-if="loading" class="empty-team"><p>正在加载队伍信息…</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage, NTag } from 'naive-ui'

/**
 * 集成英雄字典（游戏ID -> { name, type }）
 * 你也可以独立出一个 heroDict.ts 后 import；按你的要求，这里整合到同一文件。
 */
const HERO_DICT = {
  101: { name: '司马懿', type: '魏国' }, 102: { name: '郭嘉', type: '魏国' }, 103: { name: '关羽', type: '蜀国' },
  104: { name: '诸葛亮', type: '蜀国' }, 105: { name: '周瑜', type: '吴国' }, 106: { name: '太史慈', type: '吴国' },
  107: { name: '吕布', type: '群雄' }, 108: { name: '华佗', type: '群雄' }, 109: { name: '甄姬', type: '魏国' },
  110: { name: '黄月英', type: '蜀国' }, 111: { name: '孙策', type: '吴国' }, 112: { name: '贾诩', type: '群雄' },
  113: { name: '曹仁', type: '魏国' }, 114: { name: '姜维', type: '蜀国' }, 115: { name: '孙坚', type: '吴国' },
  116: { name: '公孙瓒', type: '群雄' }, 117: { name: '典韦', type: '魏国' }, 118: { name: '赵云', type: '蜀国' },
  119: { name: '大乔', type: '吴国' }, 120: { name: '张角', type: '群雄' }, 201: { name: '徐晃', type: '魏国' },
  202: { name: '荀彧', type: '魏国' }, 203: { name: '典韦', type: '魏国' }, 204: { name: '张飞', type: '蜀国' },
  205: { name: '赵云', type: '蜀国' }, 206: { name: '庞统', type: '蜀国' }, 207: { name: '鲁肃', type: '吴国' },
  208: { name: '陆逊', type: '吴国' }, 209: { name: '甘宁', type: '吴国' }, 210: { name: '貂蝉', type: '群雄' },
  211: { name: '董卓', type: '群雄' }, 212: { name: '张角', type: '群雄' }, 213: { name: '张辽', type: '魏国' },
  214: { name: '夏侯惇', type: '魏国' }, 215: { name: '许褚', type: '魏国' }, 216: { name: '夏侯渊', type: '魏国' },
  217: { name: '魏延', type: '蜀国' }, 218: { name: '黄忠', type: '蜀国' }, 219: { name: '马超', type: '蜀国' },
  220: { name: '马岱', type: '蜀国' }, 221: { name: '吕蒙', type: '吴国' }, 222: { name: '黄盖', type: '吴国' },
  223: { name: '蔡文姬', type: '魏国' }, 224: { name: '小乔', type: '吴国' }, 225: { name: '袁绍', type: '群雄' },
  226: { name: '华雄', type: '群雄' }, 227: { name: '颜良', type: '群雄' }, 228: { name: '文丑', type: '群雄' },
  301: { name: '周泰', type: '吴国' }, 302: { name: '许攸', type: '魏国' }, 303: { name: '于禁', type: '魏国' },
  304: { name: '张星彩', type: '蜀国' }, 305: { name: '关银屏', type: '蜀国' }, 306: { name: '关平', type: '蜀国' },
  307: { name: '程普', type: '吴国' }, 308: { name: '张昭', type: '吴国' }, 309: { name: '陆绩', type: '吴国' },
  310: { name: '吕玲绮', type: '群雄' }, 311: { name: '潘凤', type: '群雄' }, 312: { name: '邢道荣', type: '群雄' },
  313: { name: '祝融夫人', type: '群雄' }, 314: { name: '孟获', type: '群雄' }
}

const tokenStore = useTokenStore()
const message = useMessage()

// 状态
const loading = ref(false)
const switching = ref(false)
const currentTeam = ref(1)
const availableTeams = ref([1, 2, 3, 4])

// WebSocket连接状态
const wsStatus = computed(() => {
  if (!tokenStore.selectedToken) return 'disconnected'
  return tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
})

// —— 缓存优先的 presetTeam 原始数据 ——
const presetTeamRaw = computed(() => tokenStore.gameData?.presetTeam ?? null)

// 统一结构：输出 { useTeamId, teams }
function normalizePresetTeam(raw) {
  if (!raw) return { useTeamId: 1, teams: {} }
  const root = raw.presetTeamInfo ?? raw
  const findUseIdRec = (obj) => {
    if (!obj || typeof obj !== 'object') return null
    if (typeof obj.useTeamId === 'number') return obj.useTeamId
    for (const k of Object.keys(obj)) {
      const v = findUseIdRec(obj[k])
      if (v) return v
    }
    return null
  }
  const useTeamId = root.useTeamId ?? root.presetTeamInfo?.useTeamId ?? findUseIdRec(root) ?? 1

  const dict = root.presetTeamInfo ?? root
  const teams = {}
  const ids = Object.keys(dict || {}).filter(k => /^\d+$/.test(k))
  for (const idStr of ids) {
    const id = Number(idStr)
    const node = dict[idStr]
    if (!node) { teams[id] = { teamInfo: {} }; continue }
    if (node.teamInfo) {
      teams[id] = { teamInfo: node.teamInfo }
    } else if (node.heroes) {
      const ti: Record<string, any> = {}
      node.heroes.forEach((h, idx) => { ti[String(idx + 1)] = h })
      teams[id] = { teamInfo: ti }
    } else if (typeof node === 'object') {
      const hasHero = Object.values(node).some((v) => v && typeof v === 'object' && 'heroId' in v)
      teams[id] = { teamInfo: hasHero ? node : {} }
    } else {
      teams[id] = { teamInfo: {} }
    }
  }
  return { useTeamId: Number(useTeamId) || 1, teams }
}

const presetTeam = computed(() => normalizePresetTeam(presetTeamRaw.value))

// —— 英雄列表 ——
const currentTeamHeroes = computed(() => {
  const team = presetTeam.value.teams[currentTeam.value]?.teamInfo
  if (!team) return []
  const heroes = []
  for (const [pos, hero] of Object.entries(team)) {
    const hid = (hero as any)?.heroId ?? (hero as any)?.id
    if (!hid) continue
    const meta = HERO_DICT[Number(hid)]
    heroes.push({
      id: Number(hid),
      name: meta?.name ?? `英雄${hid}`,
      type: meta?.type ?? '',
      position: Number(pos),
      level: (hero as any)?.level ?? 1,
      avatar: (hero as any)?.avatar
    })
  }
  heroes.sort((a, b) => a.position - b.position)
  return heroes
})

// —— 命令封装 ——
const executeGameCommand = async (tokenId, cmd, params = {}, description = '', timeout = 8000) => {
  try {
    return await tokenStore.sendMessageWithPromise(tokenId, cmd, params, timeout)
  } catch (error) {
    const msg = error?.message ?? String(error)
    if (description) message.error(`${description}失败：${msg}`)
    throw error
  }
}

// —— 数据加载：缓存优先，可强制刷新 ——
const getTeamInfoWithCache = async (force = false) => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return null
  }
  const tokenId = tokenStore.selectedToken.id

  if (!force) {
    const cached = tokenStore.gameData?.presetTeam?.presetTeamInfo
    if (cached) return cached
  }

  loading.value = true
  try {
    const result = await executeGameCommand(tokenId, 'presetteam_getinfo', {}, '获取阵容信息')
    tokenStore.$patch((state) => {
      state.gameData = { ...(state.gameData ?? {}), presetTeam: result }
    })
    return result?.presetTeamInfo ?? null
  } catch (error) {
    console.error('获取阵容信息失败:', error)
    return null
  } finally {
    loading.value = false
  }
}

// —— UI 同步 ——
const updateAvailableTeams = () => {
  const ids = Object.keys(presetTeam.value.teams).map(Number).filter(n => !Number.isNaN(n)).sort((a, b) => a - b)
  availableTeams.value = ids.length ? ids : [1, 2, 3, 4]
}
const updateCurrentTeam = () => { currentTeam.value = presetTeam.value.useTeamId || 1 }

// —— 交互 ——
const selectTeam = async (teamId) => {
  if (switching.value || loading.value) return
  if (!tokenStore.selectedToken) { message.warning('请先选择Token'); return }
  const prev = currentTeam.value
  switching.value = true
  try {
    await executeGameCommand(tokenStore.selectedToken.id, 'presetteam_saveteam', { teamId }, `切换到阵容 ${teamId}`)
    currentTeam.value = teamId
    message.success(`已切换到阵容 ${teamId}`)
    await refreshTeamData(true)
  } catch (e) {
    currentTeam.value = prev
  } finally {
    switching.value = false
  }
}

const refreshTeamData = async (force = false) => { await getTeamInfoWithCache(force) }

// —— 首次挂载：检查连接状态后获取数据 ——
onMounted(async () => {
  // 组件挂载时获取队伍信息
  if (tokenStore.selectedToken && wsStatus.value === 'connected') {
    await refreshTeamData(false)
    updateAvailableTeams(); updateCurrentTeam()
    if (!presetTeamRaw.value) {
      await refreshTeamData(true)
      updateAvailableTeams(); updateCurrentTeam()
    }
  } else if (!tokenStore.selectedToken) {
    console.log('🛡️ 没有选中的Token，无法获取队伍信息')
  } else {
    console.log('🛡️ WebSocket未连接，等待连接后自动获取队伍信息')
  }
})

// —— 监听WebSocket连接状态变化 ——
watch(wsStatus, (newStatus, oldStatus) => {
  console.log(`🛡️ WebSocket状态变化: ${oldStatus} -> ${newStatus}`)
  
  if (newStatus === 'connected' && oldStatus !== 'connected' && tokenStore.selectedToken) {
    console.log('🛡️ WebSocket已连接，自动获取队伍信息')
    // 延迟一点时间让WebSocket完全就绪
    setTimeout(async () => {
      await refreshTeamData(false)
      updateAvailableTeams(); updateCurrentTeam()
      if (!presetTeamRaw.value) {
        await refreshTeamData(true)
        updateAvailableTeams(); updateCurrentTeam()
      }
    }, 1000)
  }
})

// —— 监听Token变化 ——
watch(() => tokenStore.selectedToken, async (newToken, oldToken) => {
  if (newToken && newToken.id !== oldToken?.id) {
    console.log('🛡️ Token已切换，重新获取队伍信息')
    
    // 检查WebSocket是否已连接
    const status = tokenStore.getWebSocketStatus(newToken.id)
    if (status === 'connected') {
      await refreshTeamData(true) // 切换Token时强制刷新
      updateAvailableTeams(); updateCurrentTeam()
    }
  }
})

// —— 监听缓存变化（其他地方写入也能联动） ——
watch(() => presetTeamRaw.value, () => { updateAvailableTeams(); updateCurrentTeam() }, { deep: true })
</script>

<style scoped lang="scss">
.team-status-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  &:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); transform: translateY(-2px); }
}
.card-header { display: flex; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.team-icon { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
.team-info { flex: 1;
  h3 { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); color: var(--text-primary); margin: 0 0 var(--spacing-xs) 0; }
  p { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0; }
}
.team-selector { display: flex; gap: var(--spacing-xs); }
.team-button {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-secondary);
  font-size: var(--font-size-sm); font-weight: var(--font-weight-medium);
  cursor: pointer; transition: all var(--transition-fast);
  &:hover { background: var(--bg-secondary); }
  &.active { background: var(--primary-color); color: white; }
  &:disabled { opacity: .6; cursor: not-allowed; }
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast, 0.15s ease);
  
  &:hover {
    background: var(--bg-secondary, #f9fafb);
    border-color: var(--border-hover, #d1d5db);
    color: var(--text-primary, #374151);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
    
    &:hover {
      background: var(--bg-primary, #ffffff);
      border-color: var(--border-color, #e5e7eb);
      color: var(--text-secondary, #6b7280);
      transform: none;
      box-shadow: none;
    }
  }
  
  .refresh-icon {
    width: 14px;
    height: 14px;
    transition: transform var(--transition-fast, 0.15s ease);
  }
  
  &:not(:disabled):hover .refresh-icon {
    transform: rotate(180deg);
  }
  
  &:disabled .refresh-icon {
    animation: spin 1s linear infinite;
  }
  
  .refresh-text {
    font-size: 13px;
    line-height: 1;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.card-content .current-team-info {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);
  .label { font-size: var(--font-size-sm); color: var(--text-secondary); }
  .team-number { font-size: var(--font-size-lg); font-weight: var(--font-weight-bold); color: var(--text-primary); }
}
.heroes-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heroes-inline {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.hero-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 50px;
}

.hero-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--border-light);
  background: var(--bg-primary);
}

.hero-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: var(--font-weight-bold);
}

.hero-name {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
  font-weight: var(--font-weight-medium);
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-team { text-align: center; color: var(--text-secondary); p { margin: 0; font-size: var(--font-size-sm); }
}
@media (max-width: 768px) {
  .card-header { 
    flex-direction: column; 
    gap: var(--spacing-sm); 
    text-align: center; 
  }
  .team-selector { 
    justify-content: center; 
  }
  .heroes-inline { 
    justify-content: center; 
    gap: var(--spacing-xs);
  }
  .hero-item {
    min-width: 45px;
  }
  .hero-circle {
    width: 35px;
    height: 35px;
  }
  .hero-name {
    font-size: 10px;
    max-width: 45px;
  }
}
</style>

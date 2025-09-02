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
          :class="[
            'team-button',
            { active: currentTeam === teamId }
          ]"
          @click="selectTeam(teamId)"
        >
          {{ teamId }}
        </button>
        <button
          class="team-button refresh-button"
          title="刷新队伍数据"
          @click="refreshTeamData"
        >
          🔄
        </button>
      </div>
    </div>

    <div class="card-content">
      <div class="team-display">
        <div class="current-team-info">
          <span class="label">当前阵容</span>
          <span class="team-number">阵容 {{ currentTeam }}</span>
        </div>
        
        <div class="heroes-container">
          <div class="heroes-grid">
            <div 
              v-for="hero in currentTeamHeroes"
              :key="hero.id || hero.name"
              class="hero-card"
            >
              <img 
                v-if="hero.avatar" 
                :src="hero.avatar" 
                :alt="hero.name"
                class="hero-avatar"
              >
              <div 
                v-else
                class="hero-placeholder"
              >
                {{ hero.name?.substring(0, 2) || '?' }}
              </div>
              <span class="hero-name">{{ hero.name || '未知' }}</span>
            </div>
          </div>
          
          <div
            v-if="!currentTeamHeroes.length"
            class="empty-team"
          >
            <p>暂无队伍信息</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const currentTeam = ref(1)
const availableTeams = ref([1, 2, 3, 4])

// 计算属性
const presetTeamInfo = computed(() => {
  return tokenStore.gameData?.presetTeam || null
})

const currentTeamHeroes = computed(() => {
  if (!presetTeamInfo.value) {
    console.log('👥 TeamStatus: presetTeamInfo 为空')
    return []
  }
  
  console.log('👥 TeamStatus: 当前队伍信息结构:', {
    presetTeamInfo: presetTeamInfo.value,
    currentTeam: currentTeam.value,
    hasPresetTeamInfo: !!presetTeamInfo.value.presetTeamInfo,
    presetTeamInfoKeys: presetTeamInfo.value.presetTeamInfo ? Object.keys(presetTeamInfo.value.presetTeamInfo) : []
  })
  
  // 尝试多种可能的数据结构
  let teamData = null
  
  // 方式1: 标准结构 presetTeamInfo[teamId].teamInfo
  if (presetTeamInfo.value.presetTeamInfo?.[currentTeam.value]?.teamInfo) {
    teamData = presetTeamInfo.value.presetTeamInfo[currentTeam.value].teamInfo
    console.log('👥 TeamStatus: 使用标准结构获取队伍数据')
  }
  // 方式2: 直接在presetTeamInfo[teamId]下
  else if (presetTeamInfo.value.presetTeamInfo?.[currentTeam.value]) {
    const teamInfo = presetTeamInfo.value.presetTeamInfo[currentTeam.value]
    if (typeof teamInfo === 'object' && !Array.isArray(teamInfo)) {
      teamData = teamInfo
      console.log('👥 TeamStatus: 使用直接结构获取队伍数据')
    }
  }
  // 方式3: 查找任何包含英雄数据的结构
  else if (presetTeamInfo.value.presetTeamInfo) {
    for (const [key, value] of Object.entries(presetTeamInfo.value.presetTeamInfo)) {
      if (value && typeof value === 'object') {
        // 查找包含heroId或类似字段的数据
        if (value.teamInfo || value.heroes || value.formation || 
            Object.values(value).some(v => v && v.heroId)) {
          teamData = value.teamInfo || value.heroes || value.formation || value
          console.log(`👥 TeamStatus: 在 ${key} 中找到队伍数据`)
          break
        }
      }
    }
  }
  
  if (!teamData) {
    console.log('👥 TeamStatus: 未找到队伍数据')
    return []
  }
  
  console.log('👥 TeamStatus: 解析队伍数据:', teamData)
  
  // 转换队伍信息为英雄数组
  const heroes = []
  
  // 处理不同的数据格式
  if (Array.isArray(teamData)) {
    // 数组格式
    teamData.forEach((hero, index) => {
      if (hero && (hero.heroId || hero.id)) {
        heroes.push({
          id: hero.heroId || hero.id,
          name: getHeroName(hero.heroId || hero.id),
          position: index + 1,
          level: hero.level || 1
        })
      }
    })
  } else if (typeof teamData === 'object') {
    // 对象格式（position => hero）
    for (const [position, hero] of Object.entries(teamData)) {
      if (hero && (hero.heroId || hero.id)) {
        heroes.push({
          id: hero.heroId || hero.id,
          name: getHeroName(hero.heroId || hero.id),
          position: position,
          level: hero.level || 1
        })
      }
    }
  }
  
  console.log('👥 TeamStatus: 解析出的英雄列表:', heroes)
  return heroes
})

// 从presetTeamInfo获取可用队伍数量
const updateAvailableTeams = () => {
  if (!presetTeamInfo.value?.presetTeamInfo) return
  
  const teams = Object.keys(presetTeamInfo.value.presetTeamInfo)
    .map(Number)
    .filter(num => !isNaN(num))
    .sort((a, b) => a - b)
  
  if (teams.length > 0) {
    availableTeams.value = teams
  }
}

// 更新当前队伍
const updateCurrentTeam = () => {
  if (presetTeamInfo.value?.presetTeamInfo?.useTeamId) {
    currentTeam.value = presetTeamInfo.value.presetTeamInfo.useTeamId
  }
}

// 获取英雄名称（这里需要英雄数据字典）
const getHeroName = (heroId) => {
  // 暂时返回英雄ID，后续可以添加英雄名称映射
  const heroNames = {
    1: '剑士',
    2: '法师',
    3: '弓手',
    4: '盗贼',
    5: '牧师'
    // 更多英雄映射...
  }
  
  return heroNames[heroId] || `英雄${heroId}`
}

// 选择队伍
const selectTeam = (teamId) => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  
  currentTeam.value = teamId
  
  // 发送切换队伍的消息
  const tokenId = tokenStore.selectedToken.id
  tokenStore.sendMessage(tokenId, 'presetteam_saveteam', { teamId })
  
  message.info(`切换到阵容 ${teamId}`)
}

// 监听预设队伍信息变化
watch(presetTeamInfo, (newValue) => {
  if (newValue) {
    updateAvailableTeams()
    updateCurrentTeam()
  }
}, { deep: true, immediate: true })

// 刷新队伍数据
const refreshTeamData = () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  
  const tokenId = tokenStore.selectedToken.id
  console.log('👥 手动刷新队伍数据')
  
  // 发送多个可能的队伍相关命令
  const commands = [
    'presetteam_getteam',
    'role_gettargetteam',
    'role_getroleinfo'  // 角色信息中可能包含队伍数据
  ]
  
  commands.forEach(cmd => {
    tokenStore.sendMessage(tokenId, cmd, {})
    console.log(`👥 发送命令: ${cmd}`)
  })
  
  message.info('正在刷新队伍数据...')
}

// 生命周期
onMounted(() => {
  // 获取队伍信息
  refreshTeamData()
})
</script>

<style scoped lang="scss">
.team-status-card {
  background: white;
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.team-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.team-info {
  flex: 1;

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

.team-selector {
  display: flex;
  gap: var(--spacing-xs);
}

.team-button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-secondary);
  }

  &.active {
    background: var(--primary-color);
    color: white;
  }
  
  &.refresh-button {
    background: var(--success-color, #10b981);
    color: white;
    
    &:hover {
      background: var(--success-color-dark, #059669);
    }
  }
}

.card-content {
  .current-team-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);

    .label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }

    .team-number {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }
  }
}

.heroes-container {
  background: var(--bg-tertiary);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heroes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-medium);
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
  min-width: 80px;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
}

.hero-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.hero-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.hero-name {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-align: center;
  font-weight: var(--font-weight-medium);
}

.empty-team {
  text-align: center;
  color: var(--text-secondary);

  p {
    margin: 0;
    font-size: var(--font-size-sm);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }

  .team-selector {
    justify-content: center;
  }

  .heroes-grid {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
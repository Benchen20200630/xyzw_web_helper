<template>
  <div class="status-card club-info">
    <div class="card-header">
      <img
        src="/icons/1733492491706152.png"
        alt="俱乐部图标"
        class="status-icon"
      >
      <div class="status-info">
        <h3>俱乐部信息</h3>
        <p>军团/俱乐部概览与成员</p>
      </div>
      <div class="status-badge" :class="{ active: !!club }">
        <div class="status-dot" />
        <span>{{ club ? '已加入' : '暂无俱乐部' }}</span>
      </div>
    </div>

    <div class="card-content">
      <div v-if="!club" class="empty-club">
        <n-empty description="暂无俱乐部" />
        <div class="actions">
          <n-button size="small" @click="refreshClub">刷新</n-button>
        </div>
      </div>
      <div v-else>
        <div class="toolbar">
          <n-space size="small">
            <n-button size="small" @click="refreshClub">刷新</n-button>
          </n-space>
        </div>

        <n-tabs type="line" animated>
          <n-tab-pane name="overview" tab="概览" display-directive="show:lazy">
            <div class="overview">
              <div class="club-header">
                <n-avatar :size="48" :src="club.logo || '/icons/xiaoyugan.png'" />
                <div class="meta">
                  <div class="name">{{ club.name }}</div>
                  <div class="sub">ID {{ club.id }} · Lv.{{ club.level }} · 服务器 {{ club.serverId }}</div>
                </div>
              </div>
              <div class="grid">
                <div class="item">
                  <div class="label">战力</div>
                  <div class="value">{{ formatNumber(info.power || 0) }}</div>
                </div>
                <div class="item">
                  <div class="label">段位</div>
                  <div class="value">{{ info.dan ?? '-' }}</div>
                </div>
                <div class="item">
                  <div class="label">成员数</div>
                  <div class="value">{{ memberCount }}</div>
                </div>
                <div class="item">
                  <div class="label">红洗次数</div>
                  <div class="value">{{ info.redQuenchCnt ?? info.statistics?.['red:quench'] ?? 0 }}</div>
                </div>
                <div class="item">
                  <div class="label">上次排位名次</div>
                  <div class="value">{{ info.statistics?.['last:war:rank'] ?? '-' }}</div>
                </div>
                <div class="item">
                  <div class="label">是否禁止申请</div>
                  <div class="value">{{ info.noApply ? '是' : '否' }}</div>
                </div>
              </div>
              <div v-if="club.announcement" class="announcement">
                <div class="label">公告</div>
                <div class="text">{{ club.announcement }}</div>
              </div>
              <div class="leader" v-if="leader">
                <div class="label">会长</div>
                <div class="leader-info">
                  <n-avatar :size="32" :src="leader.headImg || '/icons/xiaoyugan.png'"/>
                  <span class="leader-name">{{ leader.name }}</span>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="members" tab="成员" display-directive="show:lazy">
            <div class="members">
              <div class="members-list">
                <div v-for="m in topMembers" :key="m.roleId" class="member-row">
                  <div class="left">
                    <n-avatar :size="28" :src="m.headImg || '/icons/xiaoyugan.png'"/>
                    <span class="name">{{ m.name }}</span>
                  </div>
                  <div class="right">
                    <span class="power">{{ formatNumber(m.power || m.custom?.s_power || 0) }}</span>
                    <span class="tag">{{ jobLabel(m.job) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="memberCount > topMembers.length" class="hint">仅显示前 {{ topMembers.length }} 名(按战力)</div>
            </div>
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'

const tokenStore = useTokenStore()

const info = computed(() => tokenStore.gameData?.legionInfo || null)
const club = computed(() => info.value?.info || null)

const membersObj = computed(() => club.value?.members || {})
const members = computed(() => Object.values(membersObj.value || {}))
const memberCount = computed(() => members.value.length)

const leader = computed(() => {
  const lid = club.value?.leaderId
  if (!lid) return null
  return members.value.find(m => Number(m.roleId) === Number(lid)) || null
})

const topMembers = computed(() => {
  return [...members.value]
    .sort((a, b) => (Number(b.power || b.custom?.s_power || 0) - Number(a.power || a.custom?.s_power || 0)))
    .slice(0, 20)
})

const refreshClub = () => {
  const token = tokenStore.selectedToken
  if (!token) return
  tokenStore.sendMessage(token.id, 'legion_getinfo')
}

const jobLabel = (job) => {
  if (job === 1) return '会长'
  if (job === 2) return '副会长'
  return '成员'
}

const formatNumber = (num) => {
  const n = Number(num || 0)
  if (n >= 1e8) return (n / 1e8).toFixed(2) + '亿'
  if (n >= 1e4) return (n / 1e4).toFixed(2) + '万'
  return String(n)
}
</script>

<style scoped lang="scss">
.club-info {
  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--spacing-sm);
  }

  .overview {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .club-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .meta {
    .name { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
    .sub { color: var(--text-secondary); font-size: var(--font-size-sm); }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-md);
  }

  .item {
    background: var(--bg-tertiary);
    border-radius: var(--border-radius-medium);
    padding: var(--spacing-sm);
    .label { color: var(--text-secondary); font-size: var(--font-size-xs); margin-bottom: 2px; }
    .value { font-weight: var(--font-weight-medium); }
  }

  .announcement .label, .leader .label { color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 4px; }
  .announcement .text { white-space: pre-wrap; }
  .leader .leader-info { display: flex; align-items: center; gap: var(--spacing-sm); }

  .members-list { display: flex; flex-direction: column; gap: 8px; }
  .member-row { display: flex; align-items: center; justify-content: space-between; padding: 8px; border-radius: 8px; background: var(--bg-tertiary); }
  .member-row .left { display: flex; align-items: center; gap: 8px; }
  .member-row .right { display: flex; align-items: center; gap: 8px; color: var(--text-secondary); }
  .member-row .name { font-weight: var(--font-weight-medium); }
  .member-row .power { font-feature-settings: 'tnum' 1; font-variant-numeric: tabular-nums; }
  .hint { margin-top: 8px; color: var(--text-tertiary); font-size: var(--font-size-xs); }

  .empty-club { text-align: center; }
  .empty-club .actions { margin-top: var(--spacing-sm); }
}

/* 卡片基础样式，保持与 GameStatus 一致 */
.status-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-normal);
  min-height: 200px;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  margin-right: var(--spacing-md);
}

.status-info {
  flex: 1;
  h3 { margin: 0; font-size: var(--font-size-lg); }
  p { margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);

  &.active {
    background: rgba(24, 160, 88, 0.12);
    color: var(--success-color);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}
</style>

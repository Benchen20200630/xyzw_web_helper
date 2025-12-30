<template>
  <div class="club-warrank-container">
    <div class="club-warrank-card">
      <!-- 头部信息区 -->
      <div class="header-section">
        <div class="header-left">
          <img src="/icons/moonPalace.png" alt="俱乐部图标" class="header-icon">
          <div class="header-title">
            <h2>盐场匹配信息详情</h2>
            <p>俱乐部盐场匹配详情</p>
          </div>
        </div>
        
        <!-- 数据统计区 -->
        <div class="stats-section" v-if="battleRecords1 && battleRecords1.legionRankList">
          <div class="stat-item">
            <span class="stat-label">查询日期:</span>
            <n-tag type="info">{{ formatTimestamp1(inputDate1) }}</n-tag>
          </div>
          <div class="stat-item">
            <span class="stat-label">总俱乐部数:</span>
            <n-tag type="success">{{ battleRecords1.legionRankList.length }}</n-tag>
          </div>
        </div>
      </div>
      
      <!-- 功能操作区 -->
      <div class="function-section">
        <div class="function-left">
          <div class="export-options">
            <n-checkbox-group v-model:value="exportmethod" name="group-exportmethod" size="small">
              <n-checkbox value="1">表格导出</n-checkbox>
              <n-checkbox value="2">图片导出</n-checkbox>
            </n-checkbox-group>
          </div>
        </div>
        
        <div class="function-right">
          <a-date-picker v-model:value="inputDate1" :defaultValue="inputDate1" @change="fetchBattleRecordsByDate" 
            valueFormat="YYYY/MM/DD" format="YYYY/MM/DD" :disabled-date="disabledDate" />
          <n-button size="small" :disabled="loading1" @click="handleRefresh1" class="action-btn refresh-btn">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>刷新</n-button>
          <n-button type="primary" size="small" :disabled="!battleRecords1 || loading1" @click="handleExport1" class="action-btn export-btn">
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>导出</n-button>
          <n-button type="info" size="small" :disabled="!battleRecords1 || loading1" @click="hcSort" class="action-btn sort-btn">
            红淬排序</n-button>
          <n-button type="info" size="small" :disabled="!battleRecords1 || loading1" @click="scoreSort" class="action-btn sort-btn">
            积分排序</n-button>
        </div>
      </div>

      <!-- 公告区域 -->
      <div v-if="battleRecords1 && battleRecords1.legionRankList" class="announcement-section">
        <div class="announcement-content">
          <span class="announcement-text">盐场匹配信息实时更新中，请关注最新排名变化</span>
        </div>
      </div>

      <!-- 联盟分类标签栏 -->
      <div v-if="battleRecords1 && battleRecords1.legionRankList" class="alliance-tabs-section">
        <div class="alliance-tab" :class="{ active: activeAlliance === '大联盟' }" @click="setActiveAlliance('大联盟')">
          <span class="tab-text">大联盟</span>
          <span class="tab-count">{{ getActiveAllianceCount('大联盟') }}</span>
        </div>
        <div class="alliance-tab" :class="{ active: activeAlliance === '梦盟' }" @click="setActiveAlliance('梦盟')">
          <span class="tab-text">梦盟</span>
          <span class="tab-count">{{ getActiveAllianceCount('梦盟') }}</span>
        </div>
        <div class="alliance-tab" :class="{ active: activeAlliance === '未知联盟' }" @click="setActiveAlliance('未知联盟')">
          <span class="tab-text">未知联盟</span>
          <span class="tab-count">{{ getActiveAllianceCount('未知联盟') }}</span>
        </div>

        <div class="alliance-tab all" :class="{ active: activeAlliance === 'all' }" @click="setActiveAlliance('all')">
          <span class="tab-text">全部</span>
          <span class="tab-count">{{ battleRecords1.legionRankList.length }}</span>
        </div>
      </div>

      <!-- 表格内容区 -->
      <div class="table-content">
        <!-- 加载状态 -->
        <div v-if="loading1" class="loading-state">
          <n-spin size="large">
            <template #description>
              正在加载盐场匹配数据...
            </template>
          </n-spin>
        </div>

        <!-- 匹配列表 -->
        <div v-else-if="battleRecords1 && battleRecords1.legionRankList" ref="exportDom" class="table-container">
          <!-- 表格标题行 -->
          <div class="table-header">
            <div class="table-cell rank">排名</div>
            <div class="table-cell alliance">联盟</div>
            <div class="table-cell avatar">头像</div>
            <div class="table-cell name">名称</div>
            <div class="table-cell score">积分</div>
            <div class="table-cell red-quench">红淬</div>
            <div class="table-cell first-3">前三车头</div>
            <div class="table-cell power">战力</div>
            <div class="table-cell level">等级</div>
            <div class="table-cell server">服务区</div>
            <div class="table-cell announcement">公告</div>
          </div>
          
          <!-- 表格数据行 -->
          <div v-for="(member, index) in filteredLegionList" :key="member.id" 
               class="table-row" 
               :class="getAllianceClass(allianceincludes(member.announcement))">
            <div class="table-cell rank">
              <div class="rank-container">
                <span v-if="index === 0" class="rank-medal gold"></span>
                <span v-else-if="index === 1" class="rank-medal silver"></span>
                <span v-else-if="index === 2" class="rank-medal bronze"></span>
                <span v-else class="rank-number">{{ index + 1 }}</span>
              </div>
            </div>
            <div class="table-cell alliance">
              <span class="alliance-tag">{{ allianceincludes(member.announcement) || '未知联盟' }}</span>
            </div>
            <div class="table-cell avatar">
              <img v-if="member.logo" :src="member.logo" :alt="member.name" class="member-avatar"
                @error="handleImageError">
              <div v-else class="member-avatar-placeholder">{{ member.name?.charAt(0) || '?' }}</div>
            </div>
            <div class="table-cell name">{{ member.name }}</div>
            <div class="table-cell score">{{ formatScore(member.sRScore) || 0 }}</div>
            <div class="table-cell red-quench">{{ member.redQuench || 0 }}</div>
            <div class="table-cell first-3">
              <div class="hero-avatars">
                <div v-for="(hero, index) in member.topHeroes" :key="index" class="hero-card">
                  <img v-if="hero.headImg" :src="hero.headImg" :alt="hero.name" class="hero-avatar">
                  <div v-else class="hero-avatar-placeholder">{{ hero.name?.charAt(0) || '?' }}</div>
                  <div class="hero-info">
                    <div class="hero-name">{{ hero.name || '未知' }}</div>
                    <div class="hero-stats">
                      <span class="hero-power">{{ formatPower(hero.power) }}</span>
                      <span class="hero-redquench" :class="getRedQuenchClass(hero.redQuench)">{{ hero.redQuench }}红</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="table-cell power">{{ formatPower(member.power) || 0 }}</div>
            <div class="table-cell level"><span>{{ member.level || 30 }}</span></div>
            <div class="table-cell server">{{ member.serverId || 0 }}</div>
            <div class="table-cell announcement">{{ member.announcement || '' }}</div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="!loading1" class="empty-state">
          <n-empty description="暂无盐场匹配数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMessage, NDatePicker, NCheckboxGroup, NCheckbox } from 'naive-ui'
import { useTokenStore } from '@/stores/tokenStore'
import html2canvas from 'html2canvas';
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText
} from '@vicons/ionicons5'
import {
  getLastSaturday,
  formatTimestamp,
  formatTimestamp1,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard
} from '@/utils/clubBattleUtils'
import { gettoday, formatWarrankRecordsForExport, allianceincludes } from '@/utils/clubWarrankUtils'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const exportmethod = ref([]);
const exportDom = ref(null);
const emit = defineEmits(['update:visible'])

const message = useMessage()
const tokenStore = useTokenStore()

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const loading1 = ref(false)
const battleRecords1 = ref(null)
const expandedMembers = ref(new Set())
const queryDate = ref('')
const inputDate1 = ref(getLastSaturday())

// 新增联盟筛选功能
const activeAlliance = ref('all')

// 联盟筛选计算属性
const filteredLegionList = computed(() => {
  if (!battleRecords1.value?.legionRankList) {
    return []
  }
  
  if (activeAlliance.value === 'all') {
    return battleRecords1.value.legionRankList
  }
  
  return battleRecords1.value.legionRankList.filter(member => {
    const memberAlliance = allianceincludes(member.announcement)
    if (activeAlliance.value === '空白') {
      return !member.announcement || member.announcement === 0 || member.announcement === '0'
    }
    return memberAlliance === activeAlliance.value
  })
})

// 设置当前选中联盟
const setActiveAlliance = (alliance) => {
  activeAlliance.value = alliance
}

// 获取联盟数量
const getActiveAllianceCount = (alliance) => {
  if (!battleRecords1.value?.legionRankList) {
    return 0
  }
  
  return battleRecords1.value.legionRankList.filter(member => {
    const memberAlliance = allianceincludes(member.announcement)
    if (alliance === '空白') {
      return !member.announcement || member.announcement === 0 || member.announcement === '0'
    }
    return memberAlliance === alliance
  }).length
}

// 格式化战力
const formatPower = (power) => {
  if (!power) return '0'
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + '亿'
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + '万'
  }
  return power.toString()
}

const formatScore = (Score) => {
  return Score ? Score.toFixed(0).toString() : '0'
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = 'none'
}


const disabledDate = current => {
  return (current.getDay() != 6 && current.getDay() != 0) || current > Date.now()
}

// 联盟样式类
const getAllianceClass = (alliance) => {
  switch(alliance) {
    case '大联盟':
      return 'alliance-large';
    case '梦盟':
      return 'alliance-dream';
    case '未知联盟':
      return 'alliance-unknown';
    default:
      return 'alliance-other';
  }
}

// 红淬样式类
const getRedQuenchClass = (redQuench) => {
  if (redQuench >= 60) {
    return 'redquench-high';
  } else if (redQuench >= 50) {
    return 'redquench-medium';
  } else {
    return 'redquench-low';
  }
}

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = val => {
  if (undefined != val) {
    inputDate1.value = val
  } else {
    inputDate1.value = getLastSaturday()
  }
  fetchBattleRecords1()
}

// 查询战绩
const fetchBattleRecords1 = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择游戏角色')
    return
  }

  const tokenId = tokenStore.selectedToken.id

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId)
  if (wsStatus !== 'connected') {
    message.error('WebSocket未连接，无法查询战绩')
    return
  }

  loading1.value = true
  queryDate.value = formatTimestamp1(inputDate1.value)


  if (gettoday() == queryDate.value && new Date().getHours() < 21) {
    const getbattlefield = await tokenStore.sendMessageWithPromise(tokenId, 'legion_getbattlefield', {}, 10000)
    if (!getbattlefield.info) {
      battleRecords1.value = null;
      message.warning('未查询到盐场匹配数据');
      return;
    }
    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        'legion_getopponent',
        {
          phase: getbattlefield.info.phase,
          battlefieldId: getbattlefield.info.battlefieldId
        },
        10000
      )

      if (!result?.opponentList) {
        battleRecords1.value = null;
        message.warning('未查询到盐场匹配数据');
        return;
      }
      const detailPromises = result.opponentList.map(async (club) => {
        try {
          const detail = await tokenStore.sendMessageWithPromise(
            tokenId,
            'legion_getinfobyid',
            { legionId: club.id },
            5000
          );
          if (!detail) {
        return {
          ...club,
          redQuench: 0,
          power: 0,
          announcement: '未知',
          redno: 0,
          redno1: '0红',
          redno2: '0红',
          redno3: '0红',
          hb1: 0,
          hb2: 0,
          hb3: 0,
          topHeroes: [],
          level: 30
        };
      }
          const topHeroes = [];
          
          for (const [roleId, memberData] of Object.entries(detail?.legionData?.members)) {
            const tempRoleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'rank_getroleinfo',
              {
                bottleType: 0,
                includeBottleTeam: false,
                isSearch: false,
                roleId: roleId
              }, 5000)
            
            let holyBeast = 0;
            for (const [heroId, heroData] of Object.entries(tempRoleInfo?.roleInfo?.heroes)) {
              if (heroData.hB?.active !== undefined) {
                holyBeast++;
              }
            }
            
            topHeroes.push({
              id: roleId,
              name: memberData.name || memberData.custom?.name || '未知',
              headImg: memberData.headImg || memberData.custom?.headImg || '',
              power: tempRoleInfo?.roleInfo?.power || 0,
              redQuench: memberData.custom?.red_quench_cnt || 0,
              holyBeast: holyBeast
            });
          }
          
          // 按红淬数量降序排序，取前三
          topHeroes.sort((a, b) => b.redQuench - a.redQuench);
          const top3Heroes = topHeroes.slice(0, 3);
          
          // 提取红淬数量数组
          const redQuenchCounts = top3Heroes.map(hero => hero.redQuench + '红');
          // 提取圣物数量数组
          const HolyBeastNum = top3Heroes.map(hero => hero.holyBeast);
          
          return {
            ...club,
            redQuench: detail?.legionData?.quenchNum || 0,
            power: detail?.legionData?.power || 0,
            announcement: detail?.legionData?.announcement || 0,
            redno: redQuenchCounts || 0,
            redno1: redQuenchCounts[0] || '0红',
            redno2: redQuenchCounts[1] || '0红',
            redno3: redQuenchCounts[2] || '0红',
            hb1: HolyBeastNum[0] || 0,
            hb2: HolyBeastNum[1] || 0,
            hb3: HolyBeastNum[2] || 0,
            topHeroes: top3Heroes,
            level: 30
          };
        } catch (error) {
          console.error(`查询俱乐部${club.id}详情失败:`, error);
          return {
            ...club,
            redQuench: 0,
            power: 0,
            announcement: '未知',
            redno: 0,
            redno1: '0红',
            redno2: '0红',
            redno3: '0红',
            hb1: 0,
            hb2: 0,
            hb3: 0,
            topHeroes: [],
            level: 30
          };
        }
      });
      const processedClubs = await Promise.all(detailPromises);
      battleRecords1.value = {
        ...result,
        legionRankList: processedClubs
      };
      message.success('盐场匹配数据加载成功');
    } catch (error) {
      console.error('查询失败:', error);
      message.error(`查询失败: ${error.message}`);
      battleRecords1.value = null;
    } finally {
      loading1.value = false;
    }
  }

  else {
    try {
      const result = await tokenStore.sendMessageWithPromise(
        tokenId,
        'legion_getwarrank',
        { date: queryDate.value },
        10000
      )

      if (!result?.legionRankList) {
        battleRecords1.value = null;
        message.warning('未查询到盐场匹配数据');
        return;
      }
      const detailPromises = result.legionRankList.map(async (club) => {
        try {
          const detail = await tokenStore.sendMessageWithPromise(
            tokenId,
            'legion_getinfobyid',
            { legionId: club.id },
            5000
          );
          club.sRScore = -1;
          if (!detail) {
            return {
              ...club,
              redQuench: 0,
              power: 0,
              announcement: '未知',
              redno: 0,
              redno1: '0红',
              redno2: '0红',
              redno3: '0红',
              hb1: 0,
              hb2: 0,
              hb3: 0,
              topHeroes: [],
              level: 30
            };
          }
          const topHeroes = [];
          
          for (const [roleId, memberData] of Object.entries(detail?.legionData?.members)) {
            const tempRoleInfo = await tokenStore.sendMessageWithPromise(tokenId, 'rank_getroleinfo',
              {
                bottleType: 0,
                includeBottleTeam: false,
                isSearch: false,
                roleId: roleId
              }, 5000)
            
            let holyBeast = 0;
            for (const [heroId, heroData] of Object.entries(tempRoleInfo?.roleInfo?.heroes)) {
              if (heroData.hB?.active !== undefined) {
                holyBeast++;
              }
            }
            
            topHeroes.push({
              id: roleId,
              name: memberData.name || memberData.custom?.name || '未知',
              headImg: memberData.headImg || memberData.custom?.headImg || '',
              power: tempRoleInfo?.roleInfo?.power || 0,
              redQuench: memberData.custom?.red_quench_cnt || 0,
              holyBeast: holyBeast
            });
          }
          
          // 按红淬数量降序排序，取前三
          topHeroes.sort((a, b) => b.redQuench - a.redQuench);
          const top3Heroes = topHeroes.slice(0, 3);
          
          // 提取红淬数量数组
          const redQuenchCounts = top3Heroes.map(hero => hero.redQuench + '红');
          // 提取圣物数量数组
          const HolyBeastNum = top3Heroes.map(hero => hero.holyBeast);
          
          return {
            ...club,
            redQuench: detail?.legionData?.quenchNum || 0,
            power: detail?.legionData?.power || 0,
            announcement: detail?.legionData?.announcement || 0,
            redno: redQuenchCounts || 0,
            redno1: redQuenchCounts[0] || '0红',
            redno2: redQuenchCounts[1] || '0红',
            redno3: redQuenchCounts[2] || '0红',
            hb1: HolyBeastNum[0] || 0,
            hb2: HolyBeastNum[1] || 0,
            hb3: HolyBeastNum[2] || 0,
            topHeroes: top3Heroes,
            level: 30
          };
        } catch (error) {
          console.error(`查询俱乐部${club.id}详情失败:`, error);
          return {
            ...club,
            redQuench: 0,
            power: 0,
            announcement: '未知',
            redno: 0,
            redno1: '0红',
            redno2: '0红',
            redno3: '0红',
            hb1: 0,
            hb2: 0,
            hb3: 0,
            topHeroes: [],
            level: 30
          };
        }
      });
      const processedClubs = await Promise.all(detailPromises);
      battleRecords1.value = {
        ...result,
        legionRankList: processedClubs
      };
      message.success('盐场匹配数据加载成功');
    } catch (error) {
      console.error('查询失败:', error);
      message.error(`查询失败: ${error.message}`);
      battleRecords1.value = null;
    } finally {
      loading1.value = false;
    }
  }

}
// 刷新战绩
const handleRefresh1 = () => {
  fetchBattleRecords1()
}

const hcSort = async () => {
  // battleRecords1.legionRankList 按照 redQuench 降序
  battleRecords1.value.legionRankList.sort((a, b) => b.redQuench - a.redQuench)
}

const scoreSort = async () => {
  // battleRecords1.legionRankList 按照 sRScore 降序
  battleRecords1.value.legionRankList.sort((a, b) => b.sRScore - a.sRScore)
}
// 导出战绩
const handleExport1 = async () => {
  if (!battleRecords1.value || !battleRecords1.value.legionRankList) {
    message.warning('没有可导出的数据')
    return
  }

  try {
    if (exportmethod.value.includes('1')) {
      const exportText = formatWarrankRecordsForExport(
        battleRecords1.value.legionRankList,
        queryDate.value
      )
    }
    if (exportmethod.value.includes('2')) {
      exportToImage()
    }
    message.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    message.error('导出失败，请重试')
  }
}

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    alert("未找到要导出的DOM元素");
    return;
  }

  try {
    // 5. 用html2canvas渲染DOM为Canvas
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: "#ffffff", // 避免透明背景（默认透明）
      logging: false, // 关闭控制台日志
    })

    // 6. Canvas转图片链接（支持PNG/JPG）
    const imgUrl = canvas.toDataURL("image/png")
    // 若要JPG，改为'image/jpeg'

    // 7. 创建下载链接，触发浏览器下载
    const link = document.createElement("a")
    link.href = imgUrl
    console.log()
    link.download = queryDate.value.replace("/", "年").replace("/", "月") + "日盐场匹配信息.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (err) {
    console.error("DOM转图片失败：", err)
    alert("导出图片失败，请重试")
  }
}

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear()
}

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords1
})

// Inline 模式：挂载后自动拉取
onMounted(() => {
  fetchBattleRecords1()
})
</script>

<style scoped lang="scss">
// 主容器样式
.club-warrank-container {
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
  background: var(--bg-primary);
  color: var(--text-primary);
  overflow: hidden;
}

// 卡片样式
.club-warrank-card {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 头部信息区
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }
  
  .header-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: var(--border-radius-md);
    background: var(--bg-secondary);
    padding: var(--spacing-xs);
    box-sizing: border-box;
  }
  
  .header-title {
    h2 {
      margin: 0;
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }
    
    p {
      margin: var(--spacing-xs) 0 0 0;
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
    }
  }
  
  // 数据统计区
  .stats-section {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      .stat-label {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }
      
      :deep(.n-tag) {
        font-size: var(--font-size-sm);
        padding: 4px 8px;
      }
    }
  }
}

// 功能操作区
.function-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  
  .function-left {
    .export-options {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      
      :deep(.n-checkbox-group) {
        display: flex;
        gap: var(--spacing-md);
        
        .n-checkbox {
          font-size: var(--font-size-sm);
          color: var(--text-primary);
        }
      }
    }
  }
  
  .function-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    :deep(.n-date-picker) {
      font-size: var(--font-size-sm);
      width: 200px;
      
      .n-input-wrapper {
        font-size: var(--font-size-sm);
      }
    }
    
    .action-btn {
      font-size: var(--font-size-sm);
      padding: 6px 12px;
      border-radius: var(--border-radius-sm);
      transition: all var(--transition-fast);
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-medium);
      }
      
      &.refresh-btn {
        background: var(--bg-primary);
        border: 1px solid var(--border-medium);
      }
      
      &.export-btn {
        background: var(--primary-color);
        color: white;
        
        &:hover {
          background: var(--primary-color-hover);
        }
      }
      
      &.sort-btn {
        background: var(--info-color-light);
        color: var(--info-color);
        border: 1px solid var(--info-color);
        
        &:hover {
          background: var(--info-color-hover);
          color: white;
        }
      }
    }
  }
}

// 公告区域
.announcement-section {
  background: linear-gradient(135deg, var(--primary-color-light) 0%, var(--primary-color) 100%);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
  
  .announcement-content {
    display: flex;
    justify-content: center;
    align-items: center;
    
    .announcement-text {
      color: white;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-align: center;
      line-height: 1.5;
      max-width: 800px;
    }
  }
}

// 联盟分类标签栏
.alliance-tabs-section {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: var(--spacing-xs);
  gap: var(--spacing-xs);
  flex-shrink: 0;
  
  .alliance-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid transparent;
    
    &:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }
    
    &.active {
      background: white;
      color: var(--primary-color);
      box-shadow: var(--shadow-medium);
      transform: translateY(-2px);
    }
    
    &.all {
      background: rgba(255, 255, 255, 0.2);
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      
      &.active {
        background: white;
        color: var(--primary-color);
      }
    }
    
    .tab-text {
      font-size: var(--font-size-sm);
    }
    
    .tab-count {
      font-size: var(--font-size-xs);
      background: rgba(255, 255, 255, 0.3);
      padding: 2px 6px;
      border-radius: 10px;
      font-weight: var(--font-weight-bold);
      
      .alliance-tab.active & {
        background: var(--primary-color);
        color: white;
      }
    }
  }
}

// 表格内容区
.table-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  height: calc(100% - 200px);
  
  // 加载状态
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: var(--bg-primary);
    height: 100%;
    
    :deep(.n-spin) {
      font-size: var(--font-size-lg);
      
      .n-spin-description {
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }
    }
  }
  
  // 空状态
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    background: var(--bg-primary);
    height: 100%;
    
    :deep(.n-empty) {
      font-size: var(--font-size-sm);
      
      .n-empty-description {
        color: var(--text-secondary);
      }
    }
  }
  
  // 表格容器
  .table-container {
    flex: 1;
    overflow: auto;
    background: var(--bg-primary);
    height: 100%;
    
    // 滚动条样式
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: var(--bg-secondary);
      border-radius: var(--border-radius-sm);
    }
    
    ::-webkit-scrollbar-thumb {
      background: var(--border-medium);
      border-radius: var(--border-radius-sm);
      
      &:hover {
        background: var(--border-dark);
      }
    }
    
    // 表格标题行
    .table-header {
      display: flex;
      background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
      border-bottom: 2px solid var(--border-medium);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
      font-size: var(--font-size-sm);
      padding: var(--spacing-xs) var(--spacing-sm);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      // 确保所有标题头居中对齐
      .table-cell {
        justify-content: center;
      }
    }
    
    // 表格数据行
    .table-row {
      display: flex;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: 1px solid var(--border-light);
      transition: all var(--transition-fast);
      background: var(--bg-primary);
      
      &:hover {
        background: var(--bg-secondary);
        transform: translateX(2px);
        box-shadow: inset 3px 0 0 var(--primary-color);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      // 联盟样式类
      &.alliance-large {
        .alliance-tag {
          background: var(--primary-color);
        }
      }
      
      &.alliance-dream {
        .alliance-tag {
          background: var(--success-color);
        }
      }
      
      &.alliance-unknown {
        .alliance-tag {
          background: var(--warning-color);
        }
      }
      
      &.alliance-other {
        .alliance-tag {
          background: var(--text-secondary);
        }
      }
    }
    
    // 表格单元格
    .table-cell {
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--text-primary);
      
      // 单元格宽度分配
      &.rank {
        width: 60px;
        min-width: 60px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        
        .rank-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        
        .rank-medal {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: var(--font-size-sm);
          color: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          
          &::before {
            content: attr(data-rank);
          }
          
          &.gold {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            
            &::before {
              content: '1';
            }
          }
          
          &.silver {
            background: linear-gradient(135deg, #C0C0C0 0%, #A9A9A9 100%);
            
            &::before {
              content: '2';
            }
          }
          
          &.bronze {
            background: linear-gradient(135deg, #CD7F32 0%, #B87333 100%);
            
            &::before {
              content: '3';
            }
          }
        }
        
        .rank-number {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          color: var(--text-primary);
        }
      }
      
      &.alliance {
        width: 80px;
        min-width: 80px;
      
        .alliance-tag {
          display: inline-block;
          padding: 3px 8px;
          border-radius: var(--border-radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          transition: all var(--transition-fast);
          
          &:hover {
            transform: scale(1.05);
            box-shadow: var(--shadow-medium);
          }
        }
      }
      
      &.avatar {
        width: 50px;
        min-width: 50px;
        justify-content: center;
      
        .member-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-light);
          transition: all var(--transition-fast);
          
          &:hover {
            transform: scale(1.2);
            box-shadow: var(--shadow-medium);
            border-color: var(--primary-color);
          }
        }
        
        .member-avatar-placeholder {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-md);
          font-weight: var(--font-weight-bold);
          border: 2px solid var(--border-light);
        }
      }
      
      &.name {
        width: 120px;
        min-width: 120px;
        font-weight: var(--font-weight-bold);
        color: var(--text-primary);
        font-size: var(--font-size-base);
      }
      
      &.score {
        width: 80px;
        min-width: 80px;
        justify-content: center;
        color: var(--warning-color);
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-base);
        text-align: center;
      }
      
      &.red-quench {
        width: 80px;
        min-width: 80px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        text-align: center;
        
        &::before {
          content: '';
          display: inline-block;
          width: 12px;
          height: 12px;
          background: var(--error-color);
          border-radius: 50%;
          margin-right: 4px;
          vertical-align: middle;
        }
      }
      
      &.first-3 {
        width: 350px;
        min-width: 350px;
        
        .hero-avatars {
          display: flex;
          gap: var(--spacing-xs);
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          flex-wrap: nowrap;
          padding: var(--spacing-xs) 0;
          overflow: hidden;
        }
        
        .hero-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: calc(var(--spacing-xs) / 2);
          padding: calc(var(--spacing-xs) / 2);
          background: var(--bg-secondary);
          border-radius: var(--border-radius-sm);
          border: 1px solid var(--border-light);
          transition: all var(--transition-fast);
          min-width: 100px;
          flex: 1;
          max-width: 110px;
          
          &:hover {
            background: var(--bg-primary);
            transform: translateY(-2px);
            box-shadow: var(--shadow-medium);
            border-color: var(--primary-color);
          }
        }
        
        .hero-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-light);
          transition: all var(--transition-fast);
          
          &:hover {
            transform: scale(1.1);
            border-color: var(--primary-color);
          }
        }
        
        .hero-avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-bold);
          border: 2px solid var(--border-light);
        }
        
        .hero-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          width: 100%;
        }
        
        .hero-name {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: var(--text-primary);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        
        .hero-stats {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
        }
        
        .hero-power {
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }
        
        .hero-redquench {
          font-weight: var(--font-weight-bold);
          padding: 1px 6px;
          border-radius: var(--border-radius-full);
          
          &.redquench-high {
            color: var(--error-color);
            background: rgba(var(--error-color-rgb), 0.1);
          }
          
          &.redquench-medium {
            color: var(--warning-color);
            background: rgba(var(--warning-color-rgb), 0.1);
          }
          
          &.redquench-low {
            color: var(--success-color);
            background: rgba(var(--success-color-rgb), 0.1);
          }
        }
      }
      
      &.power {
        width: 100px;
        min-width: 100px;
        justify-content: center;
        font-weight: var(--font-weight-bold);
        color: var(--primary-color);
        font-size: var(--font-size-base);
        text-align: center;
      }
      
      &.level {
        width: 70px;
        min-width: 70px;
        justify-content: center;
        
        &::before {
          content: 'Lv.';
          font-size: var(--font-size-xs);
          color: var(--text-secondary);
          margin-right: 2px;
        }
        
        span {
          display: inline-block;
          padding: 2px 8px;
          background: linear-gradient(135deg, var(--primary-color-light) 0%, var(--primary-color) 100%);
          color: white;
          border-radius: var(--border-radius-full);
          font-weight: var(--font-weight-bold);
          font-size: var(--font-size-sm);
        }
      }
      
      &.server {
        width: 90px;
        min-width: 90px;
        justify-content: center;
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        text-align: center;
      }
      
      &.announcement {
        flex: 1;
        min-width: 150px;
        color: var(--text-secondary);
        white-space: normal;
        overflow: visible;
        text-overflow: clip;
        font-size: var(--font-size-xs);
        line-height: 1.4;
        min-height: 24px;
        word-break: break-all;
      }
    }
  }
}

// 按钮样式调整
:deep(.n-button) {
  font-size: var(--font-size-sm);
  padding: 6px 12px;
  border-radius: var(--border-radius-sm);
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// 输入框样式调整
:deep(.n-input-wrapper) {
  font-size: var(--font-size-sm);
}

// 响应式设计
@media (max-width: 1200px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    
    .stats-section {
      width: 100%;
      justify-content: flex-start;
    }
  }
  
  .function-section {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
    
    .function-right {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }
  }
  
  .alliance-tabs-section {
    overflow-x: auto;
    justify-content: flex-start;
    
    .alliance-tab {
      flex: 0 0 auto;
      white-space: nowrap;
    }
  }
  
  .table-container {
    font-size: var(--font-size-xs);
    
    .table-header {
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    
    .table-row {
      padding: var(--spacing-xs) var(--spacing-sm);
    }
    
    .table-cell {
      padding: 0 var(--spacing-xs);
      font-size: var(--font-size-xs);
      
      &.rank {
        width: 50px;
        min-width: 50px;
      }
      
      &.alliance {
        width: 100px;
        min-width: 100px;
      }
      
      &.avatar {
        width: 50px;
        min-width: 50px;
        
        .member-avatar, .member-avatar-placeholder {
          width: 32px;
          height: 32px;
        }
      }
      
      &.name {
        width: 120px;
        min-width: 120px;
      }
      
      &.score, &.red-quench {
        width: 80px;
        min-width: 80px;
      }
      
      &.first-3 {
        width: 350px;
        min-width: 350px;
        
        .hero-card {
          min-width: 80px;
          
          .hero-avatar,
          .hero-avatar-placeholder {
            width: 40px;
            height: 40px;
          }
          
          .hero-name {
            font-size: var(--font-size-xs);
          }
          
          .hero-stats {
            font-size: var(--font-size-xs);
          }
        }
      }
      
      &.power {
        width: 100px;
        min-width: 100px;
      }
      
      &.level, &.server {
        width: 70px;
        min-width: 70px;
      }
      
      &.announcement {
        min-width: 150px;
      }
    }
  }
}

@media (max-width: 768px) {
  .club-warrank-container {
    padding: var(--spacing-xs);
  }
  
  .header-section {
    padding: var(--spacing-md);
  }
  
  .function-section {
    padding: var(--spacing-xs) var(--spacing-md);
  }
  
  .alliance-tabs-section {
    padding: var(--spacing-xs) var(--spacing-xs);
  }
  
  :deep(.n-date-picker) {
    width: 180px !important;
  }
}
</style>
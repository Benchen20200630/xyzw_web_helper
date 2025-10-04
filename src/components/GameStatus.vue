<template>
  <div class="game-status-container">
    <!-- 队伍状态 -->
    <TeamStatus />
    
    <!-- 每日任务状态 -->
    <DailyTaskStatus />

    <!-- 月度任务进度 -->
    <div class="status-card monthly-tasks">
      <div class="card-header">
        <img
          src="/icons/1736425783912140.png"
          alt="月度任务"
          class="status-icon"
        >
        <div class="status-info">
          <h3>月度任务</h3>
          <p>进度与一键补齐</p>
        </div>
        <div class="status-badge" :class="{ active: monthHasData }">
          <div class="status-dot" />
          <span v-if="remainingDays > 0">剩余 {{ remainingDays }} 天</span>
          <span v-else>本月最后一天</span>
        </div>
      </div>
      <div class="card-content">
        <div class="monthly-row">
          <div class="row-title">钓鱼进度</div>
          <div class="row-value">{{ fishNum }} / {{ FISH_TARGET }}（{{ fishPercent }}%）</div>
        </div>
        <div class="monthly-row">
          <div class="row-title">竞技场进度</div>
          <div class="row-value">{{ arenaNum }} / {{ ARENA_TARGET }}（{{ arenaPercent }}%）</div>
        </div>
        <div class="action-row">
          <button class="action-button secondary" :disabled="monthLoading || fishToppingUp || arenaToppingUp" @click="fetchMonthlyActivity">
            {{ monthLoading ? '刷新中...' : '刷新进度' }}
          </button>

          <!-- 钓鱼：补齐 + 下拉更多（隐藏一键完成） -->
          <n-button-group>
            <n-button class="action-button" :disabled="monthLoading || fishToppingUp" @click="topUpMonthly('fish')">
              {{ fishToppingUp ? '补齐中...' : '钓鱼补齐' }}
            </n-button>
            <n-dropdown :options="fishMoreOptions" trigger="click" @select="onFishMoreSelect">
              <n-button :disabled="monthLoading || fishToppingUp">▾</n-button>
            </n-dropdown>
          </n-button-group>

          <!-- 竞技场：补齐 + 下拉更多（隐藏一键完成） -->
          <n-button-group>
            <n-button class="action-button" :disabled="monthLoading || arenaToppingUp" @click="topUpMonthly('arena')">
              {{ arenaToppingUp ? '补齐中...' : '竞技场补齐' }}
            </n-button>
            <n-dropdown :options="arenaMoreOptions" trigger="click" @select="onArenaMoreSelect">
              <n-button :disabled="monthLoading || arenaToppingUp">▾</n-button>
            </n-dropdown>
          </n-button-group>
        </div>
        <p class="description muted">
          补齐规则：让“当前天数比例”和“完成比例”一致；若无剩余天数则按满额（{{FISH_TARGET}}/{{ARENA_TARGET}}）计算。
        </p>
      </div>
    </div>

    <!-- 咸将塔状态 -->
    <TowerStatus />
    
    <!-- 其他游戏状态卡片 -->
    <!-- 盐罐机器人状态 -->
    <div class="status-card bottle-helper">
      <div class="card-header">
        <img
          src="/icons/173746572831736.png"
          alt="盐罐图标"
          class="status-icon"
        >
        <div class="status-info">
          <h3>盐罐机器人</h3>
          <p>剩余时间</p>
        </div>
        <div
          class="status-badge"
          :class="{ active: bottleHelper.isRunning }"
        >
          <div class="status-dot" />
          <span>{{ bottleHelper.isRunning ? '运行中' : '已停止' }}</span>
        </div>
      </div>
      <div class="card-content">
        <div class="time-display">
          {{ formatTime(bottleHelper.remainingTime) }}
        </div>
        <button 
          class="action-button"
          :class="{ active: bottleHelper.isRunning }"
          @click="handleBottleHelper"
        >
          {{ bottleHelper.isRunning ? '重启服务' : '启动服务' }}
        </button>
      </div>
    </div>

    <!-- 挂机状态 -->
    <div class="status-card hang-up">
      <div class="card-header">
        <img
          src="/icons/174061875626614.png"
          alt="挂机图标"
          class="status-icon"
        >
        <div class="status-info">
          <h3>挂机时间</h3>
          <p>已挂机：{{ formatTime(hangUp.elapsedTime) }}</p>
        </div>
        <div
          class="status-badge"
          :class="{ active: hangUp.isActive }"
        >
          <div class="status-dot" />
          <span>{{ hangUp.isActive ? '挂机中' : '已完成' }}</span>
        </div>
      </div>
      <div class="card-content">
        <div class="time-display">
          {{ formatTime(hangUp.remainingTime) }}
        </div>
        <div class="action-row">
          <button 
            class="action-button secondary" 
            :disabled="hangUp.isExtending"
            @click="extendHangUp"
          >
            <span
              v-if="hangUp.isExtending"
              class="loading-text"
            >
              <svg
                class="loading-icon"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
                />
              </svg>
              加钟中...
            </span>
            <span v-else>加钟</span>
          </button>
          <button 
            class="action-button primary" 
            :disabled="hangUp.isClaiming"
            @click="claimHangUpReward"
          >
            <span
              v-if="hangUp.isClaiming"
              class="loading-text"
            >
              <svg
                class="loading-icon"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
                />
              </svg>
              领取中...
            </span>
            <span v-else>领取奖励</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 俱乐部排位 -->
    <div class="status-card legion-match">
      <div class="card-header">
        <img
          src="/icons/1733492491706152.png"
          alt="俱乐部图标"
          class="status-icon"
        >
        <div class="status-info">
          <h3>俱乐部排位</h3>
          <p>赛事状态</p>
        </div>
        <div
          class="status-badge"
          :class="{ active: legionMatch.isRegistered }"
        >
          <div class="status-dot" />
          <span>{{ legionMatch.isRegistered ? '已报名' : '未报名' }}</span>
        </div>
      </div>
      <div class="card-content">
        <p class="description">
          每逢周三周四周五有比赛<br>
          立即报名参与精彩对决！
        </p>
        <button 
          class="action-button"
          :disabled="legionMatch.isRegistered"
          @click="registerLegionMatch"
        >
          {{ legionMatch.isRegistered ? '已报名' : '立即报名' }}
        </button>
      </div>
    </div>

    <!-- 俱乐部签到 -->
    <div class="status-card legion-signin">
      <div class="card-header">
        <img
          src="/icons/1733492491706148.png"
          alt="签到图标"
          class="status-icon"
        >
        <div class="status-info">
          <h3>俱乐部签到</h3>
          <p>每日签到状态</p>
        </div>
        <div
          class="status-badge"
          :class="{ active: legionSignin.isSignedIn }"
        >
          <div class="status-dot" />
          <span>{{ legionSignin.isSignedIn ? '已签到' : '待签到' }}</span>
        </div>
      </div>
      <div class="card-content">
        <p
          v-if="legionSignin.clubName"
          class="club-name"
        >
          当前俱乐部<br>
          <strong>{{ legionSignin.clubName }}</strong>
        </p>
        <p
          v-else
          class="description"
        >
          尚未加入任何俱乐部
        </p>
        <div class="action-row">
          <button
            class="action-button"
            :disabled="legionSignin.isSignedIn"
            @click="signInLegion"
          >
            {{ legionSignin.isSignedIn ? '已签到' : '立即签到' }}
          </button>
          <button
            class="action-button secondary"
            :disabled="!isConnected"
            @click="handleBattleRecordsClick"
          >
            盐场战绩
          </button>
        </div>
      </div>
    </div>

    <!-- 俱乐部战绩弹窗 -->
    <ClubBattleRecords
      ref="battleRecordsRef"
      v-model:visible="showBattleRecords"
    />

    <!-- 咸鱼大冲关 -->
    <div class="status-card study">
      <div class="card-header">
        <img
          src="/icons/1736425783912140.png"
          alt="学习图标"
          class="status-icon"
        >
        <div class="status-info">
          <h3>咸鱼大冲关</h3>
          <p>每日知识挑战</p>
        </div>
        <div class="status-badge weekly" :class="{ 'completed': study.isCompleted }">
          <div class="status-dot" :class="{ 'completed': study.isCompleted }" />
          <span>每周任务</span>
        </div>
      </div>
      <div class="card-content">
        <p class="description">
          没有什么可以阻挡我求知的欲望！
        </p>
        <button 
          class="action-button"
          :class="{ 'completed': study.isCompleted }"
          :disabled="study.isAnswering || study.isCompleted"
          @click="startStudy"
        >
          <span v-if="study.isCompleted">
            ✅ 已完成无需作答
          </span>
          <span
            v-else-if="study.isAnswering"
            class="loading-text"
          >
            <svg
              class="loading-icon"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 22c5.421 0 10-4.579 10-10h-2c0 4.337-3.663 8-8 8s-8-3.663-8-8c0-4.336 3.663-8 8-8V2C6.579 2 2 6.58 2 12c0 5.421 4.579 10 10 10z"
              />
            </svg>
            <span v-if="study.status === 'starting'">正在获取题目...</span>
            <span v-else-if="study.status === 'answering'">答题中 {{ study.answeredCount }}/{{ study.questionCount }}</span>
            <span v-else-if="study.status === 'claiming_rewards'">正在领取奖励...</span>
            <span v-else-if="study.status === 'completed'">答题完成</span>
            <span v-else>答题中...</span>
          </span>
          <span v-else>🎯 一键答题</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTokenStore } from '@/stores/tokenStore'
import { useMessage } from 'naive-ui'
import { preloadQuestions, getQuestionCount } from '@/utils/studyQuestionsFromJSON.js'
import TeamStatus from './TeamStatus.vue'
import DailyTaskStatus from './DailyTaskStatus.vue'
import TowerStatus from './TowerStatus.vue'
import ClubBattleRecords from './ClubBattleRecords.vue'

const tokenStore = useTokenStore()
const message = useMessage()

// 响应式数据
const showBattleRecords = ref(false)
const battleRecordsRef = ref(null)

const bottleHelper = ref({
  isRunning: false,
  remainingTime: 0,
  stopTime: 0
})

const hangUp = ref({
  isActive: false,
  remainingTime: 0,
  elapsedTime: 0,
  lastTime: 0,
  hangUpTime: 0,
  isExtending: false, // 加钟状态
  isClaiming: false   // 领取奖励状态
})

const legionMatch = ref({
  isRegistered: false
})

const legionSignin = ref({
  isSignedIn: false,
  clubName: ''
})

// 使用 tokenStore 中的答题状态
const study = computed(() => tokenStore.gameData.studyStatus)

// 月度任务相关
const FISH_TARGET = 320
const ARENA_TARGET = 240
const monthLoading = ref(false)
const fishToppingUp = ref(false)
const arenaToppingUp = ref(false)
const monthActivity = ref(null)

const now = new Date()
const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
const dayOfMonth = now.getDate()
const remainingDays = computed(() => Math.max(0, daysInMonth - dayOfMonth))
// 显示用百分比（取整），与计算用比例（不取整）分离，避免舍入带来的偏差
const monthPercent = computed(() => Math.min(100, Math.round((dayOfMonth / daysInMonth) * 100)))
const monthProgress = computed(() => Math.min(1, Math.max(0, dayOfMonth / daysInMonth)))

const monthHasData = computed(() => !!monthActivity.value)
const myMonthInfo = computed(() => monthActivity.value?.myMonthInfo || {})
const myArenaInfo = computed(() => monthActivity.value?.myArenaInfo || {})

const fishNum = computed(() => Number(myMonthInfo.value?.['2']?.num || 0))
const arenaNum = computed(() => Number(myArenaInfo.value?.num || 0))
const fishPercent = computed(() => Math.min(100, Math.round((fishNum.value / FISH_TARGET) * 100)))
const arenaPercent = computed(() => Math.min(100, Math.round((arenaNum.value / ARENA_TARGET) * 100)))

const fishShouldBe = computed(() => remainingDays.value === 0 ? FISH_TARGET : Math.min(FISH_TARGET, Math.ceil(monthProgress.value * FISH_TARGET)))
const arenaShouldBe = computed(() => remainingDays.value === 0 ? ARENA_TARGET : Math.min(ARENA_TARGET, Math.ceil(monthProgress.value * ARENA_TARGET)))
const fishNeeded = computed(() => Math.max(0, fishShouldBe.value - fishNum.value))
const arenaNeeded = computed(() => Math.max(0, arenaShouldBe.value - arenaNum.value))

// 下拉菜单选项
const fishMoreOptions = [
  { label: '一键完成', key: 'complete-fish' }
]
const arenaMoreOptions = [
  { label: '一键完成', key: 'complete-arena' }
]

const fetchMonthlyActivity = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  if (status !== 'connected') {
    // 等待连接建立后再获取
    return
  }
  monthLoading.value = true
  try {
    const tokenId = tokenStore.selectedToken.id
    const result = await tokenStore.sendMessageWithPromise(tokenId, 'activity_get', {}, 10000)
    const act = result?.activity || result?.body?.activity || result
    monthActivity.value = act || null
    if (act) message.success('月度任务进度已更新')
  } catch (e) {
    message.error(`获取月度任务失败：${e.message}`)
  } finally {
    monthLoading.value = false
  }
}

const topUpMonthly = (type) => {
  const isFish = type === 'fish'
  const target = isFish ? FISH_TARGET : ARENA_TARGET
  const current = isFish ? fishNum.value : arenaNum.value
  const shouldBe = remainingDays.value === 0 ? target : Math.min(target, Math.ceil((monthProgress.value * target)))
  const need = Math.max(0, shouldBe - current)

  if (need <= 0) {
    message.success('当前进度已达标，无需补齐')
    return
  }
  if (isFish) {
    // 自动补齐钓鱼
    autoTopUpFish(need, shouldBe, target)
  } else {
    // 自动补齐竞技场
    autoTopUpArena(need, shouldBe, target)
  }
}

// 完成本项任务（直接以满额为目标）
const completeMonthly = (type) => {
  const isFish = type === 'fish'
  const target = isFish ? FISH_TARGET : ARENA_TARGET
  const current = isFish ? fishNum.value : arenaNum.value
  const need = Math.max(0, target - current)

  if (need <= 0) {
    message.success('已满额，无需完成')
    return
  }
  if (isFish) {
    autoTopUpFish(need, target, target)
  } else {
    autoTopUpArena(need, target, target)
  }
}

// 下拉菜单选择处理
const onFishMoreSelect = (key) => {
  if (key === 'complete-fish') completeMonthly('fish')
}
const onArenaMoreSelect = (key) => {
  if (key === 'complete-arena') completeMonthly('arena')
}

// 辅助：获取当日零点时间戳（秒）
const getTodayStartSec = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

// 判断今天是否可用（用于免费钓鱼），当最后一次时间不在今天时认为可用
const isTodayAvailable = (lastTimeSec) => {
  if (!lastTimeSec || typeof lastTimeSec !== 'number') return true
  const todayStart = getTodayStartSec()
  return lastTimeSec < todayStart
}

// 自动补齐钓鱼：优先消耗免费3次，再按 need 批量抽（每次最多10）
const autoTopUpFish = async (need, shouldBe, target) => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  if (tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) !== 'connected') {
    message.warning('请先建立WS连接')
    return
  }

  fishToppingUp.value = true
  try {
    const tokenId = tokenStore.selectedToken.id

    // 1) 检查免费次数（通过角色 statisticsTime 判断今天是否可用）
    let role = tokenStore.gameData?.roleInfo?.role
    if (!role) {
      try { await tokenStore.sendGetRoleInfo(tokenId) } catch {}
      role = tokenStore.gameData?.roleInfo?.role
    }

    let freeUsed = 0
    const lastFreeTime = Number(role?.statisticsTime?.['artifact:normal:lottery:time'] || 0)
    if (isTodayAvailable(lastFreeTime)) {
      message.info('检测到今日免费钓鱼次数，开始消耗 3 次')
      for (let i = 0; i < 3; i++) {
        try {
          await tokenStore.sendMessageWithPromise(tokenId, 'artifact_lottery', { lotteryNumber: 1, newFree: true, type: 1 }, 8000)
          freeUsed++
          await new Promise(r => setTimeout(r, 500))
        } catch (e) {
          // 若免费次数已用尽或被限制，停止免费尝试
          break
        }
      }
      if (freeUsed > 0) {
        await fetchMonthlyActivity()
      }
    }

    // 2) 计算剩余需要次数（以目标 shouldBe 为准）
    const currentAfterFree = fishNum.value
    let remaining = Math.max(0, shouldBe - currentAfterFree)
    if (remaining <= 0) {
      message.success('已通过免费次数完成当日目标')
      return
    }

    message.info(`开始付费钓鱼补齐：共需 ${remaining} 次（每次最多10）`)
    
    // 3) 批量执行，每指令最多10次
    while (remaining > 0) {
      const batch = Math.min(10, remaining)
      try {
        await tokenStore.sendMessageWithPromise(tokenId, 'artifact_lottery', { lotteryNumber: batch, newFree: false, type: 1 }, 12000)
      } catch (e) {
        message.error(`钓鱼失败：${e.message}`)
        break
      }
      remaining -= batch
      await new Promise(r => setTimeout(r, 800))
    }

    // 4) 刷新进度
    await fetchMonthlyActivity()
    if (fishNum.value >= shouldBe || fishNum.value >= target) {
      message.success('钓鱼补齐完成')
    } else {
      message.warning('钓鱼补齐已停止，未达到目标')
    }
  } finally {
    fishToppingUp.value = false
  }
}

// 自动补齐竞技场（贪心）：
// 1) 假设每场胜利+2（最佳），先执行 ceil(need/2) 场
// 2) 拉一次 activity_get 校准；
// 3) 重复步骤1-2直到达标或触发安全上限
const autoTopUpArena = async (need, shouldBe, target) => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  if (tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) !== 'connected') {
    message.warning('请先建立WS连接')
    return
  }

  arenaToppingUp.value = true
  try {
    const tokenId = tokenStore.selectedToken.id
    // 开始竞技场
    try {
      await tokenStore.sendMessageWithPromise(tokenId, 'arena_startarea', {}, 6000)
    } catch {}
    
    let safetyCounter = 0
    const safetyMaxFights = 100
    let round = 1
    let remaining = need
    
    while (remaining > 0 && safetyCounter < safetyMaxFights) {
      const planFights = Math.ceil(remaining / 2)
      message.info(`竞技场补齐 第${round}轮：计划战斗 ${planFights} 场（估算每胜+2）`)

      for (let i = 0; i < planFights && safetyCounter < safetyMaxFights; i++) {
        // 获取目标（尝试不刷新，失败再刷新）
        let targets
        try {
          targets = await tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', { refresh: false }, 8000)
        } catch (e) {
          try {
            targets = await tokenStore.sendMessageWithPromise(tokenId, 'arena_getareatarget', { refresh: true }, 8000)
          } catch (e2) {
            message.error(`获取竞技场目标失败：${e2.message}`)
            break
          }
        }

        const targetId = targets?.roleList?.[0]?.roleId || targets?.targets?.[0]?.roleId || targets?.targets?.[0]?.id
        if (!targetId) {
          message.warning('未找到可用的竞技场目标，已停止此轮')
          break
        }

        try {
          await tokenStore.sendMessageWithPromise(tokenId, 'fight_startareaarena', { targetId }, 15000)
        } catch (e) {
          message.error(`竞技场对决失败：${e.message}`)
          // 失败也计入一次（至少+1），继续
        }

        safetyCounter++
        await new Promise(r => setTimeout(r, 1200))
      }

      // 校准一次
      await fetchMonthlyActivity()
      const cur = arenaNum.value
      remaining = Math.max(0, shouldBe - cur)
      round++
    }

    if (arenaNum.value >= shouldBe || arenaNum.value >= target) {
      message.success('竞技场补齐完成')
    } else if (safetyCounter >= safetyMaxFights) {
      message.warning('达到安全上限，已停止竞技场补齐')
    } else {
      message.warning('竞技场补齐已停止，未达到目标')
    }
  } finally {
    arenaToppingUp.value = false
  }
}


// 计算属性
const roleInfo = computed(() => {
  return tokenStore.gameData?.roleInfo || null
})

// WebSocket连接状态
const isConnected = computed(() => {
  if (!tokenStore.selectedToken) return false
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id)
  return status === 'connected'
})

// 格式化时间 - 确保显示到秒
const formatTime = (seconds) => {
  // 确保传入值为数字，并向下取整到秒
  const totalSeconds = Math.floor(Number(seconds) || 0)
  
  if (totalSeconds <= 0) return '00:00:00'
  
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 更新数据
const updateGameStatus = () => {
  if (!roleInfo.value) return

  const role = roleInfo.value.role

  // 更新盐罐机器人状态
  if (role.bottleHelpers) {
    const now = Date.now() / 1000
    bottleHelper.value.stopTime = role.bottleHelpers.helperStopTime
    bottleHelper.value.isRunning = role.bottleHelpers.helperStopTime > now
    // 确保剩余时间为整数秒
    bottleHelper.value.remainingTime = Math.max(0, Math.floor(role.bottleHelpers.helperStopTime - now))
    // 控制台精简，避免频繁刷屏
  }

  // 更新挂机状态
  if (role.hangUp) {
    const now = Date.now() / 1000
    hangUp.value.lastTime = role.hangUp.lastTime
    hangUp.value.hangUpTime = role.hangUp.hangUpTime
    
    const elapsed = now - hangUp.value.lastTime
    if (elapsed <= hangUp.value.hangUpTime) {
      // 确保剩余时间为整数秒
      hangUp.value.remainingTime = Math.floor(hangUp.value.hangUpTime - elapsed)
      hangUp.value.isActive = true
    } else {
      hangUp.value.remainingTime = 0
      hangUp.value.isActive = false
    }
    // 确保已挂机时间为整数秒
    hangUp.value.elapsedTime = Math.floor(hangUp.value.hangUpTime - hangUp.value.remainingTime)
    // 控制台精简
  }

  // 更新俱乐部排位状态
  if (role.statistics) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime() / 1000
    
    legionMatch.value.isRegistered = 
      Number(role.statistics['last:legion:match:sign:up:time']) > todayTimestamp
  }

  // 更新俱乐部签到状态
  if (role.statisticsTime) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime() / 1000
    
    legionSignin.value.isSignedIn = 
      role.statisticsTime['legion:sign:in'] > todayTimestamp
  }

}

// 定时器更新
let timer = null
const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    // 更新盐罐机器人剩余时间
    if (bottleHelper.value.isRunning && bottleHelper.value.remainingTime > 0) {
      bottleHelper.value.remainingTime = Math.max(0, bottleHelper.value.remainingTime - 1)
      if (bottleHelper.value.remainingTime <= 0) {
        bottleHelper.value.isRunning = false
      }
    }
    
    // 更新挂机剩余时间
    if (hangUp.value.isActive && hangUp.value.remainingTime > 0) {
      hangUp.value.remainingTime = Math.max(0, hangUp.value.remainingTime - 1)
      hangUp.value.elapsedTime = hangUp.value.elapsedTime + 1
      if (hangUp.value.remainingTime <= 0) {
        hangUp.value.isActive = false
      }
    }
  }, 1000)
}

// 盐罐机器人操作
const handleBottleHelper = () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }

  const tokenId = tokenStore.selectedToken.id
  
  // 停止后重启
  tokenStore.sendMessage(tokenId, 'bottlehelper_stop')
  setTimeout(() => {
    tokenStore.sendMessage(tokenId, 'bottlehelper_start')
    tokenStore.sendMessage(tokenId, 'role_getroleinfo')
  }, 500)
  
  message.info(bottleHelper.value.isRunning ? '重启盐罐机器人' : '启动盐罐机器人')
}

// 挂机操作 - 参考HangUpStatus逻辑优化
const extendHangUp = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  
  const tokenId = tokenStore.selectedToken.id
  
  try {
    // 降噪
    hangUp.value.isExtending = true
    message.info('正在加钟...')
    
    // 按照参考代码的逻辑，发送4次分享回调请求
    const promises = []
    for (let i = 0; i < 4; i++) {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          // 降噪
          const result = tokenStore.sendMessage(tokenId, 'system_mysharecallback', {
            isSkipShareCard: true,
            type: 2
          })
          resolve(result)
        }, i * 300) // 增加间隔时间确保稳定性
      })
      promises.push(promise)
    }
    
    // 等待所有请求完成
    await Promise.all(promises)
    
    // 降噪
    
    // 延迟获取最新角色信息
    setTimeout(() => {
      // 降噪
      tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    }, 1500)
    
    // 延迟显示完成消息和重置状态
    setTimeout(() => {
      message.success('加钟操作已完成，请查看挂机剩余时间')
      hangUp.value.isExtending = false
    }, 2500)
    
  } catch (error) {
    console.error('🕐 加钟操作失败:', error)
    message.error('加钟操作失败: ' + (error.message || '未知错误'))
    hangUp.value.isExtending = false
  }
}

const claimHangUpReward = async () => {
  if (!tokenStore.selectedToken) {
    message.warning('请先选择Token')
    return
  }
  
  const tokenId = tokenStore.selectedToken.id
  
  try {
    // 降噪
    hangUp.value.isClaiming = true
    message.info('正在领取挂机奖励...')
    
    // 参考HangUpStatus的S函数逻辑
    // 1. 发送初始分享回调
    tokenStore.sendMessage(tokenId, 'system_mysharecallback')
    
    // 2. 领取挂机奖励
    setTimeout(() => {
      tokenStore.sendMessage(tokenId, 'system_claimhangupreward')
    }, 200)
    
    // 3. 发送跳过分享卡片的回调
    setTimeout(() => {
      tokenStore.sendMessage(tokenId, 'system_mysharecallback', {
        isSkipShareCard: true,
        type: 2
      })
    }, 400)
    
    // 4. 获取最新角色信息
    setTimeout(() => {
      tokenStore.sendMessage(tokenId, 'role_getroleinfo')
    }, 600)
    
    // 5. 显示完成消息并重置状态
    setTimeout(() => {
      message.success('挂机奖励领取完成')
      hangUp.value.isClaiming = false
    }, 1200)
    
    // 降噪
    
  } catch (error) {
    console.error('🎁 领取挂机奖励失败:', error)
    message.error('领取挂机奖励失败: ' + (error.message || '未知错误'))
    hangUp.value.isClaiming = false
  }
}

// 俱乐部排位报名
const registerLegionMatch = () => {
  if (!tokenStore.selectedToken || legionMatch.value.isRegistered) return
  
  const tokenId = tokenStore.selectedToken.id
  tokenStore.sendMessage(tokenId, 'legionmatch_rolesignup')
  
  message.info('报名俱乐部排位')
}

// 俱乐部签到
const signInLegion = () => {
  if (!tokenStore.selectedToken || legionSignin.value.isSignedIn) return

  const tokenId = tokenStore.selectedToken.id
  tokenStore.sendMessage(tokenId, 'legion_signin')
  tokenStore.sendMessage(tokenId, 'role_getroleinfo')

  message.info('俱乐部签到')
}

// 处理盐场战绩按钮点击
const handleBattleRecordsClick = () => {
  console.log('点击盐场战绩按钮, isConnected:', isConnected.value)
  showBattleRecords.value = true
}

// 学习答题
const startStudy = async () => {
  if (!tokenStore.selectedToken || study.value.isAnswering) return
  
  // 检查是否已完成
  if (study.value.isCompleted) {
    message.success('✅ 咸鱼大冲关任务已完成，无需重复作答！')
    return
  }
  
  try {
    // 确保答题数据已加载
    await preloadQuestions()
    const questionCount = await getQuestionCount()
    
    // 通过 tokenStore 重置状态
    tokenStore.gameData.studyStatus = {
      ...tokenStore.gameData.studyStatus, // 保留isCompleted等状态
      isAnswering: true,
      questionCount: 0,
      answeredCount: 0,
      status: 'starting',
      timestamp: Date.now()
    }
    
    const tokenId = tokenStore.selectedToken.id
    tokenStore.sendMessage(tokenId, 'study_startgame')
    
    // 设置超时保护，最多30秒后自动重置
    setTimeout(() => {
      if (tokenStore.gameData.studyStatus.isAnswering) {
        tokenStore.gameData.studyStatus = {
          ...tokenStore.gameData.studyStatus, // 保留isCompleted等状态
          isAnswering: false,
          questionCount: 0,
          answeredCount: 0,
          status: '',
          timestamp: null
        }
        message.warning('答题超时，已自动重置状态')
      }
    }, 30000)
    
    message.info(`🚀 开始一键答题... (题库包含 ${questionCount} 道题目)`)
  } catch (error) {
    console.error('启动答题失败:', error)
    message.error('启动答题失败: ' + error.message)
  }
}


// 监听角色信息变化
watch(roleInfo, (newValue) => {
  if (newValue) {
    updateGameStatus()
  }
}, { deep: true, immediate: true })

// 监听 WebSocket 连接状态，连接成功后获取月度任务数据（仅触发一次）
const hasFetchedMonthlyOnce = ref(false)
watch(
  () => tokenStore.selectedToken ? tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) : 'disconnected',
  (status) => {
    if (status === 'connected' && !hasFetchedMonthlyOnce.value) {
      hasFetchedMonthlyOnce.value = true
      fetchMonthlyActivity()
    }
  }
)

// 监听战绩弹窗打开，自动加载数据
watch(showBattleRecords, (newVal) => {
  if (newVal && battleRecordsRef.value) {
    // 延迟执行，确保弹窗已经完全打开
    nextTick(() => {
      battleRecordsRef.value.fetchBattleRecords()
    })
  }
})

// 生命周期
onMounted(() => {
  updateGameStatus()
  startTimer()
  // 拉取一次月度任务数据
  // 如果已连接，拉取一次月度任务数据
  if (tokenStore.selectedToken && tokenStore.getWebSocketStatus(tokenStore.selectedToken.id) === 'connected') {
    fetchMonthlyActivity()
  }
  
  // 预加载答题数据
  preloadQuestions().then(() => {
    // 降噪
  }).catch(error => {
    console.error('❌ 答题数据预加载失败:', error)
  })
  
  // 获取俱乐部信息
  if (tokenStore.selectedToken) {
    const tokenId = tokenStore.selectedToken.id
    tokenStore.sendMessage(tokenId, 'legion_getinfo')
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.game-status-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);

  // 在大屏幕上限制最大列数以确保卡片有足够宽度
  @media (min-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
    max-width: 1400px;
    margin: 0 auto;
  }

  // 在中等屏幕上确保有足够空间
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  }

  // 在较小屏幕上使用单列布局
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
}

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
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.status-icon {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.status-info {
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

.status-badge {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  background: rgba(156, 163, 175, 0.1);
  color: var(--text-secondary);

  &.active {
    background: rgba(34, 197, 94, 0.1);
    color: var(--success-color);
  }

  &.weekly {
    background: rgba(59, 130, 246, 0.1);
    color: var(--info-color);
  }

  &.energy {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning-color);
  }

  &.completed {
    background: rgba(34, 197, 94, 0.15);
    color: var(--success-color);
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
}

.monthly-tasks .description.muted {
  color: var(--text-tertiary);
  margin-top: var(--spacing-sm);
}

.monthly-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;

  &.completed {
    background: var(--success-color);
    box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  }
}

.energy-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.card-content {
  .time-display {
    font-size: 1.5rem; /* text-2xl */
    font-weight: 700; /* font-bold */
    color: var(--text-primary);
    text-align: center;
    margin-bottom: var(--spacing-md);
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
    letter-spacing: 0.1em;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    background: var(--bg-tertiary);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease-in-out;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
    }
  }

  .description {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    margin-bottom: var(--spacing-lg);
  }

  .club-name {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-bottom: var(--spacing-lg);

    strong {
      color: var(--text-primary);
      font-weight: var(--font-weight-medium);
    }
  }

  .tower-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);

    .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
    }

    .tower-level {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--text-primary);
    }
  }
}

.action-button {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--border-radius-medium);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  background: var(--primary-color);
  color: white;

  &:hover:not(:disabled) {
    background: var(--primary-color-hover);
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
    cursor: not-allowed;
  }

  &.secondary {
    background: var(--secondary-color);
    
    &:hover:not(:disabled) {
      background: var(--secondary-color-hover);
    }
  }

  &.active {
    background: var(--info-color);
    
    &:hover {
      background: var(--info-color-hover);
    }
  }

  &.completed {
    background: var(--success-color);
    color: white;
    border: 1px solid rgba(34, 197, 94, 0.3);
    
    &:hover {
      background: var(--success-color);
      transform: none;
      cursor: default;
    }
    
    &:disabled {
      background: var(--success-color);
      color: white;
      opacity: 0.9;
    }
  }
}

.action-row {
  display: flex;
  gap: var(--spacing-sm);

  .action-button {
    flex: 1;
  }
}

.loading-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
}

.loading-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// 响应式设计
@media (max-width: 768px) {
  .game-status-container {
    grid-template-columns: 1fr;
    padding: var(--spacing-md);
  }

  .status-card {
    padding: var(--spacing-md);
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}
</style>

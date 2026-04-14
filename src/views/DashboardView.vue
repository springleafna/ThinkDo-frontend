<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { Badge } from '@/components/ui/badge'
import {
  CalendarCheck,
  StickyNote,
  BookText,
  TrendingUp,
  CheckCircle2,
  Clock,
  Plus,
  PenTool,
  Check
} from 'lucide-vue-next'
import { memoApi, type Memo } from '@/api/memo'
import { noteApi } from '@/api/note'
import type { NoteListItem } from '@/api/note'
import { planApi, type Plan } from '@/api/plan'
import { planExecutionApi, type PlanExecution } from '@/api/planExecution'
import { knowledgeBaseApi, type KnowledgeStatistics } from '@/api/knowledgeBase'
import { Database, FileText } from 'lucide-vue-next'

const router = useRouter()
const isSidebarOpen = ref(true)
const activeView = ref('dashboard')

// 最新便签数据
const latestMemos = ref<Memo[]>([])
const memosLoading = ref(true)

// 计划数据
const plans = ref<Plan[]>([])
const plansLoading = ref(true)

// 每日清单数据
const dailyTasks = ref<PlanExecution[]>([])
const dailyTasksLoading = ref(true)

// 知识库统计数据
const knowledgeStats = ref<KnowledgeStatistics>({ baseCount: 0, documentCount: 0 })
const knowledgeStatsLoading = ref(true)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 获取最新便签
const fetchLatestMemos = async () => {
  try {
    memosLoading.value = true
    const res = await memoApi.getLatestMemos()
    latestMemos.value = (res || []).map(memo => ({
      ...memo,
      backgroundColor: memo.backgroundColor || '#fef9e3' // 默认黄色
    }))
  } catch (error) {
    console.error('获取最新便签失败:', error)
    latestMemos.value = []
  } finally {
    memosLoading.value = false
  }
}

const fetchRecentNotes = async () => {
  try {
    const res = await noteApi.getRecentNotes()
    insightNotes.value = res || []
  } catch (error) {
    console.error('获取最近笔记失败:', error)
    insightNotes.value = []
  }
}

// 获取最近计划
const fetchRecentPlans = async () => {
  try {
    plansLoading.value = true
    const res = await planApi.getRecentPlans()
    plans.value = res || []
  } catch (error) {
    console.error('获取最近计划失败:', error)
    plans.value = []
  } finally {
    plansLoading.value = false
  }
}

// 获取今日每日清单
const fetchTodayTasks = async () => {
  try {
    dailyTasksLoading.value = true
    const res = await planExecutionApi.getTodayList()
    dailyTasks.value = res || []
  } catch (error) {
    console.error('获取今日清单失败:', error)
    dailyTasks.value = []
  } finally {
    dailyTasksLoading.value = false
  }
}

// 获取知识库统计数据
const fetchKnowledgeStats = async () => {
  try {
    knowledgeStatsLoading.value = true
    const res = await knowledgeBaseApi.getStatistics()
    knowledgeStats.value = res || { baseCount: 0, documentCount: 0 }
  } catch (error) {
    console.error('获取知识库统计失败:', error)
    knowledgeStats.value = { baseCount: 0, documentCount: 0 }
  } finally {
    knowledgeStatsLoading.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchLatestMemos()
  fetchRecentNotes()
  fetchRecentPlans()
  fetchTodayTasks()
  fetchKnowledgeStats()
})

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hour}:${minute}`
}

// 根据便签背景色获取卡片样式类
const getCardStyleClass = (backgroundColor: string) => {
  const colorMap: Record<string, { bg: string; icon: string; text: string; tag: string; dot: string }> = {
    // Amber/Yellow colors
    '#fef3c7': { bg: 'bg-amber-100/40', icon: 'text-amber-600', text: 'text-amber-900', tag: '#IDEA', dot: 'bg-amber-600' },
    '#fef9e3': { bg: 'bg-amber-100/40', icon: 'text-amber-600', text: 'text-amber-900', tag: '#IDEA', dot: 'bg-amber-600' },
    '#fef08a': { bg: 'bg-amber-100/40', icon: 'text-amber-600', text: 'text-amber-900', tag: '#IDEA', dot: 'bg-amber-600' },
    // Rose/Red colors
    '#fee2e2': { bg: 'bg-rose-100/40', icon: 'text-rose-600', text: 'text-rose-900', tag: '#REMINDER', dot: 'bg-rose-600' },
    '#fecaca': { bg: 'bg-rose-100/40', icon: 'text-rose-600', text: 'text-rose-900', tag: '#REMINDER', dot: 'bg-rose-600' },
    '#fff1f2': { bg: 'bg-rose-100/40', icon: 'text-rose-600', text: 'text-rose-900', tag: '#REMINDER', dot: 'bg-rose-600' },
    // Emerald/Green colors
    '#dcfce7': { bg: 'bg-emerald-100/40', icon: 'text-emerald-600', text: 'text-emerald-900', tag: '#TASK', dot: 'bg-emerald-600' },
    '#bbf7d0': { bg: 'bg-emerald-100/40', icon: 'text-emerald-600', text: 'text-emerald-900', tag: '#TASK', dot: 'bg-emerald-600' },
    '#e8fcf2': { bg: 'bg-emerald-100/40', icon: 'text-emerald-600', text: 'text-emerald-900', tag: '#TASK', dot: 'bg-emerald-600' },
    // Sky/Blue colors
    '#e0f2fe': { bg: 'bg-sky-100/40', icon: 'text-sky-600', text: 'text-sky-900', tag: '#NOTE', dot: 'bg-sky-600' },
    '#f4f8fe': { bg: 'bg-sky-100/40', icon: 'text-sky-600', text: 'text-sky-900', tag: '#NOTE', dot: 'bg-sky-600' },
    '#bae6fd': { bg: 'bg-sky-100/40', icon: 'text-sky-600', text: 'text-sky-900', tag: '#NOTE', dot: 'bg-sky-600' },
    // Purple colors
    '#f3e8ff': { bg: 'bg-purple-100/40', icon: 'text-purple-600', text: 'text-purple-900', tag: '#THOUGHT', dot: 'bg-purple-600' },
    '#e9d5ff': { bg: 'bg-purple-100/40', icon: 'text-purple-600', text: 'text-purple-900', tag: '#THOUGHT', dot: 'bg-purple-600' },
    '#f9f3ff': { bg: 'bg-purple-100/40', icon: 'text-purple-600', text: 'text-purple-900', tag: '#THOUGHT', dot: 'bg-purple-600' },
  }

  // 如果没有匹配到，使用默认的 zinc 样式
  return colorMap[backgroundColor] || {
    bg: 'bg-zinc-100/40',
    icon: 'text-zinc-600',
    text: 'text-zinc-900',
    tag: '#MEMO',
    dot: 'bg-zinc-600'
  }
}

// 获取图标组件
const getIconComponent = (backgroundColor: string) => {
  const iconMap: Record<string, any> = {
    // Amber/Yellow - 想法
    '#fef3c7': TrendingUp,
    '#fef9e3': TrendingUp,
    '#fef08a': TrendingUp,
    // Rose/Red - 提醒
    '#fee2e2': Clock,
    '#fecaca': Clock,
    // Emerald/Green - 任务
    '#dcfce7': CheckCircle2,
    '#bbf7d0': CheckCircle2,
    // Sky/Blue - 笔记
    '#e0f2fe': StickyNote,
    '#f4f8fe': StickyNote,
    '#bae6fd': StickyNote,
    // Purple - 思考
    '#f3e8ff': StickyNote,
    '#e9d5ff': StickyNote,
  }
  return iconMap[backgroundColor] || StickyNote
}

// 思维笔记数据
const insightNotes = ref<NoteListItem[]>([])

// 新任务输入
const newTaskInput = ref('')

// 添加新任务
const addNewTask = async () => {
  if (newTaskInput.value.trim()) {
    try {
      const today = new Date().toISOString().split('T')[0] as string
      await planExecutionApi.create({
        title: newTaskInput.value,
        executeDate: today
      })
      newTaskInput.value = ''
      await fetchTodayTasks()
    } catch (error) {
      console.error('添加任务失败:', error)
    }
  }
}

// 切换任务完成状态
const toggleTask = async (id: number) => {
  try {
    await planExecutionApi.toggleStatus(id)
    await fetchTodayTasks()
  } catch (error) {
    console.error('切换任务状态失败:', error)
  }
}

// 计算计划进度（使用后端返回的真实进度）
const getPlanProgress = (plan: Plan) => {
  // 如果后端返回了进度，使用后端进度
  if (plan.progress !== undefined && plan.progress !== null) {
    return plan.progress
  }
  // 如果没有步骤进度，根据计划状态返回
  return plan.status === 1 ? 100 : 0
}

// 获取计划颜色
const getPlanColor = (plan: Plan) => {
  if (plan.priority === 3) return 'zinc'
  if (plan.quadrant === 1) return 'amber'
  return 'zinc'
}

// 获取计划标签
const getPlanTag = (plan: Plan) => {
  if (plan.categoryName) return plan.categoryName.toUpperCase()
  if (plan.priority === 3) return 'HIGH PRIORITY'
  return 'ACTIVE'
}

// 格式化任务时间
const formatTaskTime = (task: PlanExecution) => {
  if (task.startTime) {
    const start = new Date(task.startTime)
    const end = task.dueTime ? new Date(task.dueTime) : null
    const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
    if (end) {
      const endTimeStr = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`
      return `${startTimeStr} - ${endTimeStr}`
    }
    return startTimeStr
  }
  return ''
}

// 检查任务是否已完成
const isTaskCompleted = (task: PlanExecution) => {
  return task.status === 1
}

// 导航到计划页面
const navigateToPlans = () => {
  router.push('/plan')
}

// 导航到笔记页面
const navigateToNotes = () => {
  router.push('/notes')
}

// 导航到便签页面
const navigateToMemos = () => {
  router.push('/memo')
}

// 当前日期
const currentDate = computed(() => {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  return `${month}月${day}日`
})

const placeholderCount = computed(() => Math.max(0, 2 - insightNotes.value.length))
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto p-8 md:p-12 pt-8 custom-scrollbar relative z-10">
        <!-- Dashboard View -->
        <div v-if="activeView === 'dashboard'" class="max-w-7xl mx-auto space-y-12 pb-12">
          <div class="dashboard-grid items-start">

            <!-- Left Column (Plans & Notes) - Span 8 -->
            <section class="col-span-12 lg:col-span-8 space-y-6 section-reveal" style="animation-delay: 0.2s">

              <!-- Plans Section -->
              <div class="woven-border bg-white p-6 rounded-[2rem] relative overflow-hidden group card-hover shadow-sm">
                <div class="flex justify-between items-start mb-6">
                  <div>
                    <h2 class="text-xl font-medium tracking-tight mb-1 text-neutral-900">我的计划</h2>
                  </div>
                  <button
                    @click="navigateToPlans"
                    class="p-2 hover:bg-black/5 rounded-full transition-colors text-neutral-400"
                  >
                    <Plus :size="20" />
                  </button>
                </div>

                <div class="space-y-8 relative">
                  <div class="absolute left-[7px] top-2 bottom-2 w-[1px] bg-black/5"></div>

                  <!-- 空状态 -->
                  <div v-if="plans.length === 0 && !plansLoading" class="relative pl-8">
                    <p class="text-sm text-neutral-400 italic">暂时还没有计划，点击右上角的 + 按钮创建一个吧！</p>
                  </div>

                  <!-- 加载状态 -->
                  <div v-if="plansLoading" class="relative pl-8 space-y-4">
                    <div v-for="i in 2" :key="i" class="animate-pulse">
                      <div class="h-4 bg-stone-100 rounded w-1/3 mb-2"></div>
                      <div class="h-3 bg-stone-100 rounded w-full"></div>
                    </div>
                  </div>

                  <!-- 计划列表 -->
                  <div v-for="plan in plans" :key="plan.id" class="relative pl-8 group/item">
                    <div
                      class="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-4 border-white z-10 shadow-sm"
                      :class="getPlanColor(plan) === 'zinc' ? 'bg-zinc-900' : 'bg-amber-500'"
                    ></div>
                    <div class="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <span
                        class="mono text-[10px] px-2 py-0.5 rounded-md self-start"
                        :class="getPlanColor(plan) === 'zinc' ? 'bg-zinc-100 text-zinc-600' : 'bg-amber-50 text-amber-700'"
                      >
                        {{ getPlanTag(plan) }}
                      </span>
                      <h3 class="text-base font-medium text-neutral-900">{{ plan.title }}</h3>
                    </div>
                    <div class="w-full bg-black/5 h-[4px] rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-1000"
                        :class="getPlanColor(plan) === 'zinc' ? 'bg-zinc-900' : 'bg-amber-500'"
                        :style="{ width: getPlanProgress(plan) + '%' }"
                      ></div>
                    </div>
                    <div class="mt-2">
                      <span class="text-[10px] opacity-40 mono">{{ getPlanProgress(plan) }}% COMPLETED</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notes Section -->
              <div
                class="woven-border bg-[#18181b] text-white p-6 rounded-[2rem] card-hover relative group cursor-pointer shadow-lg overflow-hidden"
                @click="navigateToNotes"
              >
                <div class="flex justify-between items-center mb-6 relative z-10">
                  <div class="flex items-center gap-3">
                    <PenTool class="w-5 h-5 opacity-60 text-zinc-400" />
                    <h2 class="text-lg font-light tracking-wide italic">思维笔记</h2>
                  </div>
                </div>

                <!-- 笔记列表 -->
                <div class="space-y-6 relative z-10">
                  <div
                    v-if="insightNotes.length === 0"
                    class="absolute inset-0 flex items-center justify-center text-center"
                  >
                    <p class="text-base md:text-lg text-white/60 italic">您还没有创建笔记</p>
                  </div>
                  <div
                    v-for="(note, index) in insightNotes"
                    :key="note.id"
                    :class="index < insightNotes.length - 1 ? 'border-b border-white/5 pb-6' : 'pb-2'"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <h4 class="text-sm font-medium group-hover:text-zinc-300 transition-colors">
                        {{ note.title }}
                      </h4>
                      <Badge
                        v-if="note.categoryName"
                        variant="secondary"
                        class="text-[10px] px-2 py-0 h-auto bg-white/10 text-white/80 hover:bg-white/20"
                      >
                        {{ note.categoryName }}
                      </Badge>
                    </div>
                    <p class="text-xs text-white/40 leading-relaxed line-clamp-2">
                      {{ note.preview && note.preview.trim() ? note.preview : '暂无内容' }}
                    </p>
                    <p v-if="note.updatedAt" class="text-[10px] text-white/20 mono mt-2">
                      {{ formatDate(note.updatedAt) }}
                    </p>
                  </div>

                  <div
                    v-for="i in placeholderCount"
                    :key="'placeholder-' + i"
                    :class="(i < placeholderCount) ? 'border-b border-white/5 pb-6' : 'pb-2'"
                    class="opacity-0"
                  >
                    <div class="flex items-center gap-2 mb-2">
                      <h4 class="text-sm font-medium">—</h4>
                    </div>
                    <p class="text-xs leading-relaxed line-clamp-2">—</p>
                    <p class="text-[10px] mono mt-2">—</p>
                  </div>
                </div>

                <div class="absolute -bottom-4 -right-4 opacity-5 pointer-events-none transform rotate-12">
                  <BookText :size="180" />
                </div>
              </div>
            </section>

            <!-- Right Column -->
            <section class="col-span-12 lg:col-span-4 space-y-6 section-reveal" style="animation-delay: 0.3s">
              <!-- Knowledge Statistics -->
              <div class="woven-border bg-white p-5 rounded-[2rem] card-hover shadow-sm">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="font-medium text-sm tracking-tight text-neutral-900">知识库</h2>
                  <a href="/knowledge-base" class="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors">查看全部</a>
                </div>

                <div v-if="knowledgeStatsLoading" class="flex items-center gap-4">
                  <div class="animate-pulse">
                    <div class="w-12 h-12 bg-stone-100 rounded-xl"></div>
                  </div>
                  <div class="flex-1 space-y-2">
                    <div class="h-3 bg-stone-100 rounded w-20"></div>
                    <div class="h-2 bg-stone-100 rounded w-16"></div>
                  </div>
                </div>

                <div v-else class="grid grid-cols-2 gap-3">
                  <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100/50">
                    <div class="flex items-center gap-2 mb-2">
                      <Database class="w-4 h-4 text-blue-600" />
                      <span class="text-[10px] text-blue-600/80 font-medium">知识库</span>
                    </div>
                    <p class="text-2xl font-semibold text-blue-900">{{ knowledgeStats.baseCount }} <span class="text-sm font-normal">个</span></p>
                  </div>

                  <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100/50">
                    <div class="flex items-center gap-2 mb-2">
                      <FileText class="w-4 h-4 text-emerald-600" />
                      <span class="text-[10px] text-emerald-600/80 font-medium">文档</span>
                    </div>
                    <p class="text-2xl font-semibold text-emerald-900">{{ knowledgeStats.documentCount }} <span class="text-sm font-normal">个</span></p>
                  </div>
                </div>
              </div>

              <!-- Daily Tasks -->
              <div class="woven-border bg-white p-6 rounded-[2rem] card-hover flex flex-col h-[260px] shadow-sm">
                <div class="flex items-center justify-between mb-8">
                  <h2 class="font-medium text-base tracking-tight text-neutral-900">每日清单</h2>
                  <span class="mono text-[10px] bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest">
                    {{ currentDate }}
                  </span>
                </div>

                <div class="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-2">
                  <!-- 空状态 -->
                  <div v-if="dailyTasks.length === 0 && !dailyTasksLoading" class="flex flex-col items-center justify-center h-full text-center">
                    <CalendarCheck class="w-8 h-8 text-stone-300 mb-2" />
                    <p class="text-xs text-stone-400 italic">今天还没有任务，快来添加一个吧！</p>
                  </div>

                  <!-- 加载状态 -->
                  <div v-if="dailyTasksLoading" class="space-y-2.5">
                    <div v-for="i in 3" :key="i" class="flex items-start gap-4 p-3 bg-stone-50 rounded-2xl animate-pulse">
                      <div class="w-4.5 h-4.5 rounded-md border border-black/10 bg-stone-200"></div>
                      <div class="flex-1 space-y-2">
                        <div class="h-3 bg-stone-200 rounded w-3/4"></div>
                        <div class="h-2 bg-stone-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>

                  <!-- 任务列表 -->
                  <div
                    v-for="task in dailyTasks"
                    :key="task.id"
                    class="flex items-start gap-4 p-3 bg-stone-50 rounded-2xl group cursor-pointer border border-transparent hover:border-black/5 transition-all"
                    @click="toggleTask(task.id)"
                  >
                    <div
                      class="mt-0.5 w-4.5 h-4.5 rounded-md border border-black/10 flex items-center justify-center transition-all"
                      :class="isTaskCompleted(task) ? 'bg-black border-black' : 'bg-white group-hover:border-zinc-500'"
                    >
                      <Check
                        :size="12"
                        class="text-white transition-transform"
                        :class="isTaskCompleted(task) ? 'scale-100' : 'scale-0 group-hover:scale-100'"
                      />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p
                        class="text-sm font-medium leading-tight truncate"
                        :class="isTaskCompleted(task) ? 'line-through opacity-30' : 'text-neutral-900'"
                      >
                        {{ task.planTitle }}
                      </p>
                      <p class="text-[10px] opacity-40 mono mt-0.5">
                        {{ formatTaskTime(task) }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-black/5">
                  <input
                    v-model="newTaskInput"
                    @keyup.enter="addNewTask"
                    type="text"
                    placeholder="+ 快速添加..."
                    class="w-full bg-transparent text-sm focus:outline-none opacity-40 focus:opacity-100 transition-opacity italic px-1"
                  />
                </div>
              </div>

              <!-- Memo Cards -->
              <div v-if="memosLoading" class="grid grid-cols-2 gap-4">
                <!-- 加载占位 -->
                <div v-for="i in 2" :key="i" class="bg-stone-50 p-5 rounded-2xl woven-border flex flex-col justify-between h-36 shadow-sm animate-pulse">
                  <div class="w-4 h-4 bg-stone-200 rounded mb-2"></div>
                  <div class="space-y-2">
                    <div class="h-3 bg-stone-200 rounded w-3/4"></div>
                    <div class="h-3 bg-stone-200 rounded w-1/2"></div>
                  </div>
                  <div class="h-3 bg-stone-200 rounded w-1/4"></div>
                </div>
              </div>

              <div v-else-if="latestMemos.length === 0" class="grid grid-cols-2 gap-4">
                <!-- 空状态 -->
                <div class="col-span-2 bg-stone-50 p-8 rounded-2xl woven-border flex flex-col items-center justify-center h-36 shadow-sm">
                  <StickyNote class="w-8 h-8 text-stone-300 mb-2" />
                  <p class="text-xs text-stone-400 italic">您还没有记录便签哦~</p>
                </div>
              </div>

              <div v-else class="grid grid-cols-2 gap-4">
                <div
                  v-for="memo in latestMemos.slice(0, 2)"
                  :key="memo.id"
                  :class="['p-5 rounded-2xl woven-border card-hover flex flex-col justify-between h-36 shadow-sm cursor-pointer group hover:shadow-md transition-all', getCardStyleClass(memo.backgroundColor).bg]"
                  @click="navigateToMemos"
                >
                  <div class="flex items-start justify-between mb-2">
                    <component
                      :is="getIconComponent(memo.backgroundColor)"
                      :class="['w-4 h-4 flex-shrink-0', getCardStyleClass(memo.backgroundColor).icon]"
                    />
                  </div>
                  <p :class="['text-[13px] font-medium leading-snug line-clamp-3 flex-1', getCardStyleClass(memo.backgroundColor).text]">
                    {{ memo.title || memo.content }}
                  </p>
                  <div class="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                    <span v-if="memo.tag" class="text-[10px] mono opacity-30">
                      {{ memo.tag }}
                    </span>
                    <div class="w-1.5 h-1.5 rounded-full opacity-30" :class="getCardStyleClass(memo.backgroundColor).dot"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <!-- Memo/Sticky View -->
        <div v-else-if="activeView === 'sticky'" class="section-reveal" style="animation-delay: 0.2s">
          <div class="mb-8">
            <h2 class="text-4xl font-light tracking-tight text-neutral-900 mb-2">灵感便签</h2>
            <p class="text-neutral-500">点击侧边栏的"灵感便签"跳转到完整便签页面</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="i in 3"
              :key="i"
              class="bg-white border border-black/5 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              @click="router.push('/memo')"
            >
              <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
                <StickyNote class="text-stone-400" />
              </div>
              <div class="h-4 bg-stone-100 rounded mb-3 w-3/4"></div>
              <div class="h-3 bg-stone-50 rounded w-1/2"></div>
              <p class="text-sm text-stone-400 mt-4">点击跳转到完整的便签管理页面</p>
            </div>
          </div>
        </div>

        <!-- Other Views Placeholder -->
        <div v-else class="section-reveal" style="animation-delay: 0.2s">
          <div class="mb-8">
            <h2 class="text-4xl font-light tracking-tight text-neutral-900 mb-2">
              {{ activeView }}
            </h2>
            <p class="text-neutral-500">此功能正在建设中...</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="i in 3"
              :key="i"
              class="bg-white border border-black/5 rounded-3xl p-8 shadow-sm"
            >
              <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
                <div class="w-6 h-6 bg-stone-200 rounded"></div>
              </div>
              <div class="h-4 bg-stone-100 rounded mb-3 w-3/4"></div>
              <div class="h-3 bg-stone-50 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@keyframes section-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-reveal {
  animation: section-reveal 0.8s ease-out forwards;
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.5rem;
}

.woven-border {
  position: relative;
}

.woven-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.02) 50%, rgba(0, 0, 0, 0.05) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
</style>

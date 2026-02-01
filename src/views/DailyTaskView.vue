<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import {
  Plus,
  Trash2,
  Edit3,
  Circle,
  Sparkles,
  Clock,
  AlertTriangle
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { planExecutionApi, type PlanExecution, type CreatePlanExecutionParams, type UpdatePlanExecutionParams } from '@/api/planExecution'

const layoutStore = useLayoutStore()
const activeView = ref('daily')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 任务数据接口
interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  startTime?: string
  dueTime?: string
  tags: string[]
}

// 状态
const tasks = ref<Task[]>([])
const loading = ref(false)

const showTaskModal = ref(false)
const showEditTaskDialog = ref(false)
const showDeleteDialog = ref(false)
const deletingTask = ref<Task | null>(null)
const editingTask = ref<Task | null>(null)
const newTask = ref({
  title: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  startTime: '',
  dueTime: '',
  tags: ''
})

const quickTaskInput = ref('')

// 计算属性
const completedCount = computed(() =>
  tasks.value.filter(t => t.completed).length
)

const totalCount = computed(() => tasks.value.length)

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

// 优先级映射函数
const mapPriorityToApi = (priority: 'low' | 'medium' | 'high'): number => {
  const map = { low: 1, medium: 2, high: 3 }
  return map[priority]
}

const mapPriorityFromApi = (priority: number): 'low' | 'medium' | 'high' => {
  const map: Record<number, 'low' | 'medium' | 'high'> = { 1: 'low', 2: 'medium', 3: 'high' }
  return map[priority] || 'medium'
}

// 将API数据转换为前端Task数据
const convertApiToTask = (apiData: PlanExecution): Task => {
  return {
    id: String(apiData.id),
    title: apiData.planTitle,
    completed: apiData.status === 1,
    priority: apiData.priority ? mapPriorityFromApi(apiData.priority) : 'medium',
    startTime: apiData.startTime,
    dueTime: apiData.dueTime,
    tags: apiData.tags ? apiData.tags.split(',').map(t => t.trim()).filter(t => t) : []
  }
}

// 加载今日每日清单
const loadTodayTasks = async () => {
  try {
    loading.value = true
    const data = await planExecutionApi.getTodayList()
    tasks.value = data.map(convertApiToTask)
  } catch (error) {
    console.error('加载每日清单失败', error)
    toast.error('加载每日清单失败')
  } finally {
    loading.value = false
  }
}

// 方法
const toggleTaskCompletion = async (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return

  // 立即更新本地状态
  const originalCompleted = task.completed
  task.completed = !task.completed

  try {
    await planExecutionApi.toggleStatus(parseInt(taskId))
    if (task.completed) {
      toast.success('任务已完成')
    }
  } catch (error) {
    console.error('切换任务状态失败', error)
    // 如果失败，恢复原状态
    task.completed = originalCompleted
    toast.error('切换任务状态失败')
  }
}

const addQuickTask = async () => {
  const title = quickTaskInput.value.trim()
  if (!title) {
    toast.error('请输入任务内容')
    return
  }

  try {
    // 获取今天的日期
    const today = new Date()
    const executeDate = today.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]!

    const params: CreatePlanExecutionParams = {
      title,
      priority: mapPriorityToApi('medium'),
      executeDate
    }

    await planExecutionApi.create(params)
    toast.success('任务已添加')
    quickTaskInput.value = ''

    // 重新加载列表
    await loadTodayTasks()
  } catch (error) {
    console.error('创建任务失败', error)
    toast.error('创建任务失败')
  }
}

const handleAddTask = async () => {
  if (!newTask.value.title.trim()) {
    toast.error('请输入任务标题')
    return
  }

  // 验证时间
  if (newTask.value.startTime && newTask.value.dueTime) {
    if (new Date(newTask.value.startTime) >= new Date(newTask.value.dueTime)) {
      toast.error('截止时间必须晚于开始时间')
      return
    }
  }

  try {
    // 获取今天的日期（本地格式）
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const executeDate = `${year}-${month}-${day}`

    const params: CreatePlanExecutionParams = {
      title: newTask.value.title,
      priority: mapPriorityToApi(newTask.value.priority),
      executeDate,
      startTime: newTask.value.startTime ? `${executeDate}T${newTask.value.startTime}:00` : undefined,
      dueTime: newTask.value.dueTime ? `${executeDate}T${newTask.value.dueTime}:00` : undefined,
      tags: newTask.value.tags || undefined
    }

    await planExecutionApi.create(params)
    toast.success('任务已创建')
    showTaskModal.value = false

    // 重置表单
    newTask.value = {
      title: '',
      priority: 'medium',
      startTime: '',
      dueTime: '',
      tags: ''
    }

    // 重新加载列表
    await loadTodayTasks()
  } catch (error) {
    console.error('创建任务失败', error)
    toast.error('创建任务失败')
  }
}

const startEditTask = (task: Task) => {
  editingTask.value = { ...task }
  showEditTaskDialog.value = true
}

// 将 tags 数组转换为逗号分隔的字符串用于编辑
const editingTaskTagsString = computed(() => {
  if (!editingTask.value) return ''
  return editingTask.value.tags.join(', ')
})

// 更新编辑任务的 tags
const updateEditingTaskTags = (value: string) => {
  if (editingTask.value) {
    editingTask.value.tags = value ? value.split(',').map(t => t.trim()).filter(t => t) : []
  }
}

const handleEditTask = async () => {
  if (!editingTask.value) return

  if (!editingTask.value.title.trim()) {
    toast.error('请输入任务标题')
    return
  }

  // 验证时间
  if (editingTask.value.startTime && editingTask.value.dueTime) {
    if (new Date(editingTask.value.startTime) >= new Date(editingTask.value.dueTime)) {
      toast.error('截止时间必须晚于开始时间')
      return
    }
  }

  try {
    // 获取今天的日期（本地格式）
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const executeDate = `${year}-${month}-${day}`

    // 处理时间格式：统一转换为本地时间的 ISO 格式（不带时区）
    const formatLocalTime = (timeStr?: string): string | undefined => {
      if (!timeStr) return undefined
      // 如果已经是完整的日期时间格式，保持不变
      if (timeStr.includes('T') && timeStr.includes(':')) {
        return timeStr
      }
      // 否则拼接日期和 HH:mm 格式的时间
      return `${executeDate}T${timeStr}:00`
    }

    const params: UpdatePlanExecutionParams = {
      id: parseInt(editingTask.value.id),
      title: editingTask.value.title,
      priority: mapPriorityToApi(editingTask.value.priority),
      startTime: formatLocalTime(editingTask.value.startTime),
      dueTime: formatLocalTime(editingTask.value.dueTime),
      tags: editingTask.value.tags.length > 0 ? editingTask.value.tags.join(', ') : undefined
    }

    await planExecutionApi.update(params)
    toast.success('任务已更新')
    showEditTaskDialog.value = false
    editingTask.value = null

    // 重新加载列表
    await loadTodayTasks()
  } catch (error) {
    console.error('更新任务失败', error)
    toast.error('更新任务失败')
  }
}

const deleteTask = async (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    deletingTask.value = task
    showDeleteDialog.value = true
  }
}

const confirmDelete = async () => {
  if (!deletingTask.value) return

  try {
    await planExecutionApi.delete(parseInt(deletingTask.value.id))
    toast.success('任务已删除')
    showDeleteDialog.value = false
    deletingTask.value = null
    await loadTodayTasks()
  } catch (error) {
    console.error('删除任务失败', error)
    toast.error('删除任务失败')
  }
}

const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  const colorMap = {
    low: 'bg-sky-100 text-sky-700 border-sky-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-rose-100 text-rose-700 border-rose-200'
  }
  return colorMap[priority]
}

const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
  const labelMap = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return labelMap[priority]
}

// 格式化时间显示
const formatTime = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return ''
  try {
    const date = new Date(dateTimeStr)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

// 将ISO时间字符串转换为time input需要的格式(HH:mm)
const formatTimeForInput = (dateTimeStr?: string): string => {
  if (!dateTimeStr) return ''
  try {
    // 如果已经是 HH:mm 格式，直接返回
    if (dateTimeStr.match(/^\d{2}:\d{2}$/)) {
      return dateTimeStr
    }
    // 处理 ISO 格式的时间字符串
    const date = new Date(dateTimeStr)
    if (isNaN(date.getTime())) return ''
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } catch (e) {
    return ''
  }
}

// 初始化
onMounted(() => {
  loadTodayTasks()
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto p-8 md:p-12 pt-8 custom-scrollbar relative z-10">
        <div class="max-w-7xl mx-auto space-y-10 pb-12 section-reveal">
          <!-- 头部 -->
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 class="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">每日清单</h1>
              <p class="text-sm text-neutral-400 mt-1 italic">专注当下，高效完成每一天。</p>
            </div>
            <div class="flex items-center gap-3">
              <div class="text-right mr-2">
                <div class="text-[12px] text-neutral-400 mono uppercase tracking-wider">今日进度</div>
                <div class="text-lg font-bold text-neutral-900">{{ completedCount }}/{{ totalCount }}</div>
              </div>
              <div class="w-14 h-14 relative">
                <svg class="w-14 h-14 transform -rotate-90">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                    class="text-neutral-100"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="currentColor"
                    stroke-width="3"
                    fill="none"
                    :stroke-darray="`${progressPercentage * 1.507} 150.7`"
                    class="text-zinc-900 transition-all duration-500"
                  />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-900">
                  {{ progressPercentage }}%
                </div>
              </div>
              <Button
                @click="showTaskModal = true"
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Plus :size="16" />
                <span>新建任务</span>
              </Button>
            </div>
          </div>

          <!-- 快速添加任务 -->
          <div class="relative">
            <Input
              v-model="quickTaskInput"
              type="text"
              placeholder="快速添加任务... (按回车保存)"
              @keydown.enter="addQuickTask"
              :disabled="loading"
              class="w-full px-8 py-5 bg-white border-2 border-dashed border-black/10 rounded-3xl text-base placeholder:text-neutral-300 focus:border-black/20 transition-all shadow-sm"
            />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Sparkles :size="20" class="text-neutral-300" />
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="text-neutral-400">加载中...</div>
          </div>

          <!-- 任务列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="(task, idx) in tasks"
              :key="task.id"
              :class="[
                'woven-border rounded-[2.5rem] card-hover group border border-black/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all duration-500 flex items-center p-6 md:p-8',
                task.completed ? 'bg-emerald-50/20 grayscale-[0.2]' : 'bg-white'
              ]"
              :style="{ animationDelay: `${idx * 0.05}s` }"
            >
              <Checkbox
                :model-value="task.completed"
                @update:model-value="toggleTaskCompletion(task.id)"
                :disabled="loading"
                class="shrink-0 mr-6"
              />

              <div class="flex-1 min-w-0">
                <h3
                  :class="[
                    'text-xl font-medium transition-all truncate mb-2',
                    task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'
                  ]"
                >
                  {{ task.title }}
                </h3>

                <div class="flex flex-wrap items-center gap-2">
                  <Badge
                    :class="[
                      'px-2.5 py-1 text-[12px] font-medium border',
                      getPriorityColor(task.priority)
                    ]"
                  >
                    {{ getPriorityLabel(task.priority) }}优先级
                  </Badge>

                  <Badge
                    v-if="task.startTime || task.dueTime"
                    class="px-2.5 py-1 text-[12px] font-medium bg-stone-100 text-stone-700 border border-stone-200"
                  >
                    <Clock :size="12" class="mr-1 inline" />
                    <template v-if="task.startTime && task.dueTime">
                      {{ formatTime(task.startTime) }} - {{ formatTime(task.dueTime) }}
                    </template>
                    <template v-else-if="task.startTime">
                      从 {{ formatTime(task.startTime) }} 开始
                    </template>
                    <template v-else-if="task.dueTime">
                      {{ formatTime(task.dueTime) }} 截止
                    </template>
                  </Badge>

                  <Badge
                    v-for="tag in task.tags"
                    :key="tag"
                    variant="outline"
                    class="px-2.5 py-1 text-[12px] font-medium border-black/5 bg-white text-neutral-500"
                  >
                    #{{ tag }}
                  </Badge>
                </div>
              </div>

              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                <button
                  @click="startEditTask(task)"
                  :disabled="task.completed || loading"
                  :class="[
                    'p-2 rounded-lg transition-all',
                    task.completed || loading
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                  ]"
                  title="编辑"
                >
                  <Edit3 :size="18" />
                </button>
                <button
                  @click="deleteTask(task.id)"
                  :disabled="task.completed || loading"
                  :class="[
                    'p-2 rounded-lg transition-all',
                    task.completed || loading
                      ? 'text-neutral-300 cursor-not-allowed'
                      : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                  ]"
                  title="删除"
                >
                  <Trash2 :size="18" />
                </button>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div
            v-if="!loading && tasks.length === 0"
            class="border-2 border-dashed border-black/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center p-16 bg-white"
          >
            <Circle :size="64" class="mb-4 text-neutral-300" />
            <p class="text-[16px] mono font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">暂无任务</p>
            <p class="text-[14px] text-neutral-300">开始规划你的一天吧</p>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- 新建任务对话框 -->
  <Dialog v-model:open="showTaskModal">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900">新建任务</DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          创建一个新的每日清单任务
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">任务标题</label>
          <Input
            v-model="newTask.title"
            type="text"
            placeholder="例如：完成项目报告"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">优先级</label>
          <Select v-model="newTask.priority">
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低优先级</SelectItem>
              <SelectItem value="medium">中优先级</SelectItem>
              <SelectItem value="high">高优先级</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">开始时间（可选）</label>
            <Input
              v-model="newTask.startTime"
              type="time"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">截止时间（可选）</label>
            <Input
              v-model="newTask.dueTime"
              type="time"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">标签（可选）</label>
          <Input
            v-model="newTask.tags"
            type="text"
            placeholder="工作, 学习 (逗号分隔)"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showTaskModal = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleAddTask"
          :disabled="loading"
          class="flex-1 bg-black text-white hover:bg-neutral-800 py-4 text-xs font-bold uppercase tracking-[0.2em]"
        >
          创建
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 编辑任务对话框 -->
  <Dialog v-model:open="showEditTaskDialog">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900">编辑任务</DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          修改任务的详细信息
        </DialogDescription>
      </DialogHeader>

      <div v-if="editingTask" class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">任务标题</label>
          <Input
            v-model="editingTask.title"
            type="text"
            placeholder="例如：完成项目报告"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">优先级</label>
          <Select v-model="editingTask.priority">
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">低优先级</SelectItem>
              <SelectItem value="medium">中优先级</SelectItem>
              <SelectItem value="high">高优先级</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">开始时间（可选）</label>
            <Input
              :model-value="formatTimeForInput(editingTask.startTime)"
              @input="editingTask.startTime = $event.target.value"
              type="time"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">截止时间（可选）</label>
            <Input
              :model-value="formatTimeForInput(editingTask.dueTime)"
              @input="editingTask.dueTime = $event.target.value"
              type="time"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">标签（可选）</label>
          <Input
            :model-value="editingTaskTagsString"
            @input="updateEditingTaskTags($event.target.value)"
            type="text"
            placeholder="工作, 学习 (逗号分隔)"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showEditTaskDialog = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleEditTask"
          :disabled="loading"
          class="flex-1 bg-black text-white hover:bg-neutral-800 py-4 text-xs font-bold uppercase tracking-[0.2em]"
        >
          保存更改
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 删除确认对话框 -->
  <Dialog v-model:open="showDeleteDialog">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900 flex items-center gap-2">
          <AlertTriangle :size="20" class="text-red-500" />
          确认删除任务
        </DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          此操作无法撤销
        </DialogDescription>
      </DialogHeader>

      <div v-if="deletingTask" class="py-4">
        <p class="text-neutral-700 mb-2">您确定要删除以下任务吗？</p>
        <div class="p-4 bg-red-50 rounded-xl border border-red-100">
          <p class="font-medium text-neutral-900">{{ deletingTask.title }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showDeleteDialog = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="confirmDelete"
          variant="destructive"
          class="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          确认删除
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
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
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Calendar as CalendarIcon,
  Tag,
  Target,
  Briefcase,
  Heart,
  Cpu,
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Palette,
  Check,
  Inbox,
  Activity,
  Archive,
  Edit3,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

const router = useRouter()
const isSidebarOpen = ref(true)
const activeView = ref('long-term')

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 类型定义
interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Plan {
  id: string
  title: string
  category: string
  progress: number
  completed: boolean
  subTasks: SubTask[]
  deadline: string
  tags: string[]
  color: string
}

interface Category {
  name: string
  icon: any
}

type StatusFilter = 'active' | 'completed' | 'all'

// 状态
const activeCategory = ref('全部')
const statusFilter = ref<StatusFilter>('active')
const showPlanModal = ref(false)
const showCategoryModal = ref(false)
const quickTaskInputs = ref<{ [key: string]: string }>({})
const expandedPlans = ref<Record<string, boolean>>({ '1': true })
const editingSubTask = ref<{ planId: string; subTaskId: string } | null>(null)
const editTaskInput = ref('')

// 检查计划是否展开
const isPlanExpanded = (planId: string) => expandedPlans.value[planId] || false

// 分类数据
const categories = ref<Category[]>([
  { name: '全部', icon: Layers },
  { name: '技能', icon: Cpu },
  { name: '生活', icon: Heart },
  { name: '项目', icon: Briefcase },
  { name: '职业', icon: Target }
])

// 计划数据
const plans = ref<Plan[]>([
  {
    id: '1',
    title: '全栈架构师进阶',
    category: '技能',
    progress: 66,
    completed: false,
    subTasks: [
      { id: 's1', title: '深入理解 Vue 3 Composition API', completed: true },
      { id: 's2', title: 'Rust 基础语法与所有权模型', completed: true },
      { id: 's3', title: '分布式系统共识算法研究', completed: false },
      { id: 's4', title: 'WebAssembly 性能优化实战', completed: false }
    ],
    deadline: '2025-06-01',
    tags: ['DEVELOPMENT', 'CAREER'],
    color: 'bg-zinc-900'
  },
  {
    id: '2',
    title: '身体健康重塑计划',
    category: '生活',
    progress: 50,
    completed: false,
    subTasks: [
      { id: 's6', title: '每周三次力量训练', completed: true },
      { id: 's7', title: '每日饮食摄入记录', completed: false }
    ],
    deadline: '2024-12-31',
    tags: ['HEALTH', 'FITNESS'],
    color: 'bg-emerald-600'
  }
])

// 新建计划表单
const newPlan = ref({
  title: '',
  category: '技能',
  deadline: '',
  tags: '',
  color: 'bg-zinc-900'
})

const newCatName = ref('')

// 颜色选项
const colors = [
  { name: 'Obsidian', value: 'bg-zinc-900' },
  { name: 'Emerald', value: 'bg-emerald-600' },
  { name: 'Rose', value: 'bg-rose-600' },
  { name: 'Amber', value: 'bg-amber-600' },
  { name: 'Stone', value: 'bg-stone-500' }
]

// 计算属性
const filteredPlans = computed(() => {
  return plans.value.filter(plan => {
    const matchesCategory = activeCategory.value === '全部' || plan.category === activeCategory.value
    const matchesStatus = statusFilter.value === 'all'
      ? true
      : statusFilter.value === 'completed'
        ? plan.completed
        : !plan.completed
    return matchesCategory && matchesStatus
  })
})

const activeCount = computed(() => plans.value.filter(p => !p.completed).length)
const completedCount = computed(() => plans.value.filter(p => p.completed).length)

// 方法
const toggleExpand = (id: string) => {
  expandedPlans.value[id] = !expandedPlans.value[id]
}

const calculateProgress = (subTasks: SubTask[], planCompleted: boolean) => {
  if (subTasks.length === 0) {
    return planCompleted ? 100 : 0
  }
  const completedCount = subTasks.filter(st => st.completed).length
  return Math.round((completedCount / subTasks.length) * 100)
}

const togglePlanCompletion = (planId: string) => {
  const plan = plans.value.find(p => p.id === planId)
  if (!plan) return

  plan.completed = !plan.completed
  if (plan.completed) {
    plan.subTasks = plan.subTasks.map(st => ({ ...st, completed: true }))
  }
  plan.progress = calculateProgress(plan.subTasks, plan.completed)
}

const toggleSubTask = (planId: string, subTaskId: string) => {
  const plan = plans.value.find(p => p.id === planId)
  if (!plan) return

  const subTask = plan.subTasks.find(st => st.id === subTaskId)
  if (!subTask) return

  subTask.completed = !subTask.completed
  const allCompleted = plan.subTasks.length > 0 && plan.subTasks.every(st => st.completed)
  plan.completed = allCompleted
  plan.progress = calculateProgress(plan.subTasks, allCompleted)

  if (allCompleted) {
    toast.success('太棒了！计划已完成！')
  }
}

const addSubTask = (planId: string) => {
  const title = quickTaskInputs.value[planId]
  if (!title?.trim()) return

  const plan = plans.value.find(p => p.id === planId)
  if (!plan || plan.completed) return

  plan.subTasks.push({
    id: Date.now().toString(),
    title: title.trim(),
    completed: false
  })

  plan.progress = calculateProgress(plan.subTasks, plan.completed)
  quickTaskInputs.value[planId] = ''
  toast.success('子任务已添加')
}

const handleAddPlan = () => {
  if (!newPlan.value.title.trim()) {
    toast.error('请输入计划标题')
    return
  }

  const plan: Plan = {
    id: Date.now().toString(),
    title: newPlan.value.title,
    category: newPlan.value.category,
    progress: 0,
    completed: false,
    subTasks: [],
    deadline: newPlan.value.deadline || '未设置',
    tags: newPlan.value.tags.split(',').map(t => t.trim().toUpperCase()).filter(t => t),
    color: newPlan.value.color
  }

  plans.value.unshift(plan)
  showPlanModal.value = false
  newPlan.value = { title: '', category: '技能', deadline: '', tags: '', color: 'bg-zinc-900' }
  toast.success('✨ 愿景节点已创建！')
}

const handleAddCategory = () => {
  if (!newCatName.value.trim()) {
    toast.error('请输入分类名称')
    return
  }

  if (categories.value.find(c => c.name === newCatName.value)) {
    toast.error('分类已存在')
    return
  }

  categories.value.push({ name: newCatName.value, icon: Layers })
  showCategoryModal.value = false
  newCatName.value = ''
  toast.success('分类已添加')
}

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '技能': 'bg-zinc-100 text-zinc-900',
    '生活': 'bg-emerald-50 text-emerald-600',
    '项目': 'bg-stone-100 text-stone-600',
    '职业': 'bg-rose-50 text-rose-600'
  }
  return colorMap[category] || 'bg-stone-100 text-stone-600'
}

// 编辑子任务
const startEditingSubTask = (planId: string, subTaskId: string, currentTitle: string) => {
  editingSubTask.value = { planId, subTaskId }
  editTaskInput.value = currentTitle
}

const saveSubTaskEdit = () => {
  if (!editingSubTask.value) return

  const { planId, subTaskId } = editingSubTask.value
  const plan = plans.value.find(p => p.id === planId)
  if (!plan) return

  const subTask = plan.subTasks.find(st => st.id === subTaskId)
  if (!subTask) return

  if (!editTaskInput.value.trim()) {
    toast.error('子任务内容不能为空')
    return
  }

  subTask.title = editTaskInput.value.trim()
  editingSubTask.value = null
  editTaskInput.value = ''
  toast.success('子任务已更新')
}

const cancelSubTaskEdit = () => {
  editingSubTask.value = null
  editTaskInput.value = ''
}

const isEditingSubTask = (planId: string, subTaskId: string) => {
  return editingSubTask.value?.planId === planId && editingSubTask.value?.subTaskId === subTaskId
}
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
              <p class="text-sm text-neutral-400 mt-1 italic">分阶段拆解宏大目标，保持战略定力。</p>
            </div>
            <div class="flex items-center gap-3">
              <button
                @click="showPlanModal = true"
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Plus :size="16" />
                <span>新建愿景节点</span>
              </button>
            </div>
          </div>

          <!-- 主内容区域 -->
          <div class="flex flex-col lg:flex-row gap-8">
            <!-- 左侧边栏 -->
            <aside class="lg:w-64 space-y-8 shrink-0">
              <!-- 状态筛选 -->
              <div class="w-full">
                <Tabs v-model="statusFilter" class="w-full">
                  <TabsList class="bg-stone-100/50 p-1 rounded-2xl flex flex-col gap-1 h-auto items-stretch justify-start w-full">
                    <TabsTrigger
                      value="active"
                      class="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-neutral-400 hover:text-neutral-600 w-full"
                    >
                      <span class="flex items-center gap-2"><Activity :size="14"/> 进行中</span>
                      <span class="px-2 py-0.5 rounded-md text-[10px] bg-zinc-100 text-zinc-900">{{ activeCount }}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="completed"
                      class="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 text-neutral-400 hover:text-neutral-600 w-full"
                    >
                      <span class="flex items-center gap-2"><Archive :size="14"/> 已完成</span>
                      <span class="px-2 py-0.5 rounded-md text-[10px] bg-emerald-50 text-emerald-600">{{ completedCount }}</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="all"
                      class="flex items-center px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-neutral-900 text-neutral-400 hover:text-neutral-600 w-full justify-start"
                    >
                      <span class="flex items-center gap-2"><Layers :size="14"/> 全部</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <!-- 分类筛选 -->
              <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                  <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">分类过滤</h3>
                  <button
                    @click="showCategoryModal = true"
                    class="p-1 hover:bg-black/5 rounded-md text-neutral-400"
                  >
                    <Plus :size="14" />
                  </button>
                </div>
                <div class="space-y-1">
                  <button
                    v-for="cat in categories"
                    :key="cat.name"
                    @click="activeCategory = cat.name"
                    :class="[
                      'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-sm font-medium',
                      activeCategory === cat.name
                        ? 'bg-zinc-900 text-white font-bold'
                        : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-900'
                    ]"
                  >
                    <span class="flex items-center gap-3">
                      <component
                        :is="cat.icon"
                        :size="16"
                        :class="[activeCategory === cat.name ? 'opacity-100' : 'opacity-40']"
                      />
                      {{ cat.name }}
                    </span>
                    <ChevronRight v-if="activeCategory === cat.name" :size="14" />
                  </button>
                </div>
              </div>
            </aside>

            <!-- 右侧计划列表 -->
            <main class="flex-1 flex flex-col gap-6">
              <div
                v-for="(plan, idx) in filteredPlans"
                :key="plan.id"
                :class="[
                  'woven-border rounded-[2.5rem] card-hover group border border-black/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 transition-all duration-500 flex flex-col md:flex-row h-auto',
                  plan.completed ? 'bg-emerald-50/20 grayscale-[0.2]' : 'bg-white'
                ]"
                :style="{ animationDelay: `${idx * 0.1}s` }"
              >
                <!-- 左侧:战略信息 (40%) -->
                <div class="md:w-[38%] p-8 border-r border-black/[0.03] flex flex-col justify-between">
                  <div>
                    <div class="flex justify-between items-start mb-4">
                      <Badge
                        :class="[
                          'px-3 py-1 text-[9px] font-bold uppercase tracking-widest mono',
                          plan.completed ? 'bg-emerald-100 text-emerald-700' : getCategoryColor(plan.category)
                        ]"
                        :variant="plan.completed ? 'default' : 'secondary'"
                      >
                        {{ plan.completed ? 'COMPLETED' : plan.category }}
                      </Badge>
                    </div>

                    <div class="flex items-start gap-4 mb-4">
                      <button
                        @click="togglePlanCompletion(plan.id)"
                        :class="[
                          'mt-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                          plan.completed
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-black/10 hover:border-black/30 bg-white shadow-sm'
                        ]"
                      >
                        <Check
                          :size="14"
                          :class="['text-white transition-transform', plan.completed ? 'scale-100' : 'scale-0']"
                        />
                      </button>
                      <h3 :class="[
                        'text-2xl font-medium leading-tight transition-all',
                        plan.completed ? 'line-through text-emerald-900/40' : 'text-neutral-900'
                      ]">
                        {{ plan.title }}
                      </h3>
                    </div>

                    <!-- 标签 -->
                    <div class="flex flex-wrap gap-2 mb-4">
                      <Badge
                        v-for="tag in plan.tags"
                        :key="tag"
                        variant="outline"
                        class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border-black/[0.05] bg-white text-neutral-400 shadow-sm"
                      >
                        #{{ tag }}
                      </Badge>
                    </div>

                    <div class="flex items-center gap-2 text-[10px] mono text-neutral-400 mb-6 uppercase tracking-tighter">
                      <CalendarIcon :size="12" />
                      <span>截止: {{ plan.deadline }}</span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex justify-between items-end">
                      <span :class="[
                        'text-[10px] mono font-bold uppercase tracking-widest',
                        plan.completed ? 'text-emerald-600' : 'text-neutral-400'
                      ]">归档进度</span>
                      <span :class="[
                        'text-sm font-medium',
                        plan.completed ? 'text-emerald-700' : 'text-neutral-900'
                      ]">{{ plan.progress }}%</span>
                    </div>
                    <div :class="[
                      'relative h-2 w-full overflow-hidden rounded-full',
                      plan.completed ? 'bg-emerald-100' : 'bg-neutral-100'
                    ]">
                      <div
                        :class="[
                          'h-full transition-all duration-500 ease-out',
                          plan.completed ? 'bg-emerald-500' : 'bg-zinc-900'
                        ]"
                        :style="{ width: `${plan.progress}%` }"
                      />
                    </div>
                  </div>
                </div>

                <!-- 右侧:执行详情 (可展开) -->
                <div class="flex-1 p-8 flex flex-col bg-stone-50/20">
                  <!-- 没有子任务的情况：直接显示暂无子项 -->
                  <div
                    v-if="plan.subTasks.length === 0"
                    class="flex-1 flex flex-col items-center justify-center border border-dashed border-black/5 rounded-[1.5rem] opacity-40"
                  >
                    <Inbox :size="20" class="mb-1 text-neutral-300" />
                    <p class="text-[9px] mono uppercase tracking-widest text-neutral-300">暂无子项</p>
                  </div>

                  <!-- 有子任务的情况 -->
                  <template v-else>
                    <!-- 统计信息 -->
                    <div class="flex items-center gap-6 text-sm mb-4">
                      <div class="flex items-center gap-2">
                        <span class="text-neutral-600">已完成 {{ plan.subTasks.filter(st => st.completed).length }} 项</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-neutral-600">待完成 {{ plan.subTasks.filter(st => !st.completed).length }} 项</span>
                      </div>
                    </div>

                    <!-- 子任务列表 -->
                    <Collapsible v-model:open="expandedPlans[plan.id]">
                      <!-- 未展开时显示前2项 -->
                      <div class="space-y-3">
                        <div
                          v-for="st in (isPlanExpanded(plan.id) ? plan.subTasks : plan.subTasks.slice(0, 2))"
                          :key="st.id"
                          :class="[
                            'flex items-center gap-4 p-4 rounded-2xl transition-all border group/task',
                            plan.completed
                              ? 'bg-emerald-50/50 border-transparent'
                              : 'bg-white hover:bg-stone-50 border-black/[0.02] shadow-sm'
                          ]"
                        >
                          <Checkbox
                            :modelValue="st.completed || plan.completed"
                            @update:modelValue="toggleSubTask(plan.id, st.id)"
                            :disabled="plan.completed || isEditingSubTask(plan.id, st.id)"
                            class="shrink-0"
                          />
                          <!-- 编辑模式 -->
                          <div
                            v-if="isEditingSubTask(plan.id, st.id)"
                            class="flex items-center gap-2 flex-1"
                          >
                            <Input
                              v-model="editTaskInput"
                              @keydown.enter="saveSubTaskEdit"
                              @keydown.escape="cancelSubTaskEdit"
                              class="flex-1 h-8 text-sm px-3"
                              autofocus
                            />
                            <button
                              @click="saveSubTaskEdit"
                              class="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
                              title="保存"
                            >
                              <Check :size="14" />
                            </button>
                            <button
                              @click="cancelSubTaskEdit"
                              class="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                              title="取消"
                            >
                              <X :size="14" />
                            </button>
                          </div>
                          <!-- 显示模式 -->
                          <template v-else>
                            <span
                              @click="toggleSubTask(plan.id, st.id)"
                              :class="[
                                'text-sm truncate flex-1 cursor-pointer',
                                (st.completed || plan.completed) ? 'text-neutral-400 line-through' : 'text-neutral-700 font-medium'
                              ]"
                            >
                              {{ st.title }}
                            </span>
                            <button
                              @click.stop="startEditingSubTask(plan.id, st.id, st.title)"
                              :disabled="plan.completed"
                              :class="[
                                'p-1.5 rounded-lg transition-all opacity-0 group-hover/task:opacity-100',
                                plan.completed
                                  ? 'text-neutral-300 cursor-not-allowed'
                                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                              ]"
                              title="编辑子任务"
                            >
                              <Edit3 :size="14" />
                            </button>
                          </template>
                        </div>
                      </div>

                      <!-- 展开/收起按钮 -->
                      <CollapsibleTrigger as-child>
                        <button
                          v-if="plan.subTasks.length > 2"
                          class="flex items-center gap-2 w-full mt-4 mb-4 text-xs text-neutral-400 hover:text-neutral-600 transition-colors group/header"
                        >
                          <span class="mono uppercase tracking-widest">
                            {{ isPlanExpanded(plan.id) ? '收起' : `还有 ${plan.subTasks.length - 2} 项子任务...` }}
                          </span>
                          <ChevronDown
                            v-if="isPlanExpanded(plan.id)"
                            :size="16"
                            class="transition-transform"
                          />
                          <ChevronRight
                            v-else
                            :size="16"
                            class="transition-transform group-hover/header:translate-x-1"
                          />
                        </button>
                      </CollapsibleTrigger>
                    </Collapsible>
                  </template>

                  <!-- 添加新任务输入 -->
                  <div class="mt-auto">
                    <div class="relative">
                      <Input
                        v-model="quickTaskInputs[plan.id]"
                        type="text"
                        placeholder="添加执行节点..."
                        :disabled="plan.completed"
                        @keydown.enter="addSubTask(plan.id)"
                        :class="[
                          'pl-5 pr-12 py-3.5 bg-white border border-black/[0.05] rounded-2xl text-sm placeholder:text-neutral-300 italic shadow-sm',
                          plan.completed ? 'opacity-30 cursor-not-allowed' : ''
                        ]"
                      />
                      <button
                        :disabled="plan.completed"
                        @click="addSubTask(plan.id)"
                        :class="[
                          'absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all',
                          plan.completed ? 'text-neutral-200' : 'text-neutral-400 hover:text-white hover:bg-black'
                        ]"
                      >
                        <Plus :size="16" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 新建计划按钮 -->
              <button
                v-if="statusFilter !== 'completed' && activeCategory === '全部'"
                @click="showPlanModal = true"
                class="border-2 border-dashed border-black/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center p-8 hover:bg-white hover:border-black/10 transition-all card-hover group h-[120px]"
              >
                <div class="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-zinc-100 group-hover:text-zinc-900 transition-all shadow-sm">
                  <Plus :size="20" :stroke-width="1" />
                </div>
                <span class="text-[10px] mono font-bold uppercase tracking-[0.2em] text-neutral-300 group-hover:text-neutral-900 transition-colors">
                  初始化新愿景节点
                </span>
              </button>
            </main>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- 新建计划对话框 -->
  <Dialog v-model:open="showPlanModal">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900">新建愿景计划</DialogTitle>
        <DialogDescription class="text-[10px] mono uppercase tracking-widest text-neutral-400">
          Initialize New Roadmap Node
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">计划标题</label>
          <Input
            v-model="newPlan.title"
            type="text"
            placeholder="例如：掌握 Rust 编程语言"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">所属分类</label>
            <Select v-model="newPlan.category">
              <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="cat in categories.filter(c => c.name !== '全部')"
                  :key="cat.name"
                  :value="cat.name"
                >
                  {{ cat.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">截止日期</label>
            <Input
              v-model="newPlan.deadline"
              type="date"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">标签 (逗号分隔)</label>
          <Input
            v-model="newPlan.tags"
            type="text"
            placeholder="DEVELOPMENT, CAREER..."
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm uppercase"
          />
        </div>

        <div class="space-y-3">
          <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">主题色彩</label>
          <div class="flex gap-3">
            <button
              v-for="color in colors"
              :key="color.value"
              type="button"
              @click="newPlan.color = color.value"
              :class="[
                'w-8 h-8 rounded-full transition-all flex items-center justify-center',
                color.value,
                newPlan.color === color.value
                  ? 'ring-2 ring-offset-2 ring-black/10 scale-110 shadow-lg'
                  : 'hover:scale-105 opacity-60'
              ]"
            >
              <Check v-if="newPlan.color === color.value" :size="14" class="text-white" />
            </button>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showPlanModal = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleAddPlan"
          class="flex-1 bg-black text-white hover:bg-neutral-800 py-4 text-xs font-bold uppercase tracking-[0.2em]"
        >
          启动愿景节点
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 新建分类对话框 -->
  <Dialog v-model:open="showCategoryModal">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900">新建分类</DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          添加一个新的计划分类
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1">分类名称</label>
          <Input
            v-model="newCatName"
            type="text"
            placeholder="例如：投资"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showCategoryModal = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleAddCategory"
          class="flex-1 bg-black text-white hover:bg-neutral-800"
        >
          确认添加
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
  transform: translateY(-4px);
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

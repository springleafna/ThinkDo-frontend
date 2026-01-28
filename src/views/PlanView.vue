<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
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
  Trash2,
  AlertTriangle,
  Repeat,
  Clock,
  Calendar,
  Flag,
  Zap
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { planApi, type Plan as PlanApi, type CreatePlanParams, type UpdatePlanParams } from '@/api/plan'
import { planCategoryApi, type PlanCategory } from '@/api/planCategory'
import { planStepApi, type PlanStep } from '@/api/planStep'
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
const layoutStore = useLayoutStore()
const activeView = ref('long-term')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 重复配置接口
interface RepeatConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  // 每日：周期天数
  dailyInterval?: number
  // 每周：选中的星期几 (0-6, 0=周日)
  weeklyDays?: number[]
  // 每月：选中的日期 (1-31)
  monthlyDays?: number[]
  // 每年：选中的月份和日期
  yearlyMonth?: number
  yearlyDay?: number
}

// 类型定义
interface SubTask {
  id: string
  title: string
  completed: boolean
}

interface Plan {
  id: string
  categoryId?: string
  title: string
  category: string
  progress: number
  completed: boolean
  subTasks: SubTask[]
  startTime?: string
  dueTime?: string
  tags: string[]
  color: string
  priority: 'low' | 'medium' | 'high'
  repeatConfig?: RepeatConfig
  quadrant?: 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important' | null
}

interface PlanEditForm {
  id: string
  title: string
  category: string
  startTime?: string
  dueTime?: string
  tags: string
  color: string
  priority: 'low' | 'medium' | 'high'
  repeatConfig?: RepeatConfig
  quadrant?: 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important' | null
}

interface Category {
  id?: string
  name: string
  icon: any
}

type StatusFilter = 'active' | 'completed' | 'all'

// 状态
const activeCategory = ref('全部')
const statusFilter = ref<StatusFilter>('active')
const showPlanModal = ref(false)
const showCategoryModal = ref(false)
const showEditPlanModal = ref(false)
const showDeletePlanDialog = ref(false)
const showDeleteSubTaskDialog = ref(false)
const quickTaskInputs = ref<{ [key: string]: string }>({})
const expandedPlans = ref<Record<string, boolean>>({ '1': true })
const editingSubTask = ref<{ planId: string; subTaskId: string } | null>(null)
const editTaskInput = ref('')
const editingPlan = ref<PlanEditForm | null>(null)
const deletingPlan = ref<Plan | null>(null)
const deletingSubTask = ref<{ planId: string; subTaskId: string; subTaskTitle: string } | null>(null)
const loading = ref(false)
const categoriesLoading = ref(false)

// 检查计划是否展开
const isPlanExpanded = (planId: string) => expandedPlans.value[planId] || false

// 优先级映射函数
const mapPriorityToApi = (priority: 'low' | 'medium' | 'high'): number => {
  const map = { low: 1, medium: 2, high: 3 }
  return map[priority]
}

const mapPriorityFromApi = (priority: number): 'low' | 'medium' | 'high' => {
  const map: Record<number, 'low' | 'medium' | 'high'> = { 1: 'low', 2: 'medium', 3: 'high' }
  return map[priority] || 'medium'
}

// 四象限映射函数
const mapQuadrantToApi = (quadrant: string | null): number => {
  const map: Record<string, number> = {
    'urgent-important': 1,
    'urgent-not-important': 3,
    'not-urgent-important': 2,
    'not-urgent-not-important': 4
  }
  return quadrant ? map[quadrant] || 0 : 0
}

const mapQuadrantFromApi = (quadrant: number): 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important' | null => {
  const map: Record<number, 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important'> = {
    1: 'urgent-important',
    2: 'not-urgent-important',
    3: 'urgent-not-important',
    4: 'not-urgent-not-important'
  }
  return map[quadrant] || null
}

// 重复类型映射函数
const mapRepeatTypeToApi = (type: string | null | undefined): number => {
  const map: Record<string, number> = { 'daily': 1, 'weekly': 2, 'monthly': 3, 'yearly': 4 }
  return type ? map[type] || 0 : 0
}

const mapRepeatTypeFromApi = (repeatType: number): 'daily' | 'weekly' | 'monthly' | 'yearly' | null => {
  const map: Record<number, 'daily' | 'weekly' | 'monthly' | 'yearly'> = {
    1: 'daily',
    2: 'weekly',
    3: 'monthly',
    4: 'yearly'
  }
  return map[repeatType] || null
}

// 重复配置转换函数
const convertRepeatConfigToApi = (repeatConfig: RepeatConfig | null): { repeatType: number; repeatConf?: string; repeatUntil?: string } => {
  if (!repeatConfig || !repeatConfig.type) {
    return { repeatType: 0 }
  }

  const repeatType = mapRepeatTypeToApi(repeatConfig.type)
  let repeatConf: string | undefined

  switch (repeatConfig.type) {
    case 'daily':
      if (repeatConfig.dailyInterval && repeatConfig.dailyInterval >= 1) {
        repeatConf = JSON.stringify({ interval: repeatConfig.dailyInterval })
      }
      break
    case 'weekly':
      if (repeatConfig.weeklyDays && repeatConfig.weeklyDays.length > 0) {
        repeatConf = JSON.stringify({ days: repeatConfig.weeklyDays })
      }
      break
    case 'monthly':
      if (repeatConfig.monthlyDays && repeatConfig.monthlyDays.length > 0) {
        repeatConf = JSON.stringify({ day: repeatConfig.monthlyDays[0] })
      }
      break
    case 'yearly':
      if (repeatConfig.yearlyMonth && repeatConfig.yearlyDay) {
        repeatConf = JSON.stringify({ month: repeatConfig.yearlyMonth, day: repeatConfig.yearlyDay })
      }
      break
  }

  return { repeatType, repeatConf }
}

const convertRepeatConfigFromApi = (repeatType: number, repeatConf?: string): RepeatConfig | undefined => {
  const type = mapRepeatTypeFromApi(repeatType)
  if (!type) return undefined

  const config: RepeatConfig = { type }

  if (repeatConf) {
    try {
      const conf = JSON.parse(repeatConf)
      if (type === 'daily' && conf.interval) {
        config.dailyInterval = conf.interval
      } else if (type === 'weekly' && conf.days) {
        config.weeklyDays = conf.days
      } else if (type === 'monthly' && conf.day) {
        config.monthlyDays = [conf.day]
      } else if (type === 'yearly' && conf.month && conf.day) {
        config.yearlyMonth = conf.month
        config.yearlyDay = conf.day
      }
    } catch (e) {
      console.error('解析重复配置失败', e)
    }
  } else {
    // 设置默认值
    if (type === 'daily') config.dailyInterval = 1
    if (type === 'weekly') config.weeklyDays = []
    if (type === 'monthly') config.monthlyDays = []
    if (type === 'yearly') { config.yearlyMonth = 1; config.yearlyDay = 1 }
  }

  return config
}

// 加载数据函数
const loadCategories = async () => {
  try {
    categoriesLoading.value = true
    const data = await planCategoryApi.getList()

    // 从后端数据转换为前端分类数据
    const categoryMap: Record<string, any> = {
      '技能': Cpu,
      '生活': Heart,
      '项目': Briefcase,
      '职业': Target
    }

    const backendCategories: Category[] = data.map((cat: PlanCategory) => ({
      id: String(cat.id),
      name: cat.name,
      icon: categoryMap[cat.name] || Layers
    }))

    // 保留"全部"选项
    categories.value = [
      { name: '全部', icon: Layers },
      ...backendCategories
    ]

    // 更新默认分类
    newPlan.value.category = 'uncategorized'
  } catch (error) {
    console.error('加载分类失败', error)
    toast.error('加载分类失败')
  } finally {
    categoriesLoading.value = false
  }
}

const loadPlans = async () => {
  try {
    loading.value = true

    // 根据选中的分类获取数据
    let data
    if (activeCategory.value === '全部') {
      data = await planApi.getList({ type: 0 })
    } else {
      // 找到选中分类的ID
      const selectedCategory = categories.value.find(c => c.name === activeCategory.value)
      if (selectedCategory?.id) {
        data = await planApi.getListByCategoryId(parseInt(selectedCategory.id))
      } else {
        // 如果是"未分类"，使用查询参数
        data = await planApi.getList({ categoryId: 0, type: 0 })
      }
    }

    // 从后端数据转换为前端计划数据
    const categoryMap: Record<string, string> = {}

    // 构建分类ID到名称的映射
    categories.value.forEach(cat => {
      if (cat.id && cat.name) {
        categoryMap[String(cat.id)] = cat.name
      }
    })

    const backendPlans: Plan[] = await Promise.all(data.map(async (planApi: PlanApi) => {
      // 获取子任务
      let subTasks: SubTask[] = []
      try {
        const steps = await planStepApi.getListByPlanId(planApi.id)
        subTasks = steps.map((step: PlanStep) => ({
          id: String(step.id),
          title: step.title,
          completed: step.status === 1
        }))
      } catch (e) {
        console.error('加载子任务失败', e)
      }

      // 获取分类名称（如果没有分类，使用 "uncategorized"）
      const categoryName = planApi.categoryName || categoryMap[String(planApi.categoryId)] || 'uncategorized'

      return {
        id: String(planApi.id),
        categoryId: planApi.categoryId ? String(planApi.categoryId) : undefined,
        title: planApi.title,
        category: categoryName,
        progress: calculateProgressFromSteps(subTasks, planApi.status === 1),
        completed: planApi.status === 1,
        subTasks,
        startTime: planApi.startTime || undefined,
        dueTime: planApi.dueTime || undefined,
        tags: planApi.tags ? planApi.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        color: 'bg-zinc-900', // 默认颜色
        priority: mapPriorityFromApi(planApi.priority),
        repeatConfig: convertRepeatConfigFromApi(planApi.repeatType, planApi.repeatConf),
        quadrant: mapQuadrantFromApi(planApi.quadrant)
      }
    }))

    plans.value = backendPlans
  } catch (error) {
    console.error('加载计划失败', error)
    toast.error('加载计划失败')
  } finally {
    loading.value = false
  }
}

const calculateProgressFromSteps = (subTasks: SubTask[], planCompleted: boolean): number => {
  if (subTasks.length === 0) {
    return planCompleted ? 100 : 0
  }
  const completedCount = subTasks.filter(st => st.completed).length
  return Math.round((completedCount / subTasks.length) * 100)
}

// 初始化加载数据
onMounted(() => {
  loadCategories()
  loadPlans()
})

// 监听分类变化，重新加载计划
watch(activeCategory, () => {
  loadPlans()
})

// 分类数据
const categories = ref<Category[]>([
  { name: '全部', icon: Layers }
])

// 计划数据
const plans = ref<Plan[]>([])

// 新建计划表单
const newPlan = ref({
  title: '',
  category: 'uncategorized', // 默认为"uncategorized"（未分类）
  startTime: '',
  dueTime: '',
  tags: '',
  color: 'bg-zinc-900',
  priority: 'medium' as 'low' | 'medium' | 'high',
  repeatConfig: null as RepeatConfig | null,
  quadrant: null as 'urgent-important' | 'urgent-not-important' | 'not-urgent-important' | 'not-urgent-not-important' | null
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
    const matchesStatus = statusFilter.value === 'all'
      ? true
      : statusFilter.value === 'completed'
        ? plan.completed
        : !plan.completed
    return matchesStatus
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

const togglePlanCompletion = async (planId: string) => {
  try {
    await planApi.toggleStatus(parseInt(planId))

    // 重新加载计划列表
    await loadPlans()

    const plan = plans.value.find(p => p.id === planId)
    if (plan && plan.completed) {
      toast.success('太棒了！计划已完成！')
    }
  } catch (error) {
    console.error('切换计划状态失败', error)
    toast.error('切换计划状态失败')
  }
}

const toggleSubTask = async (planId: string, subTaskId: string) => {
  try {
    await planStepApi.toggleStatus(parseInt(subTaskId))

    // 重新加载计划列表
    await loadPlans()

    const plan = plans.value.find(p => p.id === planId)
    if (plan && plan.completed) {
      toast.success('太棒了！计划已完成！')
    }
  } catch (error) {
    console.error('切换子任务状态失败', error)
    toast.error('切换子任务状态失败')
  }
}

const addSubTask = async (planId: string) => {
  const title = quickTaskInputs.value[planId]
  if (!title?.trim()) return

  const plan = plans.value.find(p => p.id === planId)
  if (!plan || plan.completed) return

  try {
    await planStepApi.create({
      planId: parseInt(planId),
      title: title.trim()
    })
    toast.success('子任务已添加')

    // 重新加载计划列表
    await loadPlans()

    quickTaskInputs.value[planId] = ''
  } catch (error) {
    console.error('添加子任务失败', error)
    toast.error('添加子任务失败')
  }
}

const handleAddPlan = async () => {
  if (!newPlan.value.title.trim()) {
    toast.error('请输入计划标题')
    return
  }

  try {
    // 查找分类ID（"uncategorized" 表示未分类）
    const category = categories.value.find(c => c.name === newPlan.value.category && c.name !== '全部')
    const categoryId = (newPlan.value.category && newPlan.value.category !== 'uncategorized' && category?.id)
      ? parseInt(category.id)
      : undefined

    // 转换重复配置
    const { repeatType, repeatConf } = convertRepeatConfigToApi(newPlan.value.repeatConfig)

    const params: CreatePlanParams = {
      categoryId,
      title: newPlan.value.title,
      priority: mapPriorityToApi(newPlan.value.priority),
      quadrant: mapQuadrantToApi(newPlan.value.quadrant),
      tags: newPlan.value.tags || undefined,
      startTime: newPlan.value.startTime || undefined,
      dueTime: newPlan.value.dueTime || undefined,
      repeatType,
      repeatConf,
      type: 0
    }

    const planId = await planApi.create(params)
    toast.success('计划已创建！')

    // 重新加载计划列表
    await loadPlans()

    showPlanModal.value = false
    newPlan.value = {
      title: '',
      category: 'uncategorized',
      startTime: '',
      dueTime: '',
      tags: '',
      color: 'bg-zinc-900',
      priority: 'medium',
      repeatConfig: null,
      quadrant: null
    }
  } catch (error) {
    console.error('创建计划失败', error)
    toast.error('创建计划失败')
  }
}

const handleAddCategory = async () => {
  if (!newCatName.value.trim()) {
    toast.error('请输入分类名称')
    return
  }

  try {
    await planCategoryApi.create({ name: newCatName.value.trim() })
    toast.success('分类已添加')

    // 重新加载分类列表
    await loadCategories()

    showCategoryModal.value = false
    newCatName.value = ''
  } catch (error) {
    console.error('创建分类失败', error)
    toast.error('创建分类失败')
  }
}

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '未分类': 'bg-stone-100 text-stone-600',
    '技能': 'bg-zinc-100 text-zinc-900',
    '生活': 'bg-emerald-50 text-emerald-600',
    '项目': 'bg-stone-100 text-stone-600',
    '职业': 'bg-rose-50 text-rose-600'
  }
  return colorMap[category] || 'bg-stone-100 text-stone-600'
}

const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  const colorMap: Record<string, { bg: string, text: string, icon: any }> = {
    'low': {
      bg: 'bg-sky-100',
      text: 'text-sky-700',
      icon: Flag
    },
    'medium': {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: Zap
    },
    'high': {
      bg: 'bg-rose-100',
      text: 'text-rose-700',
      icon: AlertTriangle
    }
  }
  return colorMap[priority] || colorMap['medium']
}

const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
  const labelMap: Record<string, string> = {
    'low': '低优先级',
    'medium': '中优先级',
    'high': '高优先级'
  }
  return labelMap[priority]
}

const getRepeatLabel = (repeatConfig: RepeatConfig | undefined) => {
  if (!repeatConfig || !repeatConfig.type) return null

  const { type, dailyInterval, weeklyDays, monthlyDays, yearlyMonth, yearlyDay } = repeatConfig

  switch (type) {
    case 'daily':
      return dailyInterval && dailyInterval > 1 ? `每 ${dailyInterval} 天` : '每日'
    case 'weekly':
      if (weeklyDays && weeklyDays.length > 0) {
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        const days = weeklyDays.map(d => dayNames[d]).join('、')
        return `每周 ${days}`
      }
      return '每周'
    case 'monthly':
      if (monthlyDays && monthlyDays.length > 0) {
        const days = monthlyDays.sort((a, b) => a - b).join('、')
        return `每月 ${days} 号`
      }
      return '每月'
    case 'yearly':
      if (yearlyMonth && yearlyDay) {
        return `每年 ${yearlyMonth} 月 ${yearlyDay} 日`
      }
      return '每年'
    default:
      return null
  }
}

// 格式化时间显示
const formatDateTime = (dateTimeStr?: string) => {
  if (!dateTimeStr) return '未设置'
  try {
    const date = new Date(dateTimeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (e) {
    return dateTimeStr
  }
}

// 四象限配置
const getQuadrantConfig = (quadrant: string | undefined | null) => {
  if (!quadrant) return null

  const configMap: Record<string, { label: string, bg: string, text: string, icon: any, description: string }> = {
    'urgent-important': {
      label: '紧急重要',
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: AlertTriangle,
      description: '立即处理'
    },
    'urgent-not-important': {
      label: '紧急不重要',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      icon: Clock,
      description: '快速处理'
    },
    'not-urgent-important': {
      label: '重要不紧急',
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: Target,
      description: '计划安排'
    },
    'not-urgent-not-important': {
      label: '不紧急不重要',
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: Archive,
      description: '暂不处理'
    }
  }

  return configMap[quadrant] || null
}

// 重复配置处理函数
const handleRepeatTypeChange = (val: any) => {
  if (val) {
    newPlan.value.repeatConfig = { type: val }
    if (val === 'daily') newPlan.value.repeatConfig.dailyInterval = 1
    if (val === 'weekly') newPlan.value.repeatConfig.weeklyDays = []
    if (val === 'monthly') newPlan.value.repeatConfig.monthlyDays = []
    if (val === 'yearly') {
      newPlan.value.repeatConfig.yearlyMonth = 1
      newPlan.value.repeatConfig.yearlyDay = 1
    }
  } else {
    newPlan.value.repeatConfig = null
  }
}

const handleEditRepeatTypeChange = (val: any) => {
  if (!editingPlan.value) return
  if (val) {
    editingPlan.value.repeatConfig = { type: val }
    if (val === 'daily') editingPlan.value.repeatConfig.dailyInterval = 1
    if (val === 'weekly') editingPlan.value.repeatConfig.weeklyDays = []
    if (val === 'monthly') editingPlan.value.repeatConfig.monthlyDays = []
    if (val === 'yearly') {
      editingPlan.value.repeatConfig.yearlyMonth = 1
      editingPlan.value.repeatConfig.yearlyDay = 1
    }
  } else {
    editingPlan.value.repeatConfig = undefined
  }
}

const toggleWeeklyDay = (dayIndex: number) => {
  if (!newPlan.value.repeatConfig) return
  if (!newPlan.value.repeatConfig.weeklyDays) newPlan.value.repeatConfig.weeklyDays = []
  const days = newPlan.value.repeatConfig.weeklyDays
  if (days.includes(dayIndex)) {
    newPlan.value.repeatConfig.weeklyDays = days.filter(d => d !== dayIndex)
  } else {
    newPlan.value.repeatConfig.weeklyDays.push(dayIndex)
  }
}

const toggleEditWeeklyDay = (dayIndex: number) => {
  if (!editingPlan.value?.repeatConfig) return
  if (!editingPlan.value.repeatConfig.weeklyDays) editingPlan.value.repeatConfig.weeklyDays = []
  const days = editingPlan.value.repeatConfig.weeklyDays
  if (days.includes(dayIndex)) {
    editingPlan.value.repeatConfig.weeklyDays = days.filter(d => d !== dayIndex)
  } else {
    editingPlan.value.repeatConfig.weeklyDays.push(dayIndex)
  }
}

const toggleMonthlyDay = (day: number) => {
  if (!newPlan.value.repeatConfig) return
  if (!newPlan.value.repeatConfig.monthlyDays) newPlan.value.repeatConfig.monthlyDays = []
  const days = newPlan.value.repeatConfig.monthlyDays
  if (days.includes(day)) {
    newPlan.value.repeatConfig.monthlyDays = days.filter(d => d !== day)
  } else {
    newPlan.value.repeatConfig.monthlyDays.push(day)
  }
}

const toggleEditMonthlyDay = (day: number) => {
  if (!editingPlan.value?.repeatConfig) return
  if (!editingPlan.value.repeatConfig.monthlyDays) editingPlan.value.repeatConfig.monthlyDays = []
  const days = editingPlan.value.repeatConfig.monthlyDays
  if (days.includes(day)) {
    editingPlan.value.repeatConfig.monthlyDays = days.filter(d => d !== day)
  } else {
    editingPlan.value.repeatConfig.monthlyDays.push(day)
  }
}

// 编辑子任务
const startEditingSubTask = (planId: string, subTaskId: string, currentTitle: string) => {
  editingSubTask.value = { planId, subTaskId }
  editTaskInput.value = currentTitle
}

const saveSubTaskEdit = async () => {
  if (!editingSubTask.value) return

  const { planId, subTaskId } = editingSubTask.value

  if (!editTaskInput.value.trim()) {
    toast.error('子任务内容不能为空')
    return
  }

  try {
    await planStepApi.update({
      id: parseInt(subTaskId),
      title: editTaskInput.value.trim()
    })
    toast.success('子任务已更新')

    // 重新加载计划列表
    await loadPlans()

    editingSubTask.value = null
    editTaskInput.value = ''
  } catch (error) {
    console.error('更新子任务失败', error)
    toast.error('更新子任务失败')
  }
}

const cancelSubTaskEdit = () => {
  editingSubTask.value = null
  editTaskInput.value = ''
}

const isEditingSubTask = (planId: string, subTaskId: string) => {
  return editingSubTask.value?.planId === planId && editingSubTask.value?.subTaskId === subTaskId
}

// 编辑计划
const startEditPlan = (plan: Plan) => {
  editingPlan.value = {
    ...plan,
    tags: plan.tags.join(', '),
    repeatConfig: plan.repeatConfig ? { ...plan.repeatConfig } : undefined,
    quadrant: plan.quadrant || null
  }
  showEditPlanModal.value = true
}

const handleEditPlan = async () => {
  if (!editingPlan.value) return

  if (!editingPlan.value.title.trim()) {
    toast.error('请输入计划标题')
    return
  }

  try {
    // 查找分类ID（"uncategorized" 表示未分类）
    const category = categories.value.find(c => c.name === editingPlan.value.category && c.name !== '全部')
    const categoryId = (editingPlan.value.category && editingPlan.value.category !== 'uncategorized' && category?.id)
      ? parseInt(category.id)
      : undefined

    // 转换重复配置
    const { repeatType, repeatConf } = convertRepeatConfigToApi(editingPlan.value.repeatConfig || null)

    const params: UpdatePlanParams = {
      id: parseInt(editingPlan.value.id),
      categoryId,
      title: editingPlan.value.title,
      priority: mapPriorityToApi(editingPlan.value.priority),
      quadrant: mapQuadrantToApi(editingPlan.value.quadrant || null),
      tags: editingPlan.value.tags || undefined,
      startTime: editingPlan.value.startTime || undefined,
      dueTime: editingPlan.value.dueTime || undefined,
      repeatType,
      repeatConf
    }

    await planApi.update(params)
    toast.success('计划已更新')

    // 重新加载计划列表
    await loadPlans()

    showEditPlanModal.value = false
    editingPlan.value = null
  } catch (error) {
    console.error('更新计划失败', error)
    toast.error('更新计划失败')
  }
}

// 删除计划
const confirmDeletePlan = (plan: Plan) => {
  deletingPlan.value = plan
  showDeletePlanDialog.value = true
}

const handleDeletePlan = async () => {
  if (!deletingPlan.value) return

  try {
    await planApi.delete(parseInt(deletingPlan.value.id))
    toast.success('计划已删除')

    // 重新加载计划列表
    await loadPlans()

    showDeletePlanDialog.value = false
    deletingPlan.value = null
  } catch (error) {
    console.error('删除计划失败', error)
    toast.error('删除计划失败')
  }
}

// 删除子任务
const confirmDeleteSubTask = (planId: string, subTask: SubTask) => {
  deletingSubTask.value = { planId, subTaskId: subTask.id, subTaskTitle: subTask.title }
  showDeleteSubTaskDialog.value = true
}

const handleDeleteSubTask = async () => {
  if (!deletingSubTask.value) return

  try {
    await planStepApi.delete(parseInt(deletingSubTask.value.subTaskId))
    toast.success('子任务已删除')

    // 重新加载计划列表
    await loadPlans()

    showDeleteSubTaskDialog.value = false
    deletingSubTask.value = null
  } catch (error) {
    console.error('删除子任务失败', error)
    toast.error('删除子任务失败')
  }
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
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Plus :size="16" />
                <span>新建计划</span>
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
                  <h3 class="text-[12px] font-bold uppercase tracking-[0.2em] opacity-40">分类过滤</h3>
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
              <!-- 暂无计划提示 -->
              <div
                v-if="filteredPlans.length === 0"
                class="border-2 border-dashed border-black/[0.05] rounded-[2.5rem] flex flex-col items-center justify-center p-16 bg-white"
              >
                <Inbox :size="64" class="mb-4 text-neutral-300" />
                <p class="text-[16px] mono font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2">暂无计划</p>
                <p class="text-[14px] text-neutral-300">该分类下还没有计划，点击右上方按钮创建新计划</p>
              </div>

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
                          'px-3 py-1 text-[14px] font-bold uppercase tracking-widest mono',
                          plan.completed ? 'bg-emerald-100 text-emerald-700' : getCategoryColor(plan.category === 'uncategorized' ? '未分类' : plan.category)
                        ]"
                        :variant="plan.completed ? 'default' : 'secondary'"
                      >
                        {{ plan.completed ? '已完成' : (plan.category === 'uncategorized' ? '未分类' : plan.category) }}
                      </Badge>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          @click="startEditPlan(plan)"
                          :disabled="plan.completed"
                          :class="[
                            'p-2 rounded-lg transition-all',
                            plan.completed
                              ? 'text-neutral-300 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                          ]"
                          title="编辑计划"
                        >
                          <Edit3 :size="14" />
                        </button>
                        <button
                          @click="confirmDeletePlan(plan)"
                          :disabled="plan.completed"
                          :class="[
                            'p-2 rounded-lg transition-all',
                            plan.completed
                              ? 'text-neutral-300 cursor-not-allowed'
                              : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                          ]"
                          title="删除计划"
                        >
                          <Trash2 :size="14" />
                        </button>
                      </div>
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
                        class="px-3 py-1.5 text-[12px] font-bold uppercase tracking-widest border-black/[0.05] bg-white text-neutral-400 shadow-sm"
                      >
                        #{{ tag }}
                      </Badge>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex flex-wrap items-center gap-5">
                      <div v-if="plan.startTime" class="flex items-center gap-2 text-[12px] mono text-neutral-400 uppercase tracking-tighter">
                        <CalendarIcon :size="16" />
                        <span>开始: {{ formatDateTime(plan.startTime) }}</span>
                      </div>
                      <div v-if="plan.dueTime" class="flex items-center gap-2 text-[12px] mono text-neutral-400 uppercase tracking-tighter">
                        <CalendarIcon :size="16" />
                        <span>截止: {{ formatDateTime(plan.dueTime) }}</span>
                      </div>
                      <div v-if="!plan.startTime && !plan.dueTime" class="flex items-center gap-2 text-[12px] mono text-neutral-400 uppercase tracking-tighter">
                        <CalendarIcon :size="16" />
                        <span>时间未设置</span>
                      </div>
                      <div class="flex flex-wrap items-center gap-1.5">
                        <!-- 重复标签 -->
                        <Badge
                          v-if="getRepeatLabel(plan.repeatConfig)"
                          class="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors"
                        >
                          <Repeat :size="11" class="shrink-0" />
                          <span>{{ getRepeatLabel(plan.repeatConfig) }}</span>
                        </Badge>

                        <!-- 四象限标签 -->
                        <Badge
                          v-if="plan.quadrant"
                          :class="[
                            'flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium hover:opacity-80 transition-opacity',
                            getQuadrantConfig(plan.quadrant)?.bg,
                            getQuadrantConfig(plan.quadrant)?.text
                          ]"
                        >
                          <component
                            :is="getQuadrantConfig(plan.quadrant)?.icon"
                            :size="11"
                            class="shrink-0"
                          />
                          <span>{{ getQuadrantConfig(plan.quadrant)?.label }}</span>
                        </Badge>

                        <!-- 优先级标签 -->
                        <Badge
                          :class="[
                            'flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium hover:opacity-80 transition-opacity',
                            getPriorityColor(plan.priority).bg,
                            getPriorityColor(plan.priority).text
                          ]"
                        >
                          <component
                            :is="getPriorityColor(plan.priority).icon"
                            :size="11"
                            class="shrink-0"
                          />
                          <span>{{ getPriorityLabel(plan.priority) }}</span>
                        </Badge>
                      </div>
                    </div>
                    <div class="flex justify-between items-end">
                      <span :class="[
                        'text-[12px] mono font-bold uppercase tracking-widest',
                        plan.completed ? 'text-emerald-600' : 'text-neutral-400'
                      ]">完成进度</span>
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
                    <Inbox :size="40" class="mb-1 text-neutral-500" />
                    <p class="text-[14px] mono uppercase tracking-widest text-neutral-550">暂无子任务</p>
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
                            <div class="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                              <button
                                @click.stop="startEditingSubTask(plan.id, st.id, st.title)"
                                :disabled="plan.completed"
                                :class="[
                                  'p-1.5 rounded-lg transition-all',
                                  plan.completed
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                                ]"
                                title="编辑子任务"
                              >
                                <Edit3 :size="14" />
                              </button>
                              <button
                                @click.stop="confirmDeleteSubTask(plan.id, st)"
                                :disabled="plan.completed"
                                :class="[
                                  'p-1.5 rounded-lg transition-all',
                                  plan.completed
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : 'text-neutral-400 hover:text-red-600 hover:bg-red-50'
                                ]"
                                title="删除子任务"
                              >
                                <Trash2 :size="14" />
                              </button>
                            </div>
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
                  <div class="mt-auto pt-3">
                    <div class="relative">
                      <Input
                        v-model="quickTaskInputs[plan.id]"
                        type="text"
                        placeholder="添加子任务..."
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
                <span class="text-[12px] mono font-bold uppercase tracking-[0.2em] text-neutral-300 group-hover:text-neutral-900 transition-colors">
                  新建计划
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
        <DialogTitle class="text-lg font-medium text-neutral-900">新建计划</DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          创建一个新的长期计划
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">计划标题</label>
          <Input
            v-model="newPlan.title"
            type="text"
            placeholder="例如：掌握 Rust 编程语言"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">所属分类</label>
            <Select v-model="newPlan.category">
              <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
                <SelectValue placeholder="未分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">未分类</SelectItem>
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
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">优先级</label>
            <Select v-model="newPlan.priority">
              <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低优先级</SelectItem>
                <SelectItem value="medium">中优先级</SelectItem>
                <SelectItem value="high">高优先级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">开始时间（可选）</label>
            <Input
              v-model="newPlan.startTime"
              type="datetime-local"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">截止时间（可选）</label>
            <Input
              v-model="newPlan.dueTime"
              type="datetime-local"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">任务四象限（可选）</label>
          <Select v-model="newPlan.quadrant">
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
              <SelectValue placeholder="无（默认）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="null">无（默认）</SelectItem>
              <SelectItem value="urgent-important">紧急重要 - 立即处理</SelectItem>
              <SelectItem value="urgent-not-important">紧急不重要 - 快速处理</SelectItem>
              <SelectItem value="not-urgent-important">重要不紧急 - 计划安排</SelectItem>
              <SelectItem value="not-urgent-not-important">不紧急不重要 - 暂不处理</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-3">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">重复时间（可选）</label>

          <!-- 重复类型选择 -->
          <Select
            :model-value="newPlan.repeatConfig?.type || null"
            @update:model-value="handleRepeatTypeChange"
          >
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
              <SelectValue placeholder="不重复" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="null">不重复</SelectItem>
              <SelectItem value="daily">每日</SelectItem>
              <SelectItem value="weekly">每周</SelectItem>
              <SelectItem value="monthly">每月</SelectItem>
              <SelectItem value="yearly">每年</SelectItem>
            </SelectContent>
          </Select>

          <!-- 每日配置 -->
          <div v-if="newPlan.repeatConfig?.type === 'daily'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">周期天数</label>
            <div class="flex items-center gap-2">
              <Input
                :model-value="newPlan.repeatConfig?.dailyInterval || 1"
                @update:model-value="(val) => {
                  if (newPlan.repeatConfig) {
                    newPlan.repeatConfig.dailyInterval = parseInt(String(val)) || 1
                  }
                }"
                type="number"
                min="1"
                class="w-24 px-3 py-2 bg-white border border-black/5 rounded-xl text-sm"
              />
              <span class="text-sm text-neutral-500">天</span>
            </div>
          </div>

          <!-- 每周配置 -->
          <div v-if="newPlan.repeatConfig?.type === 'weekly'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">选择星期</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(day, idx) in ['日', '一', '二', '三', '四', '五', '六']"
                :key="day"
                type="button"
                @click="toggleWeeklyDay(idx)"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  newPlan.repeatConfig?.weeklyDays?.includes(idx)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white border border-black/10 text-neutral-600 hover:border-indigo-300'
                ]"
              >
                周{{ day }}
              </button>
            </div>
            <p v-if="!newPlan.repeatConfig?.weeklyDays?.length" class="text-xs text-amber-600">请至少选择一天</p>
          </div>

          <!-- 每月配置 -->
          <div v-if="newPlan.repeatConfig?.type === 'monthly'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">选择日期</label>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              <button
                v-for="day in 31"
                :key="day"
                type="button"
                @click="toggleMonthlyDay(day)"
                :class="[
                  'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                  newPlan.repeatConfig?.monthlyDays?.includes(day)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white border border-black/10 text-neutral-600 hover:border-indigo-300'
                ]"
              >
                {{ day }}
              </button>
            </div>
            <p v-if="!newPlan.repeatConfig?.monthlyDays?.length" class="text-xs text-amber-600">请至少选择一天</p>
          </div>

          <!-- 每年配置 -->
          <div v-if="newPlan.repeatConfig?.type === 'yearly'" class="pl-4 space-y-3">
            <label class="text-xs text-neutral-500">选择月份和日期</label>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs text-neutral-400">月份</label>
                <Select
                  :model-value="newPlan.repeatConfig?.yearlyMonth"
                  @update:model-value="(val) => {
                    if (newPlan.repeatConfig && val) newPlan.repeatConfig.yearlyMonth = Number(val)
                  }"
                >
                  <SelectTrigger class="w-full px-3 py-2 bg-white border border-black/5 rounded-xl text-sm">
                    <SelectValue placeholder="选择月" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in 12" :key="m" :value="String(m)">{{ m }}月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-400">日期</label>
                <Select
                  :model-value="newPlan.repeatConfig?.yearlyDay"
                  @update:model-value="(val) => {
                    if (newPlan.repeatConfig && val) newPlan.repeatConfig.yearlyDay = Number(val)
                  }"
                >
                  <SelectTrigger class="w-full px-3 py-2 bg-white border border-black/5 rounded-xl text-sm">
                    <SelectValue placeholder="选择日" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="d in 31" :key="d" :value="String(d)">{{ d }}日</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p v-if="!newPlan.repeatConfig?.yearlyMonth || !newPlan.repeatConfig?.yearlyDay" class="text-xs text-amber-600">请选择月份和日期</p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold tracking-widest text-neutral-400 ml-1">标签 (逗号分隔)</label>
          <Input
            v-model="newPlan.tags"
            type="text"
            placeholder="学习, 生活..."
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
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
          创建
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
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">分类名称</label>
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

  <!-- 编辑计划对话框 -->
  <Dialog v-model:open="showEditPlanModal">
    <DialogContent class="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900">编辑计划</DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          修改计划的详细信息
        </DialogDescription>
      </DialogHeader>

      <div v-if="editingPlan" class="space-y-6 py-4">
        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">计划标题</label>
          <Input
            v-model="editingPlan.title"
            type="text"
            placeholder="例如：掌握 Rust 编程语言"
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">所属分类（可选）</label>
            <Select v-model="editingPlan.category">
              <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
                <SelectValue placeholder="未分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncategorized">未分类</SelectItem>
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
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">优先级</label>
            <Select v-model="editingPlan.priority">
              <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">低优先级</SelectItem>
                <SelectItem value="medium">中优先级</SelectItem>
                <SelectItem value="high">高优先级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">开始时间（可选）</label>
            <Input
              v-model="editingPlan.startTime"
              type="datetime-local"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">截止时间（可选）</label>
            <Input
              v-model="editingPlan.dueTime"
              type="datetime-local"
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">任务四象限（可选）</label>
          <Select v-model="editingPlan.quadrant">
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
              <SelectValue placeholder="无（默认）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="null">无（默认）</SelectItem>
              <SelectItem value="urgent-important">紧急重要 - 立即处理</SelectItem>
              <SelectItem value="urgent-not-important">紧急不重要 - 快速处理</SelectItem>
              <SelectItem value="not-urgent-important">重要不紧急 - 计划安排</SelectItem>
              <SelectItem value="not-urgent-not-important">不紧急不重要 - 暂不处理</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-3">
          <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">重复时间（可选）</label>

          <!-- 重复类型选择 -->
          <Select
            :model-value="editingPlan.repeatConfig?.type || null"
            @update:model-value="handleEditRepeatTypeChange"
          >
            <SelectTrigger class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:ring-4 focus:ring-zinc-100 shadow-sm">
              <SelectValue placeholder="不重复" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="null">不重复</SelectItem>
              <SelectItem value="daily">每日</SelectItem>
              <SelectItem value="weekly">每周</SelectItem>
              <SelectItem value="monthly">每月</SelectItem>
              <SelectItem value="yearly">每年</SelectItem>
            </SelectContent>
          </Select>

          <!-- 每日配置 -->
          <div v-if="editingPlan.repeatConfig?.type === 'daily'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">周期天数</label>
            <div class="flex items-center gap-2">
              <Input
                :model-value="editingPlan.repeatConfig?.dailyInterval || 1"
                @update:model-value="(val) => {
                  if (editingPlan.repeatConfig) {
                    editingPlan.repeatConfig.dailyInterval = parseInt(String(val)) || 1
                  }
                }"
                type="number"
                min="1"
                class="w-24 px-3 py-2 bg-white border border-black/5 rounded-xl text-sm"
              />
              <span class="text-sm text-neutral-500">天</span>
            </div>
          </div>

          <!-- 每周配置 -->
          <div v-if="editingPlan.repeatConfig?.type === 'weekly'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">选择星期</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="(day, idx) in ['日', '一', '二', '三', '四', '五', '六']"
                :key="day"
                type="button"
                @click="toggleEditWeeklyDay(idx)"
                :class="[
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  editingPlan.repeatConfig?.weeklyDays?.includes(idx)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white border border-black/10 text-neutral-600 hover:border-indigo-300'
                ]"
              >
                周{{ day }}
              </button>
            </div>
            <p v-if="!editingPlan.repeatConfig?.weeklyDays?.length" class="text-xs text-amber-600">请至少选择一天</p>
          </div>

          <!-- 每月配置 -->
          <div v-if="editingPlan.repeatConfig?.type === 'monthly'" class="pl-4 space-y-2">
            <label class="text-xs text-neutral-500">选择日期</label>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              <button
                v-for="day in 31"
                :key="day"
                type="button"
                @click="toggleEditMonthlyDay(day)"
                :class="[
                  'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                  editingPlan.repeatConfig?.monthlyDays?.includes(day)
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white border border-black/10 text-neutral-600 hover:border-indigo-300'
                ]"
              >
                {{ day }}
              </button>
            </div>
            <p v-if="!editingPlan.repeatConfig?.monthlyDays?.length" class="text-xs text-amber-600">请至少选择一天</p>
          </div>

          <!-- 每年配置 -->
          <div v-if="editingPlan.repeatConfig?.type === 'yearly'" class="pl-4 space-y-3">
            <label class="text-xs text-neutral-500">选择月份和日期</label>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs text-neutral-400">月份</label>
                <Select
                  :model-value="String(editingPlan.repeatConfig?.yearlyMonth || '')"
                  @update:model-value="(val) => {
                    if (editingPlan.repeatConfig && val) editingPlan.repeatConfig.yearlyMonth = Number(val)
                  }"
                >
                  <SelectTrigger class="w-full px-3 py-2 bg-white border border-black/5 rounded-xl text-sm">
                    <SelectValue placeholder="选择月" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in 12" :key="m" :value="String(m)">{{ m }}月</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-400">日期</label>
                <Select
                  :model-value="String(editingPlan.repeatConfig?.yearlyDay || '')"
                  @update:model-value="(val) => {
                    if (editingPlan.repeatConfig && val) editingPlan.repeatConfig.yearlyDay = Number(val)
                  }"
                >
                  <SelectTrigger class="w-full px-3 py-2 bg-white border border-black/5 rounded-xl text-sm">
                    <SelectValue placeholder="选择日" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="d in 31" :key="d" :value="String(d)">{{ d }}日</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p v-if="!editingPlan.repeatConfig?.yearlyMonth || !editingPlan.repeatConfig?.yearlyDay" class="text-xs text-amber-600">请选择月份和日期</p>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[12px] font-bold tracking-widest text-neutral-400 ml-1">标签 (逗号分隔)</label>
          <Input
            v-model="editingPlan.tags"
            type="text"
            placeholder="学习, 生活..."
            class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showEditPlanModal = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleEditPlan"
          class="flex-1 bg-black text-white hover:bg-neutral-800 py-4 text-xs font-bold uppercase tracking-[0.2em]"
        >
          保存更改
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 删除计划确认对话框 -->
  <Dialog v-model:open="showDeletePlanDialog">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900 flex items-center gap-2">
          <AlertTriangle :size="20" class="text-red-500" />
          确认删除计划
        </DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          此操作无法撤销
        </DialogDescription>
      </DialogHeader>

      <div v-if="deletingPlan" class="py-4">
        <p class="text-neutral-700 mb-2">您确定要删除以下计划吗？</p>
        <div class="p-4 bg-red-50 rounded-xl border border-red-100">
          <p class="font-medium text-neutral-900">{{ deletingPlan.title }}</p>
          <p class="text-xs text-neutral-500 mt-1">
            {{ deletingPlan.subTasks.length }} 个子任务将会被同时删除
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showDeletePlanDialog = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleDeletePlan"
          variant="destructive"
          class="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          确认删除
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 删除子任务确认对话框 -->
  <Dialog v-model:open="showDeleteSubTaskDialog">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-medium text-neutral-900 flex items-center gap-2">
          <AlertTriangle :size="20" class="text-red-500" />
          确认删除子任务
        </DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          此操作无法撤销
        </DialogDescription>
      </DialogHeader>

      <div v-if="deletingSubTask" class="py-4">
        <p class="text-neutral-700 mb-2">您确定要删除以下子任务吗？</p>
        <div class="p-4 bg-red-50 rounded-xl border border-red-100">
          <p class="font-medium text-neutral-900">{{ deletingSubTask.subTaskTitle }}</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="showDeleteSubTaskDialog = false" class="flex-1">
          取消
        </Button>
        <Button
          @click="handleDeleteSubTask"
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

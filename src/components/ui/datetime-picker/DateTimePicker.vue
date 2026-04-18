<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  placeholder?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择日期时间'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

// 解析日期时间字符串
const parseDateTime = (dateTimeStr?: string) => {
  if (!dateTimeStr) return { date: undefined, hours: 0, minutes: 0 }
  const date = new Date(dateTimeStr)
  return {
    date: date,
    hours: date.getHours(),
    minutes: date.getMinutes()
  }
}

// 格式化为 datetime-local 格式 (YYYY-MM-DDTHH:mm)
const formatDateTime = (date: Date, hours: number, minutes: number) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  return `${year}-${month}-${day}T${h}:${m}`
}

// 格式化显示 (中文格式)
const formatDisplay = (date: Date, hours: number, minutes: number) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const h = String(hours).padStart(2, '0')
  const m = String(minutes).padStart(2, '0')
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
  return `${year}年${month}月${day}日 周${weekday} ${h}:${m}`
}

// 当前视图的年月
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())

// 选中的日期
const selectedDate = ref<Date>()
const selectedHours = ref(0)
const selectedMinutes = ref(0)

// 初始化值
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const parsed = parseDateTime(newVal)
    if (parsed.date) {
      selectedDate.value = parsed.date
      selectedHours.value = parsed.hours
      selectedMinutes.value = parsed.minutes
      viewYear.value = parsed.date.getFullYear()
      viewMonth.value = parsed.date.getMonth()
    }
  }
}, { immediate: true })

// 获取当前视图月份的日历数据
const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1)
  const lastDay = new Date(viewYear.value, viewMonth.value + 1, 0)
  const startDayOfWeek = firstDay.getDay() // 0-6
  const daysInMonth = lastDay.getDate()

  const days: Array<{ date: number; isCurrentMonth: boolean; fullDate?: Date }> = []

  // 上个月的日期
  const prevMonthLastDay = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      isCurrentMonth: false
    })
  }

  // 当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: i,
      isCurrentMonth: true,
      fullDate: new Date(viewYear.value, viewMonth.value, i)
    })
  }

  // 下个月的日期
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      isCurrentMonth: false
    })
  }

  return days
})

// 星期标题
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 选择日期
const selectDate = (day: typeof calendarDays.value[0]) => {
  if (day.fullDate) {
    selectedDate.value = day.fullDate
    emitValue()
  }
}

// 上一个月
const prevMonth = () => {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

// 下一个月
const nextMonth = () => {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

// 检查是否是选中的日期
const isSelected = (day: typeof calendarDays.value[0]) => {
  if (!day.fullDate || !selectedDate.value) return false
  return day.fullDate.getTime() === selectedDate.value.getTime()
}

// 检查是否是今天
const isToday = (day: typeof calendarDays.value[0]) => {
  if (!day.fullDate) return false
  const today = new Date()
  return day.fullDate.getTime() === new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
}

// 发送值更新
const emitValue = () => {
  if (selectedDate.value) {
    emit('update:modelValue', formatDateTime(selectedDate.value, selectedHours.value, selectedMinutes.value))
  }
}

// 更新时间
const updateTime = () => {
  // 确保小时在 0-23 范围内
  if (selectedHours.value < 0) selectedHours.value = 0
  if (selectedHours.value > 23) selectedHours.value = 23

  // 确保分钟在 0-59 范围内
  if (selectedMinutes.value < 0) selectedMinutes.value = 0
  if (selectedMinutes.value > 59) selectedMinutes.value = 59

  emitValue()
}

// 处理小时输入
const handleHoursInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  // 即时限制范围
  if (value > 23) value = 23
  if (value < 0) value = 0

  selectedHours.value = value
  emitValue() // 输入时立即更新
}

// 处理分钟输入
const handleMinutesInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  // 即时限制范围
  if (value > 59) value = 59
  if (value < 0) value = 0

  selectedMinutes.value = value
  emitValue() // 输入时立即更新
}

// 处理小时失焦（只做范围验证，不更新值）
const handleHoursBlur = () => {
  if (selectedHours.value < 0) selectedHours.value = 0
  if (selectedHours.value > 23) selectedHours.value = 23
  // 不调用 emitValue()，避免与清除操作冲突
}

// 处理分钟失焦（只做范围验证，不更新值）
const handleMinutesBlur = () => {
  if (selectedMinutes.value < 0) selectedMinutes.value = 0
  if (selectedMinutes.value > 59) selectedMinutes.value = 59
  // 不调用 emitValue()，避免与清除操作冲突
}

const displayValue = computed(() => {
  if (selectedDate.value) {
    return formatDisplay(selectedDate.value, selectedHours.value, selectedMinutes.value)
  }
  return ''
})

const handleClear = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  emit('update:modelValue', '')
  selectedDate.value = undefined
  selectedHours.value = 0
  selectedMinutes.value = 0
}

const handleOpenChange = (open: boolean) => {
  isOpen.value = open
  if (open && props.modelValue) {
    const parsed = parseDateTime(props.modelValue)
    if (parsed.date) {
      viewYear.value = parsed.date.getFullYear()
      viewMonth.value = parsed.date.getMonth()
    }
  }
}
</script>

<template>
  <Popover :open="isOpen" @update:open="handleOpenChange">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        :class="cn(
          'w-full justify-start text-left font-normal px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm hover:bg-stone-100',
          !modelValue && 'text-muted-foreground',
          props.class
        )"
      >
        <CalendarIcon class="mr-2 h-4 w-4 opacity-50" />
        <span class="flex-1">{{ displayValue || placeholder }}</span>
        <X
          v-if="modelValue"
          class="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
          @click.stop="handleClear"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-auto p-0" align="start">
      <div class="p-3 space-y-3">
        <!-- 日历头部 -->
        <div class="flex items-center justify-between">
          <button
            @click="prevMonth"
            class="p-1 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ChevronLeft :size="16" />
          </button>
          <div class="text-sm font-medium">
            {{ viewYear }}年 {{ viewMonth + 1 }}月
          </div>
          <button
            @click="nextMonth"
            class="p-1 hover:bg-stone-100 rounded-md transition-colors"
          >
            <ChevronRight :size="16" />
          </button>
        </div>

        <!-- 星期标题 -->
        <div class="grid grid-cols-7 gap-1 text-center">
          <div
            v-for="day in weekDays"
            :key="day"
            class="text-xs text-muted-foreground py-1"
          >
            {{ day }}
          </div>
        </div>

        <!-- 日期网格 -->
        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="(day, index) in calendarDays"
            :key="index"
            @click="selectDate(day)"
            :class="cn(
              'h-8 w-8 text-sm rounded-md transition-colors',
              !day.isCurrentMonth && 'text-muted-foreground opacity-30',
              day.isCurrentMonth && 'hover:bg-stone-100',
              isSelected(day) && 'bg-black text-white hover:bg-black',
              isToday(day) && !isSelected(day) && 'border border-black/20'
            )"
            :disabled="!day.isCurrentMonth"
          >
            {{ day.date }}
          </button>
        </div>

        <!-- 时间选择 -->
        <div class="border-t pt-3">
          <div class="flex items-center gap-2">
            <span class="text-xs text-muted-foreground whitespace-nowrap">选择时间:</span>
            <div class="flex items-center gap-1">
              <Input
                :model-value="String(selectedHours).padStart(2, '0')"
                type="number"
                min="0"
                max="23"
                placeholder="00"
                class="w-16 h-9 text-center text-sm"
                @input="handleHoursInput"
                @blur="handleHoursBlur"
              />
              <span class="text-sm">:</span>
              <Input
                :model-value="String(selectedMinutes).padStart(2, '0')"
                type="number"
                min="0"
                max="59"
                placeholder="00"
                class="w-16 h-9 text-center text-sm"
                @input="handleMinutesInput"
                @blur="handleMinutesBlur"
              />
            </div>
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

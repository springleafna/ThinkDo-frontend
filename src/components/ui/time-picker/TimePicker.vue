<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string
  placeholder?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择时间'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

// 解析时间字符串 (HH:mm 或 HH:mm:ss)
const parseTime = (timeStr?: string) => {
  if (!timeStr) return { hours: 0, minutes: 0 }

  // 如果是 HH:mm 格式
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/)
  if (match && match[1] && match[2]) {
    return {
      hours: parseInt(match[1]) || 0,
      minutes: parseInt(match[2]) || 0
    }
  }

  // 如果是完整日期时间格式
  try {
    const date = new Date(timeStr)
    return {
      hours: date.getHours(),
      minutes: date.getMinutes()
    }
  } catch (e) {
    return { hours: 0, minutes: 0 }
  }
}

// 初始化时间
const { hours, minutes } = parseTime(props.modelValue)

const selectedHours = ref(hours)
const selectedMinutes = ref(minutes)

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    const parsed = parseTime(newVal)
    selectedHours.value = parsed.hours
    selectedMinutes.value = parsed.minutes
  }
})

// 格式化显示 (中文格式)
const formatDisplay = (h: number, m: number) => {
  return `${String(h).padStart(2, '0')}时${String(m).padStart(2, '0')}分`
}

// 格式化为 HH:mm
const formatTime = (h: number, m: number) => {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 处理小时输入
const handleHoursInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  // 即时限制范围
  if (value > 23) value = 23
  if (value < 0) value = 0

  selectedHours.value = value
  emitValue()
}

// 处理分钟输入
const handleMinutesInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let value = parseInt(target.value) || 0

  // 即时限制范围
  if (value > 59) value = 59
  if (value < 0) value = 0

  selectedMinutes.value = value
  emitValue()
}

// 处理小时失焦（只做范围验证）
const handleHoursBlur = () => {
  if (selectedHours.value < 0) selectedHours.value = 0
  if (selectedHours.value > 23) selectedHours.value = 23
  emitValue()
}

// 处理分钟失焦（只做范围验证）
const handleMinutesBlur = () => {
  if (selectedMinutes.value < 0) selectedMinutes.value = 0
  if (selectedMinutes.value > 59) selectedMinutes.value = 59
  emitValue()
}

// 发送值更新
const emitValue = () => {
  emit('update:modelValue', formatTime(selectedHours.value, selectedMinutes.value))
}

const displayValue = computed(() => {
  return formatDisplay(selectedHours.value, selectedMinutes.value)
})

const handleClear = () => {
  emit('update:modelValue', '')
  selectedHours.value = 0
  selectedMinutes.value = 0
}

const handleOpenChange = (open: boolean) => {
  isOpen.value = open
}
</script>

<template>
  <Popover :open="isOpen" @update:open="handleOpenChange">
    <div class="relative w-full">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="cn(
            'w-full justify-start text-left font-normal px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm shadow-sm hover:bg-stone-100',
            !modelValue && 'text-muted-foreground',
            props.class
          )"
        >
          <Clock class="mr-2 h-4 w-4 opacity-50" />
          <span class="flex-1">{{ displayValue || placeholder }}</span>
        </Button>
      </PopoverTrigger>
      <X
        v-if="modelValue"
        class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer z-10"
        @click="handleClear"
      />
    </div>
    <PopoverContent class="w-auto p-4" align="start">
      <div class="space-y-3">
        <div class="text-sm font-medium text-neutral-900">选择时间</div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1 flex-1">
            <Input
              :model-value="String(selectedHours).padStart(2, '0')"
              type="number"
              min="0"
              max="23"
              placeholder="00"
              class="w-20 h-10 text-center text-sm"
              @input="handleHoursInput"
              @blur="handleHoursBlur"
            />
            <span class="text-sm font-medium">时</span>
          </div>
          <span class="text-lg">:</span>
          <div class="flex items-center gap-1 flex-1">
            <Input
              :model-value="String(selectedMinutes).padStart(2, '0')"
              type="number"
              min="0"
              max="59"
              placeholder="00"
              class="w-20 h-10 text-center text-sm"
              @input="handleMinutesInput"
              @blur="handleMinutesBlur"
            />
            <span class="text-sm font-medium">分</span>
          </div>
        </div>
        <!-- 快捷选择 -->
        <div class="grid grid-cols-4 gap-2 pt-2">
          <button
            @click="selectedHours = 6; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            早上 6:00
          </button>
          <button
            @click="selectedHours = 9; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            上午 9:00
          </button>
          <button
            @click="selectedHours = 12; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            中午 12:00
          </button>
          <button
            @click="selectedHours = 14; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            下午 2:00
          </button>
          <button
            @click="selectedHours = 18; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            晚上 6:00
          </button>
          <button
            @click="selectedHours = 20; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            晚上 8:00
          </button>
          <button
            @click="selectedHours = 22; selectedMinutes = 0; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            晚上 10:00
          </button>
          <button
            @click="selectedHours = 23; selectedMinutes = 59; emitValue()"
            class="px-2 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
          >
            23:59
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

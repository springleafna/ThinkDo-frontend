<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Sparkles,
  LayoutDashboard,
  Target,
  CalendarCheck,
  BookText,
  StickyNote,
  Grid2x2,
  Library,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-vue-next'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { toast } from 'vue-sonner'

const router = useRouter()
const userStore = useUserStore()

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()

const activeView = defineModel<string>('activeView')

const navigation = [
  { id: 'dashboard', label: '中控控制台', icon: LayoutDashboard },
  { id: 'ai-chat', label: 'AI 智库', icon: Sparkles },
  { id: 'knowledge-base', label: '知识库', icon: Library },
  { id: 'quadrant', label: '四象限分析', icon: Grid2x2 },
  { id: 'long-term', label: '我的计划', icon: Target },
  { id: 'daily', label: '每日清单', icon: CalendarCheck },
  { id: 'notes', label: '思维笔记', icon: BookText },
  { id: 'sticky', label: '快捷便签', icon: StickyNote }
]

const handleLogout = async () => {
  try {
    // 调用后端退出登录接口
    await userApi.logout()

    // 清空本地状态
    userStore.logout()

    toast.success('已安全退出')

    // 跳转到登录页
    router.push('/auth')
  } catch (error) {
    // 即使接口失败，也清空本地状态并跳转
    userStore.logout()
    router.push('/auth')
  }
}

const handleNavigation = (viewId: string) => {
  activeView.value = viewId

  // 如果是"我的计划"菜单,跳转到独立路由页面
  if (viewId === 'long-term') {
    router.push('/plan')
  }
}
</script>

<template>
  <aside
    :class="[
      'transition-all duration-500 border-r border-black/5 bg-transparent flex flex-col z-40',
      isOpen ? 'w-60' : 'w-16'
    ]"
  >
    <div
      :class="[
        'py-6 flex items-center transition-all',
        isOpen ? 'px-6 justify-between' : 'px-0 justify-center'
      ]"
    >
      <div class="flex items-center gap-3">
        <div class="bg-[#18181b] text-white p-2 rounded-xl shadow-lg shadow-black/5 shrink-0">
          <Sparkles :size="18" />
        </div>
        <span
          v-if="isOpen"
          class="font-medium text-xl tracking-tight text-neutral-900 whitespace-nowrap overflow-hidden"
        >
          ThinkDo
        </span>
      </div>
      <button
        v-if="isOpen"
        @click="emit('toggle')"
        class="p-1.5 hover:bg-black/5 rounded-lg text-neutral-400 hover:text-neutral-900 transition-all"
      >
        <PanelLeftClose :size="18" />
      </button>
    </div>

    <div v-if="!isOpen" class="flex justify-center py-2">
      <button
        @click="emit('toggle')"
        class="p-1.5 hover:bg-black/5 rounded-lg text-neutral-400 hover:text-neutral-900 transition-all"
      >
        <PanelLeftOpen :size="18" />
      </button>
    </div>

    <nav class="flex-1 px-3 space-y-1 mt-6">
      <button
        v-for="item in navigation"
        :key="item.id"
        @click="handleNavigation(item.id)"
        :class="[
          'w-full flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all duration-300',
          activeView === item.id
            ? 'bg-zinc-100 text-zinc-900 font-bold border border-zinc-200/50 shadow-sm'
            : 'text-neutral-400 hover:text-neutral-900 hover:bg-black/5'
        ]"
        :title="!isOpen ? item.label : undefined"
      >
        <component
          :is="item.icon"
          :size="18"
          :class="[activeView === item.id ? 'opacity-100' : 'opacity-40', 'shrink-0']"
        />
        <span v-if="isOpen" class="text-sm tracking-tight whitespace-nowrap">
          {{ item.label }}
        </span>
      </button>
    </nav>

    <div class="p-4 border-t border-black/5 flex flex-col gap-2">
      <div :class="['flex items-center gap-3 px-2 py-2', !isOpen ? 'justify-center' : '']">
        <div class="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center bg-white shadow-sm shrink-0">
          <User :size="14" class="opacity-60" />
        </div>
        <div v-if="isOpen" class="flex-1 overflow-hidden">
          <p class="text-[11px] font-medium truncate">{{ userStore.username || '未登录' }}</p>
          <p class="mono text-[8px] opacity-40 uppercase tracking-tighter">在线连接</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        :class="[
          'flex items-center gap-3 px-2 py-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all',
          !isOpen ? 'justify-center' : ''
        ]"
        title="退出登录"
      >
        <LogOut :size="16" class="shrink-0" />
        <span v-if="isOpen" class="text-[10px] font-bold uppercase tracking-widest">
          终止会话
        </span>
      </button>
    </div>
  </aside>
</template>

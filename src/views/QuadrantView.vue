<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import {
  Plus,
  Check,
  Trash2,
  Zap,
  Calendar,
  Users,
  Trash
} from 'lucide-vue-next'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const layoutStore = useLayoutStore()
const activeView = ref('quadrant')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 任务接口
interface QuadrantTask {
  id: number
  text: string
  done: boolean
}

// 象限数据接口
interface QuadrantData {
  id: string
  title: string
  subtitle: string
  description: string
  icon: any
  color: string
  tasks: QuadrantTask[]
}

// 象限数据
const data = ref<QuadrantData[]>([
  {
    id: 'q1',
    title: '重要且紧急',
    subtitle: 'DO IT NOW',
    description: '立即处理，危机管理。',
    icon: Zap,
    color: 'bg-rose-50 border-rose-200 text-rose-900',
    tasks: [
      { id: 1, text: '提交 Q4 季度财务报表', done: false },
      { id: 2, text: '修复核心交易系统的 P0 级 Bug', done: true }
    ]
  },
  {
    id: 'q2',
    title: '重要但不紧急',
    subtitle: 'SCHEDULE IT',
    description: '长期规划，自我提升。',
    icon: Calendar,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    tasks: [
      { id: 3, text: '精读《系统架构：复杂系统的设计》', done: false },
      { id: 4, text: '更新个人作品集网站', done: false }
    ]
  },
  {
    id: 'q3',
    title: '不重要但紧急',
    subtitle: 'DELEGATE IT',
    description: '琐碎事务，尽量授权。',
    icon: Users,
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    tasks: [
      { id: 5, text: '回复周五团建的确认邮件', done: true },
      { id: 6, text: '整理下周会议的录音材料', done: false }
    ]
  },
  {
    id: 'q4',
    title: '不重要且不紧急',
    subtitle: 'ELIMINATE IT',
    description: '消遣娱乐，断舍离。',
    icon: Trash,
    color: 'bg-stone-50 border-stone-200 text-stone-900',
    tasks: [
      { id: 7, text: '浏览社交媒体的热搜信息', done: false },
      { id: 8, text: '整理旧相册里的无关截图', done: true }
    ]
  }
])

// 切换任务状态
const toggleTask = (qId: string, taskId: number) => {
  const quadrant = data.value.find(q => q.id === qId)
  if (quadrant) {
    const task = quadrant.tasks.find(t => t.id === taskId)
    if (task) {
      task.done = !task.done
    }
  }
}

// 删除任务
const deleteTask = (qId: string, taskId: number) => {
  const quadrant = data.value.find(q => q.id === qId)
  if (quadrant) {
    quadrant.tasks = quadrant.tasks.filter(t => t.id !== taskId)
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[600px]">
            <div
              v-for="quadrant in data"
              :key="quadrant.id"
              :class="['woven-border rounded-[2.5rem] p-8 flex flex-col card-hover shadow-sm', quadrant.color]"
            >
              <div class="flex justify-between items-start mb-6">
                <div class="flex items-center gap-4">
                  <div class="bg-white/60 p-3 rounded-2xl shadow-sm">
                    <component :is="quadrant.icon" :size="24" :stroke-width="1.5" />
                  </div>
                  <div>
                    <h2 class="text-lg font-bold tracking-tight">{{ quadrant.title }}</h2>
                    <p class="mono text-[10px] font-bold opacity-40 tracking-widest">{{ quadrant.subtitle }}</p>
                  </div>
                </div>
                <button class="p-2 hover:bg-white/40 rounded-full transition-colors">
                  <Plus :size="18" class="opacity-40" />
                </button>
              </div>

              <p class="text-xs italic mb-8 opacity-60 leading-relaxed">
                {{ quadrant.description }}
              </p>

              <div class="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
                <div
                  v-for="task in quadrant.tasks"
                  :key="task.id"
                  class="flex items-center group gap-4 p-4 bg-white/40 rounded-2xl border border-transparent hover:border-black/5 transition-all"
                >
                  <button
                    @click="toggleTask(quadrant.id, task.id)"
                    :class="[
                      'w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300',
                      task.done ? 'bg-black border-black' : 'bg-white/50 border-black/10 hover:border-black/30'
                    ]"
                  >
                    <Check
                      :size="12"
                      :class="['text-white transition-transform', task.done ? 'scale-100' : 'scale-0']"
                    />
                  </button>
                  <span
                    :class="[
                      'flex-1 text-sm font-medium',
                      task.done ? 'opacity-30 line-through' : 'text-neutral-900'
                    ]"
                  >
                    {{ task.text }}
                  </span>
                  <button
                    @click="deleteTask(quadrant.id, task.id)"
                    class="opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-rose-600 transition-all"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
                <div
                  v-if="quadrant.tasks.length === 0"
                  class="h-20 flex items-center justify-center border-2 border-dashed border-black/5 rounded-2xl text-[10px] mono opacity-20 uppercase tracking-widest"
                >
                  No active segments
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-black/5">
                <input
                  type="text"
                  placeholder="Append new objective..."
                  class="w-full bg-transparent text-sm italic focus:outline-none opacity-40 focus:opacity-100 transition-opacity"
                />
              </div>
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

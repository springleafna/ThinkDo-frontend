<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import { planApi, type Plan } from '@/api/plan'
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

// 象限数据接口
interface QuadrantData {
  id: string
  title: string
  subtitle: string
  description: string
  icon: any
  color: string
  tasks: Plan[]
}

// 象限配置
const quadrantConfigs = [
  {
    id: 'q1',
    title: '重要且紧急',
    subtitle: 'DO IT NOW',
    description: '立即处理，危机管理。',
    icon: Zap,
    color: 'bg-rose-50 border-rose-200 text-rose-900',
    key: 'importantUrgent' as keyof QuadrantData
  },
  {
    id: 'q2',
    title: '重要但不紧急',
    subtitle: 'SCHEDULE IT',
    description: '长期规划，自我提升。',
    icon: Calendar,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    key: 'importantNotUrgent' as keyof QuadrantData
  },
  {
    id: 'q3',
    title: '不重要但紧急',
    subtitle: 'DELEGATE IT',
    description: '琐碎事务，尽量授权。',
    icon: Users,
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    key: 'urgentNotImportant' as keyof QuadrantData
  },
  {
    id: 'q4',
    title: '不重要且不紧急',
    subtitle: 'ELIMINATE IT',
    description: '消遣娱乐，断舍离。',
    icon: Trash,
    color: 'bg-stone-50 border-stone-200 text-stone-900',
    key: 'notImportantNotUrgent' as keyof QuadrantData
  }
]

// 象限数据
const data = ref<QuadrantData[]>([])
const loading = ref(false)

// 获取四象限数据
const fetchQuadrantData = async () => {
  try {
    loading.value = true
    const response = await planApi.getQuadrantPlans()

    // 将 API 数据转换为象限数据格式
    data.value = quadrantConfigs.map(config => ({
      ...config,
      tasks: response[config.key] || []
    }))
  } catch (error) {
    console.error('获取四象限数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换任务状态
const toggleTask = async (qId: string, taskId: number) => {
  const quadrant = data.value.find(q => q.id === qId)
  if (quadrant) {
    const task = quadrant.tasks.find(t => t.id === taskId)
    if (task) {
      // 乐观更新 UI
      task.status = task.status === 1 ? 0 : 1
      try {
        // 调用 API 切换状态
        await planApi.toggleStatus(taskId)
      } catch (error) {
        // 如果失败，恢复原状态
        task.status = task.status === 1 ? 0 : 1
        console.error('切换任务状态失败:', error)
      }
    }
  }
}

// 删除任务
const deleteTask = async (qId: string, taskId: number) => {
  const quadrant = data.value.find(q => q.id === qId)
  if (quadrant) {
    try {
      await planApi.delete(taskId)
      quadrant.tasks = quadrant.tasks.filter(t => t.id !== taskId)
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }
}

// 限制显示的任务数量
const MAX_DISPLAY_TASKS = 2

onMounted(() => {
  fetchQuadrantData()
})
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

              <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[130px]">
                <div class="space-y-3">
                  <div
                    v-for="task in quadrant.tasks.slice(0, MAX_DISPLAY_TASKS)"
                    :key="task.id"
                    class="flex items-center group gap-4 p-4 bg-white/40 rounded-2xl border border-transparent hover:border-black/5 transition-all"
                  >
                    <button
                      @click="toggleTask(quadrant.id, task.id)"
                      :class="[
                        'w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300',
                        task.status === 1 ? 'bg-black border-black' : 'bg-white/50 border-black/10 hover:border-black/30'
                      ]"
                    >
                      <Check
                        :size="12"
                        :class="['text-white transition-transform', task.status === 1 ? 'scale-100' : 'scale-0']"
                      />
                    </button>
                    <div class="flex-1 min-w-0">
                      <span
                        :class="[
                          'text-sm font-medium block truncate',
                          task.status === 1 ? 'opacity-30 line-through' : 'text-neutral-900'
                        ]"
                      >
                        {{ task.title }}
                      </span>
                      <span
                        v-if="task.dueTime"
                        class="text-[10px] opacity-40 truncate block"
                      >
                        {{ new Date(task.dueTime).toLocaleDateString() }}
                      </span>
                    </div>
                    <button
                      @click="deleteTask(quadrant.id, task.id)"
                      class="opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-rose-600 transition-all flex-shrink-0"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </div>
                </div>

                <!-- 更多任务，可滚动查看 -->
                <div
                  v-if="quadrant.tasks.length > MAX_DISPLAY_TASKS"
                  class="mt-3"
                >
                  <div class="space-y-3">
                    <div
                      v-for="task in quadrant.tasks.slice(MAX_DISPLAY_TASKS)"
                      :key="task.id"
                      class="flex items-center group gap-4 p-4 bg-white/30 rounded-2xl border border-transparent hover:border-black/5 transition-all"
                    >
                      <button
                        @click="toggleTask(quadrant.id, task.id)"
                        :class="[
                          'w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300',
                          task.status === 1 ? 'bg-black border-black' : 'bg-white/50 border-black/10 hover:border-black/30'
                        ]"
                      >
                        <Check
                          :size="12"
                          :class="['text-white transition-transform', task.status === 1 ? 'scale-100' : 'scale-0']"
                        />
                      </button>
                      <div class="flex-1 min-w-0">
                        <span
                          :class="[
                            'text-sm font-medium block truncate',
                            task.status === 1 ? 'opacity-30 line-through' : 'text-neutral-900'
                          ]"
                        >
                          {{ task.title }}
                        </span>
                        <span
                          v-if="task.dueTime"
                          class="text-[10px] opacity-40 truncate block"
                        >
                          {{ new Date(task.dueTime).toLocaleDateString() }}
                        </span>
                      </div>
                      <button
                        @click="deleteTask(quadrant.id, task.id)"
                        class="opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-rose-600 transition-all flex-shrink-0"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-if="quadrant.tasks.length === 0"
                  class="h-20 flex items-center justify-center border-2 border-dashed border-black/5 rounded-2xl text-[14px] mono opacity-20 uppercase tracking-widest"
                >
                  暂无计划
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-black/5">
                <input
                  type="text"
                  placeholder="添加计划"
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

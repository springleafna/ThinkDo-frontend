<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, X } from 'lucide-vue-next'

defineProps<{
  activeView: string
}>()

const showNotifications = ref(false)
const time = ref('')

const updateTime = () => {
  time.value = new Date().toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

let timer: number

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000) as unknown as number
})

onUnmounted(() => {
  clearInterval(timer)
})

const navigation: Record<string, string> = {
  dashboard: '中控控制台',
  'ai-chat': 'AI 智库',
  'knowledge-base': '知识库',
  quadrant: '四象限分析',
  'long-term': '我的计划',
  daily: '每日清单',
  notes: '思维笔记',
  sticky: '快捷便签'
}

const notifications = [
  {
    id: 1,
    title: '计划提醒',
    desc: '您的"React 19"学习进度已落后 2 天',
    time: '10 分钟前',
    type: 'warning'
  },
  {
    id: 2,
    title: '系统更新',
    desc: 'ThinkDo 算法节点已优化，建议查看新洞察',
    time: '1 小时前',
    type: 'info'
  },
  {
    id: 3,
    title: '同步成功',
    desc: '云端思维笔记已完成 12 个条目的增量同步',
    time: '3 小时前',
    type: 'success'
  }
]
</script>

<template>
  <header
    class="px-8 md:px-12 pt-8 pb-4 flex justify-between items-end section-reveal relative z-30"
    style="animation-delay: 0.1s"
  >
    <div>
      <span class="mono text-[10px] uppercase tracking-[0.2em] opacity-40 mb-2 block">
        System Operating Node
      </span>
      <h1 class="text-3xl font-light tracking-tight flex items-center gap-2 text-neutral-900">
        {{ navigation[activeView] }}
        <span class="text-zinc-300 font-light">/</span>
        <span class="opacity-40 font-light">归档记录</span>
      </h1>
    </div>
    <div class="flex gap-6 items-center relative">
      <div class="text-right hidden md:block">
        <p class="mono text-xs font-medium uppercase tracking-widest text-neutral-900">
          {{ time }}
        </p>
        <p class="text-[9px] opacity-30 mono tracking-tighter">状态: 活跃运行中</p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="showNotifications = !showNotifications"
          :class="[
            'relative p-2.5 bg-white border border-black/5 rounded-full shadow-sm transition-all hover:scale-105',
            showNotifications
              ? 'text-zinc-900 ring-4 ring-zinc-100 border-zinc-300'
              : 'text-neutral-500 hover:text-neutral-900'
          ]"
        >
          <Bell :size="18" />
          <span class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 -translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-4"
        >
          <div
            v-if="showNotifications"
            class="absolute top-full right-0 mt-4 w-80 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-black/5 z-[100] overflow-hidden"
          >
            <div class="p-6 border-b border-black/5 flex justify-between items-center bg-stone-50/50">
              <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-900">
                归档通知中心
              </h3>
              <button
                @click="showNotifications = false"
                class="text-neutral-300 hover:text-neutral-900 transition-colors"
              >
                <X :size="16" />
              </button>
            </div>
            <div class="max-h-[380px] overflow-y-auto custom-scrollbar">
              <div
                v-for="n in notifications"
                :key="n.id"
                class="p-5 border-b border-black/[0.03] hover:bg-stone-50 transition-colors flex gap-4 cursor-pointer group relative"
              >
                <div
                  :class="[
                    'w-1.5 h-1.5 rounded-full mt-2 shrink-0',
                    n.type === 'warning'
                      ? 'bg-amber-400'
                      : n.type === 'success'
                        ? 'bg-emerald-400'
                        : 'bg-zinc-400'
                  ]"
                ></div>
                <div>
                  <p class="text-xs font-bold text-neutral-900 group-hover:text-zinc-700 transition-colors">
                    {{ n.title }}
                  </p>
                  <p class="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                    {{ n.desc }}
                  </p>
                  <p class="text-[9px] mono opacity-30 mt-3 uppercase tracking-tighter">
                    {{ n.time }}
                  </p>
                </div>
              </div>
            </div>
            <button
              class="w-full py-5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-zinc-900 hover:bg-stone-50 transition-all border-t border-black/5"
            >
              清空系统日志
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
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
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>

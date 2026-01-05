<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Sparkles,
  Target,
  CalendarCheck,
  BookText,
  Library,
  ArrowRight,
  Zap,
  Shield,
  Globe
} from 'lucide-vue-next'

const router = useRouter()

const features = [
  {
    icon: Target,
    title: '长期愿景规划',
    desc: '定义你的宏大目标，并将其分解为可执行的战略里程碑。',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    icon: CalendarCheck,
    title: '每日执行系统',
    desc: '基于微习惯和高效清单，确保每一天的努力都契合长远目标。',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    icon: Sparkles,
    title: 'AI 深度洞察',
    desc: '集成顶级语言模型，协助你分析复杂任务并提供策略建议。',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    icon: Library,
    title: '中央知识库',
    desc: '构建你的第二大脑，沉淀思维碎片，形成结构化的知识体系。',
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  }
]

const onStart = () => {
  router.push('/auth')
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfaf7] overflow-x-hidden">
    <!-- Navigation -->
    <nav class="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex items-center gap-3">
        <div class="bg-[#1c1917] text-white p-2 rounded-xl shadow-lg">
          <Sparkles :size="20" />
        </div>
        <span class="font-light text-2xl tracking-tight text-neutral-900">ThinkDo</span>
      </div>
      <button
        @click="onStart"
        class="text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-indigo-600 transition-colors"
      >
        开始使用 →
      </button>
    </nav>

    <!-- Hero Section -->
    <section class="max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <Zap :size="14" />
        新一代个人生产力控制台
      </div>
      <h1 class="text-6xl md:text-8xl font-light tracking-tighter text-neutral-900 leading-[1.1] mb-10 section-reveal" style="animation-delay: 0.2s">
        将深邃思考<br /><span class="italic font-medium text-indigo-600">转化为</span>卓越行动
      </h1>
      <p class="max-w-2xl mx-auto text-lg text-neutral-400 font-light leading-relaxed mb-12 section-reveal" style="animation-delay: 0.3s">
        ThinkDo 是一个为长期主义者设计的生产力中枢。在这里，愿景不仅是空想，而是通过科学的执行层与 AI 智库辅助，一步步化为现实。
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 section-reveal" style="animation-delay: 0.4s">
        <button
          @click="onStart"
          class="group px-10 py-5 bg-black text-white rounded-[2rem] text-sm font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 flex items-center gap-3"
        >
          立即进入控制台
          <ArrowRight :size="18" class="group-hover:translate-x-1 transition-transform" />
        </button>
        <div class="flex items-center gap-4 text-neutral-400">
          <div class="flex -space-x-3">
            <div v-for="i in 4" :key="i" class="w-8 h-8 rounded-full border-2 border-[#fcfaf7] bg-stone-200"></div>
          </div>
          <span class="text-xs italic">已服务超过 5,000+ 深度思考者</span>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="bg-white border-y border-black/5 py-32">
      <div class="max-w-7xl mx-auto px-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div
            v-for="(feature, i) in features"
            :key="i"
            class="space-y-6 section-reveal"
            :style="{ animationDelay: `${0.2 + i * 0.1}s` }"
          >
            <div :class="[feature.bg, feature.color, 'w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm']">
              <component :is="feature.icon" :size="28" :stroke-width="1.5" />
            </div>
            <h3 class="text-xl font-medium text-neutral-900">{{ feature.title }}</h3>
            <p class="text-sm text-neutral-400 leading-relaxed">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Security -->
    <section class="max-w-7xl mx-auto px-8 py-32">
      <div class="woven-border bg-stone-50/50 p-12 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-12">
        <div class="max-w-lg space-y-6">
          <h2 class="text-3xl font-light tracking-tight text-neutral-900">数据主权与安全</h2>
          <p class="text-sm text-neutral-500 leading-relaxed">
            您的所有计划和思维笔记均经过端到端加密，并安全存储在分布式归档节点中。我们尊重每一比特的知识主权。
          </p>
          <div class="flex gap-8 pt-4">
            <div class="flex items-center gap-2 text-neutral-400">
              <Shield :size="16" />
              <span class="text-[10px] font-bold uppercase tracking-widest">端到端加密</span>
            </div>
            <div class="flex items-center gap-2 text-neutral-400">
              <Globe :size="16" />
              <span class="text-[10px] font-bold uppercase tracking-widest">分布式存储</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4 w-full lg:w-auto">
          <div class="bg-white p-8 rounded-3xl border border-black/5 shadow-sm text-center">
            <p class="text-3xl font-light text-neutral-900 mb-1">99.9%</p>
            <p class="text-[10px] mono uppercase tracking-widest opacity-40">系统可用性</p>
          </div>
          <div class="bg-white p-8 rounded-3xl border border-black/5 shadow-sm text-center">
            <p class="text-3xl font-light text-neutral-900 mb-1">0</p>
            <p class="text-[10px] mono uppercase tracking-widest opacity-40">数据泄露事件</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="max-w-7xl mx-auto px-8 py-12 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
      <p class="text-[10px] mono opacity-30 uppercase tracking-widest">© 2026 THINKDO ARCHIVE NODE. ALL RIGHTS RESERVED.</p>
      <div class="flex gap-8">
        <button class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">隐私协议</button>
        <button class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">服务条款</button>
        <button class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors">更新日志</button>
      </div>
    </footer>
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

.woven-border {
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}
</style>

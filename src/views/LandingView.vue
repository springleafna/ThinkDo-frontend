<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Database,
  FileEdit,
  Target,
  CheckSquare,
  Layers,
  BrainCircuit,
  Rocket
} from 'lucide-vue-next'

const router = useRouter()

// 基于项目文档提取的 5 大核心功能
const features = [
  {
    icon: MessageSquare,
    title: '智能对话与问答',
    desc: '围绕问题实时交流，结合沉淀知识提供辅助回答，大幅降低信息获取门槛。',
    gradient: 'from-blue-500 to-indigo-500',
    span: 'lg:col-span-2'
  },
  {
    icon: Database,
    title: '知识沉淀与检索',
    desc: '集中管理各类资料，让知识不再停留在“存进去”，而是随时可被检索和调用。',
    gradient: 'from-emerald-500 to-teal-500',
    span: 'lg:col-span-2'
  },
  {
    icon: FileEdit,
    title: '笔记与智能整理',
    desc: '提供智能润色、扩写、纠错等增强能力，让零散记录转化为结构化的知识资产。',
    gradient: 'from-orange-400 to-rose-400',
    span: 'lg:col-span-2'
  },
  {
    icon: Target,
    title: '计划制定与任务拆解',
    desc: '结合任务拆解、步骤管理和状态跟踪，将抽象的宏大目标拆解为可操作的具体行动。',
    gradient: 'from-purple-500 to-indigo-500',
    span: 'lg:col-span-3' // 底部两卡片更宽
  },
  {
    icon: CheckSquare,
    title: '每日执行与轻量记录',
    desc: '覆盖每日清单和便签场景，承接日常高频任务和临时事项，确保每一天都在推进。',
    gradient: 'from-cyan-500 to-blue-500',
    span: 'lg:col-span-3' // 底部两卡片更宽
  }
]

const onStart = () => {
  router.push('/auth')
}
</script>

<template>
  <div class="min-h-screen bg-[#fcfaf7] text-neutral-900 selection:bg-neutral-900 selection:text-white overflow-x-hidden font-sans">
    <!-- Navigation -->
    <nav class="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center animate-in fade-in slide-in-from-top-8 duration-1000">
      <div class="flex items-center gap-3 group cursor-pointer">
        <img src="/thinkdo_logo.png" alt="ThinkDo Logo" class="h-9 w-9 rounded-lg shadow-sm group-hover:shadow-md transition-all object-contain" />
        <span class="font-semibold text-xl tracking-tight">ThinkDo</span>
      </div>
      <button
        @click="onStart"
        class="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
      >
        开始使用 <ArrowRight :size="16" />
      </button>
    </nav>

    <!-- Hero Section (保留了原有的黑蓝文字对比设计) -->
    <section class="max-w-6xl mx-auto px-6 pt-24 pb-32 text-center relative">
      <!-- 呼吸灯状态标签 -->
      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-neutral-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-neutral-600 text-xs font-medium tracking-wide mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-40"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        新一代个人生产力平台
      </div>

      <!-- 恢复你喜欢的排版：部分黑色，部分蓝色斜体 -->
      <h1 class="text-5xl md:text-7xl font-semibold tracking-tight text-neutral-900 leading-[1.15] mb-8 section-reveal" style="animation-delay: 0.2s">
        将深邃思考<br />
        <span class="italic font-medium text-indigo-600">转化为</span>卓越行动
      </h1>
      
      <p class="max-w-2xl mx-auto text-lg text-neutral-500 font-light leading-relaxed mb-12 section-reveal" style="animation-delay: 0.3s">
        ThinkDo 是一个为长期主义者设计的知识管理平台。在这里，愿景不只是空想，而是通过科学的执行与 AI 的智能辅助，一步步将计划化为现实。
      </p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-6 section-reveal" style="animation-delay: 0.4s">
        <button
          @click="onStart"
          class="group px-8 py-4 bg-neutral-900 text-white rounded-2xl text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center gap-3"
        >
          进入控制台
          <ArrowRight :size="16" class="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>

    <!-- 核心功能：基于文档梳理的 5 大功能（非对称 Bento 布局） -->
    <section class="py-24 relative">
      <div class="absolute inset-0 bg-white border-y border-neutral-100/50 -z-10"></div>
      <div class="max-w-7xl mx-auto px-6">
        <div class="mb-16 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h2 class="text-2xl font-semibold tracking-tight text-neutral-900 mb-2">全面的个人管理能力</h2>
            <p class="text-neutral-500 text-sm">不只是记录，更强调记录之后的检索、追问、整理与执行。</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div
            v-for="(feature, i) in features"
            :key="i"
            :class="[
              feature.span,
              'group relative bg-[#FAFAFA] border border-neutral-200/60 rounded-3xl p-8 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-neutral-300/80 transition-all duration-500 section-reveal overflow-hidden'
            ]"
            :style="{ animationDelay: `${0.2 + i * 0.1}s` }"
          >
            <!-- 顶部装饰渐变线 -->
            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500" :class="feature.gradient"></div>
            
            <div class="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
              <component :is="feature.icon" :size="20" class="text-neutral-700" :stroke-width="1.5" />
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 mb-3">{{ feature.title }}</h3>
            <p class="text-sm text-neutral-500 leading-relaxed">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 新增：一体化闭环场景（替代原有的数据安全模块） -->
    <section class="max-w-7xl mx-auto px-6 py-32">
      <div class="relative bg-neutral-950 rounded-[2.5rem] p-10 md:p-16 overflow-hidden flex flex-col items-center text-center gap-12 border border-neutral-800 shadow-2xl">
        <!-- 背景氛围光 -->
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[20rem] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div class="relative max-w-2xl space-y-6">
          <h2 class="text-3xl md:text-4xl font-semibold tracking-tight text-white">从知识沉淀到行动落地</h2>
          <p class="text-base text-neutral-400 leading-relaxed">
            告别“内容多、查找慢、计划多、落地难”。ThinkDo 帮你把分散的信息、待办、资料统一管理，形成完整的闭环体系。
          </p>
        </div>

        <!-- 闭环步骤展示 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative z-10">
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-left hover:bg-white/10 transition-colors">
            <Layers class="text-indigo-400 mb-6" :size="28" :stroke-width="1.5" />
            <h3 class="text-lg font-medium text-white mb-2">1. 沉淀与管理</h3>
            <p class="text-sm text-neutral-400">将零散的想法、阅读笔记和项目资料统一录入，构建专属知识库。</p>
          </div>
          
          <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-left hover:bg-white/10 transition-colors">
            <BrainCircuit class="text-emerald-400 mb-6" :size="28" :stroke-width="1.5" />
            <h3 class="text-lg font-medium text-white mb-2">2. AI 智能加工</h3>
            <p class="text-sm text-neutral-400">利用智能对话追问细节，一键润色、整理和归档，提升资料复用率。</p>
          </div>

          <div class="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-left hover:bg-white/10 transition-colors">
            <Rocket class="text-rose-400 mb-6" :size="28" :stroke-width="1.5" />
            <h3 class="text-lg font-medium text-white mb-2">3. 拆解与执行</h3>
            <p class="text-sm text-neutral-400">基于知识库制定战略规划，拆解为每日任务清单，步步为营达成目标。</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@keyframes section-reveal {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-reveal {
  animation: section-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
</style>
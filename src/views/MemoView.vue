<script setup lang="ts">
import { ref } from 'vue'
import {
  Plus,
  Maximize2,
  Zap,
  Lightbulb,
  Coffee,
  Heart,
  Code,
  X,
  Check,
  Edit3
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

interface Stick {
  id: string
  title: string
  content: string
  color: string
  borderColor: string
  textColor: string
  icon: any
  tag: string
}

const showModal = ref(false)
const editId = ref<string | null>(null)

const sticks = ref<Stick[]>([
  {
    id: '1',
    title: '购物清单',
    content: '买牛奶、鸡蛋、面包和咖啡豆。重点是曼特宁。',
    color: 'bg-amber-100/50',
    borderColor: 'border-amber-200/50',
    textColor: 'text-amber-900',
    icon: Coffee,
    tag: '#REMINDER'
  },
  {
    id: '2',
    title: '商务电话',
    content: '给张三回个电话，讨论周五的会议安排及 Q4 预算。',
    color: 'bg-blue-100/50',
    borderColor: 'border-blue-200/50',
    textColor: 'text-blue-900',
    icon: Zap,
    tag: '#URGENT'
  },
  {
    id: '3',
    title: '架构思考',
    content: '思考：为什么 Vue 的响应式系统如此优雅？是否需要画个图？',
    color: 'bg-purple-100/50',
    borderColor: 'border-purple-200/50',
    textColor: 'text-purple-900',
    icon: Lightbulb,
    tag: '#THOUGHT'
  }
])

const form = ref({
  title: '',
  content: '',
  tag: 'IDEA',
  colorIndex: 0
})

const colorPresets = [
  { name: 'Amber', bg: 'bg-amber-100/50', border: 'border-amber-200/50', text: 'text-amber-900', icon: Lightbulb },
  { name: 'Blue', bg: 'bg-blue-100/50', border: 'border-blue-200/50', text: 'text-blue-900', icon: Zap },
  { name: 'Purple', bg: 'bg-purple-100/50', border: 'border-purple-200/50', text: 'text-purple-900', icon: Lightbulb },
  { name: 'Rose', bg: 'bg-rose-100/50', border: 'border-rose-200/50', text: 'text-rose-900', icon: Heart },
  { name: 'Emerald', bg: 'bg-emerald-100/50', border: 'border-emerald-200/50', text: 'text-emerald-900', icon: Code }
]

const handleOpenCreate = () => {
  editId.value = null
  form.value = { title: '', content: '', tag: 'IDEA', colorIndex: 0 }
  showModal.value = true
}

const handleOpenEdit = (stick: Stick) => {
  editId.value = stick.id
  const cIdx = colorPresets.findIndex((p) => p.bg === stick.color)
  form.value = {
    title: stick.title,
    content: stick.content,
    tag: stick.tag.replace('#', ''),
    colorIndex: cIdx !== -1 ? cIdx : 0
  }
  showModal.value = true
}

const handleSubmit = (e: Event) => {
  e.preventDefault()

  if (!form.value.content.trim() && !form.value.title.trim()) {
    toast.error('标题和内容至少需要填写一项')
    return
  }

  const preset = colorPresets[form.value.colorIndex]

  if (editId.value) {
    sticks.value = sticks.value.map((s) =>
      s.id === editId.value
        ? {
            ...s,
            title: form.value.title.trim(),
            content: form.value.content.trim(),
            color: preset.bg,
            borderColor: preset.border,
            textColor: preset.text,
            icon: preset.icon,
            tag: `#${form.value.tag.toUpperCase()}`
          }
        : s
    )
    toast.success('便签已更新')
  } else {
    const stick: Stick = {
      id: Date.now().toString(),
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      color: preset.bg,
      borderColor: preset.border,
      textColor: preset.text,
      icon: preset.icon,
      tag: `#${form.value.tag.toUpperCase()}`
    }
    sticks.value = [stick, ...sticks.value]
    toast.success('灵感已归档')
  }

  showModal.value = false
}

const deleteStick = (id: string) => {
  if (confirm('确定要删除这条便签吗？')) {
    sticks.value = sticks.value.filter((s) => s.id !== id)
    toast.success('便签已删除')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-10 pb-12 section-reveal">
    <div class="flex items-center justify-between">
      <div>
        <span class="mono text-[10px] uppercase tracking-[0.2em] opacity-40 mb-2 block"
          >Ephemeral Brain Dump</span
        >
        <h1 class="text-3xl font-light tracking-tight text-neutral-900">快捷便签</h1>
        <p class="text-sm text-neutral-400 mt-1 italic">
          在灵感消逝前捕捉那些转瞬即逝的思想火花。
        </p>
      </div>
      <button
        @click="handleOpenCreate"
        class="flex items-center gap-3 px-6 py-2.5 bg-black text-white rounded-full text-xs font-medium hover:bg-neutral-800 shadow-xl shadow-black/20 transition-all hover:scale-105"
      >
        <Plus :size="16" />
        <span>新建灵感</span>
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-[240px]">
      <div
        v-for="stick in sticks"
        :key="stick.id"
        @click="handleOpenEdit(stick)"
        :class="[
          'p-6 rounded-[2rem] shadow-sm relative group flex flex-col justify-between card-hover animate-in fade-in zoom-in duration-300 cursor-pointer',
          stick.color,
          stick.borderColor,
          stick.textColor
        ]"
      >
        <div class="overflow-hidden">
          <div class="flex justify-between items-center mb-3">
            <component :is="stick.icon" class="w-4 h-4 opacity-60" />
            <span class="mono text-[9px] opacity-40 uppercase tracking-tighter">{{
              stick.tag
            }}</span>
          </div>
          <h4 v-if="stick.title" class="text-sm font-bold mb-2 truncate">
            {{ stick.title }}
          </h4>
          <p
            :class="[
              'text-xs font-medium leading-relaxed overflow-hidden opacity-80',
              stick.title ? 'line-clamp-5' : 'line-clamp-[7]'
            ]"
          >
            {{ stick.content }}
          </p>
        </div>

        <div
          class="mt-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <div class="flex gap-2">
            <button
              @click.stop="handleOpenEdit(stick)"
              class="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
            >
              <Edit3 :size="12" class="opacity-40" />
            </button>
            <button
              @click.stop
              class="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
            >
              <Maximize2 :size="12" class="opacity-40" />
            </button>
          </div>
          <button
            @click.stop="deleteStick(stick.id)"
            class="p-1.5 hover:bg-rose-100/50 hover:text-rose-600 rounded-lg transition-colors"
          >
            <X :size="12" class="opacity-40" />
          </button>
        </div>
      </div>

      <button
        @click="handleOpenCreate"
        class="border-2 border-dashed border-black/5 bg-white/20 rounded-[2rem] flex flex-col items-center justify-center p-6 text-neutral-300 hover:text-neutral-500 hover:bg-white/40 transition-all card-hover group"
      >
        <div
          class="w-12 h-12 rounded-full border border-black/5 bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm"
        >
          <Plus :size="24" :stroke-width="1" />
        </div>
        <span class="mono text-[9px] font-bold uppercase tracking-widest mt-2">
          添加节点
        </span>
      </button>
    </div>

    <!-- Note Modal (Create/Edit) -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        class="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div class="p-8 border-b border-black/5 flex justify-between items-center bg-stone-50/50">
          <div>
            <h3 class="text-lg font-medium text-neutral-900">
              {{ editId ? '编辑灵感节点' : '记录瞬间灵感' }}
            </h3>
            <p class="text-[10px] mono uppercase tracking-widest text-neutral-400">
              {{ editId ? 'Update Existing Fragment' : 'Capture Thought Fragment' }}
            </p>
          </div>
          <button
            @click="showModal = false"
            class="p-2 text-neutral-300 hover:text-neutral-900 transition-colors"
          >
            <X :size="20" />
          </button>
        </div>

        <form @submit="handleSubmit" class="p-8 space-y-6">
          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
              >便签标题 (可选)</label
            >
            <input
              v-model="form.title"
              type="text"
              autofocus
              placeholder="给灵感起个名字..."
              class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
              >内容描述 (可选)</label
            >
            <textarea
              v-model="form.content"
              rows="4"
              placeholder="在这里输入你的想法、提醒或任何碎片化的信息..."
              class="w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                >标签</label
              >
              <div class="relative flex items-center">
                <span class="absolute left-5 text-neutral-300 mono text-xs">#</span>
                <input
                  v-model="form.tag"
                  type="text"
                  placeholder="IDEA..."
                  class="w-full pl-9 pr-5 py-3 bg-stone-50 border border-black/5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>
            <div class="space-y-3">
              <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                >底色</label
              >
              <div class="flex justify-between px-1">
                <button
                  v-for="(color, idx) in colorPresets"
                  :key="idx"
                  type="button"
                  @click="form.colorIndex = idx"
                  :class="[
                    'w-8 h-8 rounded-xl border transition-all flex items-center justify-center',
                    color.bg,
                    color.border,
                    form.colorIndex === idx
                      ? 'ring-2 ring-offset-2 ring-black/10 scale-110'
                      : 'hover:scale-105 opacity-60'
                  ]"
                >
                  <Check v-if="form.colorIndex === idx" :size="12" :class="color.text" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {{ editId ? '确认更新' : '归档灵感节点' }}
          </button>
        </form>
      </div>
    </div>
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

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
}

.line-clamp-5 {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-[7] {
  display: -webkit-box;
  -webkit-line-clamp: 7;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

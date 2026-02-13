<script setup lang="ts">
import { ref, watch } from 'vue'
import { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

interface TocItem {
  id: string
  level: number
  text: string
  pos: number
}

const items = ref<TocItem[]>([])
const activeItemId = ref<string>('')
const isHovered = ref(false)

const updateToc = () => {
  if (!props.editor) return
  const newItems: TocItem[] = []
  const content = props.editor.state.doc

  content.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const id = `heading-${pos}`
      newItems.push({
        id,
        level: node.attrs.level,
        text: node.textContent,
        pos
      })
    }
  })
  items.value = newItems
  updateActiveItem()
}

const updateActiveItem = () => {
  if (!props.editor) return
  const { selection } = props.editor.state
  const currentPos = selection.from
  
  let lastHeading: TocItem | null = null
  for (const item of items.value) {
    if (item.pos <= currentPos + 50) { // 稍微增加一点偏移容错
      lastHeading = item
    } else {
      break
    }
  }
  
  if (lastHeading) {
    activeItemId.value = lastHeading.id
  } else if (items.value.length > 0) {
    // 如果还没滚动到第一个标题，默认不高亮或高亮第一个
    activeItemId.value = '' 
  }
}

watch(() => props.editor, (editor) => {
  if (!editor) return
  updateToc()
  editor.on('update', updateToc)
  editor.on('selectionUpdate', updateActiveItem)
}, { immediate: true })

const handleItemClick = (pos: number) => {
  if (!props.editor) return
  
  // 1. 设置光标
  props.editor.chain().setTextSelection(pos).run()
  
  // 2. 原生滚动 (更平滑)
  const { view } = props.editor
  const dom = view.nodeDOM(pos) as HTMLElement
  if (dom) {
    dom.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <!-- 容器：控制整体位置和交互区域 -->
  <div 
    class="fixed right-8 top-24 z-50 flex flex-col items-end"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 使用 Transition 实现淡入淡出切换 -->
    <Transition name="fade" mode="out-in">
      
      <!-- 状态 1: 收起模式 (纯线条) -->
      <div 
        v-if="!isHovered" 
        class="py-2 pr-2 flex flex-col items-end gap-[6px] cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
      >
        <div 
          v-for="item in items" 
          :key="item.id"
          class="h-[3px] rounded-full transition-all duration-300"
          :class="[
            // 激活状态：深黑色；非激活状态：浅灰色
            activeItemId === item.id ? 'bg-neutral-800 w-6' : 'bg-neutral-200',
            // 根据层级决定非激活状态的长度，模拟视觉层级
            activeItemId !== item.id && item.level === 1 ? 'w-6' : '',
            activeItemId !== item.id && item.level === 2 ? 'w-4' : '',
            activeItemId !== item.id && item.level >= 3 ? 'w-3' : '',
          ]"
        ></div>
        <!-- 如果没有内容，显示一个默认点 -->
        <div v-if="items.length === 0" class="w-1.5 h-1.5 rounded-full bg-neutral-300"></div>
      </div>

      <!-- 状态 2: 展开模式 (完整目录) -->
      <div 
        v-else 
        class="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-100 p-4 w-64 origin-top-right"
        style="max-height: 70vh;"
      >
        <div class="mb-3 pb-2 border-b border-neutral-100">
           <span class="text-xs font-bold text-violet-600 uppercase tracking-wider select-none">目录</span>
        </div>

        <div style="max-height: calc(70vh - 60px); overflow-y: auto;" class="custom-scrollbar">
          <nav class="flex flex-col gap-0.5">
           <template v-if="items.length > 0">
            <button
              v-for="item in items"
              :key="item.id"
              @click="handleItemClick(item.pos)"
              class="w-full text-left py-1.5 px-2 rounded-md transition-all duration-200 text-sm truncate relative group"
              :class="[
                // 激活状态样式
                activeItemId === item.id 
                  ? 'bg-neutral-100 text-neutral-900 font-medium' 
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700',
                item.level === 1 && activeItemId !== item.id ? 'text-violet-600/90' : ''
              ]"
              :style="{
                paddingLeft: `${(item.level - 1) * 12 + 8}px`
              }"
            >
              {{ item.text || 'Untitled' }}
              
              <!-- 激活状态左侧指示条 -->
              <div 
                v-if="activeItemId === item.id"
                class="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-violet-500 rounded-r"
              ></div>
            </button>
           </template>
           
           <div v-else class="text-xs text-neutral-400 text-center py-4">
             开始输入大标题以创建目录
           </div>
          </nav>
        </div>
      </div>

    </Transition>
  </div>
</template>

<style scoped>
/* Vue Transition 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

/* 隐藏滚动条但保留功能 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e5e5;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d4d4d4;
}
</style>
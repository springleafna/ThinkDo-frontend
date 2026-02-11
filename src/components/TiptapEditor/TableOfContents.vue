<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Editor } from '@tiptap/vue-3'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

interface TocItem {
  id: string
  level: number
  text: string
  pos: number // 用于跳转的位置
}

const items = ref<TocItem[]>([])

// 提取标题的函数
const updateToc = () => {
  if (!props.editor) return

  const newItems: TocItem[] = []
  const content = props.editor.state.doc

  // 遍历文档节点寻找标题
  content.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      // 这里的 id 是为了给 v-for key 使用，如果 node.attrs.id 不存在则生成一个
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
}

// 监听编辑器更新
watch(() => props.editor, (editor) => {
  if (!editor) return
  
  // 初始获取
  updateToc()
  
  // 监听内容变化事件
  editor.on('update', updateToc)
}, { immediate: true })

// 点击跳转逻辑
const handleItemClick = (pos: number) => {
  if (!props.editor) return
  
  // 1. 设置选区并聚焦
  props.editor.chain().focus().setTextSelection(pos).run()
  
  // 2. 滚动到可视区域 (通过 DOM 操作)
  // Tiptap 会聚焦，但我们希望平滑滚动到元素位置
  const { view } = props.editor
  const dom = view.nodeDOM(pos) as HTMLElement
  
  if (dom) {
    dom.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="w-64 hidden xl:block pl-4">
    <div class="sticky top-4">
      <h3 class="text-sm font-semibold text-neutral-900 mb-3 px-2">目录</h3>
      
      <div v-if="items.length === 0" class="text-xs text-neutral-400 px-2">
        暂无标题
      </div>

      <nav v-else class="space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
        <button
          v-for="item in items"
          :key="item.id"
          @click="handleItemClick(item.pos)"
          class="w-full text-left text-sm py-1.5 px-2 rounded-md hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-neutral-900 truncate"
          :class="{
            'pl-2 font-medium': item.level === 1,
            'pl-6 text-xs': item.level === 2,
            'pl-9 text-xs text-neutral-500': item.level === 3
          }"
          :title="item.text"
        >
          {{ item.text || '(空标题)' }}
        </button>
      </nav>
    </div>
  </div>
</template>

<style scoped>
/* 简单的滚动条样式优化 */
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
</style>
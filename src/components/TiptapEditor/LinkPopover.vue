<script setup lang="ts">
import { ref, watch } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Link as LinkIcon, 
  CornerDownLeft, 
  Trash2, 
  ExternalLink 
} from 'lucide-vue-next'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

const isOpen = ref(false)
const linkUrl = ref('')

// 监听打开状态，回显链接
watch(
  () => [isOpen.value, props.editor.isActive('link')],
  ([open, isActive]) => {
    if (open && isActive) {
      const attrs = props.editor.getAttributes('link')
      linkUrl.value = (attrs.href as string) || ''
    } else if (!open) {
      // 关闭时延迟清空
      setTimeout(() => {
        linkUrl.value = ''
      }, 200)
    }
  }
)

const openMenu = () => {
  isOpen.value = true
}

// 确认添加/修改链接
const confirmLink = () => {
  if (!props.editor) return
  
  // 如果内容为空，视为移除
  if (!linkUrl.value) {
    removeLink()
    return
  }

  let href = linkUrl.value
  // 可选：在这里添加 https:// 补全逻辑
  
  props.editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href })
    .run()
    
  isOpen.value = false
}

// 移除链接 / 清空输入
const removeLink = () => {
  // 1. 移除编辑器中的链接标记
  props.editor.chain().focus().unsetLink().run()
  // 2. 清空输入框状态
  linkUrl.value = ''
  // 3. 关闭菜单
  isOpen.value = false
}

// 在新标签页打开
const openInNewTab = () => {
  if (linkUrl.value) {
    window.open(linkUrl.value, '_blank', 'noopener,noreferrer')
    isOpen.value = false
  }
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        @click="openMenu"
        variant="ghost"
        size="icon"
        class="h-8 w-8 transition-colors"
        :class="[
          props.editor.isActive('link') 
            ? 'bg-violet-100 text-violet-600 hover:bg-violet-200 hover:text-violet-700' 
            : 'text-neutral-600 hover:bg-neutral-100'
        ]"
        title="插入链接"
      >
        <LinkIcon :size="18" />
      </Button>
    </PopoverTrigger>

    <PopoverContent 
      align="start" 
      side="bottom" 
      class="w-[360px] p-1 flex items-center gap-1 bg-white shadow-xl border-neutral-200 rounded-lg"
    >
      <!-- 输入框 -->
      <Input
        v-model="linkUrl"
        placeholder="输入链接"
        @keyup.enter="confirmLink"
        class="h-8 flex-1 border-none shadow-none focus-visible:ring-0 px-2 text-sm bg-transparent placeholder:text-neutral-400"
        auto-focus
      />

      <!-- 分割线 -->
      <Separator orientation="vertical" class="h-5 mx-1" />

      <!-- 确认按钮 (回车) -->
      <Button
        @click="confirmLink"
        variant="ghost"
        size="icon"
        class="h-7 w-7 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
        title="应用链接 (Enter)"
      >
        <CornerDownLeft :size="14" />
      </Button>

      <!-- 打开链接按钮 -->
      <Button
        @click="openInNewTab"
        variant="ghost"
        size="icon"
        :disabled="!linkUrl"
        class="h-7 w-7 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
        title="在浏览器中打开"
      >
        <ExternalLink :size="14" />
      </Button>

      <!-- 移除链接按钮 -->
      <Button
        @click="removeLink"
        :disabled="!linkUrl"
        variant="ghost"
        size="icon"
        class="h-7 w-7 text-neutral-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
        title="移除链接"
      >
        <Trash2 :size="14" />
      </Button>
    </PopoverContent>
  </Popover>
</template>
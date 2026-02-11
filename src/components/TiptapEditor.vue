<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'

const lowlight = createLowlight()
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Code2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import LinkPopover from './TiptapEditor/LinkPopover.vue'
import ImagePopover from './TiptapEditor/ImagePopover.vue'

interface Props {
  modelValue: string
  placeholder?: string
  editable?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '输入内容...',
  editable: true
})

const emit = defineEmits<Emits>()

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
      link: false
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 underline cursor-pointer'
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg'
      }
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-neutral-100 rounded-md p-4 my-4 overflow-x-auto'
      }
    })
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-neutral prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3'
    }
  },
  editable: props.editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// 监听 modelValue 变化
watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value)
  }
})

// 监听 editable 变化
watch(() => props.editable, (value) => {
  if (editor.value) {
    editor.value.setEditable(value)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const isActive = (name: string, attributes = {}) => {
  return editor.value?.isActive(name, attributes) || false
}

const canUndo = () => {
  return editor.value?.can().undo() || false
}

const canRedo = () => {
  return editor.value?.can().redo() || false
}

const setParagraph = () => {
  editor.value?.chain().focus().setParagraph().run()
}

const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  editor.value?.chain().focus().toggleHeading({ level }).run()
}

const toggleBold = () => {
  editor.value?.chain().focus().toggleBold().run()
}

const toggleItalic = () => {
  editor.value?.chain().focus().toggleItalic().run()
}

const toggleStrike = () => {
  editor.value?.chain().focus().toggleStrike().run()
}

const toggleCode = () => {
  editor.value?.chain().focus().toggleCode().run()
}

const toggleBulletList = () => {
  editor.value?.chain().focus().toggleBulletList().run()
}

const toggleOrderedList = () => {
  editor.value?.chain().focus().toggleOrderedList().run()
}

const toggleBlockquote = () => {
  editor.value?.chain().focus().toggleBlockquote().run()
}

const toggleCodeBlock = () => {
  editor.value?.chain().focus().toggleCodeBlock().run()
}

const undo = () => {
  editor.value?.chain().focus().undo().run()
}

const redo = () => {
  editor.value?.chain().focus().redo().run()
}
</script>

<template>
  <div class="border border-black/10 rounded-lg overflow-hidden bg-white">
    <!-- 工具栏 -->
    <div v-if="editable" class="flex items-center gap-1 px-3 py-2 bg-black/5 border-b border-black/10 flex-wrap">
      <!-- 撤销/重做 -->
      <Button
        @click="undo"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :disabled="!canUndo()"
        title="撤销"
      >
        <Undo :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="redo"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :disabled="!canRedo()"
        title="重做"
      >
        <Redo :size="16" class="text-neutral-600" />
      </Button>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- 标题 -->
      <Button
        @click="setParagraph"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('paragraph') }"
        title="段落"
      >
        <span class="text-xs font-medium text-neutral-600">P</span>
      </Button>
      <Button
        @click="setHeading(1)"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('heading', { level: 1 }) }"
        title="一级标题"
      >
        <Heading1 :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="setHeading(2)"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('heading', { level: 2 }) }"
        title="二级标题"
      >
        <Heading2 :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="setHeading(3)"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('heading', { level: 3 }) }"
        title="三级标题"
      >
        <Heading3 :size="16" class="text-neutral-600" />
      </Button>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- 文本格式 -->
      <Button
        @click="toggleBold"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('bold') }"
        title="粗体"
      >
        <Bold :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleItalic"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('italic') }"
        title="斜体"
      >
        <Italic :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleStrike"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('strike') }"
        title="删除线"
      >
        <Strikethrough :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleCode"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('code') }"
        title="行内代码"
      >
        <Code :size="16" class="text-neutral-600" />
      </Button>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- 列表 -->
      <Button
        @click="toggleBulletList"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('bulletList') }"
        title="无序列表"
      >
        <List :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleOrderedList"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('orderedList') }"
        title="有序列表"
      >
        <ListOrdered :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleBlockquote"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('blockquote') }"
        title="引用"
      >
        <Quote :size="16" class="text-neutral-600" />
      </Button>
      <Button
        @click="toggleCodeBlock"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :class="{ 'bg-black/10': isActive('codeBlock') }"
        title="代码块"
      >
        <Code2 :size="16" class="text-neutral-600" />
      </Button>

      <Separator orientation="vertical" class="h-6 mx-1" />

      <!-- 插入 -->
      <LinkPopover v-if="editor" :editor="editor" />
      <ImagePopover v-if="editor" :editor="editor" />
    </div>

    <!-- 编辑器内容区 -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped>
:deep(.ProseMirror) {
  min-height: 300px;
}

:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: rgba(0, 0, 0, 0.4);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror:focus) {
  outline: none;
}

:deep(.ProseMirror h1) {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0.5em;
  margin-bottom: 0.3em;
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.3em;
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 0.4em;
  margin-bottom: 0.2em;
  line-height: 1.4;
}

:deep(.ProseMirror p) {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  line-height: 1.7;
}

:deep(.ProseMirror code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', monospace;
  color: #e83e8c;
}

:deep(.ProseMirror pre) {
  background-color: #f6f8fa;
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 0.75em 0;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
  color: inherit;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.75em 0;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.75em 0;
}

:deep(.ProseMirror li) {
  margin: 0.25em 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 4px solid rgba(0, 0, 0, 0.1);
  padding-left: 1em;
  margin: 1em 0;
  color: rgba(0, 0, 0, 0.7);
  font-style: italic;
}

:deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5em;
  margin: 1em 0;
}

:deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
  cursor: pointer;
}

/* 代码高亮样式 */
:deep(.hljs) {
  background-color: transparent;
  padding: 0;
  color: #383a42;
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #a0a1a7;
  font-style: italic;
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag) {
  color: #a626a4;
}

:deep(.hljs-number),
:deep(.hljs-literal) {
  color: #e45649;
}

:deep(.hljs-variable),
:deep(.hljs-template-variable) {
  color: #986801;
  font-weight: normal;
}

:deep(.hljs-type),
:deep(.hljs-title) {
  color: #c18401;
  font-weight: normal;
}

:deep(.hljs-regexp),
:deep(.hljs-link) {
  color: #4078f2;
}

:deep(.hljs-symbol),
:deep(.hljs-bullet) {
  color: #a626a4;
}

:deep(.hljs-built_in),
:deep(.hljs-builtin-name) {
  color: #c18401;
}

:deep(.hljs-meta) {
  color: #a0a1a7;
}

:deep(.hljs-deletion) {
  background: #ffeef0;
}

:deep(.hljs-addition) {
  background: #e6ffed;
}

:deep(.hljs-emphasis) {
  font-style: italic;
}

:deep(.hljs-strong) {
  font-weight: bold;
}
</style>

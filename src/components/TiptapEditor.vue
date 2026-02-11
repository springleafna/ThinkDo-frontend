<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import css from 'highlight.js/lib/languages/css'
import js from 'highlight.js/lib/languages/javascript'
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml'

// UI Components
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import LinkPopover from './TiptapEditor/LinkPopover.vue'
import ImagePopover from './TiptapEditor/ImagePopover.vue'

// Icons
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
  Code2,
  Text as TextIcon,
} from 'lucide-vue-next'

// 配置代码高亮语言
const lowlight = createLowlight({
  css,
  js,
  ts,
  html,
})

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
      codeBlock: false, // 禁用默认 codeBlock，使用 codeBlockLowlight
      link: false,      // 禁用默认 link，使用自定义配置
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
      emptyEditorClass: 'is-editor-empty'
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-violet-600 hover:text-violet-800 underline underline-offset-4 cursor-pointer transition-colors'
      }
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-lg border border-neutral-200 shadow-sm max-w-full h-auto my-4'
      }
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-neutral-100 text-neutral-800 rounded-md p-4 my-4 overflow-x-auto font-mono text-sm border border-neutral-200'
      }
    })
  ],
  editorProps: {
    attributes: {
      class: [
        'focus:outline-none',
        'min-h-[300px] px-6 py-4'
      ].join(' ')
    }
  },
  editable: props.editable,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// 监听外部 modelValue 变化
watch(() => props.modelValue, (value) => {
  if (editor.value && value !== editor.value.getHTML()) {
    editor.value.commands.setContent(value)
  }
})

// 监听 editable 变化
watch(() => props.editable, (value) => {
  editor.value?.setEditable(value)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// 工具函数
const toggle = (action: () => void) => action()
</script>

<template>
  <div class="flex flex-col border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-violet-100 focus-within:border-violet-300">
    
    <!-- 工具栏 -->
    <div v-if="editable && editor" class="flex items-center flex-wrap gap-1 px-2 py-2 bg-neutral-50/50 border-b border-neutral-100">
      
      <!-- 1. 撤销/重做 -->
      <div class="flex items-center gap-0.5">
        <Button @click="editor.chain().focus().undo().run()" variant="ghost" size="icon" class="h-8 w-8" :disabled="!editor.can().undo()" title="撤销">
          <Undo :size="15" />
        </Button>
        <Button @click="editor.chain().focus().redo().run()" variant="ghost" size="icon" class="h-8 w-8" :disabled="!editor.can().redo()" title="重做">
          <Redo :size="15" />
        </Button>
      </div>

      <Separator orientation="vertical" class="h-5 mx-1 bg-neutral-200" />

      <!-- 2. 标题 -->
      <div class="flex items-center gap-0.5">
        <Button @click="editor.chain().focus().setParagraph().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('paragraph') }" title="正文">
          <TextIcon :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('heading', { level: 1 }) }" title="一级标题">
          <Heading1 :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('heading', { level: 2 }) }" title="二级标题">
          <Heading2 :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('heading', { level: 3 }) }" title="三级标题">
          <Heading3 :size="15" />
        </Button>
      </div>

      <Separator orientation="vertical" class="h-5 mx-1 bg-neutral-200" />

      <!-- 3. 文本样式 -->
      <div class="flex items-center gap-0.5">
        <Button @click="editor.chain().focus().toggleBold().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('bold') }" title="粗体">
          <Bold :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleItalic().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('italic') }" title="斜体">
          <Italic :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleStrike().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('strike') }" title="删除线">
          <Strikethrough :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleCode().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('code') }" title="行内代码">
          <Code :size="15" />
        </Button>
      </div>

      <Separator orientation="vertical" class="h-5 mx-1 bg-neutral-200" />

      <!-- 4. 列表与块 -->
      <div class="flex items-center gap-0.5">
        <Button @click="editor.chain().focus().toggleBulletList().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('bulletList') }" title="无序列表">
          <List :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleOrderedList().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('orderedList') }" title="有序列表">
          <ListOrdered :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleBlockquote().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('blockquote') }" title="引用">
          <Quote :size="15" />
        </Button>
        <Button @click="editor.chain().focus().toggleCodeBlock().run()" variant="ghost" size="icon" class="h-8 w-8" :class="{ 'bg-neutral-200 text-neutral-900': editor.isActive('codeBlock') }" title="代码块">
          <Code2 :size="15" />
        </Button>
      </div>

      <Separator orientation="vertical" class="h-5 mx-1 bg-neutral-200" />

      <!-- 5. 插入对象 (组件集成) -->
      <div class="flex items-center gap-0.5">
        <LinkPopover :editor="editor" />
        <ImagePopover :editor="editor" />
      </div>

    </div>

    <!-- 编辑器主体 -->
    <EditorContent :editor="editor" class="flex-1 cursor-text" />
  </div>
</template>

<style scoped>
/* ========== 富文本基础样式 ========== */

/* 标题样式 */
:deep(.ProseMirror h1) {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 2.5rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror h2) {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 2.25rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror h3) {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 2rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

/* 段落样式 */
:deep(.ProseMirror p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

/* 引用样式 */
:deep(.ProseMirror blockquote) {
  border-left: 4px solid #e5e5e5;
  padding-left: 1rem;
  color: #737373;
  font-style: italic;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

/* 列表样式 */
:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
}

:deep(.ProseMirror li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

:deep(.ProseMirror li p) {
  margin-top: 0;
  margin-bottom: 0;
}

/* 代码块样式 */
:deep(.ProseMirror pre) {
  background-color: #f5f5f5;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
}

:deep(.ProseMirror code) {
  background-color: #f5f5f5;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: ui-monospace, monospace;
  font-size: 0.875em;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
}

/* ========== Placeholder 样式 ========== */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  color: #a3a3a3;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/*  代码高亮主题 */
:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: #6a737d; /* 灰色注释 */
  font-style: italic;
}

:deep(.hljs-doctag),
:deep(.hljs-keyword),
:deep(.hljs-formula) {
  color: #d73a49; /* 红色关键字 */
}

:deep(.hljs-section),
:deep(.hljs-name),
:deep(.hljs-selector-tag),
:deep(.hljs-deletion),
:deep(.hljs-subst) {
  color: #22863a; /* 绿色 */
}

:deep(.hljs-literal) {
  color: #005cc5; /* 蓝色 */
}

:deep(.hljs-string),
:deep(.hljs-regexp),
:deep(.hljs-addition),
:deep(.hljs-attribute),
:deep(.hljs-meta-string) {
  color: #032f62; /* 深蓝字符串 */
}

:deep(.hljs-built_in),
:deep(.hljs-class .hljs-title) {
  color: #6f42c1; /* 紫色 */
}

:deep(.hljs-attr),
:deep(.hljs-variable),
:deep(.hljs-template-variable),
:deep(.hljs-type),
:deep(.hljs-selector-class),
:deep(.hljs-selector-attr),
:deep(.hljs-selector-pseudo),
:deep(.hljs-number) {
  color: #e36209; /* 橙色 */
}

:deep(.hljs-symbol),
:deep(.hljs-bullet),
:deep(.hljs-link),
:deep(.hljs-meta),
:deep(.hljs-selector-id),
:deep(.hljs-title) {
  color: #005cc5; /* 蓝色 */
}
</style>
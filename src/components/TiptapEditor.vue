<!--
  TiptapEditor - 富文本编辑器

  数据格式：
  - 输入/输出：Markdown 格式 (v-model)
  - 内部渲染：HTML (TipTap 编辑器)

  特性：
  - 支持 Markdown 源码编辑模式
  - 自动 Markdown ↔ HTML 转换
  - 代码高亮、图片、链接等
-->
<script setup lang="ts">
import { watch, onBeforeUnmount, ref, computed } from 'vue'
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
import type { Editor } from '@tiptap/vue-3'
import { marked } from 'marked'
import TurndownService from 'turndown'

// UI Components
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import LinkPopover from './TiptapEditor/LinkPopover.vue'
import ImagePopover from './TiptapEditor/ImagePopover.vue'
import TableOfContents from './TiptapEditor/TableOfContents.vue'
import AIPopover from './TiptapEditor/AIPopover.vue'

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
  FileCode,
  Eye,
} from 'lucide-vue-next'

// 配置代码高亮语言
const lowlight = createLowlight({
  css,
  js,
  ts,
  html,
})

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

// 配置 turndown (HTML -> Markdown 转换)
const turndownService = new TurndownService({
  headingStyle: 'atx',           // 使用 # 格式
  codeBlockStyle: 'fenced',      // 使用 ``` 格式
  bulletListMarker: '-',         // 使用 - 作为列表标记
  emDelimiter: '*',              // 使用 * 作为斜体标记
  strongDelimiter: '**'          // 使用 ** 作为加粗标记
})

// 自定义规则：处理代码块语言
turndownService.addRule('codeBlock', {
  filter: (node) => {
    return node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE'
  },
  replacement: (content, node) => {
    const codeNode = node.firstChild as HTMLElement
    const language = codeNode.className.match(/language-(\w+)/)?.[1] || ''
    return '\n\n```' + language + '\n' + content + '\n```\n\n'
  }
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

// Markdown源码编辑模式
const isMarkdownMode = ref(false)
const markdownSource = ref('')

// Markdown转HTML（同步版本，用于编辑器实时预览）
const markdownToHtml = (markdown: string): string => {
  try {
    return marked.parse(markdown, { async: false }) as string
  } catch (e) {
    console.error('Markdown转HTML失败:', e)
    return markdown
  }
}

// HTML转Markdown（使用 turndown）
const htmlToMarkdown = (html: string): string => {
  try {
    return turndownService.turndown(html)
  } catch (e) {
    console.error('HTML转Markdown失败:', e)
    return html
  }
}

const editor = useEditor({
  content: props.modelValue ? markdownToHtml(props.modelValue) : '',
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
        class: 'text-violet-600 hover:text-violet-800 underline underline-offset-4 cursor-pointer transition-colors',
        target: '_blank'
      },
      autolink: true,
      linkOnPaste: true,
      validate: (href) => !!href
    }),
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-lg border border-neutral-200 shadow-sm max-w-full h-auto my-4',
        loading: 'lazy'
      },
      inline: false,
      allowBase64: true
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: 'bg-neutral-100 text-neutral-800 rounded-md p-4 my-4 overflow-x-auto font-mono text-sm border border-neutral-200',
        spellcheck: 'false'
      },
      defaultLanguage: null
    })
  ],
  editorProps: {
    attributes: {
      class: [
        'focus:outline-none',
        'min-h-[300px] px-6 py-4',
        'w-full'
      ].join(' ')
    }
  },
  editable: props.editable,
  onUpdate: ({ editor }) => {
    // 将编辑器的 HTML 转换为 Markdown 发送给父组件
    const html = editor.getHTML()
    emit('update:modelValue', htmlToMarkdown(html))
  }
})

// 监听外部 modelValue 变化
watch(() => props.modelValue, (value) => {
  if (editor.value) {
    const currentMarkdown = htmlToMarkdown(editor.value.getHTML())
    if (value !== currentMarkdown) {
      // 外部传入的 Markdown 值发生变化，更新编辑器
      editor.value.commands.setContent(markdownToHtml(value || ''))
    }
  }
})

// 监听 editable 变化
watch(() => props.editable, (value) => {
  editor.value?.setEditable(value)
})

// 切换到Markdown源码模式
const toggleMarkdownMode = () => {
  if (!isMarkdownMode.value) {
    // 切换到 Markdown 源码模式：显示当前 Markdown
    markdownSource.value = props.modelValue || ''
    isMarkdownMode.value = true
  } else {
    // 切换回富文本模式：从 Markdown 源码更新
    const newHtml = markdownToHtml(markdownSource.value)
    editor.value?.commands.setContent(newHtml)
    emit('update:modelValue', markdownSource.value)
    isMarkdownMode.value = false
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

// 工具函数
const toggle = (action: () => void) => action()

// 暴露 editor 实例供父组件使用
defineExpose({
  editor
})
</script>

<template>
  <div class="flex flex-col border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-violet-100 focus-within:border-violet-300 w-full">
    
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
        <AIPopover :editor="editor" />
        <LinkPopover :editor="editor" />
        <ImagePopover :editor="editor" />
        <Button
          @click="toggleMarkdownMode"
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :class="isMarkdownMode ? 'bg-neutral-200 text-neutral-900' : 'text-neutral-600'"
          title="切换Markdown模式"
        >
          <FileCode v-if="!isMarkdownMode" :size="15" />
          <Eye v-else :size="15" />
        </Button>
      </div>

    </div>

    <!-- 编辑器主体 -->
    <div class="flex-1 relative w-full overflow-hidden min-h-0">
      <!-- Markdown源码编辑模式 -->
      <div v-if="isMarkdownMode" class="h-full">
        <textarea
          v-model="markdownSource"
          placeholder="在这里输入Markdown内容..."
          class="w-full p-6 font-mono text-sm resize-none focus:outline-none border-none bg-transparent overflow-y-auto"
          style="min-height: calc(100vh - 210px); max-height: calc(100vh - 210px);"
          @input="(e) => {
            const value = (e.target as HTMLTextAreaElement).value
            markdownSource = value
            // 实时更新预览并同步给父组件
            if (editor) {
              const html = markdownToHtml(value)
              editor.commands.setContent(html)
            }
            emit('update:modelValue', value)
          }"
        />
      </div>
      <!-- 富文本编辑模式 -->
      <div v-else class="cursor-text h-full">
        <EditorContent :editor="editor" class="w-full h-full" />
        <!-- 目录组件 -->
        <TableOfContents v-if="editor" :editor="editor" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 编辑器容器固定 ========== */

/* 编辑器容器固定高度，内容超出时内部滚动 */
:deep(.ProseMirror) {
  max-height: calc(100vh - 210px);
  overflow-y: auto;
}

/* Markdown 模式 textarea 固定高度 */
textarea {
  max-height: calc(100vh - 210px);
}

/* 自定义编辑器滚动条样式 */
:deep(.ProseMirror::-webkit-scrollbar),
textarea::-webkit-scrollbar {
  width: 6px;
}

:deep(.ProseMirror::-webkit-scrollbar-track),
textarea::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.ProseMirror::-webkit-scrollbar-thumb),
textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

:deep(.ProseMirror::-webkit-scrollbar-thumb:hover),
textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* ========== 富文本基础样式 ========== */

/* 标题样式 */
:deep(.ProseMirror h1) {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 2.5rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

:deep(.ProseMirror h2) {
  font-size: 1.875rem;
  font-weight: 600;
  line-height: 2.25rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #262626;
}

:deep(.ProseMirror h3) {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 2rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: #404040;
}

/* 段落样式 */
:deep(.ProseMirror p) {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

/* 文本格式样式 */
:deep(.ProseMirror strong) {
  font-weight: 700;
  color: #1a1a1a;
}

:deep(.ProseMirror em) {
  font-style: italic;
  color: #404040;
}

:deep(.ProseMirror s) {
  text-decoration: line-through;
  color: #a3a3a3;
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
  background-color: #1e293b;
  color: #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

:deep(.ProseMirror code) {
  background-color: #f1f5f9;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875em;
  font-weight: 500;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
  font-weight: 400;
}

:deep(.ProseMirror pre code) {
  background-color: transparent;
  padding: 0;
}

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
  color: #6a737d;
  font-style: italic;
}

:deep(.hljs-doctag),
:deep(.hljs-keyword),
:deep(.hljs-formula) {
  color: #d73a49;
}

:deep(.hljs-section),
:deep(.hljs-name),
:deep(.hljs-selector-tag),
:deep(.hljs-deletion),
:deep(.hljs-subst) {
  color: #22863a;
}

:deep(.hljs-literal) {
  color: #005cc5;
}

:deep(.hljs-string),
:deep(.hljs-regexp),
:deep(.hljs-addition),
:deep(.hljs-attribute),
:deep(.hljs-meta-string) {
  color: #032f62;
}

:deep(.hljs-built_in),
:deep(.hljs-class .hljs-title) {
  color: #6f42c1;
}

:deep(.hljs-attr),
:deep(.hljs-variable),
:deep(.hljs-template-variable),
:deep(.hljs-type),
:deep(.hljs-selector-class),
:deep(.hljs-selector-attr),
:deep(.hljs-selector-pseudo),
:deep(.hljs-number) {
  color: #e36209;
}

:deep(.hljs-symbol),
:deep(.hljs-bullet),
:deep(.hljs-link),
:deep(.hljs-meta),
:deep(.hljs-selector-id),
:deep(.hljs-title) {
  color: #005cc5;
}
</style>

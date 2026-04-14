<script setup lang="ts">
import { ref, computed } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Wand2, CornerDownLeft, Plus, Copy } from 'lucide-vue-next'
import { streamAiTransform, type AiAction } from '@/api/note'
import { toast } from 'vue-sonner'
import { marked } from 'marked'

// 配置marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

interface Props { editor: Editor }
const props = defineProps<Props>()

const isOpen = ref(false)
const action = ref<'polish'|'expand'|'correct'>('polish')
const scope = ref<'selection'|'paragraph'|'document'>('selection')
const generating = ref(false)
const preview = ref('')
const source = ref('')
const range = ref<{ from: number; to: number } | null>(null)
const tone = ref<'neutral'|'formal'|'friendly'>('neutral')
const targetLength = ref<'light'|'medium'|'heavy'>('medium')
const language = ref<'zh'|'en'>('zh')

const openMenu = () => {
  isOpen.value = true
  action.value = 'polish'
  scope.value = 'selection'
  preview.value = ''
  initSource()
}

const initSource = () => {
  if (!props.editor) return
  const sel = props.editor.state.selection
  if (sel && sel.from !== sel.to) {
    range.value = { from: sel.from, to: sel.to }
    // 获取选中文本，如果是HTML则转换为Markdown
    let selectedText = props.editor.state.doc.textBetween(sel.from, sel.to)
    // 如果包含HTML标签，尝试转换
    if (selectedText.includes('<')) {
      selectedText = htmlToSimpleMarkdown(selectedText)
    }
    source.value = selectedText
    scope.value = 'selection'
    return
  }
  const para = getParagraphRange()
  if (para) {
    range.value = para
    let paragraphText = props.editor.state.doc.textBetween(para.from, para.to)
    // 如果包含HTML标签，尝试转换
    if (paragraphText.includes('<')) {
      paragraphText = htmlToSimpleMarkdown(paragraphText)
    }
    source.value = paragraphText
    scope.value = 'paragraph'
    return
  }
  range.value = null
  // 使用getHTML()而不是getText()，以保留图片等HTML内容
  let fullHtml = props.editor.getHTML()
  // 将HTML转换为Markdown
  let fullText = htmlToSimpleMarkdown(fullHtml)
  source.value = fullText
  scope.value = 'document'
}

// HTML转简单Markdown（用于AI处理）
const htmlToSimpleMarkdown = (html: string): string => {
  let markdown = html
  // 处理标题
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
  // 处理加粗
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
  // 处理斜体
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
  // 处理代码
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
  // 处理图片
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
  // 处理链接
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
  // 处理段落
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n')
  // 处理换行
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n')
  // 清理多余空白
  markdown = markdown.replace(/\n{3,}/g, '\n\n')
  return markdown.trim()
}

const getParagraphRange = (): { from: number; to: number } | null => {
  const state = props.editor.state
  const $from = state.selection.$from
  let depth = $from.depth
  while (depth > 0 && !$from.node(depth).isBlock) depth--
  const node = $from.node(depth)
  if (!node) return null
  const start = $from.start(depth)
  const end = $from.end(depth)
  return { from: start, to: end }
}

const setScope = (s: 'selection' | 'paragraph' | 'document') => {
  scope.value = s
  if (s === 'selection') {
    const sel = props.editor.state.selection
    range.value = sel && sel.from !== sel.to ? { from: sel.from, to: sel.to } : null
    let text = range.value ? props.editor.state.doc.textBetween(range.value.from, range.value.to, '\n') : ''
    // 如果包含HTML标签，转换为Markdown
    if (text.includes('<')) {
      text = htmlToSimpleMarkdown(text)
    }
    source.value = text
  } else if (s === 'paragraph') {
    const para = getParagraphRange()
    range.value = para
    let text = para ? props.editor.state.doc.textBetween(para.from, para.to, '\n') : ''
    // 如果包含HTML标签，转换为Markdown
    if (text.includes('<')) {
      text = htmlToSimpleMarkdown(text)
    }
    source.value = text
  } else {
    range.value = null
    // 使用getHTML()而不是getText()，以保留图片等HTML内容
    let html = props.editor.getHTML()
    let text = htmlToSimpleMarkdown(html)
    source.value = text
  }
  preview.value = ''
}

const currentAbort = ref<AbortController | null>(null)

const toBackendAction = (a: 'polish'|'expand'|'correct'): AiAction => {
  switch (a) {
    case 'polish': return 'POLISH'
    case 'expand': return 'EXPAND'
    case 'correct': return 'CORRECT'
  }
}

const generate = async () => {
  if (!source.value) {
    toast.error('没有可处理的内容')
    return
  }
  currentAbort.value?.abort()
  const controller = new AbortController()
  currentAbort.value = controller

  generating.value = true
  preview.value = ''
  const text = source.value || ''
  const req = {
    action: toBackendAction(action.value),
    text,
    options: {
      tone: tone.value,
      targetLength: targetLength.value,
      language: language.value,
    },
    context: ''
  }

  try {
    await streamAiTransform(
      req,
      (delta) => {
        preview.value += delta
        console.log('AI返回片段:', delta)
      },
      () => {
        generating.value = false
        console.log('AI完整返回:', preview.value)
        console.log('是否包含HTML:', /<[^>]+>/.test(preview.value))
      },
      controller.signal,
    )
  } catch (e: any) {
    if (e?.name === 'AbortError') return
    toast.error('生成失败')
    generating.value = false
  }
}

// 解析Markdown内容（直接返回，因为TipTap会处理）
const parseContent = async (content: string): Promise<string> => {
  try {
    // AI返回的已经是Markdown格式，直接返回
    return content
  } catch (e) {
    return content
  }
}

const applyReplace = async () => {
  if (!preview.value) return
  // AI返回的是Markdown，转换为HTML后插入
  const htmlContent = await markdownToHtml(preview.value)

  console.log('AI返回的Markdown:', preview.value)
  console.log('转换后的HTML:', htmlContent)

  if (scope.value === 'document') {
    props.editor.commands.focus('start')
    props.editor.commands.selectAll()
    props.editor.commands.insertContent(htmlContent)
    isOpen.value = false
    return
  }

  const target = scope.value === 'selection' ? range.value : getParagraphRange()
  if (!target) return

  props.editor.chain()
    .focus()
    .deleteRange({ from: target.from, to: target.to })
    .insertContent(htmlContent)
    .run()
  isOpen.value = false
}

const applyInsertBelow = async () => {
  if (!preview.value) return
  // AI返回的是Markdown，转换为HTML后插入
  const htmlContent = await markdownToHtml(preview.value)

  if (scope.value === 'document') {
    // 在文档末尾插入
    props.editor.commands.focus('end')
    props.editor.commands.insertContent(htmlContent)
    isOpen.value = false
    return
  }

  const target = scope.value === 'selection' ? range.value : getParagraphRange()
  const pos = target ? target.to : props.editor.state.selection.to

  // 在指定位置插入
  props.editor.chain()
    .focus()
    .insertContentAt(pos, htmlContent)
    .run()
  isOpen.value = false
}

const copyPreview = async () => {
  if (!preview.value) return
  await navigator.clipboard.writeText(preview.value)
}

// 预览内容的HTML版本（用于显示）
const previewHtml = computed(() => {
  if (!preview.value) return ''
  // marked v18+ 是异步的，但这里我们先用简单的方式处理
  // 在实际应用中可以使用 watchEffect 来处理异步
  try {
    return marked.parse(preview.value, { async: false }) as string
  } catch (e) {
    console.error('Markdown转HTML失败:', e)
    return preview.value
  }
})

// Markdown转HTML（用于插入到编辑器）- 异步版本
const markdownToHtml = async (markdown: string): Promise<string> => {
  try {
    return await marked.parse(markdown) as string
  } catch (e) {
    console.error('Markdown转HTML失败:', e)
    return markdown
  }
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        @click="openMenu"
        variant="ghost"
        size="sm"
        class="h-8 px-2 rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100 hover:text-violet-800 shadow-sm flex items-center gap-1 relative"
        title="智能编辑"
        aria-label="智能编辑 AI"
      >
        <Wand2 :size="16" />
        <span class="text-xs font-semibold">AI</span>
        <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-violet-400 rounded-full ring-2 ring-white"></span>
      </Button>
    </PopoverTrigger>

    <PopoverContent align="start" side="bottom" class="w-[440px] p-0 overflow-hidden shadow-xl rounded-xl border-neutral-200 max-h-[calc(100vh-180px)] flex flex-col">
      <div class="px-3 pt-2 pb-0 shrink-0">
        <Tabs v-model="action" class="w-full">
          <TabsList class="grid w-full grid-cols-3 h-9 bg-neutral-100 p-1 rounded-lg">
            <TabsTrigger value="polish" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">润色</TabsTrigger>
            <TabsTrigger value="expand" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">扩写</TabsTrigger>
            <TabsTrigger value="correct" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">纠错</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        <div class="grid grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-2 items-center">
          <!-- 左列 -->
          <div class="flex items-center gap-2">
            <div class="text-[11px] text-neutral-500 shrink-0">语气</div>
            <Tabs v-model="tone" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="neutral" class="text-xs px-2 data-[state=active]:bg-white rounded">中性</TabsTrigger>
                <TabsTrigger value="formal" class="text-xs px-2 data-[state=active]:bg-white rounded">正式</TabsTrigger>
                <TabsTrigger value="friendly" class="text-xs px-2 data-[state=active]:bg-white rounded">亲和</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <!-- 中间空列占位 -->
          <div></div>

          <!-- 右列 -->
          <div class="flex items-center gap-2">
            <div class="text-[11px] text-neutral-500 shrink-0">长度</div>
            <Tabs v-model="targetLength" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="light" class="text-xs px-2 data-[state=active]:bg-white rounded">轻微</TabsTrigger>
                <TabsTrigger value="medium" class="text-xs px-2 data-[state=active]:bg-white rounded">适中</TabsTrigger>
                <TabsTrigger value="heavy" class="text-xs px-2 data-[state=active]:bg-white rounded">更多</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <!-- 左列：选区 -->
          <div class="flex items-center gap-1">
            <Button @click="setScope('selection')" variant="ghost" size="sm" class="h-7 px-2 text-xs" :class="scope==='selection' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">选区</Button>
            <Button @click="setScope('paragraph')" variant="ghost" size="sm" class="h-7 px-2 text-xs" :class="scope==='paragraph' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">段落</Button>
            <Button @click="setScope('document')" variant="ghost" size="sm" class="h-7 px-2 text-xs" :class="scope==='document' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">整篇</Button>
          </div>

          <!-- 中间空列占位 -->
          <div></div>

          <!-- 右列：语言 -->
          <div class="flex items-center gap-2">
            <div class="text-[11px] text-neutral-500 shrink-0">语言</div>
            <Tabs v-model="language" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="zh" class="text-xs px-2 data-[state=active]:bg-white rounded">中文</TabsTrigger>
                <TabsTrigger value="en" class="text-xs px-2 data-[state=active]:bg-white rounded">英文</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div class="rounded-lg border border-neutral-200 bg-neutral-50/50 p-2">
          <div class="text-[11px] text-neutral-500 mb-1">源内容</div>
          <div class="text-xs text-neutral-800 max-h-20 overflow-auto whitespace-pre-wrap">{{ source || '无选区，将处理当前段落或整篇' }}</div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <Button @click="generate" :disabled="generating" class="h-7 text-xs">
            <div v-if="generating" class="w-3 h-3 mr-1.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>{{ generating ? '生成中...' : '生成' }}</span>
          </Button>
          <Button @click="currentAbort?.abort()" variant="ghost" :disabled="!generating" class="h-7 text-xs">
            取消
          </Button>
          <Button @click="applyReplace" variant="outline" :disabled="!preview" class="h-7 text-xs">
            <CornerDownLeft :size="12" class="mr-1" />
            <span>替换</span>
          </Button>
          <Button @click="applyInsertBelow" variant="outline" :disabled="!preview" class="h-7 text-xs">
            <Plus :size="12" class="mr-1" />
            <span>插入</span>
          </Button>
          <Button @click="copyPreview" variant="ghost" :disabled="!preview" size="icon" class="h-7 w-7 text-neutral-600 hover:bg-neutral-100">
            <Copy :size="14" />
          </Button>
        </div>

        <div class="rounded-lg border border-neutral-200 bg-white p-2 min-h-[50px]">
          <div class="text-[11px] text-neutral-500 mb-1">预览</div>
          <div v-if="previewHtml" class="prose prose-neutral max-w-none text-xs max-h-32 overflow-auto">
            <div v-html="previewHtml"></div>
          </div>
          <div v-else class="text-xs text-neutral-400">生成后在此显示</div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.prose :where(h1,h2,h3){margin-top:.5rem;margin-bottom:.25rem}
.custom-scrollbar::-webkit-scrollbar{width:4px}
.custom-scrollbar::-webkit-scrollbar-track{background:transparent}
.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:2px}
.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.2)}
</style>

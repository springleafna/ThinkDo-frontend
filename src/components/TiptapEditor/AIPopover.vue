<script setup lang="ts">
import { ref } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Wand2, CornerDownLeft, Plus, Copy } from 'lucide-vue-next'
import { streamAiTransform, type AiAction } from '@/api/note'
import { toast } from 'vue-sonner'
import { Switch } from '@/components/ui/switch'

interface Props { editor: Editor }
const props = defineProps<Props>()

const isOpen = ref(false)
const action = ref<'polish'|'expand'|'correct'|'format'>('polish')
const scope = ref<'selection'|'paragraph'|'document'>('selection')
const generating = ref(false)
const preview = ref('')
const isHtml = ref(false)
const source = ref('')
const range = ref<{ from: number; to: number } | null>(null)
const tone = ref<'neutral'|'formal'|'friendly'>('neutral')
const targetLength = ref<'light'|'medium'|'heavy'>('medium')
const language = ref<'zh'|'en'>('zh')
const preserveMarkup = ref(false)

const openMenu = () => {
  isOpen.value = true
  action.value = 'polish'
  scope.value = 'selection'
  preview.value = ''
  isHtml.value = false
  initSource()
}

const initSource = () => {
  if (!props.editor) return
  const sel = props.editor.state.selection
  if (sel && sel.from !== sel.to) {
    range.value = { from: sel.from, to: sel.to }
    source.value = props.editor.state.doc.textBetween(sel.from, sel.to, '\n')
    scope.value = 'selection'
    return
  }
  const para = getParagraphRange()
  if (para) {
    range.value = para
    source.value = props.editor.state.doc.textBetween(para.from, para.to, '\n')
    scope.value = 'paragraph'
    return
  }
  range.value = null
  source.value = props.editor.getText()
  scope.value = 'document'
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
    source.value = range.value ? props.editor.state.doc.textBetween(range.value.from, range.value.to, '\n') : ''
  } else if (s === 'paragraph') {
    const para = getParagraphRange()
    range.value = para
    source.value = para ? props.editor.state.doc.textBetween(para.from, para.to, '\n') : ''
  } else {
    range.value = null
    source.value = props.editor.getText()
  }
  preview.value = ''
}

const currentAbort = ref<AbortController | null>(null)

const toBackendAction = (a: 'polish'|'expand'|'correct'|'format'): AiAction => {
  switch (a) {
    case 'polish': return 'POLISH'
    case 'expand': return 'EXPAND'
    case 'correct': return 'CORRECT'
    case 'format': return 'FORMAT'
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
  isHtml.value = false
  const text = source.value || ''
  const req = {
    action: toBackendAction(action.value),
    text,
    options: {
      tone: tone.value,
      targetLength: targetLength.value,
      language: language.value,
      preserveMarkup: preserveMarkup.value,
    },
    context: ''
  }

  try {
    await streamAiTransform(
      req,
      (delta) => { preview.value += delta },
      (doneIsHtml) => { isHtml.value = doneIsHtml; generating.value = false },
      controller.signal,
    )
  } catch (e: any) {
    if (e?.name === 'AbortError') return
    toast.error('生成失败')
    generating.value = false
  }
}

const applyReplace = () => {
  if (!preview.value) return
  if (scope.value === 'document') {
    props.editor.commands.setContent(preview.value)
    isOpen.value = false
    return
  }
  const target = scope.value === 'selection' ? range.value : getParagraphRange()
  if (!target) return
  props.editor.chain().focus().insertContentAt({ from: target.from, to: target.to }, preview.value).run()
  isOpen.value = false
}

const applyInsertBelow = () => {
  if (!preview.value) return
  if (scope.value === 'document') {
    props.editor.chain().focus().insertContent(preview.value).run()
    isOpen.value = false
    return
  }
  const target = scope.value === 'selection' ? range.value : getParagraphRange()
  const pos = target ? target.to : props.editor.state.selection.to
  props.editor.chain().focus().insertContentAt(pos, preview.value).run()
  isOpen.value = false
}

const copyPreview = async () => {
  if (!preview.value) return
  await navigator.clipboard.writeText(preview.value)
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

    <PopoverContent align="start" side="bottom" class="w-[440px] p-0 overflow-hidden shadow-xl rounded-xl border-neutral-200">
      <div class="px-4 pt-3 pb-0">
        <Tabs v-model="action" class="w-full">
          <TabsList class="grid w-full grid-cols-4 h-9 bg-neutral-100 p-1 rounded-lg">
            <TabsTrigger value="polish" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">润色</TabsTrigger>
            <TabsTrigger value="expand" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">扩写</TabsTrigger>
            <TabsTrigger value="correct" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">纠错</TabsTrigger>
            <TabsTrigger value="format" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">排版</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex items-center gap-3">
            <div class="text-[11px] text-neutral-500 shrink-0">语气</div>
            <Tabs v-model="tone" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="neutral" class="text-xs px-2 data-[state=active]:bg-white rounded">中性</TabsTrigger>
                <TabsTrigger value="formal" class="text-xs px-2 data-[state=active]:bg-white rounded">正式</TabsTrigger>
                <TabsTrigger value="friendly" class="text-xs px-2 data-[state=active]:bg-white rounded">亲和</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-[11px] text-neutral-500 shrink-0">长度</div>
            <Tabs v-model="targetLength" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="light" class="text-xs px-2 data-[state=active]:bg-white rounded">轻微</TabsTrigger>
                <TabsTrigger value="medium" class="text-xs px-2 data-[state=active]:bg-white rounded">适中</TabsTrigger>
                <TabsTrigger value="heavy" class="text-xs px-2 data-[state=active]:bg-white rounded">更多</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-[11px] text-neutral-500 shrink-0">语言</div>
            <Tabs v-model="language" class="w-auto shrink-0">
              <TabsList class="h-7 bg-neutral-100 p-1 rounded-md w-fit">
                <TabsTrigger value="zh" class="text-xs px-2 data-[state=active]:bg-white rounded">中文</TabsTrigger>
                <TabsTrigger value="en" class="text-xs px-2 data-[state=active]:bg-white rounded">英文</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div class="flex items-center gap-3">
            <div class="text-[11px] text-neutral-500 shrink-0">保留标记</div>
            <Switch v-model:checked="preserveMarkup" />
          </div>
        </div>
        <div class="flex items-center gap-1">
          <Button @click="setScope('selection')" variant="ghost" size="sm" class="h-7 px-3" :class="scope==='selection' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">选区</Button>
          <Button @click="setScope('paragraph')" variant="ghost" size="sm" class="h-7 px-3" :class="scope==='paragraph' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">段落</Button>
          <Button @click="setScope('document')" variant="ghost" size="sm" class="h-7 px-3" :class="scope==='document' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-600'">整篇</Button>
        </div>

        <div class="rounded-lg border border-neutral-200 bg-neutral-50/50 p-2">
          <div class="text-[11px] text-neutral-500 mb-1">源内容</div>
          <div class="text-sm text-neutral-800 max-h-24 overflow-auto whitespace-pre-wrap">{{ source || '无选区，将处理当前段落或整篇' }}</div>
        </div>

        <div class="flex items-center gap-2">
          <Button @click="generate" :disabled="generating" class="h-8">
            <div v-if="generating" class="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>{{ generating ? '生成中...' : '生成' }}</span>
          </Button>
          <Button @click="currentAbort?.abort()" variant="ghost" :disabled="!generating" class="h-8">
            取消
          </Button>
          <Button @click="applyReplace" variant="outline" :disabled="!preview" class="h-8">
            <CornerDownLeft :size="14" class="mr-2" />
            <span>替换</span>
          </Button>
          <Button @click="applyInsertBelow" variant="outline" :disabled="!preview" class="h-8">
            <Plus :size="14" class="mr-2" />
            <span>插入</span>
          </Button>
          <Button @click="copyPreview" variant="ghost" :disabled="!preview" size="icon" class="h-8 w-8 text-neutral-600 hover:bg-neutral-100">
            <Copy :size="16" />
          </Button>
        </div>

        <div class="rounded-lg border border-neutral-200 bg-white p-2 min-h-[60px]">
          <div class="text-[11px] text-neutral-500 mb-1">预览</div>
          <div v-if="preview && !isHtml" class="text-sm text-neutral-900 whitespace-pre-wrap max-h-48 overflow-auto">{{ preview }}</div>
          <div v-else-if="preview && isHtml" class="prose prose-neutral max-w-none text-sm max-h-48 overflow-auto">
            <div v-html="preview"></div>
          </div>
          <div v-else class="text-xs text-neutral-400">生成后在此显示</div>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<style scoped>
.prose :where(h1,h2,h3){margin-top:.5rem;margin-bottom:.25rem}
</style>

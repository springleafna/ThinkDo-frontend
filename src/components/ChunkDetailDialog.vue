<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Hash,
  Type,
  LetterText
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { knowledgeDocumentApi, type KnowledgeChunk } from '@/api/knowledgeDocument'

const props = defineProps<{
  open: boolean
  docId: string
  docName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isLoading = ref(false)
const chunks = ref<KnowledgeChunk[]>([])
const expandedIndex = ref<number | null>(null)

const fetchChunks = async () => {
  if (!props.docId) return
  isLoading.value = true
  chunks.value = []
  expandedIndex.value = null
  try {
    const data = await knowledgeDocumentApi.getChunks(props.docId)
    chunks.value = data || []
  } catch (error) {
    console.error('获取分块详情失败：', error)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.open, (val) => {
  if (val) fetchChunks()
})

const toggleExpand = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index
}

const isOpen = ref(false)
watch(() => props.open, (val) => { isOpen.value = val })
watch(isOpen, (val) => { emit('update:open', val) })
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[640px] max-h-[80vh] flex flex-col">
      <DialogHeader>
        <DialogTitle class="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <FileText :size="20" class="text-neutral-600" />
          分块详情
        </DialogTitle>
        <DialogDescription class="text-sm text-neutral-500">
          {{ docName }} · 共 {{ chunks.length }} 个分块
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto min-h-0 py-2">
        <!-- 加载中 -->
        <div v-if="isLoading" class="flex items-center justify-center py-12 text-neutral-400">
          <Loader2 :size="28" class="animate-spin mr-2" />
          <span class="text-sm">加载中...</span>
        </div>

        <!-- 无数据 -->
        <div v-else-if="chunks.length === 0" class="flex flex-col items-center justify-center py-12 text-neutral-400">
          <FileText :size="36" class="mb-2 opacity-50" />
          <p class="text-sm">暂无分块数据</p>
          <p class="text-xs mt-1">请先执行分块操作</p>
        </div>

        <!-- 分块列表 -->
        <div v-else class="space-y-2">
          <div
            v-for="(chunk, idx) in chunks"
            :key="chunk.id"
            class="rounded-xl border border-black/5 bg-white overflow-hidden transition-all"
          >
            <!-- 分块头部 -->
            <button
              @click="toggleExpand(idx)"
              class="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors text-left"
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="shrink-0 w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                  {{ chunk.chunkIndex }}
                </span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-neutral-700 truncate">
                    {{ chunk.content?.slice(0, 80) || '(空内容)' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3 shrink-0 ml-2">
                <div class="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
                  <span class="inline-flex items-center gap-1">
                    <LetterText :size="12" />
                    {{ chunk.charCount ?? '-' }} 字符
                  </span>
                  <span v-if="chunk.tokenCount" class="inline-flex items-center gap-1">
                    <Type :size="12" />
                    {{ chunk.tokenCount }} tokens
                  </span>
                </div>
                <ChevronDown v-if="expandedIndex !== idx" :size="16" class="text-neutral-400" />
                <ChevronUp v-else :size="16" class="text-neutral-400" />
              </div>
            </button>

            <!-- 展开内容 -->
            <div v-if="expandedIndex === idx" class="border-t border-black/5">
              <div class="px-4 py-3 space-y-3">
                <!-- 元信息 -->
                <div class="flex flex-wrap gap-2 text-xs">
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-600">
                    <Hash :size="11" />
                    序号 {{ chunk.chunkIndex }}
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-600">
                    <LetterText :size="11" />
                    {{ chunk.charCount ?? '-' }} 字符
                  </span>
                  <span v-if="chunk.tokenCount" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-600">
                    <Type :size="11" />
                    {{ chunk.tokenCount }} tokens
                  </span>
                  <span v-if="chunk.contentHash" class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 text-neutral-500 font-mono truncate max-w-[200px]">
                    {{ chunk.contentHash.slice(0, 12) }}...
                  </span>
                </div>
                <!-- 正文 -->
                <div class="p-3 bg-neutral-50 rounded-lg text-sm text-neutral-800 whitespace-pre-wrap break-words leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar">
                  {{ chunk.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  adminKnowledgeApi,
  type AdminKnowledgeBaseInfo,
  type AdminKnowledgeDocInfo,
  type KnowledgeDocDetail,
  type ChunkLog,
  type KnowledgeChunk
} from '@/api/admin'

// ==================== 知识库列表 ====================
const kbLoading = ref(false)
const kbList = ref<AdminKnowledgeBaseInfo[]>([])
const kbTotal = ref(0)
const kbPageNum = ref(1)
const kbPageSize = ref(10)
const kbSearchKeyword = ref('')
const kbSearchUsername = ref('')
const kbFilterScope = ref<string | undefined>(undefined)

// ==================== 文档列表 ====================
const docLoading = ref(false)
const docList = ref<AdminKnowledgeDocInfo[]>([])
const docTotal = ref(0)
const docPageNum = ref(1)
const docPageSize = ref(10)
const docSearchKeyword = ref('')
const docFilterStatus = ref<string | undefined>(undefined)
const docFilterKbId = ref<string | undefined>(undefined)

// ==================== 知识库删除 ====================
const showDeleteKbDialog = ref(false)
const deletingKb = ref<AdminKnowledgeBaseInfo | null>(null)

// ==================== 文档删除 ====================
const showDeleteDocDialog = ref(false)
const deletingDoc = ref<AdminKnowledgeDocInfo | null>(null)

// ==================== 文档详情弹窗 ====================
const showDocDetailDialog = ref(false)
const docDetailLoading = ref(false)
const docDetail = ref<KnowledgeDocDetail | null>(null)
const docDetailChunkLogs = ref<ChunkLog[]>([])
const docDetailChunks = ref<KnowledgeChunk[]>([])
const docDetailTab = ref<'info' | 'logs' | 'chunks'>('info')

const kbTotalPages = computed(() => Math.ceil(kbTotal.value / kbPageSize.value))
const docTotalPages = computed(() => Math.ceil(docTotal.value / docPageSize.value))

// ==================== 知识库数据加载 ====================
async function fetchKnowledgeBases() {
  kbLoading.value = true
  try {
    const res = await adminKnowledgeApi.getBaseList({
      pageNum: kbPageNum.value,
      pageSize: kbPageSize.value,
      keyword: kbSearchKeyword.value || undefined,
      username: kbSearchUsername.value || undefined,
      scope: kbFilterScope.value === 'all' ? undefined : kbFilterScope.value
    })
    kbList.value = res.records
    kbTotal.value = res.total
    kbPageNum.value = res.pageNum
  } catch {
    toast.error('获取知识库列表失败')
  } finally {
    kbLoading.value = false
  }
}

function handleKbSearch() {
  kbPageNum.value = 1
  fetchKnowledgeBases()
}

function clearKbFilters() {
  kbSearchKeyword.value = ''
  kbSearchUsername.value = ''
  kbFilterScope.value = undefined
  kbPageNum.value = 1
  fetchKnowledgeBases()
}

function handleKbPageChange(page: number) {
  kbPageNum.value = page
  fetchKnowledgeBases()
}

// ==================== 文档数据加载 ====================
async function fetchDocuments() {
  docLoading.value = true
  try {
    const res = await adminKnowledgeApi.getDocList({
      pageNum: docPageNum.value,
      pageSize: docPageSize.value,
      keyword: docSearchKeyword.value || undefined,
      status: docFilterStatus.value === 'all' ? undefined : docFilterStatus.value,
      kbId: docFilterKbId.value
    })
    docList.value = res.records
    docTotal.value = res.total
    docPageNum.value = res.pageNum
  } catch {
    toast.error('获取文档列表失败')
  } finally {
    docLoading.value = false
  }
}

function handleDocSearch() {
  docPageNum.value = 1
  fetchDocuments()
}

function clearDocFilters() {
  docSearchKeyword.value = ''
  docFilterStatus.value = undefined
  docFilterKbId.value = undefined
  docPageNum.value = 1
  fetchDocuments()
}

function handleDocPageChange(page: number) {
  docPageNum.value = page
  fetchDocuments()
}

// ==================== 知识库删除 ====================
function openDeleteKbDialog(kb: AdminKnowledgeBaseInfo) {
  deletingKb.value = kb
  showDeleteKbDialog.value = true
}

async function confirmDeleteKb() {
  if (!deletingKb.value) return
  try {
    await adminKnowledgeApi.deleteBase(String(deletingKb.value.id))
    toast.success('删除成功')
    showDeleteKbDialog.value = false
    deletingKb.value = null
    fetchKnowledgeBases()
  } catch {
    toast.error('删除失败')
  }
}

// ==================== 文档删除 ====================
function openDeleteDocDialog(doc: AdminKnowledgeDocInfo) {
  deletingDoc.value = doc
  showDeleteDocDialog.value = true
}

async function confirmDeleteDoc() {
  if (!deletingDoc.value) return
  try {
    await adminKnowledgeApi.deleteDoc(String(deletingDoc.value.id))
    toast.success('删除成功')
    showDeleteDocDialog.value = false
    deletingDoc.value = null
    fetchDocuments()
  } catch {
    toast.error('删除失败')
  }
}

// ==================== 文档启用/禁用 ====================
async function toggleDocEnabled(doc: AdminKnowledgeDocInfo) {
  try {
    await adminKnowledgeApi.enableDoc(String(doc.id), !doc.enabled)
    toast.success(doc.enabled ? '已禁用' : '已启用')
    fetchDocuments()
  } catch {
    toast.error('操作失败')
  }
}

// ==================== 文档详情 ====================
async function viewDocDetail(doc: AdminKnowledgeDocInfo) {
  showDocDetailDialog.value = true
  docDetailLoading.value = true
  docDetailTab.value = 'info'
  docDetail.value = null
  docDetailChunkLogs.value = []
  docDetailChunks.value = []
  try {
    const [detail, logs, chunks] = await Promise.all([
      adminKnowledgeApi.getDocDetail(String(doc.id)),
      adminKnowledgeApi.getChunkLogs(String(doc.id)),
      adminKnowledgeApi.getChunks(String(doc.id))
    ])
    docDetail.value = detail
    docDetailChunkLogs.value = logs
    docDetailChunks.value = chunks
  } catch {
    toast.error('加载文档详情失败')
  } finally {
    docDetailLoading.value = false
  }
}

// ==================== 工具函数 ====================
function formatTime(t: string | null | undefined): string {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

function getScopeLabel(scope: string): string {
  return scope === 'SYSTEM' ? '系统' : '用户'
}

function getScopeClass(scope: string): string {
  if (scope === 'SYSTEM') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function getDocStatusClass(status: string): string {
  if (status === 'failed') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (status === 'success') return 'border-green-200 bg-green-50 text-green-700'
  if (status === 'running') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function getDocStatusLabel(status: string): string {
  const map: Record<string, string> = { pending: '待处理', running: '处理中', success: '已完成', failed: '失败' }
  return map[status] || status
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDuration(ms: number | null): string {
  if (ms == null) return '-'
  if (ms < 1000) return ms + 'ms'
  return (ms / 1000).toFixed(1) + 's'
}

onMounted(() => {
  fetchKnowledgeBases()
  fetchDocuments()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 知识库列表 -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="kbSearchKeyword"
              placeholder="搜索知识库名称..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleKbSearch"
            />
          </div>
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="kbSearchUsername"
              placeholder="搜索创建人..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleKbSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="kbFilterScope" @update:model-value="handleKbSearch">
              <SelectTrigger class="!h-10 w-full border-slate-200 bg-white text-slate-600">
                <SelectValue placeholder="全部范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部范围</SelectItem>
                <SelectItem value="SYSTEM">系统</SelectItem>
                <SelectItem value="USER">用户</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="handleKbSearch">
            <Search class="mr-1.5 h-4 w-4" />搜索
          </Button>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearKbFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="kbLoading" class="flex items-center justify-center py-8 text-sm text-slate-400">加载中...</div>
        <div v-else-if="kbList.length === 0" class="flex items-center justify-center py-8 text-sm text-slate-400">暂无数据</div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">名称</th>
                  <th class="px-4 py-3 font-medium">范围</th>
                  <th class="px-4 py-3 font-medium">创建人</th>
                  <th class="px-4 py-3 font-medium">嵌入模型</th>
                  <th class="px-4 py-3 font-medium">文档数</th>
                  <th class="px-4 py-3 font-medium">创建时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="kb in kbList" :key="kb.id" class="border-t border-slate-100 hover:bg-slate-50/50">
                  <td class="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900" :title="kb.name">{{ kb.name }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getScopeClass(kb.scope)]">
                      {{ getScopeLabel(kb.scope) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ kb.username || kb.createdBy }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ kb.embeddingModel }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ kb.documentCount }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(kb.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <Button variant="ghost" size="sm" @click="openDeleteKbDialog(kb)" title="删除">
                      <Trash2 class="h-4 w-4 text-rose-500" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>共 {{ kbTotal }} 条，第 {{ kbPageNum }} / {{ kbTotalPages || 1 }} 页</span>
            <div class="flex gap-1">
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="kbPageNum <= 1" @click="handleKbPageChange(kbPageNum - 1)">
                <ChevronLeft class="size-4" />
              </Button>
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="kbPageNum >= kbTotalPages" @click="handleKbPageChange(kbPageNum + 1)">
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- 文档列表 -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="docSearchKeyword"
              placeholder="搜索文档名称..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleDocSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="docFilterStatus" @update:model-value="handleDocSearch">
              <SelectTrigger class="!h-10 w-full border-slate-200 bg-white text-slate-600">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="running">处理中</SelectItem>
                <SelectItem value="success">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="handleDocSearch">
            <Search class="mr-1.5 h-4 w-4" />搜索
          </Button>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearDocFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="docLoading" class="flex items-center justify-center py-8 text-sm text-slate-400">加载中...</div>
        <div v-else-if="docList.length === 0" class="flex items-center justify-center py-8 text-sm text-slate-400">暂无数据</div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[980px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">文档名称</th>
                  <th class="px-4 py-3 font-medium">所属知识库</th>
                  <th class="px-4 py-3 font-medium">创建人</th>
                  <th class="px-4 py-3 font-medium">类型</th>
                  <th class="px-4 py-3 font-medium">分块数</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                  <th class="px-4 py-3 font-medium">启用</th>
                  <th class="px-4 py-3 font-medium">更新时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="doc in docList" :key="doc.id" class="border-t border-slate-100 hover:bg-slate-50/50">
                  <td class="max-w-[180px] truncate px-4 py-3 font-medium text-slate-900" :title="doc.docName">{{ doc.docName }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ doc.kbName }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ doc.username }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ doc.fileType || '-' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ doc.chunkCount }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getDocStatusClass(doc.status)]">
                      {{ getDocStatusLabel(doc.status) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Button variant="ghost" size="sm" @click="toggleDocEnabled(doc)">
                      <Badge variant="outline" :class="doc.enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-400'" class="cursor-pointer rounded-md px-2 py-0.5 text-xs">
                        {{ doc.enabled ? '启用' : '禁用' }}
                      </Badge>
                    </Button>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(doc.updatedAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <Button variant="ghost" size="sm" @click="viewDocDetail(doc)" title="查看详情">
                        <Eye class="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" @click="openDeleteDocDialog(doc)" title="删除">
                        <Trash2 class="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>共 {{ docTotal }} 条，第 {{ docPageNum }} / {{ docTotalPages || 1 }} 页</span>
            <div class="flex gap-1">
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="docPageNum <= 1" @click="handleDocPageChange(docPageNum - 1)">
                <ChevronLeft class="size-4" />
              </Button>
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="docPageNum >= docTotalPages" @click="handleDocPageChange(docPageNum + 1)">
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- 知识库删除确认 -->
    <Dialog :open="showDeleteKbDialog" @update:open="showDeleteKbDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除知识库「{{ deletingKb?.name }}」吗？此操作将级联删除该知识库下的所有文档、分块和意图节点，且不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteKbDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmDeleteKb">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 文档删除确认 -->
    <Dialog :open="showDeleteDocDialog" @update:open="showDeleteDocDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除文档「{{ deletingDoc?.docName }}」吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDocDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmDeleteDoc">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 文档详情弹窗 -->
    <Dialog :open="showDocDetailDialog" @update:open="showDocDetailDialog = $event">
      <DialogContent class="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ docDetail?.docName || '文档详情' }}</DialogTitle>
          <DialogDescription>
            所属知识库：{{ docList.find(d => String(d.id) === String(docDetail?.id))?.kbName || '-' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="docDetailLoading" class="py-8 text-center text-slate-400">加载中...</div>
        <div v-else-if="docDetail">
          <!-- Tab 切换 -->
          <div class="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              v-for="tab in (['info', 'logs', 'chunks'] as const)"
              :key="tab"
              :class="['rounded-md px-3 py-1.5 text-sm font-medium transition-colors', docDetailTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
              @click="docDetailTab = tab"
            >
              {{ tab === 'info' ? '基本信息' : tab === 'logs' ? '处理日志' : `分块 (${docDetailChunks.length})` }}
            </button>
          </div>

          <!-- 基本信息 -->
          <div v-if="docDetailTab === 'info'" class="space-y-2 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <div><span class="text-slate-500">文档ID：</span>{{ docDetail.id }}</div>
              <div><span class="text-slate-500">知识库ID：</span>{{ docDetail.kbId }}</div>
              <div><span class="text-slate-500">来源类型：</span>{{ docDetail.sourceType }}</div>
              <div><span class="text-slate-500">文件类型：</span>{{ docDetail.fileType || '-' }}</div>
              <div><span class="text-slate-500">文件大小：</span>{{ formatFileSize(docDetail.fileSize ?? null) }}</div>
              <div><span class="text-slate-500">分块策略：</span>{{ docDetail.chunkStrategy || '-' }}</div>
              <div><span class="text-slate-500">分块数：</span>{{ docDetail.chunkCount }}</div>
              <div><span class="text-slate-500">状态：</span>
                <Badge variant="outline" :class="['ml-1 rounded-md px-2 py-0.5 text-xs', getDocStatusClass(docDetail.status)]">
                  {{ getDocStatusLabel(docDetail.status) }}
                </Badge>
              </div>
              <div><span class="text-slate-500">创建时间：</span>{{ formatTime(docDetail.createdAt) }}</div>
              <div><span class="text-slate-500">更新时间：</span>{{ formatTime(docDetail.updatedAt) }}</div>
            </div>
            <div v-if="docDetail.sourceLocation" class="mt-2">
              <span class="text-slate-500">来源地址：</span>
              <span class="break-all text-slate-700">{{ docDetail.sourceLocation }}</span>
            </div>
          </div>

          <!-- 处理日志 -->
          <div v-if="docDetailTab === 'logs'">
            <div v-if="docDetailChunkLogs.length === 0" class="py-8 text-center text-slate-400">暂无日志</div>
            <div v-else class="space-y-3">
              <div v-for="log in docDetailChunkLogs" :key="log.id" class="rounded-lg border border-slate-100 p-3 text-sm">
                <div class="mb-2 flex items-center gap-2">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getDocStatusClass(log.status)]">
                    {{ log.status }}
                  </Badge>
                  <span class="text-xs text-slate-400">{{ formatTime(log.createdAt) }}</span>
                  <span v-if="log.chunkCount" class="text-xs text-slate-400">{{ log.chunkCount }} 个分块</span>
                </div>
                <div class="grid grid-cols-4 gap-2 text-xs text-slate-600">
                  <div>提取: {{ formatDuration(log.extractDuration) }}</div>
                  <div>分块: {{ formatDuration(log.chunkDuration) }}</div>
                  <div>向量化: {{ formatDuration(log.embeddingDuration) }}</div>
                  <div>总计: {{ formatDuration(log.totalDuration) }}</div>
                </div>
                <div v-if="log.errorMessage" class="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">
                  {{ log.errorMessage }}
                </div>
              </div>
            </div>
          </div>

          <!-- 分块详情 -->
          <div v-if="docDetailTab === 'chunks'">
            <div v-if="docDetailChunks.length === 0" class="py-8 text-center text-slate-400">暂无分块</div>
            <div v-else class="space-y-2">
              <div v-for="chunk in docDetailChunks" :key="chunk.id" class="rounded-lg border border-slate-100 p-3 text-sm">
                <div class="mb-1.5 flex items-center gap-2">
                  <Badge variant="outline" class="rounded-md px-2 py-0.5 text-xs border-slate-200 bg-slate-50 text-slate-700">
                    #{{ chunk.chunkIndex }}
                  </Badge>
                  <span class="text-xs text-slate-400">
                    {{ chunk.charCount ?? 0 }} 字符 / {{ chunk.tokenCount ?? 0 }} tokens
                  </span>
                </div>
                <p class="whitespace-pre-wrap break-all text-slate-700">{{ chunk.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

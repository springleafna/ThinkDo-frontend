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
  type AdminKnowledgeDocInfo,
  type KnowledgeDocDetail,
  type ChunkLog,
  type KnowledgeChunk
} from '@/api/admin'

// ==================== 文档列表 ====================
const loading = ref(false)
const list = ref<AdminKnowledgeDocInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const filterStatus = ref<string | undefined>(undefined)

// ==================== 文档删除 ====================
const showDeleteDialog = ref(false)
const deletingItem = ref<AdminKnowledgeDocInfo | null>(null)

// ==================== 文档详情弹窗 ====================
const showDetailDialog = ref(false)
const detailLoading = ref(false)
const docDetail = ref<KnowledgeDocDetail | null>(null)
const chunkLogs = ref<ChunkLog[]>([])
const chunks = ref<KnowledgeChunk[]>([])
const detailTab = ref<'info' | 'logs' | 'chunks'>('info')

// 当前查看详情的文档所属知识库名（从列表中查找）
const detailKbName = ref('')

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

async function fetchData() {
  loading.value = true
  try {
    const res = await adminKnowledgeApi.getDocList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: filterStatus.value === 'all' ? undefined : filterStatus.value
    })
    list.value = res.records
    total.value = res.total
    pageNum.value = res.pageNum
  } catch {
    toast.error('获取文档列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchData()
}

function clearFilters() {
  searchKeyword.value = ''
  filterStatus.value = undefined
  pageNum.value = 1
  fetchData()
}

function handlePageChange(page: number) {
  pageNum.value = page
  fetchData()
}

// ==================== 文档删除 ====================
function openDeleteDialog(doc: AdminKnowledgeDocInfo) {
  deletingItem.value = doc
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    await adminKnowledgeApi.deleteDoc(String(deletingItem.value.id))
    toast.success('删除成功')
    showDeleteDialog.value = false
    deletingItem.value = null
    fetchData()
  } catch {
    toast.error('删除失败')
  }
}

// ==================== 文档启用/禁用 ====================
async function toggleEnabled(doc: AdminKnowledgeDocInfo) {
  try {
    await adminKnowledgeApi.enableDoc(String(doc.id), !doc.enabled)
    toast.success(doc.enabled ? '已禁用' : '已启用')
    fetchData()
  } catch {
    toast.error('操作失败')
  }
}

// ==================== 文档详情 ====================
async function viewDetail(doc: AdminKnowledgeDocInfo) {
  showDetailDialog.value = true
  detailLoading.value = true
  detailTab.value = 'info'
  docDetail.value = null
  chunkLogs.value = []
  chunks.value = []
  detailKbName.value = doc.kbName
  try {
    const [detail, logs, chunkList] = await Promise.all([
      adminKnowledgeApi.getDocDetail(String(doc.id)),
      adminKnowledgeApi.getChunkLogs(String(doc.id)),
      adminKnowledgeApi.getChunks(String(doc.id))
    ])
    docDetail.value = detail
    chunkLogs.value = logs
    chunks.value = chunkList
  } catch {
    toast.error('加载文档详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 工具函数 ====================
function formatTime(t: string | null | undefined): string {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
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

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchKeyword"
              placeholder="搜索文档名称..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="filterStatus" @update:model-value="handleSearch">
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
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="handleSearch">
            <Search class="mr-1.5 h-4 w-4" />搜索
          </Button>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-8 text-sm text-slate-400">加载中...</div>
        <div v-else-if="list.length === 0" class="flex items-center justify-center py-8 text-sm text-slate-400">暂无数据</div>
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
                <tr v-for="doc in list" :key="doc.id" class="border-t border-slate-100 hover:bg-slate-50/50">
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
                    <Button variant="ghost" size="sm" @click="toggleEnabled(doc)">
                      <Badge variant="outline" :class="doc.enabled ? 'border-green-200 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-400'" class="cursor-pointer rounded-md px-2 py-0.5 text-xs">
                        {{ doc.enabled ? '启用' : '禁用' }}
                      </Badge>
                    </Button>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(doc.updatedAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      <Button variant="ghost" size="sm" @click="viewDetail(doc)" title="查看详情">
                        <Eye class="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="sm" @click="openDeleteDialog(doc)" title="删除">
                        <Trash2 class="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>共 {{ total }} 条，第 {{ pageNum }} / {{ totalPages || 1 }} 页</span>
            <div class="flex gap-1">
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="pageNum <= 1" @click="handlePageChange(pageNum - 1)">
                <ChevronLeft class="size-4" />
              </Button>
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="pageNum >= totalPages" @click="handlePageChange(pageNum + 1)">
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- 删除确认 -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除文档「{{ deletingItem?.docName }}」吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 文档详情弹窗 -->
    <Dialog :open="showDetailDialog" @update:open="showDetailDialog = $event">
      <DialogContent class="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ docDetail?.docName || '文档详情' }}</DialogTitle>
          <DialogDescription>
            所属知识库：{{ detailKbName }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="py-8 text-center text-slate-400">加载中...</div>
        <div v-else-if="docDetail">
          <!-- Tab 切换 -->
          <div class="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              v-for="tab in (['info', 'logs', 'chunks'] as const)"
              :key="tab"
              :class="['rounded-md px-3 py-1.5 text-sm font-medium transition-colors', detailTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
              @click="detailTab = tab"
            >
              {{ tab === 'info' ? '基本信息' : tab === 'logs' ? '处理日志' : `分块 (${chunks.length})` }}
            </button>
          </div>

          <!-- 基本信息 -->
          <div v-if="detailTab === 'info'" class="space-y-2 text-sm">
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
          <div v-if="detailTab === 'logs'">
            <div v-if="chunkLogs.length === 0" class="py-8 text-center text-slate-400">暂无日志</div>
            <div v-else class="space-y-3">
              <div v-for="log in chunkLogs" :key="log.id" class="rounded-lg border border-slate-100 p-3 text-sm">
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
          <div v-if="detailTab === 'chunks'">
            <div v-if="chunks.length === 0" class="py-8 text-center text-slate-400">暂无分块</div>
            <div v-else class="space-y-2">
              <div v-for="chunk in chunks" :key="chunk.id" class="rounded-lg border border-slate-100 p-3 text-sm">
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

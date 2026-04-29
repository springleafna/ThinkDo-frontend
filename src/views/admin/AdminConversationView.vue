<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  adminConversationApi,
  type AdminConversationInfo,
  type AdminConversationDetail
} from '@/api/admin'

// ==================== 列表状态 ====================
const loading = ref(false)
const conversations = ref<AdminConversationInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

// 搜索筛选
const searchKeyword = ref('')
const searchUsername = ref('')
const searchUserId = ref<number | undefined>(undefined)

// ==================== 详情弹窗 ====================
const showDetailDialog = ref(false)
const detailLoading = ref(false)
const conversationDetail = ref<AdminConversationDetail | null>(null)

// ==================== 删除确认弹窗 ====================
const showDeleteDialog = ref(false)
const deletingConversation = ref<AdminConversationInfo | null>(null)

// ==================== 批量删除 ====================
const selectedIds = ref<string[]>([])
const showBatchDeleteDialog = ref(false)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ==================== 数据加载 ====================
async function fetchData() {
  loading.value = true
  try {
    const res = await adminConversationApi.getList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      username: searchUsername.value || undefined,
      userId: searchUserId.value
    })
    conversations.value = res.records
    total.value = res.total
    pageNum.value = res.pageNum
  } catch {
    toast.error('加载会话列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  selectedIds.value = []
  fetchData()
}

function clearFilters() {
  searchKeyword.value = ''
  searchUsername.value = ''
  searchUserId.value = undefined
  pageNum.value = 1
  selectedIds.value = []
  fetchData()
}

function handlePageChange(page: number) {
  pageNum.value = page
  fetchData()
}

// ==================== 详情查看 ====================
async function viewDetail(conversationId: string) {
  showDetailDialog.value = true
  detailLoading.value = true
  try {
    const res = await adminConversationApi.getDetail(conversationId)
    conversationDetail.value = res
  } catch {
    toast.error('加载会话详情失败')
  } finally {
    detailLoading.value = false
  }
}

// ==================== 删除操作 ====================
function openDeleteDialog(conv: AdminConversationInfo) {
  deletingConversation.value = conv
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingConversation.value) return
  try {
    await adminConversationApi.delete(deletingConversation.value.conversationId)
    toast.success('删除成功')
    showDeleteDialog.value = false
    deletingConversation.value = null
    fetchData()
  } catch {
    toast.error('删除失败')
  }
}

// ==================== 批量删除 ====================
function toggleSelect(conversationId: string) {
  const idx = selectedIds.value.indexOf(conversationId)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(conversationId)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === conversations.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = conversations.value.map(c => c.conversationId)
  }
}

function openBatchDeleteDialog() {
  if (selectedIds.value.length === 0) {
    toast.warning('请先选择要删除的会话')
    return
  }
  showBatchDeleteDialog.value = true
}

async function confirmBatchDelete() {
  try {
    await adminConversationApi.batchDelete(selectedIds.value)
    toast.success(`成功删除 ${selectedIds.value.length} 个会话`)
    showBatchDeleteDialog.value = false
    selectedIds.value = []
    fetchData()
  } catch {
    toast.error('批量删除失败')
  }
}

// ==================== 工具函数 ====================
function formatTime(t: string | null | undefined): string {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = { user: '用户', assistant: '助手', system: '系统' }
  return map[role] || role
}

function getRoleClass(role: string): string {
  if (role === 'user') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (role === 'assistant') return 'border-green-200 bg-green-50 text-green-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + '...' : text
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 会话列表 -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchKeyword"
              placeholder="搜索会话标题..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchUsername"
              placeholder="搜索用户名..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="handleSearch">
            <Search class="mr-1.5 h-4 w-4" />搜索
          </Button>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearFilters">
            清空筛选
          </Button>
        </div>
        <div class="flex items-center justify-between">
          <Button
            v-if="selectedIds.length > 0"
            variant="destructive"
            size="sm"
            @click="openBatchDeleteDialog"
          >
            <Trash2 class="mr-1.5 h-4 w-4" />
            批量删除 ({{ selectedIds.length }})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="py-12 text-center text-slate-400">加载中...</div>
        <div v-else-if="conversations.length === 0" class="py-12 text-center text-slate-400">暂无数据</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="w-10 px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    :checked="selectedIds.length === conversations.length && conversations.length > 0"
                    @change="toggleSelectAll"
                    class="rounded border-slate-300"
                  />
                </th>
                <th class="px-4 py-3 font-medium">会话标题</th>
                <th class="px-4 py-3 font-medium">用户名</th>
                <th class="px-4 py-3 font-medium">消息数</th>
                <th class="px-4 py-3 font-medium">最近消息时间</th>
                <th class="px-4 py-3 font-medium">创建时间</th>
                <th class="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="conv in conversations"
                :key="conv.conversationId"
                class="border-t border-slate-100 hover:bg-slate-50/50"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedIds.includes(conv.conversationId)"
                    @change="toggleSelect(conv.conversationId)"
                    class="rounded border-slate-300"
                  />
                </td>
                <td class="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900" :title="conv.title">
                  {{ conv.title || '未命名' }}
                </td>
                <td class="px-4 py-3 text-slate-600">{{ conv.username }}</td>
                <td class="px-4 py-3 text-slate-600">{{ conv.messageCount }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatTime(conv.lastTime) }}</td>
                <td class="px-4 py-3 text-slate-600">{{ formatTime(conv.createdAt) }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-1">
                    <Button variant="ghost" size="sm" @click="viewDetail(conv.conversationId)" title="查看详情">
                      <Eye class="h-4 w-4 text-slate-500" />
                    </Button>
                    <Button variant="ghost" size="sm" @click="openDeleteDialog(conv)" title="删除">
                      <Trash2 class="h-4 w-4 text-rose-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- 分页 -->
          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span class="text-sm text-slate-500">
              共 {{ total }} 条记录，第 {{ pageNum }} / {{ totalPages || 1 }} 页
            </span>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="pageNum <= 1"
                @click="handlePageChange(pageNum - 1)"
              >
                <ChevronLeft class="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="pageNum >= totalPages"
                @click="handlePageChange(pageNum + 1)"
              >
                <ChevronRight class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 详情弹窗 -->
    <Dialog :open="showDetailDialog" @update:open="showDetailDialog = $event">
      <DialogContent class="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ conversationDetail?.title || '会话详情' }}</DialogTitle>
          <DialogDescription>
            用户：{{ conversationDetail?.username }} |
            创建时间：{{ formatTime(conversationDetail?.createdAt) }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="detailLoading" class="py-8 text-center text-slate-400">加载中...</div>
        <div v-else-if="conversationDetail">
          <!-- 摘要 -->
          <div v-if="conversationDetail.summary" class="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <span class="font-medium">会话摘要：</span>{{ conversationDetail.summary }}
          </div>

          <!-- 消息列表 -->
          <div class="space-y-3">
            <div
              v-for="msg in conversationDetail.messages"
              :key="msg.id"
              class="rounded-lg border border-slate-100 p-3"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getRoleClass(msg.role)]">
                  {{ getRoleLabel(msg.role) }}
                </Badge>
                <span class="text-xs text-slate-400">{{ formatTime(msg.createdAt) }}</span>
              </div>
              <p class="whitespace-pre-wrap break-all text-sm text-slate-700">{{ msg.content }}</p>
            </div>
          </div>

          <div v-if="conversationDetail.messages.length === 0" class="py-8 text-center text-slate-400">
            暂无消息记录
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 单条删除确认弹窗 -->
    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除会话「{{ deletingConversation?.title }}」吗？此操作将同时删除该会话的所有消息记录，且不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 批量删除确认弹窗 -->
    <Dialog :open="showBatchDeleteDialog" @update:open="showBatchDeleteDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认批量删除</DialogTitle>
          <DialogDescription>
            确定要删除选中的 {{ selectedIds.length }} 个会话吗？此操作将同时删除所有会话的消息记录，且不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showBatchDeleteDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmBatchDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

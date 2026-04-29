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
import { Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  adminKnowledgeApi,
  type AdminKnowledgeBaseInfo
} from '@/api/admin'

const loading = ref(false)
const list = ref<AdminKnowledgeBaseInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const searchUsername = ref('')
const filterScope = ref<string | undefined>(undefined)

const showDeleteDialog = ref(false)
const deletingItem = ref<AdminKnowledgeBaseInfo | null>(null)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

async function fetchData() {
  loading.value = true
  try {
    const res = await adminKnowledgeApi.getBaseList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value || undefined,
      username: searchUsername.value || undefined,
      scope: filterScope.value === 'all' ? undefined : filterScope.value
    })
    list.value = res.records
    total.value = res.total
    pageNum.value = res.pageNum
  } catch {
    toast.error('获取知识库列表失败')
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
  searchUsername.value = ''
  filterScope.value = undefined
  pageNum.value = 1
  fetchData()
}

function handlePageChange(page: number) {
  pageNum.value = page
  fetchData()
}

function openDeleteDialog(item: AdminKnowledgeBaseInfo) {
  deletingItem.value = item
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingItem.value) return
  try {
    await adminKnowledgeApi.deleteBase(String(deletingItem.value.id))
    toast.success('删除成功')
    showDeleteDialog.value = false
    deletingItem.value = null
    fetchData()
  } catch {
    toast.error('删除失败')
  }
}

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
              placeholder="搜索知识库名称..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchUsername"
              placeholder="搜索创建人..."
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="filterScope" @update:model-value="handleSearch">
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
                <tr v-for="kb in list" :key="kb.id" class="border-t border-slate-100 hover:bg-slate-50/50">
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
                    <Button variant="ghost" size="sm" @click="openDeleteDialog(kb)" title="删除">
                      <Trash2 class="h-4 w-4 text-rose-500" />
                    </Button>
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

    <Dialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除知识库「{{ deletingItem?.name }}」吗？此操作将级联删除该知识库下的所有文档、分块和意图节点，且不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
import { Search } from 'lucide-vue-next'
import { adminNoteApi, type AdminNoteInfo, type AdminNoteDetail } from '@/api/admin'
import { toast } from 'vue-sonner'

const loading = ref(false)
const notes = ref<AdminNoteInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const searchKeyword = ref('')
const filterFavorited = ref<string | undefined>(undefined)
const showDetailDialog = ref(false)
const noteDetail = ref<AdminNoteDetail | null>(null)

// 删除确认对话框
const showDeleteDialog = ref(false)
const deletingNote = ref<AdminNoteInfo | null>(null)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 生成页码数组
const pageNumbers = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = pageNum.value
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const getFavoritedClass = (f: number) => {
  if (f === 1) return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const getFavoritedLabel = (f: number) => {
  return f === 1 ? '已收藏' : '未收藏'
}

const formatTime = (t: string | null) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminNoteApi.getList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      username: searchUsername.value || undefined,
      keyword: searchKeyword.value || undefined,
      favorited: filterFavorited.value === 'all' ? undefined : (filterFavorited.value !== undefined ? Number(filterFavorited.value) : undefined)
    })
    notes.value = res.records
    total.value = res.total
  } catch {
    toast.error('获取笔记列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

const clearFilters = () => {
  searchUsername.value = ''
  searchKeyword.value = ''
  filterFavorited.value = undefined
  pageNum.value = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  pageNum.value = page
  fetchData()
}

const viewDetail = async (id: number) => {
  try {
    const res = await adminNoteApi.getDetail(id)
    noteDetail.value = res
    showDetailDialog.value = true
  } catch {
    toast.error('获取笔记详情失败')
  }
}

const openDeleteDialog = (note: AdminNoteInfo) => {
  deletingNote.value = note
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deletingNote.value) return
  try {
    await adminNoteApi.delete(deletingNote.value.id)
    toast.success('笔记删除成功')
    showDeleteDialog.value = false
    fetchData()
  } catch {
    toast.error('笔记删除失败')
  }
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
              v-model="searchUsername"
              placeholder="搜索用户名"
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchKeyword"
              placeholder="搜索关键词"
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="filterFavorited" @update:model-value="handleSearch">
              <SelectTrigger class="!h-10 w-full border-slate-200 bg-white text-slate-600">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="1">已收藏</SelectItem>
                <SelectItem value="0">未收藏</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-slate-500">
          加载中...
        </div>
        <div v-else-if="notes.length === 0" class="flex items-center justify-center py-12 text-sm text-slate-500">
          暂无数据
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">用户名</th>
                  <th class="px-4 py-3 font-medium">标题</th>
                  <th class="px-4 py-3 font-medium">分类</th>
                  <th class="px-4 py-3 font-medium">标签</th>
                  <th class="px-4 py-3 font-medium">收藏</th>
                  <th class="px-4 py-3 font-medium">创建时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="note in notes" :key="note.id" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ note.username }}</td>
                  <td class="max-w-[200px] truncate px-4 py-3 text-slate-900">{{ note.title }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ note.categoryName || '-' }}</td>
                  <td class="max-w-[150px] truncate px-4 py-3 text-slate-600">{{ note.tags || '-' }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getFavoritedClass(note.favorited)]">
                      {{ getFavoritedLabel(note.favorited) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(note.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs" @click="viewDetail(note.id)">
                        查看
                      </Button>
                      <Button variant="outline" class="h-8 rounded-md border-rose-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50" @click="openDeleteDialog(note)">
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span class="text-sm text-slate-500">共 {{ total }} 条记录</span>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                :disabled="pageNum <= 1"
                class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs"
                @click="handlePageChange(pageNum - 1)"
              >
                上一页
              </Button>
              <template v-for="p in pageNumbers" :key="p">
                <button
                  :class="[
                    'h-8 rounded-md px-3 text-xs font-medium transition-colors',
                    p === pageNum
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  ]"
                  @click="handlePageChange(p)"
                >
                  {{ p }}
                </button>
              </template>
              <Button
                variant="outline"
                :disabled="pageNum >= totalPages"
                class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs"
                @click="handlePageChange(pageNum + 1)"
              >
                下一页
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- 笔记详情对话框 -->
    <Teleport to="body">
      <div v-if="showDetailDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDetailDialog = false">
        <div class="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-slate-900">{{ noteDetail?.title }}</h3>
          <div class="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span>用户：{{ noteDetail?.username }}</span>
            <span>分类：{{ noteDetail?.categoryName || '-' }}</span>
            <span>标签：{{ noteDetail?.tags || '-' }}</span>
            <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getFavoritedClass(noteDetail?.favorited ?? 0)]">
              {{ getFavoritedLabel(noteDetail?.favorited ?? 0) }}
            </Badge>
          </div>
          <div class="mt-4 text-sm text-slate-500">
            创建时间：{{ formatTime(noteDetail?.createdAt ?? null) }} &nbsp;|&nbsp; 更新时间：{{ formatTime(noteDetail?.updatedAt ?? null) }}
          </div>
          <div class="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {{ noteDetail?.content || '（无内容）' }}
          </div>
          <div class="mt-6 flex justify-end">
            <Button variant="outline" class="rounded-md border-slate-200" @click="showDetailDialog = false">关闭</Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="w-[360px] p-5">
        <DialogHeader class="space-y-2">
          <DialogTitle class="text-base font-semibold">删除笔记</DialogTitle>
          <DialogDescription class="text-sm text-slate-600">
            确定删除笔记「{{ deletingNote?.title }}」吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-4 flex justify-end gap-2">
          <Button variant="outline" class="h-8 rounded-md border-slate-200 px-3 text-sm" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" class="h-8 rounded-md px-3 text-sm" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

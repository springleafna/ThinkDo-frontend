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
import { Search, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-vue-next'
import { adminMemoApi, type AdminMemoInfo } from '@/api/admin'
import { toast } from 'vue-sonner'

const loading = ref(false)
const memos = ref<AdminMemoInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const searchKeyword = ref('')
const filterPinned = ref<string>('')
const showDetailDialog = ref(false)
const memoDetail = ref<AdminMemoInfo | null>(null)

// 总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 获取置顶 badge 样式
const getPinnedClass = (pinned: number) => {
  if (pinned === 1) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

// 获取置顶中文标签
const getPinnedLabel = (pinned: number) => {
  return pinned === 1 ? '已置顶' : '未置顶'
}

// 格式化时间
const formatTime = (t: string | null) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

// 加载数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminMemoApi.getList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      username: searchUsername.value || undefined,
      keyword: searchKeyword.value || undefined,
      pinned: filterPinned.value !== '' ? Number(filterPinned.value) : undefined
    })
    memos.value = res.records
    total.value = res.total
  } catch {
    toast.error('获取便签列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

// 清空筛选
const clearFilters = () => {
  searchUsername.value = ''
  searchKeyword.value = ''
  filterPinned.value = ''
  pageNum.value = 1
  fetchData()
}

// 翻页
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  pageNum.value = page
  fetchData()
}

// 查看详情
const viewDetail = async (memo: AdminMemoInfo) => {
  try {
    const res = await adminMemoApi.getDetail(memo.id)
    memoDetail.value = res
    showDetailDialog.value = true
  } catch {
    toast.error('获取便签详情失败')
  }
}

// 删除便签
const handleDelete = async (memo: AdminMemoInfo) => {
  if (!confirm(`确定删除便签「${memo.title || '无标题'}」吗？此操作不可恢复。`)) return
  try {
    await adminMemoApi.delete(memo.id)
    toast.success('便签删除成功')
    fetchData()
  } catch {
    toast.error('便签删除失败')
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle class="text-xl font-semibold text-slate-900">便签管理</CardTitle>
            <CardDescription class="mt-2 text-sm leading-6 text-slate-500">
              管理所有用户的便签
            </CardDescription>
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchUsername"
              placeholder="搜索用户名"
              class="h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="relative max-w-md flex-1">
            <Input
              v-model="searchKeyword"
              placeholder="搜索关键词"
              class="h-10 border-slate-200 bg-white"
              @keyup.enter="handleSearch"
            />
          </div>
          <select
            v-model="filterPinned"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600"
            @change="handleSearch"
          >
            <option value="">全部</option>
            <option value="1">已置顶</option>
            <option value="0">未置顶</option>
          </select>
          <Button variant="outline" class="h-10 rounded-md border-slate-200 bg-white" @click="clearFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-slate-500">
          加载中...
        </div>
        <div v-else-if="memos.length === 0" class="flex items-center justify-center py-12 text-sm text-slate-500">
          暂无数据
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">用户名</th>
                  <th class="px-4 py-3 font-medium">标题</th>
                  <th class="px-4 py-3 font-medium">标签</th>
                  <th class="px-4 py-3 font-medium">颜色</th>
                  <th class="px-4 py-3 font-medium">置顶</th>
                  <th class="px-4 py-3 font-medium">创建时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="memo in memos" :key="memo.id" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ memo.username }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ memo.title || '-' }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ memo.tag || '-' }}</td>
                  <td class="px-4 py-3">
                    <div
                      class="inline-block size-5 rounded border border-slate-200"
                      :style="{ backgroundColor: memo.backgroundColor }"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getPinnedClass(memo.pinned)]">
                      {{ getPinnedLabel(memo.pinned) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(memo.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs" @click="viewDetail(memo)">
                        <Eye class="mr-1 size-3.5" />
                        查看
                      </Button>
                      <Button variant="outline" class="h-8 rounded-md border-rose-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50" @click="handleDelete(memo)">
                        <Trash2 class="mr-1 size-3.5" />
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
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

    <!-- 详情对话框 -->
    <Teleport to="body">
      <div v-if="showDetailDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDetailDialog = false">
        <div class="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-slate-900">便签详情</h3>

          <div v-if="memoDetail" class="mt-4 space-y-4">
            <div>
              <label class="text-sm font-medium text-slate-500">标题</label>
              <p class="mt-1 text-sm text-slate-900">{{ memoDetail.title || '无标题' }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-slate-500">内容</label>
              <div
                class="mt-1 rounded-md p-4 text-sm text-slate-900 whitespace-pre-wrap"
                :style="{ backgroundColor: memoDetail.backgroundColor }"
              >
                {{ memoDetail.content || '无内容' }}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-500">标签</label>
                <p class="mt-1 text-sm text-slate-900">{{ memoDetail.tag || '-' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-500">置顶</label>
                <p class="mt-1">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getPinnedClass(memoDetail.pinned)]">
                    {{ getPinnedLabel(memoDetail.pinned) }}
                  </Badge>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-500">创建时间</label>
                <p class="mt-1 text-sm text-slate-600">{{ formatTime(memoDetail.createdAt) }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-500">更新时间</label>
                <p class="mt-1 text-sm text-slate-600">{{ formatTime(memoDetail.updatedAt) }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <Button variant="outline" class="rounded-md border-slate-200" @click="showDetailDialog = false">关闭</Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

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
import { adminPlanApi, type AdminPlanInfo, type AdminPlanDetail } from '@/api/admin'
import { toast } from 'vue-sonner'

const loading = ref(false)
const plans = ref<AdminPlanInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const searchKeyword = ref('')
const filterType = ref<string>('')
const filterStatus = ref<string>('')
const filterPriority = ref<string>('')
const showDetailDialog = ref(false)
const planDetail = ref<AdminPlanDetail | null>(null)

// 总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 类型标签
const getTypeLabel = (type: number) => {
  const map: Record<number, string> = { 0: '普通计划', 1: '四象限', 2: '每日计划' }
  return map[type] ?? '未知'
}

// 优先级标签
const getPriorityLabel = (priority: number) => {
  const map: Record<number, string> = { 1: '低', 2: '中', 3: '高' }
  return map[priority] ?? '未知'
}

// 优先级 badge 样式
const getPriorityClass = (priority: number) => {
  if (priority === 3) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (priority === 2) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

// 状态标签
const getStatusLabel = (status: number) => {
  const map: Record<number, string> = { 0: '未完成', 1: '已完成' }
  return map[status] ?? '未知'
}

// 状态 badge 样式
const getStatusClass = (status: number) => {
  if (status === 1) return 'border-green-200 bg-green-50 text-green-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

// 象限标签
const getQuadrantLabel = (quadrant: number) => {
  const map: Record<number, string> = { 0: '无', 1: '重要紧急', 2: '重要不紧急', 3: '不重要紧急', 4: '不重要不紧急' }
  return map[quadrant] ?? '无'
}

// 重复类型标签
const getRepeatTypeLabel = (repeatType: number) => {
  const map: Record<number, string> = { 0: '不重复', 1: '每天', 2: '每周', 3: '每月', 4: '每年' }
  return map[repeatType] ?? '未知'
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
    const res = await adminPlanApi.getList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      username: searchUsername.value || undefined,
      keyword: searchKeyword.value || undefined,
      type: filterType.value !== '' ? Number(filterType.value) : undefined,
      status: filterStatus.value !== '' ? Number(filterStatus.value) : undefined,
      priority: filterPriority.value !== '' ? Number(filterPriority.value) : undefined
    })
    plans.value = res.records
    total.value = res.total
  } catch {
    toast.error('获取计划列表失败')
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
  filterType.value = ''
  filterStatus.value = ''
  filterPriority.value = ''
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
const viewDetail = async (plan: AdminPlanInfo) => {
  try {
    const detail = await adminPlanApi.getDetail(plan.id)
    planDetail.value = detail
    showDetailDialog.value = true
  } catch {
    toast.error('获取计划详情失败')
  }
}

// 删除计划
const handleDelete = async (plan: AdminPlanInfo) => {
  if (!confirm(`确定删除计划「${plan.title}」吗？此操作不可恢复。`)) return
  try {
    await adminPlanApi.delete(plan.id)
    toast.success('计划删除成功')
    fetchData()
  } catch {
    toast.error('计划删除失败')
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
            <CardTitle class="text-xl font-semibold text-slate-900">计划管理</CardTitle>
            <CardDescription class="mt-2 text-sm leading-6 text-slate-500">
              管理所有用户的计划任务。共 {{ total }} 条记录。
            </CardDescription>
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
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
              placeholder="搜索标题关键词"
              class="h-10 border-slate-200 bg-white"
              @keyup.enter="handleSearch"
            />
          </div>
          <select
            v-model="filterType"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600"
            @change="handleSearch"
          >
            <option value="">全部类型</option>
            <option value="0">普通计划</option>
            <option value="1">四象限</option>
            <option value="2">每日计划</option>
          </select>
          <select
            v-model="filterStatus"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600"
            @change="handleSearch"
          >
            <option value="">全部状态</option>
            <option value="0">未完成</option>
            <option value="1">已完成</option>
          </select>
          <select
            v-model="filterPriority"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600"
            @change="handleSearch"
          >
            <option value="">全部优先级</option>
            <option value="1">低</option>
            <option value="2">中</option>
            <option value="3">高</option>
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
        <div v-else-if="plans.length === 0" class="flex items-center justify-center py-12 text-sm text-slate-500">
          暂无数据
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[900px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">用户名</th>
                  <th class="px-4 py-3 font-medium">标题</th>
                  <th class="px-4 py-3 font-medium">类型</th>
                  <th class="px-4 py-3 font-medium">优先级</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                  <th class="px-4 py-3 font-medium">创建时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plan in plans" :key="plan.id" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ plan.username }}</td>
                  <td class="px-4 py-3 text-slate-900">{{ plan.title }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" class="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                      {{ getTypeLabel(plan.type) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getPriorityClass(plan.priority)]">
                      {{ getPriorityLabel(plan.priority) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(plan.status)]">
                      {{ getStatusLabel(plan.status) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(plan.createdAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs" @click="viewDetail(plan)">
                        <Eye class="mr-1 size-3.5" />
                        查看
                      </Button>
                      <Button variant="outline" class="h-8 rounded-md border-rose-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50" @click="handleDelete(plan)">
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
      <div v-if="showDetailDialog && planDetail" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showDetailDialog = false">
        <div class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">计划详情</h3>
            <Button variant="ghost" size="icon" class="h-8 w-8 text-slate-400 hover:text-slate-600" @click="showDetailDialog = false">
              <span class="text-xl leading-none">&times;</span>
            </Button>
          </div>

          <div class="mt-4 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <span class="text-xs font-medium text-slate-500">标题</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ planDetail.title }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">用户名</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ planDetail.username }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">类型</span>
                <p class="mt-0.5">
                  <Badge variant="outline" class="rounded-md border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700">
                    {{ getTypeLabel(planDetail.type) }}
                  </Badge>
                </p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">优先级</span>
                <p class="mt-0.5">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getPriorityClass(planDetail.priority)]">
                    {{ getPriorityLabel(planDetail.priority) }}
                  </Badge>
                </p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">状态</span>
                <p class="mt-0.5">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(planDetail.status)]">
                    {{ getStatusLabel(planDetail.status) }}
                  </Badge>
                </p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">象限</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ getQuadrantLabel(planDetail.quadrant) }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">开始时间</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ formatTime(planDetail.startTime) }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">截止时间</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ formatTime(planDetail.dueTime) }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">重复类型</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ getRepeatTypeLabel(planDetail.repeatType) }}</p>
              </div>
              <div>
                <span class="text-xs font-medium text-slate-500">标签</span>
                <p class="mt-0.5 text-sm text-slate-900">{{ planDetail.tags || '-' }}</p>
              </div>
            </div>

            <div>
              <span class="text-xs font-medium text-slate-500">描述</span>
              <p class="mt-0.5 text-sm text-slate-900">{{ planDetail.description || '-' }}</p>
            </div>

            <!-- 步骤列表 -->
            <div v-if="planDetail.steps && planDetail.steps.length > 0">
              <span class="text-xs font-medium text-slate-500">步骤列表</span>
              <div class="mt-2 overflow-x-auto rounded-md border border-slate-200">
                <table class="w-full text-left text-sm">
                  <thead class="bg-slate-50 text-slate-500">
                    <tr>
                      <th class="px-4 py-2 font-medium">步骤标题</th>
                      <th class="px-4 py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="step in planDetail.steps" :key="step.id" class="border-t border-slate-100">
                      <td class="px-4 py-2 text-slate-900">{{ step.title }}</td>
                      <td class="px-4 py-2">
                        <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(step.status)]">
                          {{ getStatusLabel(step.status) }}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div v-else>
              <span class="text-xs font-medium text-slate-500">步骤列表</span>
              <p class="mt-0.5 text-sm text-slate-400">暂无步骤</p>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <Button variant="outline" class="rounded-md border-slate-200" @click="showDetailDialog = false">关闭</Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

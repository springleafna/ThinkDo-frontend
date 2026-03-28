<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent
} from '@/components/ui/card'
import { Pencil, TreePine, RefreshCw, X, Search } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  intentNodeApi,
  IntentKindMap,
  IntentLevelMap,
  type IntentNodeTree,
  type PageResult
} from '@/api/intentNode'

// ============ 筛选条件 ============
const searchQuery = ref('')
const filterLevel = ref('')
const filterKind = ref('')
const filterEnabled = ref('')
const loading = ref(false)

// ============ 分页 ============
const pagination = ref({ current: 1, size: 10, total: 0, pages: 0 })
const tableRows = ref<IntentNodeTree[]>([])

const fetchData = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      current: pagination.value.current,
      size: pagination.value.size
    }
    if (searchQuery.value) params.keyword = searchQuery.value
    if (filterLevel.value !== '') params.level = Number(filterLevel.value)
    if (filterKind.value !== '') params.kind = Number(filterKind.value)
    if (filterEnabled.value !== '') params.enabled = Number(filterEnabled.value)

    const res = await intentNodeApi.pageQuery(params as any)
    tableRows.value = res.records
    pagination.value.total = res.total
    pagination.value.pages = res.pages
    pagination.value.current = res.current
  } catch (error) {
    console.error('获取意图节点列表失败:', error)
    toast.error('获取意图节点列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// ============ 筛选操作 ============
const handleSearch = () => {
  pagination.value.current = 1
  fetchData()
}

const clearFilters = () => {
  searchQuery.value = ''
  filterLevel.value = ''
  filterKind.value = ''
  filterEnabled.value = ''
  pagination.value.current = 1
  fetchData()
}

const handlePageChange = (page: number) => {
  pagination.value.current = page
  fetchData()
}

// ============ 辅助函数 ============
const getKindLabel = (kind: number) => IntentKindMap[kind] ?? 'UNKNOWN'
const getLevelLabel = (level: number) => IntentLevelMap[level] ?? 'UNKNOWN'

const parseExamples = (examples: string | null): string[] => {
  if (!examples) return []
  try {
    const parsed = JSON.parse(examples)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getLevelClass = (level: number) => {
  const map: Record<string, string> = {
    DOMAIN: 'border-amber-200 bg-amber-50 text-amber-700',
    CATEGORY: 'border-blue-200 bg-blue-50 text-blue-700',
    TOPIC: 'border-purple-200 bg-purple-50 text-purple-700'
  }
  return map[getLevelLabel(level)] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getTypeClass = (kind: number) => {
  const map: Record<string, string> = {
    KB: 'border-blue-200 bg-blue-50 text-blue-700',
    MCP: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SYSTEM: 'border-slate-200 bg-slate-50 text-slate-700'
  }
  return map[getKindLabel(kind)] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getStatusClass = (enabled: number) => {
  if (enabled === 1) return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

// 生成页码数组
const pageNumbers = computed(() => {
  const pages: number[] = []
  const total = pagination.value.pages
  const current = pagination.value.current
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardContent class="px-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchQuery"
              placeholder="搜索意图名称/编码..."
              class="h-9 w-64 border-slate-200 bg-white pl-9"
              @keydown.enter="handleSearch"
            />
          </div>

          <div class="relative">
            <select
              v-model="filterLevel"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="handleSearch"
            >
              <option value="">全部层级</option>
              <option value="0">DOMAIN</option>
              <option value="1">CATEGORY</option>
              <option value="2">TOPIC</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="relative">
            <select
              v-model="filterKind"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="handleSearch"
            >
              <option value="">全部类型</option>
              <option value="0">KB</option>
              <option value="1">SYSTEM</option>
              <option value="2">MCP</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="relative">
            <select
              v-model="filterEnabled"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="handleSearch"
            >
              <option value="">全部状态</option>
              <option value="1">启用</option>
              <option value="0">禁用</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="ml-auto flex gap-2">
            <Button variant="outline" class="h-9 rounded-md border-slate-200 bg-white" @click="fetchData">
              <RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />
              刷新
            </Button>
            <Button variant="outline" class="h-9 rounded-md border-slate-200 bg-white" @click="clearFilters">
              <X class="size-4" />
              清空筛选
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardContent>
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-slate-400">
          <RefreshCw class="mr-2 size-4 animate-spin" />
          加载中...
        </div>

        <!-- Empty -->
        <div v-else-if="!tableRows.length" class="flex flex-col items-center justify-center py-12 text-slate-400">
          <p class="text-sm">暂无匹配的意图节点</p>
        </div>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">意图节点</th>
                <th class="px-4 py-3 font-medium">层级</th>
                <th class="px-4 py-3 font-medium">类型</th>
                <th class="px-4 py-3 font-medium">父节点</th>
                <th class="px-4 py-3 font-medium">关联资源</th>
                <th class="px-4 py-3 font-medium">示例数</th>
                <th class="px-4 py-3 font-medium">状态</th>
                <th class="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in tableRows" :key="row.id" class="border-t border-slate-200 hover:bg-slate-50/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-slate-900">{{ row.name }}</span>
                    <code class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{{ row.intentCode }}</code>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getLevelClass(row.level)]">
                    {{ getLevelLabel(row.level) }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getTypeClass(row.kind)]">
                    {{ getKindLabel(row.kind) }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ row.parentCode ?? 'ROOT' }}</td>
                <td class="px-4 py-3">
                  <div v-if="row.collectionName" class="space-y-0.5">
                    <span class="text-sm text-slate-700">{{ row.collectionName }}</span>
                    <p class="text-xs text-slate-500">TopK: {{ row.topK ?? '全局默认' }}</p>
                  </div>
                  <div v-else-if="row.mcpToolId" class="space-y-0.5">
                    <span class="text-sm text-emerald-700">{{ row.mcpToolId }}</span>
                    <p class="text-xs text-slate-500">MCP Tool</p>
                  </div>
                  <span v-else class="text-sm text-slate-400">-</span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">{{ parseExamples(row.examples).length }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.enabled)]">
                    {{ row.enabled === 1 ? '启用' : '禁用' }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-1">
                    <Button variant="outline" size="icon-sm" class="rounded-md border-slate-200 bg-white">
                      <Pencil class="size-3.5" />
                    </Button>
                    <Button variant="outline" size="icon-sm" class="rounded-md border-slate-200 bg-white">
                      <TreePine class="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.total > 0" class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span class="text-sm text-slate-500">共 {{ pagination.total }} 条记录</span>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              :disabled="pagination.current <= 1"
              class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs"
              @click="handlePageChange(pagination.current - 1)"
            >
              上一页
            </Button>
            <template v-for="p in pageNumbers" :key="p">
              <button
                :class="[
                  'h-8 rounded-md px-3 text-xs font-medium transition-colors',
                  p === pagination.current
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
              :disabled="pagination.current >= pagination.pages"
              class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs"
              @click="handlePageChange(pagination.current + 1)"
            >
              下一页
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

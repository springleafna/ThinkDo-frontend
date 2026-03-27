<script setup lang="ts">
import { ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Pencil, TreePine, RefreshCw, X, Search } from 'lucide-vue-next'

type IntentRow = {
  name: string
  code: string
  level: string
  type: string
  path: string
  collection: string
  topK: string
  exampleCount: number
  status: string
}

const searchQuery = ref('')
const filterLevel = ref('全部层级')
const filterType = ref('全部类型')
const filterStatus = ref('全部状态')
const filterParent = ref('全部父节点')

const intentRows = ref<IntentRow[]>([
  {
    name: '发票信息',
    code: 'DOMAIN_INVOICE',
    level: 'DOMAIN',
    type: 'KB',
    path: '发票信息',
    collection: 'finance',
    topK: '全局默认',
    exampleCount: 2,
    status: '启用'
  },
  {
    name: '增值税发票',
    code: 'CATEGORY_VAT_INVOICE',
    level: 'CATEGORY',
    type: 'KB',
    path: '发票信息 / 增值税发票',
    collection: 'finance',
    topK: '全局默认',
    exampleCount: 2,
    status: '启用'
  },
  {
    name: '销售汇总数据统计',
    code: 'DOMAIN_SALES',
    level: 'DOMAIN',
    type: 'RAG',
    path: '销售汇总数据统计',
    collection: 'sales_report',
    topK: '5',
    exampleCount: 6,
    status: '启用'
  },
  {
    name: '销售数据统计',
    code: 'CATEGORY_SALES_DATA',
    level: 'CATEGORY',
    type: 'RAG',
    path: '销售汇总数据统计 / 销售数据统计',
    collection: 'sales_report',
    topK: '全局默认',
    exampleCount: 4,
    status: '启用'
  },
  {
    name: '客户工单服务管理',
    code: 'DOMAIN_TICKET',
    level: 'DOMAIN',
    type: 'MCP',
    path: '客户工单服务管理',
    collection: 'ticket_system',
    topK: '3',
    exampleCount: 3,
    status: '启用'
  },
  {
    name: '客户工单查询',
    code: 'CATEGORY_TICKET_QUERY',
    level: 'CATEGORY',
    type: 'MCP',
    path: '客户工单服务管理 / 客户工单查询',
    collection: 'ticket_system',
    topK: '全局默认',
    exampleCount: 2,
    status: '启用'
  },
  {
    name: '系统交互',
    code: 'DOMAIN_SYSTEM',
    level: 'DOMAIN',
    type: 'SYSTEM',
    path: '系统交互',
    collection: '-',
    topK: '全局默认',
    exampleCount: 0,
    status: '启用'
  },
  {
    name: '欢迎与问候',
    code: 'CATEGORY_WELCOME',
    level: 'CATEGORY',
    type: 'SYSTEM',
    path: '系统交互 / 欢迎与问候',
    collection: '-',
    topK: '全局默认',
    exampleCount: 8,
    status: '启用'
  },
  {
    name: '关于助手',
    code: 'CATEGORY_ABOUT',
    level: 'CATEGORY',
    type: 'SYSTEM',
    path: '系统交互 / 关于助手',
    collection: '-',
    topK: '全局默认',
    exampleCount: 5,
    status: '启用'
  },
  {
    name: '情感反馈',
    code: 'CATEGORY_FEEDBACK',
    level: 'CATEGORY',
    type: 'SYSTEM',
    path: '系统交互 / 情感反馈',
    collection: '-',
    topK: '全局默认',
    exampleCount: 6,
    status: '启用'
  },
  {
    name: '天气信息查询服务',
    code: 'DOMAIN_WEATHER',
    level: 'DOMAIN',
    type: 'MCP',
    path: '天气信息查询服务',
    collection: 'weather_service',
    topK: '3',
    exampleCount: 2,
    status: '启用'
  },
  {
    name: '天气查询',
    code: 'CATEGORY_WEATHER_QUERY',
    level: 'CATEGORY',
    type: 'MCP',
    path: '天气信息查询服务 / 天气查询',
    collection: 'weather_service',
    topK: '全局默认',
    exampleCount: 3,
    status: '停用'
  }
])

const getLevelClass = (level: string) => {
  const map: Record<string, string> = {
    DOMAIN: 'border-amber-200 bg-amber-50 text-amber-700',
    CATEGORY: 'border-blue-200 bg-blue-50 text-blue-700'
  }
  return map[level] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getTypeClass = (type: string) => {
  const map: Record<string, string> = {
    KB: 'border-purple-200 bg-purple-50 text-purple-700',
    RAG: 'border-blue-200 bg-blue-50 text-blue-700',
    MCP: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SYSTEM: 'border-slate-200 bg-slate-50 text-slate-700'
  }
  return map[type] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getStatusClass = (status: string) => {
  if (status === '启用') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === '停用') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

const filteredRows = ref(intentRows.value)

const applyFilters = () => {
  filteredRows.value = intentRows.value.filter(row => {
    if (searchQuery.value && !row.name.includes(searchQuery.value) && !row.code.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    if (filterLevel.value !== '全部层级' && row.level !== filterLevel.value) return false
    if (filterType.value !== '全部类型' && row.type !== filterType.value) return false
    if (filterStatus.value !== '全部状态' && row.status !== filterStatus.value) return false
    if (filterParent.value !== '全部父节点') {
      const parent = row.path.split(' / ')[0]
      if (parent !== filterParent.value) return false
    }
    return true
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filterLevel.value = '全部层级'
  filterType.value = '全部类型'
  filterStatus.value = '全部状态'
  filterParent.value = '全部父节点'
  filteredRows.value = intentRows.value
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="space-y-1">
      <h2 class="text-xl font-semibold text-slate-900">意图节点管理</h2>
      <p class="text-sm text-slate-500">分页查看和快速定位到意图树节点</p>
    </div>

    <!-- Filters -->
    <Card class="border-slate-200 bg-white shadow-none">
      <CardContent class="pt-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <Search class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchQuery"
              placeholder="搜索意图名称/ID..."
              class="h-9 w-64 border-slate-200 bg-white pl-9"
              @input="applyFilters"
            />
          </div>

          <div class="relative">
            <select
              v-model="filterLevel"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="applyFilters"
            >
              <option value="全部层级">全部层级</option>
              <option value="DOMAIN">DOMAIN</option>
              <option value="CATEGORY">CATEGORY</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="relative">
            <select
              v-model="filterType"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="applyFilters"
            >
              <option value="全部类型">全部类型</option>
              <option value="KB">KB</option>
              <option value="RAG">RAG</option>
              <option value="MCP">MCP</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="relative">
            <select
              v-model="filterStatus"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="applyFilters"
            >
              <option value="全部状态">全部状态</option>
              <option value="启用">启用</option>
              <option value="停用">停用</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="relative">
            <select
              v-model="filterParent"
              class="h-9 rounded-md border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 appearance-none"
              @change="applyFilters"
            >
              <option value="全部父节点">全部父节点</option>
              <option value="ROOT">ROOT（根节点）</option>
              <option value="发票信息">发票信息</option>
              <option value="销售汇总数据统计">销售汇总数据统计</option>
              <option value="客户工单服务管理">客户工单服务管理</option>
              <option value="系统交互">系统交互</option>
              <option value="天气信息查询服务">天气信息查询服务</option>
            </select>
            <svg class="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
          </div>

          <div class="ml-auto flex gap-2">
            <Button variant="outline" class="h-9 rounded-md border-slate-200 bg-white" @click="applyFilters">
              <RefreshCw class="size-4" />
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
      <CardContent class="pt-6">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1100px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">意图节点</th>
                <th class="px-4 py-3 font-medium">层级</th>
                <th class="px-4 py-3 font-medium">类型</th>
                <th class="px-4 py-3 font-medium">路径</th>
                <th class="px-4 py-3 font-medium">关联资源</th>
                <th class="px-4 py-3 font-medium">示例数</th>
                <th class="px-4 py-3 font-medium">状态</th>
                <th class="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredRows" :key="row.code" class="border-t border-slate-200 hover:bg-slate-50/50">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-slate-900">{{ row.name }}</span>
                    <code class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{{ row.code }}</code>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getLevelClass(row.level)]">
                    {{ row.level }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getTypeClass(row.type)]">
                    {{ row.type }}
                  </Badge>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">{{ row.path }}</td>
                <td class="px-4 py-3">
                  <div v-if="row.collection !== '-'" class="space-y-0.5">
                    <span class="text-sm text-slate-700">{{ row.collection }}</span>
                    <p class="text-xs text-slate-500">TopK: {{ row.topK }}</p>
                  </div>
                  <span v-else class="text-sm text-slate-400">-</span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-700">{{ row.exampleCount }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.status)]">
                    {{ row.status }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-1">
                    <Button variant="outline" size="icon-sm" class="size-8 rounded-md border-slate-200 bg-white">
                      <Pencil class="size-3.5" />
                    </Button>
                    <Button variant="outline" size="icon-sm" class="size-8 rounded-md border-slate-200 bg-white">
                      <TreePine class="size-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span class="text-sm text-slate-500">共 {{ filteredRows.length }} 条记录</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" disabled class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">
              上一页
            </Button>
            <span class="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white">1</span>
            <Button variant="outline" disabled class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">
              下一页
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

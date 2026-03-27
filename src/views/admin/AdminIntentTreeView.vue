<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Plus, Pencil, Trash2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-vue-next'

type IntentNode = {
  id: string
  name: string
  code: string
  level: string
  type: string
  collection: string
  topK: string
  description: string
  examples: string[]
  parent: string
  sort: number
  status: string
  children: IntentNode[]
}

const activeTab = ref('发票信息')

const treeData = ref<IntentNode[]>([
  {
    id: '1',
    name: '发票信息',
    code: 'DOMAIN_INVOICE',
    level: 'DOMAIN',
    type: 'KB',
    collection: 'finance',
    topK: '默认（全局）',
    description: '咨询公司发票抬头信息',
    examples: ['阿里巴巴发票抬头', '快手发票信息'],
    parent: 'ROOT',
    sort: 0,
    status: '启用',
    children: [
      {
        id: '1-1',
        name: '增值税发票',
        code: 'CATEGORY_VAT_INVOICE',
        level: 'CATEGORY',
        type: 'KB',
        collection: 'finance',
        topK: '默认（全局）',
        description: '增值税专用发票与普通发票查询',
        examples: ['专票开票信息', '增值税普票'],
        parent: 'DOMAIN_INVOICE',
        sort: 0,
        status: '启用',
        children: []
      }
    ]
  },
  {
    id: '2',
    name: '销售汇总数据统计',
    code: 'DOMAIN_SALES',
    level: 'DOMAIN',
    type: 'RAG',
    collection: 'sales_report',
    topK: '5',
    description: '销售数据汇总与统计分析',
    examples: ['上月销售额', '本季度营收趋势'],
    parent: 'ROOT',
    sort: 1,
    status: '启用',
    children: [
      {
        id: '2-1',
        name: '销售数据统计',
        code: 'CATEGORY_SALES_DATA',
        level: 'CATEGORY',
        type: 'RAG',
        collection: 'sales_report',
        topK: '默认（全局）',
        description: '按维度查看销售数据明细',
        examples: ['华东区销售额', '产品线营收'],
        parent: 'DOMAIN_SALES',
        sort: 0,
        status: '启用',
        children: []
      }
    ]
  },
  {
    id: '3',
    name: '客户工单服务管理',
    code: 'DOMAIN_TICKET',
    level: 'DOMAIN',
    type: 'MCP',
    collection: 'ticket_system',
    topK: '3',
    description: '客户工单创建、查询与状态管理',
    examples: ['查询工单进度', '创建售后工单'],
    parent: 'ROOT',
    sort: 2,
    status: '启用',
    children: [
      {
        id: '3-1',
        name: '客户工单查询',
        code: 'CATEGORY_TICKET_QUERY',
        level: 'CATEGORY',
        type: 'MCP',
        collection: 'ticket_system',
        topK: '默认（全局）',
        description: '根据工单号或条件查询工单',
        examples: ['工单 TK20260301 状态', '我的未完成工单'],
        parent: 'DOMAIN_TICKET',
        sort: 0,
        status: '启用',
        children: []
      }
    ]
  },
  {
    id: '4',
    name: '系统交互',
    code: 'DOMAIN_SYSTEM',
    level: 'DOMAIN',
    type: 'SYSTEM',
    collection: '-',
    topK: '默认（全局）',
    description: '系统内置交互能力，如欢迎、帮助与反馈',
    examples: [],
    parent: 'ROOT',
    sort: 3,
    status: '启用',
    children: [
      {
        id: '4-1',
        name: '欢迎与问候',
        code: 'CATEGORY_WELCOME',
        level: 'CATEGORY',
        type: 'SYSTEM',
        collection: '-',
        topK: '默认（全局）',
        description: '用户进入对话时的欢迎回复',
        examples: ['你好', '早上好'],
        parent: 'DOMAIN_SYSTEM',
        sort: 0,
        status: '启用',
        children: []
      },
      {
        id: '4-2',
        name: '关于助手',
        code: 'CATEGORY_ABOUT',
        level: 'CATEGORY',
        type: 'SYSTEM',
        collection: '-',
        topK: '默认（全局）',
        description: '介绍 AI 助手的能力与使用方式',
        examples: ['你能做什么', '帮助'],
        parent: 'DOMAIN_SYSTEM',
        sort: 1,
        status: '启用',
        children: []
      },
      {
        id: '4-3',
        name: '情感反馈',
        code: 'CATEGORY_FEEDBACK',
        level: 'CATEGORY',
        type: 'SYSTEM',
        collection: '-',
        topK: '默认（全局）',
        description: '用户表达感谢或不满时的回复',
        examples: ['谢谢', '太棒了'],
        parent: 'DOMAIN_SYSTEM',
        sort: 2,
        status: '启用',
        children: []
      }
    ]
  },
  {
    id: '5',
    name: '天气信息查询服务',
    code: 'DOMAIN_WEATHER',
    level: 'DOMAIN',
    type: 'MCP',
    collection: 'weather_service',
    topK: '3',
    description: '查询天气信息与气象数据',
    examples: ['今天天气如何', '北京明天有雨吗'],
    parent: 'ROOT',
    sort: 4,
    status: '启用',
    children: [
      {
        id: '5-1',
        name: '天气查询',
        code: 'CATEGORY_WEATHER_QUERY',
        level: 'CATEGORY',
        type: 'MCP',
        collection: 'weather_service',
        topK: '默认（全局）',
        description: '根据城市名称查询实时天气',
        examples: ['上海天气', '深圳今天几度'],
        parent: 'DOMAIN_WEATHER',
        sort: 0,
        status: '启用',
        children: []
      }
    ]
  }
])

const expandedNodes = ref<Set<string>>(new Set(['1', '2', '3', '4', '5']))

const selectedNode = ref<IntentNode | null>(treeData.value[0])

const toggleNode = (id: string) => {
  const s = new Set(expandedNodes.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  expandedNodes.value = s
}

const selectNode = (node: IntentNode) => {
  selectedNode.value = node
}

const tabs = computed(() => treeData.value.map(n => n.name))

const getTypeClass = (type: string) => {
  const map: Record<string, string> = {
    KB: 'border-blue-200 bg-blue-50 text-blue-700',
    RAG: 'border-purple-200 bg-purple-50 text-purple-700',
    MCP: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SYSTEM: 'border-slate-200 bg-slate-50 text-slate-700'
  }
  return map[type] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getLevelClass = (level: string) => {
  const map: Record<string, string> = {
    DOMAIN: 'border-amber-200 bg-amber-50 text-amber-700',
    CATEGORY: 'border-blue-200 bg-blue-50 text-blue-700'
  }
  return map[level] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const filterTree = (nodes: IntentNode[], tab: string) => {
  if (tab === '全部') return nodes
  return nodes.map(node => {
    if (node.name === tab) return { ...node, children: node.children }
    return { ...node, children: filterTree(node.children, tab) }
  })
}

const filteredTree = computed(() => filterTree(treeData.value, activeTab.value))
</script>

<template>
  <div class="space-y-4">
    <!-- Header actions -->
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h2 class="text-xl font-semibold text-slate-900">意图树配置</h2>
        <p class="text-sm text-slate-500">配置意图层级、类型和节点关系</p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="rounded-md border-slate-200 bg-white">
          <RefreshCw class="size-4" />
          刷新
        </Button>
        <Button class="rounded-md bg-slate-900 text-white hover:bg-slate-800">
          <Plus class="size-4" />
          新建根节点
        </Button>
      </div>
    </div>

    <!-- Two-column layout -->
    <section class="grid gap-4 xl:grid-cols-2">
      <!-- Left: Tree structure -->
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">意图树结构</CardTitle>
          <CardDescription class="text-sm text-slate-500">点击节点查看详情或进行编辑</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- Tabs -->
          <div class="mb-4 flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="tab in ['全部', ...tabs]"
              :key="tab"
              :class="[
                'shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors',
                activeTab === tab
                  ? 'bg-slate-900 font-medium text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              ]"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Tree -->
          <div class="space-y-0.5">
            <template v-for="node in filteredTree" :key="node.id">
              <!-- Root node -->
              <button
                :class="[
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                  selectedNode?.id === node.id
                    ? 'bg-slate-100 text-slate-900'
                    : 'hover:bg-slate-50 text-slate-700'
                ]"
                @click="selectNode(node)"
              >
                <component
                  :is="expandedNodes.has(node.id) ? ChevronDown : ChevronRight"
                  class="size-4 shrink-0 text-slate-400"
                  @click.stop="toggleNode(node.id)"
                />
                <span class="flex-1 truncate text-sm font-medium">{{ node.name }}</span>
                <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getTypeClass(node.type)]">
                  {{ node.type }}
                </Badge>
              </button>

              <!-- Children -->
              <div v-show="expandedNodes.has(node.id)" class="ml-6 border-l border-slate-200 pl-4">
                <button
                  v-for="child in node.children"
                  :key="child.id"
                  :class="[
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                    selectedNode?.id === child.id
                      ? 'bg-slate-100 text-slate-900'
                      : 'hover:bg-slate-50 text-slate-700'
                  ]"
                  @click="selectNode(child)"
                >
                  <component
                    :is="expandedNodes.has(child.id) ? ChevronDown : ChevronRight"
                    class="size-4 shrink-0 text-slate-400"
                    @click.stop="toggleNode(child.id)"
                  />
                  <span class="flex-1 truncate text-sm">{{ child.name }}</span>
                  <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getTypeClass(child.type)]">
                    {{ child.type }}
                  </Badge>
                  <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getLevelClass(child.level)]">
                    {{ child.level }}
                  </Badge>
                </button>
              </div>
            </template>
          </div>
        </CardContent>
      </Card>

      <!-- Right: Node details -->
      <Card class="border-slate-200 bg-white shadow-none">
        <CardHeader>
          <CardTitle class="text-xl font-semibold text-slate-900">节点详情</CardTitle>
          <CardDescription class="text-sm text-slate-500">查看并管理当前选择的节点</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="selectedNode" class="space-y-5">
            <!-- Node header -->
            <div class="flex items-start justify-between">
              <div class="space-y-2">
                <h3 class="text-lg font-semibold text-slate-900">{{ selectedNode.name }}</h3>
                <div class="flex flex-wrap gap-2">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getLevelClass(selectedNode.level)]">
                    {{ selectedNode.level }}
                  </Badge>
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getTypeClass(selectedNode.type)]">
                    {{ selectedNode.type }}
                  </Badge>
                  <Badge variant="outline" class="rounded-md border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {{ selectedNode.status }}
                  </Badge>
                </div>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" class="rounded-md border-slate-200 bg-white">
                  <Plus class="size-4" />
                  新建子节点
                </Button>
                <Button variant="outline" size="sm" class="rounded-md border-slate-200 bg-white">
                  <Pencil class="size-4" />
                  编辑
                </Button>
                <Button variant="outline" size="sm" class="rounded-md border-slate-200 bg-white text-rose-600 hover:text-rose-700">
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </div>

            <div class="border-t border-slate-100" />

            <!-- Detail fields -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">父节点</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.parent }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">排序</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.sort }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">Collection</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.collection }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">节点 TopK</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.topK }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">节点编码</span>
                <code class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{{ selectedNode.code }}</code>
              </div>
              <div>
                <span class="text-sm text-slate-500">描述</span>
                <p class="mt-1 text-sm text-slate-700">{{ selectedNode.description }}</p>
              </div>
              <div v-if="selectedNode.examples.length">
                <span class="text-sm text-slate-500">示例问题</span>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge
                    v-for="ex in selectedNode.examples"
                    :key="ex"
                    variant="outline"
                    class="rounded-md border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                  >
                    {{ ex }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="flex flex-col items-center justify-center py-16 text-slate-400">
            <p class="text-sm">点击左侧节点查看详情</p>
          </div>
        </CardContent>
      </Card>
    </section>
  </div>
</template>

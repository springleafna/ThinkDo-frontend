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
import { Plus, Pencil, Trash2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  intentNodeApi,
  IntentKindMap,
  IntentLevelMap,
  type IntentNodeTree
} from '@/api/intentNode'

const isLoading = ref(false)
const treeData = ref<IntentNodeTree[]>([])
const activeTab = ref('全部')
const expandedNodes = ref<Set<string>>(new Set())
const selectedNode = ref<IntentNodeTree | null>(null)

const fetchTree = async () => {
  isLoading.value = true
  try {
    const data = await intentNodeApi.getFullTree()
    treeData.value = data
    // 默认展开所有根节点
    expandedNodes.value = new Set(data.map(n => n.id))
    // 默认选中第一个
    if (data.length > 0) {
      selectedNode.value = data[0]
    }
  } catch (error) {
    console.error('获取意图树失败:', error)
    toast.error('获取意图树失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchTree()
})

const toggleNode = (id: string) => {
  const s = new Set(expandedNodes.value)
  if (s.has(id)) {
    s.delete(id)
  } else {
    s.add(id)
  }
  expandedNodes.value = s
}

const selectNode = (node: IntentNodeTree) => {
  selectedNode.value = node
}

const tabs = computed(() => treeData.value.map(n => n.name))

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

const getTypeClass = (kind: number) => {
  const label = getKindLabel(kind)
  const map: Record<string, string> = {
    KB: 'border-blue-200 bg-blue-50 text-blue-700',
    MCP: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SYSTEM: 'border-slate-200 bg-slate-50 text-slate-700'
  }
  return map[label] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const getLevelClass = (level: number) => {
  const label = getLevelLabel(level)
  const map: Record<string, string> = {
    DOMAIN: 'border-amber-200 bg-amber-50 text-amber-700',
    CATEGORY: 'border-blue-200 bg-blue-50 text-blue-700',
    TOPIC: 'border-purple-200 bg-purple-50 text-purple-700'
  }
  return map[label] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

const filterTree = (nodes: IntentNodeTree[], tab: string) => {
  if (tab === '全部') return nodes
  return nodes
    .filter(node => node.name === tab)
    .map(node => ({ ...node }))
}

const filteredTree = computed(() => filterTree(treeData.value, activeTab.value))

// 创建节点
const showCreateDialog = ref(false)
const createForm = ref({
  intentCode: '',
  name: '',
  kind: 0 as number,
  level: 0 as number,
  description: '',
  examples: '',
  scope: '',
  collectionName: '',
  topK: null as number | null,
  mcpToolId: '',
  sortOrder: 0
})
const createIsRoot = ref(true)
const levelDisabled = ref(true)

// MCP 类型且 TOPIC 层级时需填写 mcpToolId
const isMcpType = computed(() => createForm.value.kind === 2)
const isTopicLevel = computed(() => createForm.value.level === 2)
const requireMcpToolId = computed(() => isMcpType.value && isTopicLevel.value)

const openCreateDialog = (isRoot: boolean) => {
  createIsRoot.value = isRoot
  const parentLevel = !isRoot && selectedNode.value ? selectedNode.value.level : -1
  const nextLevel = parentLevel + 1 as number
  createForm.value = {
    intentCode: '',
    name: '',
    kind: 0,
    level: nextLevel,
    description: '',
    examples: '',
    scope: '',
    collectionName: '',
    topK: null,
    mcpToolId: '',
    sortOrder: 0
  }
  // 根节点固定 DOMAIN，子节点层级由父节点决定，均不可手动选择
  levelDisabled.value = true
  showCreateDialog.value = true
}

const handleCreate = async () => {
  if (!createForm.value.intentCode.trim() || !createForm.value.name.trim()) {
    toast.error('编码和名称不能为空')
    return
  }
  if (requireMcpToolId.value && !createForm.value.mcpToolId.trim()) {
    toast.error('TOPIC 级别的 MCP 节点必须填写 MCP Tool ID')
    return
  }
  try {
    const parentCode = createIsRoot.value ? null : selectedNode.value?.intentCode ?? null
      ? selectedNode.value.intentCode
      : null
    const examplesList = createForm.value.examples
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
    await intentNodeApi.create({
      ...createForm.value,
      examples: examplesList,
      parentCode
    })
    toast.success('创建成功')
    showCreateDialog.value = false
    await fetchTree()
  } catch (error) {
    console.error('创建失败:', error)
  }
}
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
        <Button variant="outline" class="rounded-md border-slate-200 bg-white" :disabled="isLoading" @click="fetchTree">
          <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
          刷新
        </Button>
        <Button class="rounded-md bg-slate-900 text-white hover:bg-slate-800" @click="openCreateDialog(true)">
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
          <div v-if="tabs.length" class="mb-4 flex gap-2 overflow-x-auto pb-2">
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

          <!-- Loading -->
          <div v-if="isLoading" class="flex items-center justify-center py-12 text-sm text-slate-400">
            <RefreshCw class="mr-2 size-4 animate-spin" />
            加载中...
          </div>

          <!-- Empty -->
          <div v-else-if="!filteredTree.length" class="flex flex-col items-center justify-center py-12 text-slate-400">
            <p class="text-sm">暂无意图节点，点击上方按钮创建</p>
          </div>

          <!-- Tree -->
          <div v-else class="space-y-0.5">
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
                <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getLevelClass(node.level)]">
                  {{ getLevelLabel(node.level) }}
                </Badge>
                <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getTypeClass(node.kind)]">
                  {{ getKindLabel(node.kind) }}
                </Badge>
              </button>

              <!-- Children -->
              <div v-show="expandedNodes.has(node.id)" class="ml-6 border-l border-slate-200 pl-4">
                <template v-for="child in node.children" :key="child.id">
                  <button
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
                    <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getTypeClass(child.kind)]">
                      {{ getKindLabel(child.kind) }}
                    </Badge>
                    <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getLevelClass(child.level)]">
                      {{ getLevelLabel(child.level) }}
                    </Badge>
                  </button>

                  <!-- Third level -->
                  <div v-show="expandedNodes.has(child.id)" class="ml-6 border-l border-slate-200 pl-4">
                    <button
                      v-for="grandChild in child.children"
                      :key="grandChild.id"
                      :class="[
                        'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors',
                        selectedNode?.id === grandChild.id
                          ? 'bg-slate-100 text-slate-900'
                          : 'hover:bg-slate-50 text-slate-700'
                      ]"
                      @click="selectNode(grandChild)"
                    >
                      <span class="size-4 shrink-0" />
                      <span class="flex-1 truncate text-sm">{{ grandChild.name }}</span>
                      <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getTypeClass(grandChild.kind)]">
                        {{ getKindLabel(grandChild.kind) }}
                      </Badge>
                      <Badge variant="outline" :class="['rounded-md px-1.5 py-0 text-[10px]', getLevelClass(grandChild.level)]">
                        {{ getLevelLabel(grandChild.level) }}
                      </Badge>
                    </button>
                  </div>
                </template>
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
                    {{ getLevelLabel(selectedNode.level) }}
                  </Badge>
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getTypeClass(selectedNode.kind)]">
                    {{ getKindLabel(selectedNode.kind) }}
                  </Badge>
                  <Badge variant="outline" :class="[
                    'rounded-md px-2 py-0.5 text-xs',
                    selectedNode.enabled === 1
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  ]">
                    {{ selectedNode.enabled === 1 ? '启用' : '禁用' }}
                  </Badge>
                </div>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" class="rounded-md border-slate-200 bg-white" :disabled="getLevelLabel(selectedNode.level) === 'TOPIC'" @click="openCreateDialog(false)">
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
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.parentCode ?? 'ROOT' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">排序</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.sortOrder }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">Collection</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.collectionName ?? '-' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">节点 TopK</span>
                <span class="text-sm font-medium text-slate-900">{{ selectedNode.topK ?? '默认（全局）' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-500">节点编码</span>
                <code class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{{ selectedNode.intentCode }}</code>
              </div>
              <div v-if="getKindLabel(selectedNode.kind) === 'MCP' && selectedNode.mcpToolId" class="flex items-center justify-between">
                <span class="text-sm text-slate-500">MCP Tool ID</span>
                <code class="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">{{ selectedNode.mcpToolId }}</code>
              </div>
              <div>
                <span class="text-sm text-slate-500">描述</span>
                <p class="mt-1 text-sm text-slate-700">{{ selectedNode.description }}</p>
              </div>
              <div v-if="parseExamples(selectedNode.examples).length">
                <span class="text-sm text-slate-500">示例问题</span>
                <div class="mt-2 flex flex-wrap gap-2">
                  <Badge
                    v-for="ex in parseExamples(selectedNode.examples)"
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

    <!-- Create dialog -->
    <Teleport to="body">
      <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="mb-4 text-lg font-semibold text-slate-900">新建意图节点</h3>
          <div class="space-y-4">
            <div>
              <label class="mb-1 block text-sm text-slate-600">节点编码 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.intentCode"
                placeholder="如 DOMAIN_WEATHER"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div>
              <label class="mb-1 block text-sm text-slate-600">名称 <span class="text-red-500">*</span></label>
              <input
                v-model="createForm.name"
                placeholder="如 天气信息查询"
                class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1 block text-sm text-slate-600">层级</label>
                <Select v-model="createForm.level" disabled>
                  <SelectTrigger class="w-full rounded-lg border-slate-200 bg-slate-50">
                    <SelectValue placeholder="选择层级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="0">DOMAIN</SelectItem>
                    <SelectItem :value="1">CATEGORY</SelectItem>
                    <SelectItem :value="2">TOPIC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-600">类型</label>
                <Select v-model="createForm.kind">
                  <SelectTrigger class="w-full rounded-lg border-slate-200 bg-slate-50">
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem :value="0">KB (RAG)</SelectItem>
                    <SelectItem :value="1">SYSTEM</SelectItem>
                    <SelectItem :value="2">MCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <!-- MCP 类型时的表单项 -->
            <template v-if="isMcpType">
              <div v-if="requireMcpToolId">
                <label class="mb-1 block text-sm text-slate-600">MCP Tool ID <span class="text-red-500">*</span></label>
                <input
                  v-model="createForm.mcpToolId"
                  placeholder="如 weather_query"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-600">节点描述</label>
                <textarea
                  v-model="createForm.description"
                  placeholder="节点描述（可选）"
                  rows="2"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div v-if="requireMcpToolId">
                <label class="mb-1 block text-sm text-slate-600">示例问题</label>
                <textarea
                  v-model="createForm.examples"
                  placeholder="每行输入一个示例问题，如：&#10;今天天气如何&#10;北京明天有雨吗"
                  rows="3"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </template>
            <!-- 非 MCP 类型时的表单项 -->
            <template v-else>
              <div>
                <textarea
                  v-model="createForm.description"
                  placeholder="节点描述"
                  rows="2"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div>
                <label class="mb-1 block text-sm text-slate-600">示例问题</label>
                <textarea
                  v-model="createForm.examples"
                  placeholder="每行输入一个示例问题，如：&#10;今天天气如何&#10;北京明天有雨吗"
                  rows="3"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="mb-1 block text-sm text-slate-600">Collection</label>
                  <input
                    v-model="createForm.collectionName"
                    placeholder="Milvus collection 名"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-sm text-slate-600">TopK</label>
                  <input
                    v-model.number="createForm.topK"
                    type="number"
                    placeholder="默认全局"
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </template>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <Button variant="outline" class="rounded-md border-slate-200" @click="showCreateDialog = false">
              取消
            </Button>
            <Button class="rounded-md bg-slate-900 text-white hover:bg-slate-800" @click="handleCreate">
              创建
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

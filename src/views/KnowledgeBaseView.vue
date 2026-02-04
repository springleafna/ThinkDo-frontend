<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  Plus,
  Search,
  Folder,
  FolderOpen,
  FileText,
  Upload,
  Trash2,
  Edit3,
  MoreVertical,
  Clock,
  Grid3x3,
  List,
  Library,
  Archive,
  Star
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const layoutStore = useLayoutStore()
const activeView = ref('knowledge-base')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 视图模式：网格或列表
const viewMode = ref<'grid' | 'list'>('grid')

// 搜索关键词
const searchKeyword = ref('')

// 知识库分类
const selectedCategory = ref('all')

const categories = ref([
  { id: 'all', name: '全部知识库', icon: Library, count: 0 },
  { id: 'recent', name: '最近使用', icon: Clock, count: 0 },
  { id: 'favorite', name: '收藏夹', icon: Star, count: 0 },
  { id: 'archive', name: '已归档', icon: Archive, count: 0 }
])

// 知识库数据接口
interface KnowledgeBase {
  id: number
  name: string
  description: string
  fileCount: number
  category: string
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// 模拟知识库数据
const knowledgeBases = ref<KnowledgeBase[]>([
  {
    id: 1,
    name: '前端开发资料',
    description: 'Vue3、React、TypeScript 等前端技术文档和教程',
    fileCount: 28,
    category: 'recent',
    isFavorite: true,
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-15T10:30:00'
  },
  {
    id: 2,
    name: '产品设计灵感',
    description: 'UI/UX 设计案例、配色方案、设计规范等',
    fileCount: 15,
    category: 'recent',
    isFavorite: false,
    createdAt: '2024-01-14T14:20:00',
    updatedAt: '2024-01-14T14:20:00'
  },
  {
    id: 3,
    name: '项目文档',
    description: '各个项目的需求文档、技术方案、会议记录',
    fileCount: 42,
    category: 'recent',
    isFavorite: true,
    createdAt: '2024-01-13T20:15:00',
    updatedAt: '2024-01-13T20:15:00'
  },
  {
    id: 4,
    name: 'AI 学习笔记',
    description: '机器学习、深度学习、LLM 相关资料',
    fileCount: 19,
    category: 'favorite',
    isFavorite: true,
    createdAt: '2024-01-12T16:45:00',
    updatedAt: '2024-01-12T16:45:00'
  },
  {
    id: 5,
    name: '个人博客素材',
    description: '技术博客文章草稿、图片素材、引用资料',
    fileCount: 8,
    category: 'archive',
    isFavorite: false,
    createdAt: '2024-01-11T09:00:00',
    updatedAt: '2024-01-11T09:00:00'
  },
  {
    id: 6,
    name: '工具使用指南',
    description: '各种开发工具、生产力工具的使用说明',
    fileCount: 12,
    category: 'archive',
    isFavorite: false,
    createdAt: '2024-01-10T22:30:00',
    updatedAt: '2024-01-10T22:30:00'
  }
])

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year === now.getFullYear() ? `${month}-${day}` : `${year}-${month}-${day}`
}

// 过滤后的知识库列表
const filteredKnowledgeBases = computed(() => {
  let result = knowledgeBases.value

  // 按分类筛选
  if (selectedCategory.value === 'favorite') {
    result = result.filter(kb => kb.isFavorite)
  } else if (selectedCategory.value !== 'all') {
    result = result.filter(kb => kb.category === selectedCategory.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(kb =>
      kb.name.toLowerCase().includes(keyword) ||
      kb.description.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 更新分类计数
const updateCategoryCount = () => {
  categories.value.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = knowledgeBases.value.length
    } else if (cat.id === 'favorite') {
      cat.count = knowledgeBases.value.filter(k => k.isFavorite).length
    } else {
      cat.count = knowledgeBases.value.filter(k => k.category === cat.id).length
    }
  })
}

// 切换收藏状态
const toggleFavorite = (kbId: number) => {
  const kb = knowledgeBases.value.find(k => k.id === kbId)
  if (kb) {
    kb.isFavorite = !kb.isFavorite
    toast.success(kb.isFavorite ? '已添加到收藏' : '已取消收藏')
    updateCategoryCount()
  }
}

// 删除知识库
const deleteKnowledgeBase = (kbId: number) => {
  const index = knowledgeBases.value.findIndex(k => k.id === kbId)
  if (index !== -1) {
    knowledgeBases.value.splice(index, 1)
    toast.success('知识库已删除')
    updateCategoryCount()
  }
}

// 新建知识库
const createKnowledgeBase = () => {
  toast.success('创建知识库功能开发中...')
}

// 查看知识库文件列表
const viewKnowledgeBaseFiles = (kbId: number) => {
  router.push(`/knowledge-base/${kbId}`)
}

onMounted(() => {
  updateCategoryCount()
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div class="max-w-7xl mx-auto p-8 md:p-12">
          <!-- 页面标题 -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-neutral-900 mb-2">知识库</h1>
                <p class="text-sm text-neutral-400">
                  上传文件，构建你的知识管理体系
                </p>
              </div>
              <button
                @click="createKnowledgeBase"
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Plus :size="16" />
                <span>新建知识库</span>
              </button>
            </div>
          </div>

          <!-- 工具栏 -->
          <div class="mb-6 flex items-center gap-4">
            <!-- 搜索框 -->
            <div class="flex-1 relative">
              <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" :size="18" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索知识库..."
                class="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>

            <!-- 上传按钮 -->
            <button
              class="flex items-center gap-2 px-4 py-3 bg-white border border-black/5 rounded-xl text-sm hover:bg-black/5 transition-all"
            >
              <Upload :size="16" />
              <span class="hidden sm:inline">上传文件</span>
            </button>

            <!-- 视图切换 -->
            <div class="flex items-center gap-2 bg-white border border-black/5 rounded-xl p-1">
              <button
                @click="viewMode = 'grid'"
                :class="[
                  'p-2 rounded-lg transition-all',
                  viewMode === 'grid' ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-900'
                ]"
              >
                <Grid3x3 :size="16" />
              </button>
              <button
                @click="viewMode = 'list'"
                :class="[
                  'p-2 rounded-lg transition-all',
                  viewMode === 'list' ? 'bg-black text-white' : 'text-neutral-400 hover:text-neutral-900'
                ]"
              >
                <List :size="16" />
              </button>
            </div>
          </div>

          <!-- 主体内容 -->
          <div class="flex gap-6">
            <!-- 左侧分类列表 -->
            <aside class="w-60 shrink-0 hidden lg:block">
              <div class="sticky top-0 space-y-6">
                <!-- 分类 -->
                <div>
                  <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 px-1">
                    分类
                  </h3>
                  <div class="space-y-1">
                    <button
                      v-for="category in categories"
                      :key="category.id"
                      @click="selectedCategory = category.id"
                      :class="[
                        'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left',
                        selectedCategory === category.id
                          ? 'bg-zinc-100 text-zinc-900 font-semibold'
                          : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-900'
                      ]"
                    >
                      <div class="flex items-center gap-3">
                        <component :is="category.icon" :size="16" />
                        <span class="text-sm">{{ category.name }}</span>
                      </div>
                      <span class="text-xs text-neutral-400">{{ category.count }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <!-- 右侧知识库列表 -->
            <div class="flex-1 min-w-0">
              <!-- 网格视图 -->
              <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div
                  v-for="kb in filteredKnowledgeBases"
                  :key="kb.id"
                  @click="viewKnowledgeBaseFiles(kb.id)"
                  class="group bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <!-- 知识库头部 -->
                  <div class="flex items-start justify-between mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-50 border border-black/5 rounded-xl flex items-center justify-center shadow-lg shadow-black/5">
                      <Folder :size="24" class="text-neutral-600" />
                    </div>
                    <button
                      @click.stop="toggleFavorite(kb.id)"
                      class="shrink-0"
                    >
                      <Star
                        v-if="kb.isFavorite"
                        :size="18"
                        class="fill-yellow-400 text-yellow-400"
                      />
                      <Star
                        v-else
                        :size="18"
                        class="text-neutral-300 group-hover:text-neutral-500"
                      />
                    </button>
                  </div>

                  <!-- 知识库名称 -->
                  <h3 class="text-lg font-semibold text-neutral-900 mb-2 line-clamp-1">
                    {{ kb.name }}
                  </h3>

                  <!-- 知识库描述 -->
                  <p class="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                    {{ kb.description }}
                  </p>

                  <!-- 底部信息 -->
                  <div class="flex items-center justify-between text-xs text-neutral-400">
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1">
                        <FileText :size="14" />
                        <span>{{ kb.fileCount }} 个文件</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Clock :size="14" />
                        <span>{{ formatTime(kb.updatedAt) }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        @click.stop
                        class="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 :size="14" />
                      </button>
                      <button
                        @click.stop="deleteKnowledgeBase(kb.id)"
                        class="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 新建知识库卡片 -->
                <button
                  @click="createKnowledgeBase"
                  class="border-2 border-dashed border-black/10 bg-white/50 rounded-2xl flex flex-col items-center justify-center p-6 text-neutral-400 hover:text-neutral-600 hover:bg-white hover:border-black/20 transition-all min-h-[240px] group"
                >
                  <div
                    class="w-12 h-12 rounded-full border border-black/10 bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  >
                    <Plus :size="24" :stroke-width="1" />
                  </div>
                  <span class="text-sm font-medium">新建知识库</span>
                </button>
              </div>

              <!-- 列表视图 -->
              <div v-else class="space-y-3">
                <div
                  v-for="kb in filteredKnowledgeBases"
                  :key="kb.id"
                  @click="viewKnowledgeBaseFiles(kb.id)"
                  class="group bg-white border border-black/5 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div class="flex items-center gap-4">
                    <!-- 图标/缩略图 -->
                    <div class="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-50 border border-black/5 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-black/5">
                      <Folder :size="20" class="text-neutral-600" />
                    </div>

                    <!-- 内容 -->
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-neutral-900 mb-1 line-clamp-1">
                        {{ kb.name }}
                      </h3>
                      <p class="text-xs text-neutral-500 line-clamp-1">
                        {{ kb.description }}
                      </p>
                    </div>

                    <!-- 文件数量 -->
                    <div class="hidden sm:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                      <FileText :size="14" />
                      <span>{{ kb.fileCount }}</span>
                    </div>

                    <!-- 时间 -->
                    <div class="hidden md:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                      <Clock :size="14" />
                      <span>{{ formatTime(kb.updatedAt) }}</span>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        @click.stop="toggleFavorite(kb.id)"
                        class="p-2 hover:bg-black/5 rounded-lg transition-colors"
                      >
                        <Star
                          v-if="kb.isFavorite"
                          :size="16"
                          class="fill-yellow-400 text-yellow-400"
                        />
                        <Star
                          v-else
                          :size="16"
                          class="text-neutral-300"
                        />
                      </button>
                      <button
                        @click.stop
                        class="p-2 hover:bg-black/5 rounded-lg transition-colors"
                      >
                        <Edit3 :size="16" class="text-neutral-400" />
                      </button>
                      <button
                        @click.stop="deleteKnowledgeBase(kb.id)"
                        class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 :size="16" class="text-neutral-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="filteredKnowledgeBases.length === 0"
                class="flex flex-col items-center justify-center py-20 text-neutral-400"
              >
                <FolderOpen :size="48" class="mb-4 opacity-50" />
                <p class="text-sm font-medium">暂无知识库</p>
                <p class="text-xs mt-1">点击上方按钮创建你的第一个知识库</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>

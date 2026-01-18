<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Tag,
  Edit3,
  Trash2,
  FolderOpen,
  Star,
  StarOff,
  ChevronRight,
  LayoutGrid,
  List,
  Clock,
  TrendingUp
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const layoutStore = useLayoutStore()
const activeView = ref('notes')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 视图模式：网格或列表
const viewMode = ref<'grid' | 'list'>('grid')

// 搜索关键词
const searchKeyword = ref('')

// 筛选条件
const selectedCategory = ref('all')
const selectedTag = ref('all')

// 笔记分类
const categories = ref([
  { id: 'all', name: '全部笔记', icon: FolderOpen, count: 0 },
  { id: 'study', name: '学习笔记', icon: TrendingUp, count: 0 },
  { id: 'work', name: '工作记录', icon: LayoutGrid, count: 0 },
  { id: 'life', name: '生活感悟', icon: Calendar, count: 0 },
  { id: 'favorite', name: '收藏夹', icon: Star, count: 0 }
])

// 常用标签
const tags = ref([
  { id: 'all', name: '全部', color: 'bg-gray-100 text-gray-700' },
  { id: 'important', name: '重要', color: 'bg-red-100 text-red-700' },
  { id: 'idea', name: '想法', color: 'bg-blue-100 text-blue-700' },
  { id: 'todo', name: '待办', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'done', name: '已完成', color: 'bg-green-100 text-green-700' },
  { id: 'question', name: '疑问', color: 'bg-purple-100 text-purple-700' }
])

// 模拟笔记数据
interface Note {
  id: number
  title: string
  content: string
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

const notes = ref<Note[]>([
  {
    id: 1,
    title: 'Vue3 组合式 API 学习笔记',
    content: 'Vue 3 的 Composition API 提供了一种更灵活的方式来组织组件逻辑。通过 setup 函数，我们可以更好地复用代码...',
    category: 'study',
    tags: ['important', 'idea'],
    isFavorite: true,
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-15T10:30:00'
  },
  {
    id: 2,
    title: '项目需求讨论会议记录',
    content: '今天和产品经理讨论了新功能的需求，主要涉及用户权限管理和数据可视化模块...',
    category: 'work',
    tags: ['todo', 'important'],
    isFavorite: false,
    createdAt: '2024-01-14T14:20:00',
    updatedAt: '2024-01-14T14:20:00'
  },
  {
    id: 3,
    title: '周末读书感悟',
    content: '读了《原子习惯》这本书，深受启发。微小的改变能够带来巨大的不同，关键是要坚持下去...',
    category: 'life',
    tags: ['done'],
    isFavorite: true,
    createdAt: '2024-01-13T20:15:00',
    updatedAt: '2024-01-13T20:15:00'
  },
  {
    id: 4,
    title: 'TypeScript 类型系统探究',
    content: 'TypeScript 的类型系统非常强大，泛型、条件类型、映射类型等高级特性可以帮我们构建更安全的应用...',
    category: 'study',
    tags: ['idea', 'question'],
    isFavorite: false,
    createdAt: '2024-01-12T16:45:00',
    updatedAt: '2024-01-12T16:45:00'
  },
  {
    id: 5,
    title: '季度工作总结',
    content: '这个季度完成了三个重要项目，团队协作效率有了明显提升。下个季度的目标是优化代码质量...',
    category: 'work',
    tags: ['done', 'important'],
    isFavorite: true,
    createdAt: '2024-01-11T09:00:00',
    updatedAt: '2024-01-11T09:00:00'
  },
  {
    id: 6,
    title: '高效时间管理技巧',
    content: '番茄工作法真的很有效，每工作25分钟休息5分钟，能够保持专注同时避免疲劳...',
    category: 'life',
    tags: ['idea'],
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

// 过滤后的笔记列表
const filteredNotes = computed(() => {
  let result = notes.value

  // 按分类筛选
  if (selectedCategory.value === 'favorite') {
    result = result.filter(note => note.isFavorite)
  } else if (selectedCategory.value !== 'all') {
    result = result.filter(note => note.category === selectedCategory.value)
  }

  // 按标签筛选
  if (selectedTag.value !== 'all') {
    result = result.filter(note => note.tags.includes(selectedTag.value))
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(note =>
      note.title.toLowerCase().includes(keyword) ||
      note.content.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 更新分类计数
const updateCategoryCount = () => {
  categories.value.forEach(cat => {
    if (cat.id === 'all') {
      cat.count = notes.value.length
    } else if (cat.id === 'favorite') {
      cat.count = notes.value.filter(n => n.isFavorite).length
    } else {
      cat.count = notes.value.filter(n => n.category === cat.id).length
    }
  })
}

// 切换收藏状态
const toggleFavorite = (noteId: number) => {
  const note = notes.value.find(n => n.id === noteId)
  if (note) {
    note.isFavorite = !note.isFavorite
    toast.success(note.isFavorite ? '已添加到收藏' : '已取消收藏')
    updateCategoryCount()
  }
}

// 删除笔记
const deleteNote = (noteId: number) => {
  const index = notes.value.findIndex(n => n.id === noteId)
  if (index !== -1) {
    notes.value.splice(index, 1)
    toast.success('笔记已删除')
    updateCategoryCount()
  }
}

// 新建笔记
const createNote = () => {
  toast.success('创建笔记功能开发中...')
}

// 查看笔记详情
const viewNoteDetail = (noteId: number) => {
  router.push(`/notes/${noteId}`)
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
                <h1 class="text-3xl font-bold text-neutral-900 mb-2">思维笔记</h1>
                <p class="text-sm text-neutral-400">
                  记录思考轨迹，构建知识体系
                </p>
              </div>
              <button
                @click="createNote"
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Plus :size="16" />
                <span>新建笔记</span>
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
                placeholder="搜索笔记..."
                class="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>

            <!-- 筛选按钮 -->
            <button
              class="flex items-center gap-2 px-4 py-3 bg-white border border-black/5 rounded-xl text-sm hover:bg-black/5 transition-all"
            >
              <Filter :size="16" />
              <span class="hidden sm:inline">筛选</span>
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
                <LayoutGrid :size="16" />
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

                <!-- 标签 -->
                <div>
                  <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 px-1">
                    标签
                  </h3>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="tag in tags"
                      :key="tag.id"
                      @click="selectedTag = tag.id"
                      :class="[
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        selectedTag === tag.id
                          ? 'bg-black text-white'
                          : tag.color
                      ]"
                    >
                      {{ tag.name }}
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <!-- 右侧笔记列表 -->
            <div class="flex-1 min-w-0">
              <!-- 网格视图 -->
              <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div
                  v-for="note in filteredNotes"
                  :key="note.id"
                  @click="viewNoteDetail(note.id)"
                  class="group bg-white border border-black/5 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <!-- 笔记头部 -->
                  <div class="flex items-start justify-between mb-3">
                    <h3 class="text-base font-semibold text-neutral-900 flex-1 line-clamp-2">
                      {{ note.title }}
                    </h3>
                    <button
                      @click.stop="toggleFavorite(note.id)"
                      class="ml-2 shrink-0"
                    >
                      <Star
                        v-if="note.isFavorite"
                        :size="18"
                        class="fill-yellow-400 text-yellow-400"
                      />
                      <StarOff
                        v-else
                        :size="18"
                        class="text-neutral-300 group-hover:text-neutral-500"
                      />
                    </button>
                  </div>

                  <!-- 笔记内容 -->
                  <p class="text-sm text-neutral-600 mb-4 line-clamp-3 leading-relaxed">
                    {{ note.content }}
                  </p>

                  <!-- 标签 -->
                  <div class="flex flex-wrap gap-2 mb-4">
                    <span
                      v-for="tagId in note.tags"
                      :key="tagId"
                      class="px-2 py-1 bg-black/5 text-neutral-600 rounded text-xs"
                    >
                      {{ tags.find(t => t.id === tagId)?.name || tagId }}
                    </span>
                  </div>

                  <!-- 底部信息 -->
                  <div class="flex items-center justify-between text-xs text-neutral-400">
                    <div class="flex items-center gap-1">
                      <Clock :size="14" />
                      <span>{{ formatTime(note.updatedAt) }}</span>
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
                        @click.stop="deleteNote(note.id)"
                        class="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 新建笔记卡片 -->
                <button
                  @click="createNote"
                  class="border-2 border-dashed border-black/10 bg-white/50 rounded-2xl flex flex-col items-center justify-center p-6 text-neutral-400 hover:text-neutral-600 hover:bg-white hover:border-black/20 transition-all min-h-[240px] group"
                >
                  <div
                    class="w-12 h-12 rounded-full border border-black/10 bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  >
                    <Plus :size="24" :stroke-width="1" />
                  </div>
                  <span class="text-sm font-medium">新建笔记</span>
                </button>
              </div>

              <!-- 列表视图 -->
              <div v-else class="space-y-3">
                <div
                  v-for="note in filteredNotes"
                  :key="note.id"
                  @click="viewNoteDetail(note.id)"
                  class="group bg-white border border-black/5 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div class="flex items-center gap-4">
                    <!-- 图标/缩略图 -->
                    <div class="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center shrink-0">
                      <component :is="categories.find(c => c.id === note.category)?.icon || FolderOpen" :size="20" class="text-neutral-600" />
                    </div>

                    <!-- 内容 -->
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-neutral-900 mb-1 line-clamp-1">
                        {{ note.title }}
                      </h3>
                      <p class="text-xs text-neutral-500 line-clamp-2">
                        {{ note.content }}
                      </p>
                    </div>

                    <!-- 标签 -->
                    <div class="hidden sm:flex flex-wrap gap-2 shrink-0">
                      <span
                        v-for="tagId in note.tags.slice(0, 2)"
                        :key="tagId"
                        class="px-2 py-1 bg-black/5 text-neutral-600 rounded text-xs"
                      >
                        {{ tags.find(t => t.id === tagId)?.name || tagId }}
                      </span>
                    </div>

                    <!-- 时间 -->
                    <div class="hidden md:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                      <Clock :size="14" />
                      <span>{{ formatTime(note.updatedAt) }}</span>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        @click.stop="toggleFavorite(note.id)"
                        class="p-2 hover:bg-black/5 rounded-lg transition-colors"
                      >
                        <Star
                          v-if="note.isFavorite"
                          :size="16"
                          class="fill-yellow-400 text-yellow-400"
                        />
                        <StarOff
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
                        @click.stop="deleteNote(note.id)"
                        class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 :size="16" class="text-neutral-400 hover:text-rose-600" />
                      </button>
                      <ChevronRight :size="16" class="text-neutral-300 ml-1" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="filteredNotes.length === 0"
                class="flex flex-col items-center justify-center py-20 text-neutral-400"
              >
                <FolderOpen :size="48" class="mb-4 opacity-50" />
                <p class="text-sm font-medium">暂无笔记</p>
                <p class="text-xs mt-1">点击上方按钮创建你的第一条笔记</p>
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

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
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

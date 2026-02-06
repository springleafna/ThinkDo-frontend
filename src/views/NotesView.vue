<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  Plus,
  Search,
  Filter,
  Tag,
  Edit3,
  Trash2,
  FolderOpen,
  Star,
  StarOff,
  ChevronRight,
  LayoutGrid,
  List,
  Clock
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { noteApi, type Note as NoteType, type NoteStatistics } from '@/api/note'
import { noteCategoryApi } from '@/api/noteCategory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

// 笔记统计数据
const statistics = ref<NoteStatistics | null>(null)

// 分类列表项类型
interface CategoryListItem {
  id: string
  name: string
  icon: any
  count: number
}

// 分类列表（包含特殊分类）
const categoryList = computed(() => {
  const list: CategoryListItem[] = [
    { id: 'all', name: '全部笔记', icon: FolderOpen, count: statistics.value?.totalCount || 0 },
    { id: 'favorite', name: '收藏夹', icon: Star, count: statistics.value?.favoritedCount || 0 }
  ]

  // 添加各分类
  if (statistics.value?.categoryCounts) {
    statistics.value.categoryCounts.forEach((cat) => {
      list.push({
        id: cat.categoryId.toString(),
        name: cat.categoryName,
        icon: FolderOpen,
        count: cat.count
      })
    })
  }

  return list
})

// 加载中状态
const loading = ref(false)

// 新建分类对话框
const showCategoryDialog = ref(false)
const newCategoryName = ref('')
const isCreatingCategory = ref(false)

// 本地笔记接口（兼容旧代码）
interface Note {
  id: number
  title: string
  content: string
  category: string
  categoryId?: number
  tags: string[]
  isFavorite: boolean
  createdAt: string
  updatedAt: string
}

// 笔记列表
const notes = ref<Note[]>([])

// 加载笔记列表
const loadNotes = async () => {
  loading.value = true
  try {
    const params: { categoryId?: number; keyword?: string; favorited?: number } = {}

    if (selectedCategory.value !== 'all' && selectedCategory.value !== 'favorite') {
      params.categoryId = parseInt(selectedCategory.value)
    }
    if (selectedCategory.value === 'favorite') {
      params.favorited = 1
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }

    const response = await noteApi.getList(params)
    notes.value = response.map((note: NoteType) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      category: note.categoryId?.toString() || '',
      categoryId: note.categoryId,
      tags: note.tags ? note.tags.split(',') : [],
      isFavorite: note.favorited === 1,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }))
  } catch (error) {
    console.error('加载笔记失败:', error)
    toast.error('加载笔记失败')
  } finally {
    loading.value = false
  }
}

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
  return notes.value
})

// 加载统计数据
const loadStatistics = async () => {
  try {
    statistics.value = await noteApi.getStatistics()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 切换收藏状态
const toggleFavorite = async (noteId: number) => {
  try {
    await noteApi.toggleFavorited(noteId)
    const note = notes.value.find(n => n.id === noteId)
    if (note) {
      note.isFavorite = !note.isFavorite
      toast.success(note.isFavorite ? '已添加到收藏' : '已取消收藏')
      // 重新加载统计数据
      await loadStatistics()
    }
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    toast.error('操作失败')
  }
}

// 删除笔记
const deleteNote = async (noteId: number) => {
  if (!confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
    return
  }

  try {
    await noteApi.delete(noteId)
    const index = notes.value.findIndex(n => n.id === noteId)
    if (index !== -1) {
      notes.value.splice(index, 1)
      toast.success('笔记已删除')
      // 重新加载统计数据
      await loadStatistics()
    }
  } catch (error) {
    console.error('删除笔记失败:', error)
    toast.error('删除失败')
  }
}

// 新建笔记
const createNote = async () => {
  try {
    const response = await noteApi.create({
      title: '新建笔记',
      content: '',
      tags: ''
    })

    toast.success('笔记创建成功')
    // 跳转到新创建的笔记详情页
    router.push(`/notes/${response}`)
  } catch (error) {
    console.error('创建笔记失败:', error)
    toast.error('创建笔记失败')
  }
}

// 打开新建分类对话框
const openCategoryDialog = () => {
  newCategoryName.value = ''
  showCategoryDialog.value = true
}

// 关闭新建分类对话框
const closeCategoryDialog = () => {
  showCategoryDialog.value = false
  newCategoryName.value = ''
}

// 创建分类
const createCategory = async () => {
  if (!newCategoryName.value.trim()) {
    toast.error('请输入分类名称')
    return
  }

  if (newCategoryName.value.trim().length > 50) {
    toast.error('分类名称不能超过50个字符')
    return
  }

  isCreatingCategory.value = true
  try {
    await noteCategoryApi.create({
      name: newCategoryName.value.trim()
    })

    toast.success('分类创建成功')
    closeCategoryDialog()
    // 重新加载统计数据
    await loadStatistics()
  } catch (error) {
    console.error('创建分类失败:', error)
    toast.error('创建分类失败')
  } finally {
    isCreatingCategory.value = false
  }
}

// 查看笔记详情
const viewNoteDetail = (noteId: number) => {
  router.push(`/notes/${noteId}`)
}

// 监听搜索和筛选变化
const handleSearch = () => {
  loadNotes()
}

// 监听分类变化
const handleCategoryChange = () => {
  loadNotes()
}

onMounted(() => {
  loadStatistics()
  loadNotes()
})

// 监听 ESC 键关闭对话框
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showCategoryDialog.value) {
    closeCategoryDialog()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
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
                <p class="text-sm text-neutral-400">
                  记录思考轨迹，构建知识体系
                </p>
              </div>
              <Button
                @click="createNote"
                size="lg"
                class="rounded-2xl text-[12px] font-bold tracking-widest"
              >
                <Plus :size="16" class="mr-2" />
                <span>新建笔记</span>
              </Button>
            </div>
          </div>

          <!-- 工具栏 -->
          <div class="mb-6 flex items-center gap-4">
            <!-- 搜索框 -->
            <div class="flex-1 relative">
              <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" :size="18" />
              <Input
                v-model="searchKeyword"
                @keyup.enter="handleSearch"
                type="text"
                placeholder="搜索笔记..."
                class="pl-12 bg-white border-black/5"
              />
            </div>

            <!-- 筛选按钮 -->
            <Button variant="outline" size="default" class="bg-white border-black/5 hover:bg-black/5">
              <Filter :size="16" class="mr-2" />
              <span class="hidden sm:inline">筛选</span>
            </Button>

            <!-- 视图切换 -->
            <div class="flex items-center gap-2 bg-white border border-black/5 rounded-xl p-1">
              <Button
                @click="viewMode = 'grid'"
                :variant="viewMode === 'grid' ? 'default' : 'ghost'"
                size="icon"
                class="rounded-lg"
              >
                <LayoutGrid :size="16" />
              </Button>
              <Button
                @click="viewMode = 'list'"
                :variant="viewMode === 'list' ? 'default' : 'ghost'"
                size="icon"
                class="rounded-lg"
              >
                <List :size="16" />
              </Button>
            </div>
          </div>

          <!-- 主体内容 -->
          <div class="flex gap-6">
            <!-- 左侧分类列表 -->
            <aside class="w-60 shrink-0 hidden lg:block">
              <div class="sticky top-0 space-y-6">
                <!-- 分类 -->
                <div>
                  <div class="flex items-center justify-between mb-3 px-1">
                    <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      分类
                    </h3>
                    <Button
                      @click="openCategoryDialog"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="新建分类"
                    >
                      <Plus :size="14" class="text-neutral-400" />
                    </Button>
                  </div>
                  <div class="space-y-1">
                    <Button
                      v-for="category in categoryList"
                      :key="category.id"
                      @click="selectedCategory = category.id; handleCategoryChange()"
                      :variant="selectedCategory === category.id ? 'secondary' : 'ghost'"
                      :class="selectedCategory === category.id ? 'bg-zinc-100 text-zinc-900 font-semibold justify-start' : 'text-neutral-500 hover:text-neutral-900 justify-start'"
                      class="w-full h-auto py-2.5 px-3"
                    >
                      <div class="flex items-center gap-3 flex-1">
                        <component :is="category.icon" :size="16" />
                        <span class="text-sm">{{ category.name }}</span>
                      </div>
                      <Badge variant="secondary" class="text-xs text-neutral-400">{{ category.count }}</Badge>
                    </Button>
                  </div>
                </div>
              </div>
            </aside>

            <!-- 右侧笔记列表 -->
            <div class="flex-1 min-w-0">
              <!-- 网格视图 -->
              <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card
                  v-for="note in filteredNotes"
                  :key="note.id"
                  @click="viewNoteDetail(note.id)"
                  class="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-black/5"
                >
                  <CardHeader class="pb-3">
                    <div class="flex items-start justify-between">
                      <CardTitle class="text-base flex-1 line-clamp-2">
                        {{ note.title }}
                      </CardTitle>
                      <Button
                        @click.stop="toggleFavorite(note.id)"
                        variant="ghost"
                        size="icon"
                        class="ml-2 shrink-0 h-8 w-8"
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
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent class="pb-4">
                    <CardDescription class="text-sm line-clamp-3 leading-relaxed mb-4">
                      {{ note.content }}
                    </CardDescription>

                    <!-- 标签 -->
                    <div v-if="note.tags.length > 0" class="flex flex-wrap gap-2 mb-4">
                      <Badge
                        v-for="tag in note.tags"
                        :key="tag"
                        variant="secondary"
                        class="text-xs"
                      >
                        {{ tag }}
                      </Badge>
                    </div>

                    <!-- 底部信息 -->
                    <div class="flex items-center justify-between text-xs text-neutral-400">
                      <div class="flex items-center gap-1">
                        <Clock :size="14" />
                        <span>{{ formatTime(note.updatedAt) }}</span>
                      </div>
                      <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          @click.stop
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8"
                          title="编辑"
                        >
                          <Edit3 :size="14" />
                        </Button>
                        <Button
                          @click.stop="deleteNote(note.id)"
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 hover:bg-rose-50 hover:text-rose-600"
                          title="删除"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <!-- 新建笔记卡片 -->
                <Button
                  @click="createNote"
                  variant="outline"
                  class="border-dashed border-2 border-black/10 bg-white/50 rounded-2xl flex-col h-auto min-h-[240px] py-6 text-neutral-400 hover:text-neutral-600 hover:bg-white hover:border-black/20"
                >
                  <div
                    class="w-12 h-12 rounded-full border border-black/10 bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  >
                    <Plus :size="24" :stroke-width="1" />
                  </div>
                  <span class="text-sm font-medium">新建笔记</span>
                </Button>
              </div>

              <!-- 列表视图 -->
              <div v-else class="space-y-3">
                <Card
                  v-for="note in filteredNotes"
                  :key="note.id"
                  @click="viewNoteDetail(note.id)"
                  class="group hover:shadow-md transition-all cursor-pointer border-black/5"
                >
                  <CardContent class="p-4">
                    <div class="flex items-center gap-4">
                      <!-- 图标/缩略图 -->
                      <div class="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center shrink-0">
                        <component :is="categoryList.find(c => c.id === note.category)?.icon" :size="20" class="text-neutral-600" />
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
                      <div v-if="note.tags.length > 0" class="hidden sm:flex flex-wrap gap-2 shrink-0">
                        <Badge
                          v-for="tag in note.tags.slice(0, 2)"
                          :key="tag"
                          variant="secondary"
                          class="text-xs"
                        >
                          {{ tag }}
                        </Badge>
                      </div>

                      <!-- 时间 -->
                      <div class="hidden md:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                        <Clock :size="14" />
                        <span>{{ formatTime(note.updatedAt) }}</span>
                      </div>

                      <!-- 操作按钮 -->
                      <div class="flex items-center gap-2 shrink-0">
                        <Button
                          @click.stop="toggleFavorite(note.id)"
                              variant="ghost"
                          size="icon"
                          class="h-9 w-9"
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
                        </Button>
                        <Button
                          @click.stop
                          variant="ghost"
                          size="icon"
                          class="h-9 w-9"
                        >
                          <Edit3 :size="16" class="text-neutral-400" />
                        </Button>
                        <Button
                          @click.stop="deleteNote(note.id)"
                          variant="ghost"
                          size="icon"
                          class="h-9 w-9 hover:bg-rose-50"
                        >
                          <Trash2 :size="16" class="text-neutral-400 hover:text-rose-600" />
                        </Button>
                        <ChevronRight :size="16" class="text-neutral-300 ml-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

    <!-- 新建分类对话框 -->
    <Dialog v-model:open="showCategoryDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建分类</DialogTitle>
          <DialogDescription>
            创建一个新的笔记分类
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700">
              分类名称
            </label>
            <Input
              v-model="newCategoryName"
              placeholder="输入分类名称..."
              maxlength="50"
              @keyup.enter="createCategory"
            />
            <p class="text-xs text-neutral-400">
              {{ newCategoryName.length }}/50
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            @click="closeCategoryDialog"
            :disabled="isCreatingCategory"
            variant="outline"
          >
            取消
          </Button>
          <Button
            @click="createCategory"
            :disabled="isCreatingCategory || !newCategoryName.trim()"
          >
            <div v-if="isCreatingCategory" class="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>{{ isCreatingCategory ? '创建中...' : '创建' }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

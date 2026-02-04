<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  ArrowLeft,
  Upload,
  Search,
  FileText,
  FileImage,
  FileVideo,
  FileMusic,
  FileArchive,
  File,
  Trash2,
  Download,
  MoreVertical,
  Clock,
  Grid3x3,
  List,
  FolderOpen,
  Filter,
  Check,
  X
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const route = useRoute()
const layoutStore = useLayoutStore()
const activeView = ref('knowledge-base')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 获取知识库 ID
const knowledgeBaseId = computed(() => Number(route.params.id))

// 视图模式：网格或列表
const viewMode = ref<'grid' | 'list'>('grid')

// 搜索关键词
const searchKeyword = ref('')

// 筛选条件
const selectedFileType = ref('all')

// 文件类型
const fileTypes = ref([
  { id: 'all', name: '全部文件', icon: File, count: 0 },
  { id: 'document', name: '文档', icon: FileText, count: 0 },
  { id: 'image', name: '图片', icon: FileImage, count: 0 },
  { id: 'video', name: '视频', icon: FileVideo, count: 0 },
  { id: 'audio', name: '音频', icon: FileMusic, count: 0 },
  { id: 'archive', name: '压缩包', icon: FileArchive, count: 0 }
])

// 知识库信息
const knowledgeBase = ref({
  id: 1,
  name: '前端开发资料',
  description: 'Vue3、React、TypeScript 等前端技术文档和教程'
})

// 文件数据接口
interface FileInfo {
  id: number
  name: string
  type: string
  size: string
  uploadedAt: string
  thumbnail?: string
}

// 模拟文件数据
const files = ref<FileInfo[]>([
  {
    id: 1,
    name: 'Vue3 官方文档.pdf',
    type: 'document',
    size: '2.4 MB',
    uploadedAt: '2024-01-15T10:30:00'
  },
  {
    id: 2,
    name: 'React Hooks 详解.md',
    type: 'document',
    size: '156 KB',
    uploadedAt: '2024-01-14T14:20:00'
  },
  {
    id: 3,
    name: 'TypeScript 入门教程.pdf',
    type: 'document',
    size: '1.8 MB',
    uploadedAt: '2024-01-13T20:15:00'
  },
  {
    id: 4,
    name: '前端架构设计.png',
    type: 'image',
    size: '456 KB',
    uploadedAt: '2024-01-12T16:45:00'
  },
  {
    id: 5,
    name: '组件库使用指南.docx',
    type: 'document',
    size: '890 KB',
    uploadedAt: '2024-01-11T09:00:00'
  },
  {
    id: 6,
    name: '性能优化实践.mp4',
    type: 'video',
    size: '156 MB',
    uploadedAt: '2024-01-10T22:30:00'
  },
  {
    id: 7,
    name: '设计规范文档.pdf',
    type: 'document',
    size: '3.2 MB',
    uploadedAt: '2024-01-09T15:20:00'
  },
  {
    id: 8,
    name: '项目配置文件.zip',
    type: 'archive',
    size: '1.1 MB',
    uploadedAt: '2024-01-08T11:10:00'
  },
  {
    id: 9,
    name: 'UI 设计稿.fig',
    type: 'image',
    size: '12.4 MB',
    uploadedAt: '2024-01-07T08:45:00'
  },
  {
    id: 10,
    name: 'API 接口文档.xlsx',
    type: 'document',
    size: '234 KB',
    uploadedAt: '2024-01-06T13:30:00'
  }
])

// 选中的文件
const selectedFiles = ref<Set<number>>(new Set())

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

// 获取文件图标
const getFileIcon = (fileType: string) => {
  const typeMap: Record<string, any> = {
    document: FileText,
    image: FileImage,
    video: FileVideo,
    audio: FileMusic,
    archive: FileArchive
  }
  return typeMap[fileType] || File
}

// 过滤后的文件列表
const filteredFiles = computed(() => {
  let result = files.value

  // 按文件类型筛选
  if (selectedFileType.value !== 'all') {
    result = result.filter(file => file.type === selectedFileType.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(file =>
      file.name.toLowerCase().includes(keyword)
    )
  }

  return result
})

// 更新文件类型计数
const updateFileTypeCount = () => {
  fileTypes.value.forEach(type => {
    if (type.id === 'all') {
      type.count = files.value.length
    } else {
      type.count = files.value.filter(f => f.type === type.id).length
    }
  })
}

// 全选/取消全选
const toggleSelectAll = () => {
  if (selectedFiles.value.size === filteredFiles.value.length) {
    selectedFiles.value.clear()
  } else {
    selectedFiles.value = new Set(filteredFiles.value.map(f => f.id))
  }
}

// 切换文件选中状态
const toggleFileSelection = (fileId: number) => {
  if (selectedFiles.value.has(fileId)) {
    selectedFiles.value.delete(fileId)
  } else {
    selectedFiles.value.add(fileId)
  }
}

// 删除文件
const deleteFile = (fileId: number) => {
  const index = files.value.findIndex(f => f.id === fileId)
  if (index !== -1) {
    files.value.splice(index, 1)
    toast.success('文件已删除')
    updateFileTypeCount()
  }
}

// 批量删除
const deleteSelectedFiles = () => {
  if (selectedFiles.value.size === 0) {
    toast.warning('请先选择要删除的文件')
    return
  }

  files.value = files.value.filter(f => !selectedFiles.value.has(f.id))
  selectedFiles.value.clear()
  toast.success('已删除选中的文件')
  updateFileTypeCount()
}

// 上传文件
const uploadFiles = () => {
  toast.success('上传文件功能开发中...')
}

// 返回知识库列表
const goBack = () => {
  router.push('/knowledge-base')
}

onMounted(() => {
  updateFileTypeCount()
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div class="max-w-7xl mx-auto p-8 md:p-12">
          <!-- 返回按钮和标题 -->
          <div class="mb-6">
            <button
              @click="goBack"
              class="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors mb-4"
            >
              <ArrowLeft :size="16" />
              <span>返回知识库列表</span>
            </button>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-gradient-to-br from-neutral-100 to-neutral-50 border border-black/5 rounded-xl flex items-center justify-center shadow-lg shadow-black/5">
                  <FolderOpen :size="28" class="text-neutral-600" />
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-neutral-900 mb-1">{{ knowledgeBase.name }}</h1>
                  <p class="text-sm text-neutral-400">{{ knowledgeBase.description }}</p>
                </div>
              </div>
              <button
                @click="uploadFiles"
                class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
              >
                <Upload :size="16" />
                <span>上传文件</span>
              </button>
            </div>
          </div>

          <!-- 工具栏 -->
          <div class="mb-6 flex items-center gap-4">
            <!-- 全选/取消全选 -->
            <button
              v-if="selectedFiles.size > 0"
              @click="toggleSelectAll"
              class="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-all"
            >
              <Check :size="16" />
              <span class="hidden sm:inline">已选 {{ selectedFiles.size }} 项</span>
            </button>

            <button
              v-if="selectedFiles.size > 0"
              @click="deleteSelectedFiles"
              class="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 rounded-xl text-sm hover:bg-rose-100 transition-all"
            >
              <Trash2 :size="16" />
              <span class="hidden sm:inline">删除选中</span>
            </button>

            <button
              v-if="selectedFiles.size > 0"
              @click="selectedFiles.clear()"
              class="flex items-center gap-2 px-4 py-3 bg-white border border-black/5 rounded-xl text-sm hover:bg-black/5 transition-all"
            >
              <X :size="16" />
              <span class="hidden sm:inline">取消选择</span>
            </button>

            <!-- 搜索框 -->
            <div class="flex-1 relative" v-if="selectedFiles.size === 0">
              <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" :size="18" />
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索文件..."
                class="w-full pl-12 pr-4 py-3 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
              />
            </div>

            <!-- 视图切换 -->
            <div v-if="selectedFiles.size === 0" class="flex items-center gap-2 bg-white border border-black/5 rounded-xl p-1">
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
            <!-- 左侧文件类型筛选 -->
            <aside class="w-60 shrink-0 hidden lg:block">
              <div class="sticky top-0">
                <h3 class="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3 px-1">
                  文件类型
                </h3>
                <div class="space-y-1">
                  <button
                    v-for="fileType in fileTypes"
                    :key="fileType.id"
                    @click="selectedFileType = fileType.id"
                    :class="[
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left',
                      selectedFileType === fileType.id
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'text-neutral-500 hover:bg-black/5 hover:text-neutral-900'
                    ]"
                  >
                    <div class="flex items-center gap-3">
                      <component :is="fileType.icon" :size="16" />
                      <span class="text-sm">{{ fileType.name }}</span>
                    </div>
                    <span class="text-xs text-neutral-400">{{ fileType.count }}</span>
                  </button>
                </div>
              </div>
            </aside>

            <!-- 右侧文件列表 -->
            <div class="flex-1 min-w-0">
              <!-- 网格视图 -->
              <div v-if="viewMode === 'grid'" class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <div
                  v-for="file in filteredFiles"
                  :key="file.id"
                  @click="toggleFileSelection(file.id)"
                  :class="[
                    'group bg-white border rounded-xl p-4 hover:shadow-md transition-all duration-300 cursor-pointer relative',
                    selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-black/5'
                  ]"
                >
                  <!-- 选中标记 -->
                  <div
                    v-if="selectedFiles.has(file.id)"
                    class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                  >
                    <Check :size="12" class="text-white" />
                  </div>

                  <!-- 文件图标 -->
                  <div class="flex items-center justify-center mb-3 h-24">
                    <div class="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center">
                      <component :is="getFileIcon(file.type)" :size="32" class="text-neutral-600" />
                    </div>
                  </div>

                  <!-- 文件名 -->
                  <h3 class="text-sm font-medium text-neutral-900 mb-1 line-clamp-2">
                    {{ file.name }}
                  </h3>

                  <!-- 文件信息 -->
                  <div class="flex items-center justify-between text-xs text-neutral-400">
                    <span>{{ file.size }}</span>
                    <div class="flex items-center gap-1">
                      <Clock :size="12" />
                      <span>{{ formatTime(file.uploadedAt) }}</span>
                    </div>
                  </div>

                  <!-- 快捷操作按钮 -->
                  <div class="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      @click.stop
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-black/5 rounded-lg text-xs hover:bg-black/10 transition-colors"
                    >
                      <Download :size="12" />
                      <span>下载</span>
                    </button>
                    <button
                      @click.stop="deleteFile(file.id)"
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 :size="12" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 列表视图 -->
              <div v-else class="space-y-2">
                <div
                  v-for="file in filteredFiles"
                  :key="file.id"
                  @click="toggleFileSelection(file.id)"
                  :class="[
                    'group bg-white border rounded-xl p-3 hover:shadow-sm transition-all cursor-pointer relative',
                    selectedFiles.has(file.id) ? 'border-blue-500 bg-blue-50' : 'border-black/5'
                  ]"
                >
                  <div class="flex items-center gap-4">
                    <!-- 复选框区域 -->
                    <div class="w-10 flex items-center justify-center">
                      <div
                        v-if="selectedFiles.has(file.id)"
                        class="w-5 h-5 bg-blue-500 rounded flex items-center justify-center"
                      >
                        <Check :size="12" class="text-white" />
                      </div>
                      <div v-else class="w-5 h-5 border-2 border-black/10 rounded group-hover:border-black/30"></div>
                    </div>

                    <!-- 文件图标 -->
                    <div class="w-10 h-10 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg flex items-center justify-center shrink-0">
                      <component :is="getFileIcon(file.type)" :size="20" class="text-neutral-600" />
                    </div>

                    <!-- 文件信息 -->
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-medium text-neutral-900 line-clamp-1">
                        {{ file.name }}
                      </h3>
                    </div>

                    <!-- 文件大小 -->
                    <div class="hidden sm:block text-xs text-neutral-400 shrink-0">
                      {{ file.size }}
                    </div>

                    <!-- 上传时间 -->
                    <div class="hidden md:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                      <Clock :size="14" />
                      <span>{{ formatTime(file.uploadedAt) }}</span>
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        @click.stop
                        class="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download :size="16" class="text-neutral-400" />
                      </button>
                      <button
                        @click.stop="deleteFile(file.id)"
                        class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 :size="16" class="text-neutral-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div
                v-if="filteredFiles.length === 0"
                class="flex flex-col items-center justify-center py-20 text-neutral-400"
              >
                <FolderOpen :size="48" class="mb-4 opacity-50" />
                <p class="text-sm font-medium">暂无文件</p>
                <p class="text-xs mt-1">点击上方按钮上传你的第一个文件</p>
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

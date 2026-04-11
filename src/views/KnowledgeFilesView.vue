<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  ArrowLeft,
  Upload,
  Search,
  FileText,
  File,
  Trash2,
  Download,
  Clock,
  Grid3x3,
  List,
  FolderOpen,
  Check,
  X,
  Loader2,
  Play,
  RefreshCw,
  Activity,
  FileSpreadsheet,
  Presentation,
  FileType
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ChunkDetailDialog from '@/components/ChunkDetailDialog.vue'
import { knowledgeBaseApi, type KnowledgeBase } from '@/api/knowledgeBase'
import { knowledgeDocumentApi, type KnowledgeDocument, type ChunkLog } from '@/api/knowledgeDocument'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Link } from 'lucide-vue-next'

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
const knowledgeBaseId = computed(() => route.params.id as string)

// 加载状态
const isLoading = ref(false)
const isLoadingKB = ref(false)
const isRefreshing = ref(false)

// 上传对话框
const showUploadDialog = ref(false)
const isUploading = ref(false)
const uploadType = ref<'file' | 'url'>('file')
const selectedFile = ref<File | null>(null)
const urlInput = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// 分块配置参数
const chunkStrategy = ref<'fixed_size' | 'structure_aware'>('fixed_size')
const chunkSize = ref(512)
const overlapSize = ref(128)
const targetChars = ref(512)
const maxChars = ref(600)
const minChars = ref(128)
const overlapChars = ref(0)

// 删除确认对话框
const showDeleteDialog = ref(false)
const isDeleting = ref(false)
const deletingFile = ref<FileInfo | null>(null)

// 批量删除确认对话框
const showBatchDeleteDialog = ref(false)
const isBatchDeleting = ref(false)

// 视图模式：网格或列表
const viewMode = ref<'grid' | 'list'>('grid')

// 搜索关键词
const searchKeyword = ref('')

// 筛选条件
const selectedFileType = ref('all')

// 文件类型（基于后端 Apache Tika + Markdown 解析器支持的文档类型）
const fileTypes = ref([
  { id: 'all', name: '全部文件', icon: File, count: 0 },
  { id: 'pdf', name: 'PDF', icon: FileText, count: 0 },
  { id: 'word', name: 'Word', icon: FileText, count: 0 },
  { id: 'spreadsheet', name: '表格', icon: FileSpreadsheet, count: 0 },
  { id: 'presentation', name: '演示', icon: Presentation, count: 0 },
  { id: 'text', name: '文本', icon: FileType, count: 0 }
])

// 知识库信息
const knowledgeBase = ref<KnowledgeBase | null>(null)

// 文件数据接口（扩展后端返回的类型）
interface FileInfo extends KnowledgeDocument {
  uiType: string // UI显示的文件类型分类
  uiSize: string // 格式化后的文件大小
}

// 文件数据
const files = ref<FileInfo[]>([])
const chunkingFileIds = ref<Set<string>>(new Set())

// 分块日志对话框
const showChunkLogDialog = ref(false)
const isLoadingChunkLogs = ref(false)
const chunkLogs = ref<ChunkLog[]>([])
const chunkLogDocName = ref('')

// 分块详情对话框
const showChunkDetailDialog = ref(false)
const chunkDetailDocId = ref('')
const chunkDetailDocName = ref('')

// 获取知识库详情
const fetchKnowledgeBase = async () => {
  try {
    isLoadingKB.value = true
    const data = await knowledgeBaseApi.getById(knowledgeBaseId.value)
    knowledgeBase.value = data
  } catch (error) {
    console.error('获取知识库详情失败：', error)
    toast.error('获取知识库详情失败')
  } finally {
    isLoadingKB.value = false
  }
}

// 获取文档列表
const fetchDocuments = async () => {
  try {
    isLoading.value = true
    const data = await knowledgeDocumentApi.getPage(knowledgeBaseId.value, {
      pageNo: 1,
      pageSize: 1000
    })

    // 格式化文件数据
    files.value = (data.records || []).map(doc => {
      const fileType = doc.fileType?.toLowerCase() || ''
      let uiType = 'text'

      if (fileType.includes('pdf')) {
        uiType = 'pdf'
      } else if (fileType.includes('word') || fileType.includes('doc')) {
        uiType = 'word'
      } else if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) {
        uiType = 'spreadsheet'
      } else if (fileType.includes('presentation') || fileType.includes('ppt') || fileType.includes('powerpoint')) {
        uiType = 'presentation'
      } else if (fileType.includes('text') || fileType.includes('markdown') || fileType.includes('md')
        || fileType.includes('html') || fileType.includes('xml') || fileType.includes('rtf')
        || fileType.includes('csv')) {
        uiType = 'text'
      }

      // 格式化文件大小
      const size = doc.fileSize || 0
      let uiSize = '0 B'
      if (size < 1024) {
        uiSize = `${size} B`
      } else if (size < 1024 * 1024) {
        uiSize = `${(size / 1024).toFixed(1)} KB`
      } else if (size < 1024 * 1024 * 1024) {
        uiSize = `${(size / (1024 * 1024)).toFixed(1)} MB`
      } else {
        uiSize = `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
      }

      return {
        ...doc,
        uiType,
        uiSize
      }
    })

    updateFileTypeCount()
  } catch (error) {
    console.error('获取文档列表失败：', error)
    toast.error('获取文档列表失败')
  } finally {
    isLoading.value = false
  }
}

// 选中的文件
const selectedFiles = ref<Set<string>>(new Set())

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
    pdf: FileText,
    word: FileText,
    spreadsheet: FileSpreadsheet,
    presentation: Presentation,
    text: FileType
  }
  return typeMap[fileType] || File
}

// 过滤后的文件列表
const filteredFiles = computed(() => {
  let result = files.value

  // 按文件类型筛选
  if (selectedFileType.value !== 'all') {
    result = result.filter(file => file.uiType === selectedFileType.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(file =>
      file.docName.toLowerCase().includes(keyword)
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
      type.count = files.value.filter(f => f.uiType === type.id).length
    }
  })
}

const normalizeChunkStatus = (status?: string) => {
  const normalized = status?.toLowerCase()
  if (normalized === 'running' || normalized === 'failed' || normalized === 'success') {
    return normalized
  }
  return 'pending'
}

const getChunkStatusLabel = (status?: string) => {
  const normalized = normalizeChunkStatus(status)
  if (normalized === 'running') return '向量化中'
  if (normalized === 'failed') return '向量化失败'
  if (normalized === 'success') return '向量化完成'
  return '待向量化'
}

const getChunkStatusClass = (status?: string) => {
  const normalized = normalizeChunkStatus(status)
  if (normalized === 'running') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (normalized === 'failed') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (normalized === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return 'bg-stone-50 text-neutral-600 border-black/10'
}

const handleStartChunk = async (file: FileInfo) => {
  if (normalizeChunkStatus(file.status) !== 'pending' || chunkingFileIds.value.has(file.id)) return

  try {
    chunkingFileIds.value.add(file.id)
    await knowledgeDocumentApi.startChunk(file.id)
    file.status = 'running'
    toast.success('已开始分块')
    await fetchDocuments()
  } catch (error) {
    console.error('开始分块失败：', error)
    toast.error('开始分块失败')
  } finally {
    chunkingFileIds.value.delete(file.id)
  }
}

// 查看分块日志
const handleShowChunkLogs = async (file: FileInfo) => {
  chunkLogDocName.value = file.docName
  showChunkLogDialog.value = true
  isLoadingChunkLogs.value = true
  chunkLogs.value = []
  try {
    const data = await knowledgeDocumentApi.getChunkLogs(file.id)
    chunkLogs.value = data || []
  } catch (error) {
    console.error('获取分块日志失败：', error)
    toast.error('获取分块日志失败')
  } finally {
    isLoadingChunkLogs.value = false
  }
}

// 查看分块详情
const handleShowChunkDetail = (file: FileInfo) => {
  chunkDetailDocId.value = file.id
  chunkDetailDocName.value = file.docName
  showChunkDetailDialog.value = true
}

// 格式化毫秒为可读时间
const formatDuration = (ms: number | null) => {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 格式化日期时间
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 获取状态标签
const getLogStatusLabel = (status: string) => {
  if (status === 'running') return '处理中'
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  return status
}

// 获取状态样式
const getLogStatusClass = (status: string) => {
  if (status === 'running') return 'text-amber-600 bg-amber-50'
  if (status === 'success') return 'text-emerald-600 bg-emerald-50'
  if (status === 'failed') return 'text-rose-600 bg-rose-50'
  return 'text-neutral-600 bg-neutral-50'
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
const toggleFileSelection = (fileId: string) => {
  if (selectedFiles.value.has(fileId)) {
    selectedFiles.value.delete(fileId)
  } else {
    selectedFiles.value.add(fileId)
  }
}

// 删除文件
const deleteFile = (file: FileInfo) => {
  deletingFile.value = file
  showDeleteDialog.value = true
}

// 确认删除文件
const handleConfirmDelete = async () => {
  if (!deletingFile.value) return

  try {
    isDeleting.value = true
    await knowledgeDocumentApi.delete(deletingFile.value.id)
    toast.success('文件已删除')
    showDeleteDialog.value = false
    deletingFile.value = null
    await fetchDocuments()
  } catch (error) {
    console.error('删除文件失败：', error)
    toast.error('删除文件失败')
  } finally {
    isDeleting.value = false
  }
}

// 批量删除
const deleteSelectedFiles = () => {
  if (selectedFiles.value.size === 0) {
    toast.warning('请先选择要删除的文件')
    return
  }
  showBatchDeleteDialog.value = true
}

// 确认批量删除
const handleConfirmBatchDelete = async () => {
  try {
    isBatchDeleting.value = true
    // 逐个删除
    for (const fileId of selectedFiles.value) {
      await knowledgeDocumentApi.delete(fileId as string)
    }
    selectedFiles.value.clear()
    toast.success('已删除选中的文件')
    showBatchDeleteDialog.value = false
    await fetchDocuments()
  } catch (error) {
    console.error('批量删除失败：', error)
    toast.error('批量删除失败')
  } finally {
    isBatchDeleting.value = false
  }
}

// 上传文件
const uploadFiles = () => {
  uploadType.value = 'file'
  selectedFile.value = null
  urlInput.value = ''
  // 重置分块配置
  chunkStrategy.value = 'fixed_size'
  chunkSize.value = 512
  overlapSize.value = 128
  targetChars.value = 512
  maxChars.value = 600
  minChars.value = 128
  overlapChars.value = 0
  showUploadDialog.value = true
}

// 刷新文件列表
const refreshFiles = async () => {
  try {
    isRefreshing.value = true
    await fetchDocuments()
    toast.success('刷新成功')
  } catch (error) {
    console.error('刷新文件列表失败：', error)
    toast.error('刷新失败')
  } finally {
    isRefreshing.value = false
  }
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) {
      selectedFile.value = file
    }
  }
}

// 上传文档
const handleUpload = async () => {
  if (uploadType.value === 'file') {
    if (!selectedFile.value) {
      toast.error('请选择文件')
      return
    }
  } else {
    if (!urlInput.value.trim()) {
      toast.error('请输入URL地址')
      return
    }
  }

  try {
    isUploading.value = true

    // 生成chunkConfig JSON
    let chunkConfig: string | null = null
    if (chunkStrategy.value === 'fixed_size') {
      chunkConfig = JSON.stringify({
        chunkSize: chunkSize.value,
        overlapSize: overlapSize.value
      })
    } else if (chunkStrategy.value === 'structure_aware') {
      chunkConfig = JSON.stringify({
        maxChars: maxChars.value,
        minChars: minChars.value,
        targetChars: targetChars.value,
        overlapChars: overlapChars.value
      })
    }

    await knowledgeDocumentApi.upload(
      knowledgeBaseId.value,
      {
        sourceType: uploadType.value,
        sourceLocation: uploadType.value === 'url' ? urlInput.value.trim() : undefined,
        chunkStrategy: chunkStrategy.value,
        chunkConfig: chunkConfig ?? undefined,
        chunkSize: chunkSize.value,
        overlapSize: overlapSize.value,
        targetChars: targetChars.value,
        maxChars: maxChars.value,
        minChars: minChars.value,
        overlapChars: overlapChars.value
      },
      uploadType.value === 'file' ? selectedFile.value || undefined : undefined
    )
    toast.success('上传成功')
    showUploadDialog.value = false
    selectedFile.value = null
    urlInput.value = ''
    // 重置分块配置
    chunkStrategy.value = 'fixed_size'
    chunkSize.value = 512
    overlapSize.value = 128
    targetChars.value = 512
    maxChars.value = 600
    minChars.value = 128
    overlapChars.value = 0
    await fetchDocuments()
  } catch (error) {
    console.error('上传文件失败：', error)
    toast.error('上传文件失败')
  } finally {
    isUploading.value = false
  }
}

// 返回知识库列表
const goBack = () => {
  router.push('/knowledge-base')
}

onMounted(() => {
  fetchKnowledgeBase()
  fetchDocuments()
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
                  <h1 class="text-2xl font-bold text-neutral-900 mb-1">{{ knowledgeBase?.name || '加载中...' }}</h1>
                  <p class="text-sm text-neutral-400">向量空间：{{ knowledgeBase?.collectionName || '-' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <button
                  @click="refreshFiles"
                  :disabled="isRefreshing"
                  class="flex items-center gap-2 px-4 py-3 bg-white border border-black/10 text-neutral-600 rounded-2xl text-[12px] font-medium hover:bg-black/5 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="刷新文件列表"
                >
                  <RefreshCw :size="16" :class="{ 'animate-spin': isRefreshing }" />
                  <span class="hidden sm:inline">刷新</span>
                </button>
                <button
                  @click="uploadFiles"
                  class="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[12px] font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                >
                  <Upload :size="16" />
                  <span>上传文件</span>
                </button>
              </div>
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
                      <component :is="getFileIcon(file.uiType)" :size="32" class="text-neutral-600" />
                    </div>
                  </div>

                  <!-- 文件名 -->
                  <h3 class="text-sm font-medium text-neutral-900 mb-1 line-clamp-2">
                    {{ file.docName }}
                  </h3>

                  <!-- 文件信息 -->
                  <div class="flex items-center justify-between text-xs text-neutral-400">
                    <span>{{ file.uiSize }}</span>
                    <div class="flex items-center gap-1">
                      <Clock :size="12" />
                      <span>{{ formatTime(file.createdAt) }}</span>
                    </div>
                  </div>

                  <div class="mt-2 flex items-center justify-between gap-2">
                    <span
                      @click.stop="normalizeChunkStatus(file.status) !== 'pending' && handleShowChunkLogs(file)"
                      class="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px]"
                      :class="[getChunkStatusClass(file.status), normalizeChunkStatus(file.status) !== 'pending' ? 'cursor-pointer hover:opacity-80' : '']"
                    >
                      {{ getChunkStatusLabel(file.status) }}
                    </span>
                    <button
                      @click.stop="handleStartChunk(file)"
                      :disabled="normalizeChunkStatus(file.status) !== 'pending' || chunkingFileIds.has(file.id)"
                      class="h-6 px-2 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors"
                      :class="normalizeChunkStatus(file.status) === 'pending' && !chunkingFileIds.has(file.id)
                        ? 'bg-black text-white hover:bg-neutral-800'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'"
                    >
                      <Loader2 v-if="chunkingFileIds.has(file.id)" :size="11" class="animate-spin" />
                      <Play v-else :size="11" />
                      <span>{{ chunkingFileIds.has(file.id) ? '处理中' : '开始分块' }}</span>
                    </button>
                  </div>

                  <!-- 快捷操作按钮 -->
                  <div class="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      v-if="normalizeChunkStatus(file.status) === 'success'"
                      @click.stop="handleShowChunkDetail(file)"
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition-colors"
                    >
                      <FileText :size="12" />
                      <span>分块</span>
                    </button>
                    <button
                      @click.stop
                      class="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-black/5 rounded-lg text-xs hover:bg-black/10 transition-colors"
                    >
                      <Download :size="12" />
                      <span>下载</span>
                    </button>
                    <button
                      @click.stop="deleteFile(file)"
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
                      <component :is="getFileIcon(file.uiType)" :size="20" class="text-neutral-600" />
                    </div>

                    <!-- 文件信息 -->
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-medium text-neutral-900 line-clamp-1">
                        {{ file.docName }}
                      </h3>
                    </div>

                    <!-- 文件大小 -->
                    <div class="hidden sm:block text-xs text-neutral-400 shrink-0">
                      {{ file.uiSize }}
                    </div>

                    <!-- 上传时间 -->
                    <div class="hidden md:flex items-center gap-1 text-xs text-neutral-400 shrink-0">
                      <Clock :size="14" />
                      <span>{{ formatTime(file.createdAt) }}</span>
                    </div>

                    <div
                      @click.stop="normalizeChunkStatus(file.status) !== 'pending' && handleShowChunkLogs(file)"
                      class="hidden lg:inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] shrink-0"
                      :class="[getChunkStatusClass(file.status), normalizeChunkStatus(file.status) !== 'pending' ? 'cursor-pointer hover:opacity-80' : '']"
                    >
                      {{ getChunkStatusLabel(file.status) }}
                    </div>

                    <!-- 操作按钮 -->
                    <div class="flex items-center gap-2 shrink-0">
                      <button
                        @click.stop="handleStartChunk(file)"
                        :disabled="normalizeChunkStatus(file.status) !== 'pending' || chunkingFileIds.has(file.id)"
                        class="px-2.5 py-1.5 rounded-lg text-xs inline-flex items-center gap-1 transition-colors"
                        :class="normalizeChunkStatus(file.status) === 'pending' && !chunkingFileIds.has(file.id)
                          ? 'bg-black text-white hover:bg-neutral-800'
                          : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'"
                        title="开始分块"
                      >
                        <Loader2 v-if="chunkingFileIds.has(file.id)" :size="12" class="animate-spin" />
                        <Play v-else :size="12" />
                        <span>{{ chunkingFileIds.has(file.id) ? '处理中' : '开始分块' }}</span>
                      </button>
                      <button
                        v-if="normalizeChunkStatus(file.status) === 'success'"
                        @click.stop="handleShowChunkDetail(file)"
                        class="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看分块"
                      >
                        <FileText :size="16" class="text-neutral-400 hover:text-blue-600" />
                      </button>
                      <button
                        @click.stop
                        class="p-2 hover:bg-black/5 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download :size="16" class="text-neutral-400" />
                      </button>
                      <button
                        @click.stop="deleteFile(file)"
                        class="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 :size="16" class="text-neutral-400 hover:text-rose-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 加载状态 -->
              <div
                v-if="isLoading"
                class="flex flex-col items-center justify-center py-20 text-neutral-400"
              >
                <Loader2 :size="48" class="mb-4 opacity-50 animate-spin" />
                <p class="text-sm font-medium">加载中...</p>
              </div>

              <!-- 空状态 -->
              <div
                v-else-if="filteredFiles.length === 0"
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

    <!-- 上传文件对话框 -->
    <Dialog v-model:open="showUploadDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-neutral-900">上传文件</DialogTitle>
          <DialogDescription class="text-sm text-neutral-500">
            选择上传方式添加文件到知识库
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <!-- 上传方式切换 -->
          <Tabs v-model="uploadType" class="w-full">
            <TabsList class="grid w-full grid-cols-2">
              <TabsTrigger value="file">本地上传</TabsTrigger>
              <TabsTrigger value="url">URL上传</TabsTrigger>
            </TabsList>
          </Tabs>

          <!-- 分块配置 -->
          <div class="space-y-3 pt-2 border-t border-black/5">
            <h3 class="text-sm font-medium text-neutral-700">分块配置</h3>

            <!-- 分块策略 -->
            <div class="space-y-2">
              <label class="text-xs font-medium text-neutral-600">分块策略</label>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="chunkStrategy = 'fixed_size'"
                  :class="[
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    chunkStrategy === 'fixed_size'
                      ? 'bg-black text-white'
                      : 'bg-white border border-black/10 text-neutral-600 hover:bg-black/5'
                  ]"
                >
                  固定大小
                </button>
                <button
                  type="button"
                  @click="chunkStrategy = 'structure_aware'"
                  :class="[
                    'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                    chunkStrategy === 'structure_aware'
                      ? 'bg-black text-white'
                      : 'bg-white border border-black/10 text-neutral-600 hover:bg-black/5'
                  ]"
                >
                  结构感知
                </button>
              </div>
            </div>

            <!-- 固定大小参数 -->
            <div v-if="chunkStrategy === 'fixed_size'" class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">块大小</label>
                <Input
                  v-model.number="chunkSize"
                  type="number"
                  class="h-9"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">重叠大小</label>
                <Input
                  v-model.number="overlapSize"
                  type="number"
                  class="h-9"
                />
              </div>
            </div>

            <!-- 结构感知参数 -->
            <div v-if="chunkStrategy === 'structure_aware'" class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">理想块大小</label>
                <Input
                  v-model.number="targetChars"
                  type="number"
                  class="h-9"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">块上限</label>
                <Input
                  v-model.number="maxChars"
                  type="number"
                  class="h-9"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">块下限</label>
                <Input
                  v-model.number="minChars"
                  type="number"
                  class="h-9"
                />
              </div>
              <div class="space-y-1">
                <label class="text-xs text-neutral-600">重叠大小</label>
                <Input
                  v-model.number="overlapChars"
                  type="number"
                  class="h-9"
                />
              </div>
            </div>
          </div>

          <!-- 本地上传 -->
          <div v-if="uploadType === 'file'" class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">选择文件</label>
            <div class="flex items-center gap-2">
              <input
                ref="fileInputRef"
                type="file"
                @change="handleFileSelect"
                :disabled="isUploading"
                class="hidden"
              />
              <Button
                type="button"
                @click="triggerFileSelect"
                :disabled="isUploading"
                variant="outline"
                class="flex-1"
              >
                <Upload :size="16" class="mr-2" />
                {{ selectedFile ? '已选择文件' : '选择文件' }}
              </Button>
            </div>
            <p v-if="selectedFile" class="text-xs text-neutral-500 mt-1">
              已选择：{{ selectedFile.name }} ({{ ((selectedFile.size / 1024)).toFixed(1) }} KB)
            </p>
            <p v-else class="text-xs text-neutral-400 mt-1">
              支持上传各种文档、图片、视频等格式
            </p>
          </div>

          <!-- URL上传 -->
          <div v-else class="space-y-2">
            <label class="text-sm font-medium text-neutral-700">URL地址</label>
            <div class="relative">
              <Link :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                id="url"
                v-model="urlInput"
                placeholder="请输入文件URL地址"
                :disabled="isUploading"
                class="pl-10"
              />
            </div>
            <p class="text-xs text-neutral-400">
              支持HTTP/HTTPS协议，确保URL可公开访问
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            @click="showUploadDialog = false"
            :disabled="isUploading"
            class="flex-1"
          >
            取消
          </Button>
          <Button
            @click="handleUpload"
            :disabled="isUploading"
            class="flex-1"
          >
            <Loader2 v-if="isUploading" :size="16" class="mr-2 animate-spin" />
            {{ isUploading ? '上传中...' : '上传' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Trash2 :size="20" class="text-rose-500" />
            确认删除文件
          </DialogTitle>
          <DialogDescription class="text-sm text-neutral-500">
            此操作无法撤销
          </DialogDescription>
        </DialogHeader>

        <div v-if="deletingFile" class="py-4">
          <p class="text-neutral-700 mb-2">您确定要删除以下文件吗？</p>
          <div class="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p class="font-medium text-neutral-900">{{ deletingFile.docName }}</p>
            <p class="text-xs text-neutral-500 mt-1">{{ deletingFile.uiSize }}</p>
          </div>
          <p class="text-xs text-rose-600 mt-3">删除后，文件相关的所有数据将被永久删除</p>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
            class="flex-1"
          >
            取消
          </Button>
          <Button
            @click="handleConfirmDelete"
            variant="destructive"
            :disabled="isDeleting"
            class="flex-1"
          >
            <Loader2 v-if="isDeleting" :size="16" class="mr-2 animate-spin" />
            {{ isDeleting ? '删除中...' : '确认删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 批量删除确认对话框 -->
    <Dialog v-model:open="showBatchDeleteDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Trash2 :size="20" class="text-rose-500" />
            确认批量删除文件
          </DialogTitle>
          <DialogDescription class="text-sm text-neutral-500">
            此操作无法撤销
          </DialogDescription>
        </DialogHeader>

        <div class="py-4">
          <p class="text-neutral-700 mb-2">您确定要删除选中的 {{ selectedFiles.size }} 个文件吗？</p>
          <div class="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p class="font-medium text-neutral-900">{{ selectedFiles.size }} 个文件将被删除</p>
            <p class="text-xs text-neutral-500 mt-1">删除后，文件相关的所有数据将被永久删除</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            @click="showBatchDeleteDialog = false"
            :disabled="isBatchDeleting"
            class="flex-1"
          >
            取消
          </Button>
          <Button
            @click="handleConfirmBatchDelete"
            variant="destructive"
            :disabled="isBatchDeleting"
            class="flex-1"
          >
            <Loader2 v-if="isBatchDeleting" :size="16" class="mr-2 animate-spin" />
            {{ isBatchDeleting ? '删除中...' : '确认删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 分块日志对话框 -->
    <Dialog v-model:open="showChunkLogDialog">
      <DialogContent class="sm:max-w-[520px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <Activity :size="20" class="text-neutral-600" />
            分块日志详情
          </DialogTitle>
          <DialogDescription class="text-sm text-neutral-500">
            {{ chunkLogDocName }}
          </DialogDescription>
        </DialogHeader>

        <div class="py-4 space-y-4">
          <!-- 加载中 -->
          <div v-if="isLoadingChunkLogs" class="flex items-center justify-center py-8 text-neutral-400">
            <Loader2 :size="24" class="animate-spin mr-2" />
            <span class="text-sm">加载中...</span>
          </div>

          <!-- 无日志 -->
          <div v-else-if="chunkLogs.length === 0" class="flex flex-col items-center justify-center py-8 text-neutral-400">
            <Activity :size="32" class="mb-2 opacity-50" />
            <p class="text-sm">暂无分块日志</p>
          </div>

          <!-- 日志列表 -->
          <div v-else class="space-y-3">
            <div
              v-for="log in chunkLogs"
              :key="log.id"
              class="rounded-xl border border-black/5 bg-white p-4 space-y-2.5"
            >
              <!-- 状态和时间 -->
              <div class="flex items-center justify-between">
                <span
                  class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
                  :class="getLogStatusClass(log.status)"
                >
                  <Loader2 v-if="log.status === 'running'" :size="12" class="animate-spin" />
                  {{ getLogStatusLabel(log.status) }}
                </span>
                <span class="text-xs text-neutral-400">{{ formatDateTime(log.startTime) }}</span>
              </div>

              <!-- 详细信息 -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-neutral-400">处理模式</span>
                  <span class="text-neutral-700">分块策略</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">分块策略</span>
                  <span class="text-neutral-700">{{ log.chunkStrategy || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">分块数量</span>
                  <span class="text-neutral-700 font-medium">{{ log.chunkCount ?? '-' }}</span>
                </div>
              </div>

              <!-- 耗时明细 -->
              <div class="space-y-1 pt-1 border-t border-black/5">
                <div class="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div class="flex justify-between">
                    <span class="text-neutral-400">文本提取</span>
                    <span class="text-neutral-700">{{ formatDuration(log.extractDuration) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-400">分块耗时</span>
                    <span class="text-neutral-700">{{ formatDuration(log.chunkDuration) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-400">向量化</span>
                    <span class="text-neutral-700">{{ formatDuration(log.embeddingDuration) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-neutral-400">其他耗时</span>
                    <span class="text-neutral-700">{{ formatDuration(log.otherDuration) }}</span>
                  </div>
                </div>
                <div class="flex justify-between text-xs font-medium pt-1 border-t border-black/5">
                  <span class="text-neutral-500">总耗时</span>
                  <span class="text-neutral-900">{{ formatDuration(log.totalDuration) }}</span>
                </div>
              </div>

              <!-- 错误信息 -->
              <div v-if="log.errorMessage" class="mt-1 p-2 bg-rose-50 rounded-lg border border-rose-100">
                <p class="text-xs text-rose-600 break-all">{{ log.errorMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 分块详情对话框 -->
    <ChunkDetailDialog
      v-model:open="showChunkDetailDialog"
      :doc-id="chunkDetailDocId"
      :doc-name="chunkDetailDocName"
    />
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

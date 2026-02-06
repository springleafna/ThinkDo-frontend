<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  ArrowLeft,
  Save,
  Trash2,
  Star,
  StarOff,
  Tag,
  Calendar,
  FolderOpen,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Code,
  ListOrdered
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { noteApi, type Note as NoteType } from '@/api/note'
import { noteCategoryApi, type NoteCategory } from '@/api/noteCategory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const route = useRoute()
const layoutStore = useLayoutStore()

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 笔记 ID
const noteId = computed(() => parseInt(route.params.id as string))

// 是否正在编辑
const isEditing = ref(false)
// 是否保存中
const isSaving = ref(false)
// 编辑模式下是否显示预览
const showPreview = ref(true)

// 笔记分类列表
const categories = ref<NoteCategory[]>([])

// 加载中状态
const loading = ref(false)

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await noteCategoryApi.getList()
    categories.value = response
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 可用标签
const availableTags = [
  { id: 'important', name: '重要', color: 'bg-red-100 text-red-700' },
  { id: 'idea', name: '想法', color: 'bg-blue-100 text-blue-700' },
  { id: 'todo', name: '待办', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'done', name: '已完成', color: 'bg-green-100 text-green-700' },
  { id: 'question', name: '疑问', color: 'bg-purple-100 text-purple-700' }
]

// 本地笔记接口
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

const note = ref<Note>({
  id: noteId.value,
  title: '',
  content: '',
  category: '',
  categoryId: undefined,
  tags: [],
  isFavorite: false,
  createdAt: '',
  updatedAt: ''
})

// 编辑表单
const form = ref({
  title: '',
  content: '',
  categoryId: undefined as number | undefined,
  tags: [] as string[]
})

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 加载笔记详情
const loadNoteDetail = async () => {
  loading.value = true
  try {
    const response = await noteApi.getById(noteId.value)
    note.value = {
      id: response.id,
      title: response.title,
      content: response.content,
      category: response.categoryId?.toString() || '',
      categoryId: response.categoryId,
      tags: response.tags ? response.tags.split(',') : [],
      isFavorite: response.favorited === 1,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt
    }
    form.value = {
      title: response.title,
      content: response.content,
      categoryId: response.categoryId,
      tags: response.tags ? response.tags.split(',') : []
    }
  } catch (error) {
    console.error('加载笔记详情失败:', error)
    toast.error('加载笔记详情失败')
  } finally {
    loading.value = false
  }
}

// 开始编辑
const startEdit = () => {
  isEditing.value = true
  form.value = {
    title: note.value.title,
    content: note.value.content,
    categoryId: note.value.categoryId,
    tags: [...note.value.tags]
  }
}

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false
  form.value = {
    title: note.value.title,
    content: note.value.content,
    categoryId: note.value.categoryId,
    tags: [...note.value.tags]
  }
}

// 保存笔记
const saveNote = async () => {
  if (!form.value.title.trim()) {
    toast.error('请输入笔记标题')
    return
  }

  if (!form.value.content.trim()) {
    toast.error('请输入笔记内容')
    return
  }

  isSaving.value = true

  try {
    await noteApi.update({
      id: note.value.id,
      title: form.value.title,
      content: form.value.content,
      categoryId: form.value.categoryId,
      tags: form.value.tags.join(',')
    })

    // 更新本地笔记数据
    note.value = {
      ...note.value,
      title: form.value.title,
      content: form.value.content,
      categoryId: form.value.categoryId,
      category: form.value.categoryId?.toString() || '',
      tags: [...form.value.tags],
      updatedAt: new Date().toISOString()
    }

    isEditing.value = false
    toast.success('笔记已保存')
  } catch (error) {
    console.error('保存笔记失败:', error)
    toast.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

// 切换收藏状态
const toggleFavorite = async () => {
  try {
    await noteApi.toggleFavorited(note.value.id)
    note.value.isFavorite = !note.value.isFavorite
    toast.success(note.value.isFavorite ? '已添加到收藏' : '已取消收藏')
  } catch (error) {
    console.error('切换收藏状态失败:', error)
    toast.error('操作失败')
  }
}

// 删除笔记
const deleteNote = async () => {
  if (confirm('确定要删除这篇笔记吗？此操作无法撤销。')) {
    try {
      await noteApi.delete(note.value.id)
      toast.success('笔记已删除')
      router.push('/notes')
    } catch (error) {
      console.error('删除笔记失败:', error)
      toast.error('删除失败，请重试')
    }
  }
}

// 切换标签
const toggleTag = (tagId: string) => {
  const index = form.value.tags.indexOf(tagId)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  } else {
    form.value.tags.push(tagId)
  }
}

// 渲染 Markdown 内容（简单实现）
const renderContent = computed(() => {
  // 根据是否在编辑模式选择使用原始内容还是编辑中的内容
  const content = isEditing.value ? form.value.content : note.value.content

  // 简单的 Markdown 渲染
  let html = content

  // 标题
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')

  // 粗体和斜体
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>')

  // 代码块
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, '<pre class="bg-black/5 p-4 rounded-lg my-3 overflow-x-auto"><code>$2</code></pre>')

  // 行内代码
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-black/5 px-1.5 py-0.5 rounded text-sm">$1</code>')

  // 待办事项
  html = html.replace(/^- \[x\] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="rounded"><span class="line-through text-neutral-500">$1</span></div>')
  html = html.replace(/^- \[ \] (.*$)/gim, '<div class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="rounded"><span>$1</span></div>')

  // 列表
  html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')

  // 段落
  html = html.replace(/\n\n/g, '</p><p class="my-3 leading-relaxed">')
  html = '<p class="my-3 leading-relaxed">' + html + '</p>'

  return html
})

onMounted(() => {
  loadCategories()
  loadNoteDetail()
})

// 监听笔记加载完成，如果是新建笔记则自动进入编辑模式
watch(() => [note.value.title, note.value.content, loading.value], () => {
  // 如果不在编辑模式、不是加载中、标题是默认的"新建笔记"且内容为空，则自动进入编辑模式
  if (!isEditing.value && !loading.value && note.value.title === '新建笔记' && !note.value.content) {
    startEdit()
  }
}, { deep: true })

// 监听路由参数变化，重新加载笔记
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadNoteDetail()
  }
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <!-- 侧边栏（隐藏，因为这是详情页） -->
    <aside v-if="false" class="hidden"></aside>

    <!-- 主内容区 -->
    <main class="flex-1 flex flex-col min-w-0 z-10">
      <!-- 顶部工具栏 -->
      <header class="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <!-- 返回按钮 -->
          <Button
            @click="router.push('/notes')"
            variant="ghost"
            size="icon"
            class="rounded-xl"
            title="返回笔记列表"
          >
            <ArrowLeft :size="20" class="text-neutral-600" />
          </Button>

          <div class="h-6 w-px bg-black/10"></div>

          <!-- 笔记信息 -->
          <div v-if="!isEditing">
            <h1 class="text-lg font-semibold text-neutral-900">{{ note.title }}</h1>
            <p class="text-xs text-neutral-400 mt-0.5">
              {{ formatTime(note.updatedAt) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- 收藏按钮 -->
          <Button
            v-if="!isEditing"
            @click="toggleFavorite"
            variant="ghost"
            size="icon"
            class="rounded-xl"
            :title="note.isFavorite ? '取消收藏' : '收藏'"
          >
            <Star
              v-if="note.isFavorite"
              :size="20"
              class="fill-yellow-400 text-yellow-400"
            />
            <StarOff v-else :size="20" class="text-neutral-400" />
          </Button>

          <!-- 删除按钮 -->
          <Button
            v-if="!isEditing"
            @click="deleteNote"
            variant="ghost"
            size="icon"
            class="rounded-xl hover:bg-rose-50 hover:text-rose-600"
            title="删除笔记"
          >
            <Trash2 :size="20" class="text-neutral-400" />
          </Button>

          <div v-if="!isEditing" class="h-6 w-px bg-black/10"></div>

          <!-- 编辑/保存按钮 -->
          <Button
            v-if="!isEditing"
            @click="startEdit"
            size="default"
          >
            <Tag :size="16" class="mr-2" />
            <span>编辑</span>
          </Button>

          <template v-else>
            <Button
              @click="cancelEdit"
              variant="outline"
              :disabled="isSaving"
            >
              取消
            </Button>
            <Button
              @click="saveNote"
              :disabled="isSaving"
            >
              <div v-if="isSaving" class="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <Save v-else :size="16" class="mr-2" />
              <span>{{ isSaving ? '保存中...' : '保存' }}</span>
            </Button>
          </template>
        </div>
      </header>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div :class="isEditing ? 'max-w-7xl' : 'max-w-4xl'" class="mx-auto px-8 py-8">
          <!-- 预览模式 -->
          <div v-if="!isEditing" class="prose prose-neutral max-w-none">
            <!-- 元信息 -->
            <Card class="mb-6 border-black/5">
              <CardContent class="pt-6">
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2 text-sm text-neutral-600">
                    <FolderOpen :size="16" />
                    <span>{{ categories.find(c => c.id === note.categoryId)?.name || '未分类' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-neutral-600">
                    <Calendar :size="16" />
                    <span>创建于 {{ formatTime(note.createdAt) }}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- 标签 -->
            <div v-if="note.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
              <Badge
                v-for="tagId in note.tags"
                :key="tagId"
                :variant="'secondary'"
                :class="availableTags.find(t => t.id === tagId)?.color || 'bg-gray-100 text-gray-700'"
                class="px-3 py-1 text-sm font-medium"
              >
                {{ availableTags.find(t => t.id === tagId)?.name || tagId }}
              </Badge>
            </div>

            <!-- 内容渲染 -->
            <div
              class="text-neutral-700 leading-relaxed"
              v-html="renderContent"
            ></div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="space-y-6">
            <!-- 标题编辑 -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                笔记标题
              </label>
              <Input
                v-model="form.title"
                type="text"
                placeholder="输入笔记标题..."
                class="text-lg font-medium"
              />
            </div>

            <!-- 分类和标签 -->
            <div class="grid grid-cols-2 gap-6">
              <!-- 分类选择 -->
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  分类
                </label>
                <Select v-model="form.categoryId">
                  <SelectTrigger class="bg-white border-black/10">
                    <SelectValue placeholder="未分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- 标签选择 -->
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">
                  标签
                </label>
                <div class="flex flex-wrap gap-2">
                  <Badge
                    v-for="tag in availableTags"
                    :key="tag.id"
                    @click="toggleTag(tag.id)"
                    :variant="form.tags.includes(tag.id) ? 'default' : 'secondary'"
                    :class="[
                      'cursor-pointer transition-all',
                      form.tags.includes(tag.id) ? 'bg-black text-white' : tag.color
                    ]"
                    class="px-3 py-1.5 text-sm font-medium"
                  >
                    {{ tag.name }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Markdown 工具栏 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-medium text-neutral-700">
                  内容（支持 Markdown）
                </label>
                <!-- 预览切换按钮 -->
                <Button
                  @click="showPreview = !showPreview"
                  :variant="showPreview ? 'secondary' : 'outline'"
                  size="sm"
                >
                  <span>{{ showPreview ? '隐藏预览' : '显示预览' }}</span>
                </Button>
              </div>

              <div :class="showPreview ? 'grid grid-cols-2 gap-4' : ''">
                <!-- 编辑区 -->
                <Card class="border-black/10 overflow-hidden">
                  <!-- 工具栏 -->
                  <div class="flex items-center gap-1 px-3 py-2 bg-black/5 border-b border-black/10">
                    <Button
                      @click="form.content += '**粗体**'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="粗体"
                    >
                      <Bold :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '*斜体*'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="斜体"
                    >
                      <Italic :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '\n# 一级标题'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="一级标题"
                    >
                      <Heading1 :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '\n## 二级标题'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="二级标题"
                    >
                      <Heading2 :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '\n- 列表项'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="无序列表"
                    >
                      <List :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '\n1. 列表项'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="有序列表"
                    >
                      <ListOrdered :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '\n```\n代码块\n```'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="代码块"
                    >
                      <Code :size="16" class="text-neutral-600" />
                    </Button>
                    <Button
                      @click="form.content += '[链接文本](url)'"
                      variant="ghost"
                      size="icon"
                      class="h-8 w-8"
                      title="链接"
                    >
                      <LinkIcon :size="16" class="text-neutral-600" />
                    </Button>
                  </div>

                  <!-- 编辑区 -->
                  <textarea
                    v-model="form.content"
                    placeholder="在这里输入笔记内容，支持 Markdown 格式..."
                    :class="showPreview ? 'min-h-[700px]' : 'min-h-[800px]'"
                    class="w-full px-4 py-3 bg-white text-sm leading-relaxed focus:outline-none resize-none font-mono border-0 rounded-none"
                  ></textarea>
                </Card>

                <!-- 预览区 -->
                <Card
                  v-if="showPreview"
                  class="border-black/10 overflow-hidden custom-scrollbar"
                  :class="showPreview ? 'min-h-[700px] max-h-[800px]' : ''"
                >
                  <CardHeader class="pb-3 border-b border-black/5">
                    <CardTitle class="text-xs font-medium text-neutral-400">预览</CardTitle>
                  </CardHeader>
                  <CardContent class="pt-4 overflow-y-auto">
                    <div
                      class="prose prose-neutral prose-sm max-w-none"
                      v-html="renderContent"
                    ></div>
                  </CardContent>
                </Card>
              </div>

              <!-- 提示信息 -->
              <div class="mt-2 text-xs text-neutral-400">
                💡 提示：支持 Markdown 语法，包括标题、列表、代码块、粗体、斜体等
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.prose h1 {
  font-size: 2em;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.2;
}

.prose h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
  line-height: 1.3;
}

.prose h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.3em;
  line-height: 1.4;
}

.prose p {
  margin-top: 0.75em;
  margin-bottom: 0.75em;
  line-height: 1.75;
}

.prose code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 0.25em;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', monospace;
}

.prose pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 0.75em 0;
}

.prose pre code {
  background-color: transparent;
  padding: 0;
}

.prose ul {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.75em 0;
}

.prose ol {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.75em 0;
}

.prose li {
  margin: 0.25em 0;
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

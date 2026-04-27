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
  X
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { noteApi, type Note as NoteType } from '@/api/note'
import { noteCategoryApi, type NoteCategory } from '@/api/noteCategory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TiptapEditor from '@/components/TiptapEditor.vue'
import type { Editor } from '@tiptap/vue-3'

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
// 是否显示删除确认对话框
const showDeleteDialog = ref(false)
// 是否正在删除
const isDeleting = ref(false)

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

// 新标签输入
const newTagInput = ref('')

// TiptapEditor 引用
const editorRef = ref<{ editor: Editor | null }>()

// 添加标签
const addTag = () => {
  const tag = newTagInput.value.trim()
  if (!tag) {
    toast.error('请输入标签内容')
    return
  }
  if (form.value.tags.length >= 3) {
    toast.error('最多只能添加3个标签')
    return
  }
  if (form.value.tags.includes(tag)) {
    toast.error('标签已存在')
    return
  }
  form.value.tags.push(tag)
  newTagInput.value = ''
}

// 删除标签
const removeTag = (tag: string) => {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

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
const deleteNote = () => {
  showDeleteDialog.value = true
}

// 确认删除笔记
const confirmDelete = async () => {
  isDeleting.value = true
  try {
    await noteApi.delete(note.value.id)
    toast.success('笔记已删除')
    showDeleteDialog.value = false
    router.push('/notes')
  } catch (error) {
    console.error('删除笔记失败:', error)
    toast.error('删除失败，请重试')
  } finally {
    isDeleting.value = false
  }
}

// 取消删除
const cancelDelete = () => {
  showDeleteDialog.value = false
}

onMounted(() => {
  loadCategories()
  loadNoteDetail()
})

// 监听笔记加载完成，如果是新建笔记或URL参数要求编辑则自动进入编辑模式
watch(() => [note.value.title, note.value.content, loading.value, route.query.edit], () => {
  // 如果不在编辑模式、不是加载中、标题是默认的"新建笔记"且内容为空，则自动进入编辑模式
  if (!isEditing.value && !loading.value && note.value.title === '新建笔记' && !note.value.content) {
    startEdit()
  }
  // 如果URL参数中有edit=true且不是加载中，则自动进入编辑模式
  if (!isEditing.value && !loading.value && route.query.edit === 'true') {
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
          <div class="flex-1 min-w-0">
            <Input
              v-if="isEditing"
              v-model="form.title"
              type="text"
              placeholder="输入笔记标题..."
              class="text-lg font-semibold bg-stone-50 border border-black/5 rounded-xl px-3 py-1.5 w-fit min-w-[300px] max-w-[600px]"
            />
            <h1 v-else class="text-lg font-semibold text-neutral-900">{{ note.title }}</h1>
            <p v-if="!isEditing" class="text-xs text-neutral-400 mt-0.5">
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
        <div class="w-full px-6 sm:px-8 py-4 max-w-6xl mx-auto">
          <!-- 预览模式 -->
          <div v-if="!isEditing" class="flex flex-col gap-8">
            <!-- 主内容区 -->
            <div class="flex-1 min-w-0">
              <div class="max-w-4xl prose prose-neutral max-w-none">
                <!-- 元信息 -->
                <Card class="mb-3 border-black/5">
                  <CardContent>
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
                <div v-if="note.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                  <Badge
                    v-for="tag in note.tags"
                    :key="tag"
                    variant="secondary"
                    class="px-3 py-1 text-sm font-medium"
                  >
                    {{ tag }}
                  </Badge>
                </div>

                <!-- 内容渲染 -->
                <TiptapEditor
                  ref="editorRef"
                  v-model="note.content"
                  :editable="false"
                  placeholder="暂无内容"
                />
              </div>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else class="flex flex-col gap-8">
            <!-- 主编辑区 -->
            <div class="flex-1 min-w-0">
              <div class="space-y-6">
              <!-- 分类和标签 -->
              <div class="flex flex-col md:flex-row md:items-center gap-4">
                <!-- 分类选择 -->
                <div class="flex items-center gap-3">
                  <label class="text-sm font-medium text-neutral-700 min-w-[10px]">
                    分类
                  </label>
                  <Select v-model="form.categoryId">
                    <SelectTrigger class="bg-white border-black/10 w-40">
                      <SelectValue placeholder="未分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="cat in categories" :key="cat.id" :value="cat.id">
                        {{ cat.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 标签输入 -->
                <div class="flex items-center gap-3 flex-1">
                  <label class="text-sm font-medium text-neutral-700 min-w-[60px]">
                    标签 <span class="text-neutral-400 font-normal">（最多3个）</span>
                  </label>
                  <Input
                    v-model="newTagInput"
                    @keyup.enter="addTag"
                    type="text"
                    placeholder="输入标签后按回车"
                    :disabled="form.tags.length >= 3"
                    class="w-48"
                  />
                  <!-- 已选标签 - 在输入框右侧 -->
                  <div v-if="form.tags.length > 0" class="flex flex-wrap items-center gap-2">
                    <Badge
                      v-for="tag in form.tags"
                      :key="tag"
                      variant="secondary"
                      class="px-3 py-1 text-sm font-medium gap-1"
                    >
                      {{ tag }}
                      <button
                        @click="removeTag(tag)"
                        class="ml-1 hover:text-red-600 transition-colors"
                      >
                        <X :size="12" />
                      </button>
                    </Badge>
                  </div>
                  <p v-if="form.tags.length >= 3" class="text-xs text-neutral-400 whitespace-nowrap">
                    已达到标签数量上限
                  </p>
                </div>
              </div>

              <!-- 富文本编辑器 -->
              <div class="w-full">
                <TiptapEditor
                  ref="editorRef"
                  v-model="form.content"
                  placeholder="在这里输入笔记内容..."
                  class="w-full"
                />
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除这篇笔记吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            @click="cancelDelete"
            :disabled="isDeleting"
            variant="outline"
          >
            取消
          </Button>
          <Button
            @click="confirmDelete"
            :disabled="isDeleting"
            variant="destructive"
          >
            <div v-if="isDeleting" class="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span>{{ isDeleting ? '删除中...' : '确认删除' }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
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

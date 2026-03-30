<script setup lang="ts">
import { ref } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  ArrowRight
} from 'lucide-vue-next'
import { noteApi } from '@/api/note'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

const isOpen = ref(false)
const imageUrl = ref('')
const activeTab = ref('upload')
const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)

// 打开菜单
const openMenu = () => {
  isOpen.value = true
  imageUrl.value = ''
  activeTab.value = 'upload'
}

// 触发文件选择
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

// 拖拽相关逻辑
const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}
const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

// 处理文件上传
const processFile = async (file: File) => {
  if (!file.type.startsWith('image/')) return
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过5MB')
    return
  }
  isUploading.value = true
  try {
    const res = await noteApi.uploadImage(file)
    insertImage(res.data)
  } catch (e) {
    console.error('图片上传失败', e)
    alert('图片上传失败，请重试')
  } finally {
    isUploading.value = false
  }
}

// 插入图片
const insertImage = (url: string) => {
  if (url && props.editor) {
    props.editor.chain().focus().setImage({ src: url }).run()
  }
  isOpen.value = false
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        @click="openMenu"
        variant="ghost"
        size="icon"
        class="h-8 w-8 transition-colors"
        :class="[
          props.editor.isActive('image') 
            ? 'bg-violet-100 text-violet-600' 
            : 'text-neutral-600 hover:bg-neutral-100'
        ]"
        title="插入图片"
      >
        <ImageIcon :size="18" />
      </Button>
    </PopoverTrigger>

    <PopoverContent align="start" side="bottom" class="w-[400px] p-0 overflow-hidden shadow-xl rounded-xl border-neutral-200">
      <Tabs v-model="activeTab" class="w-full">
        <!-- 顶部 Tab 切换 -->
        <div class="px-4 pt-3 pb-0">
          <TabsList class="grid w-full grid-cols-2 h-9 bg-neutral-100 p-1 rounded-lg">
            <TabsTrigger value="upload" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">本地上传</TabsTrigger>
            <TabsTrigger value="url" class="text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">网络图片</TabsTrigger>
          </TabsList>
        </div>

        <div class="p-4">
          <!-- 1. 本地上传 Tab -->
          <TabsContent value="upload" class="mt-0">
            <div
              class="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer bg-neutral-50/50 group"
              :class="[
                isDragging 
                  ? 'border-violet-500 bg-violet-50' 
                  : 'border-violet-200 hover:border-violet-400 hover:bg-violet-50/50'
              ]"
              @click="triggerFileInput"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @drop="handleDrop"
            >
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileSelect" />
              
              <!-- 统一的图标容器样式 -->
              <div class="mb-3 p-3 bg-white rounded-full shadow-sm ring-1 ring-neutral-100 group-hover:scale-110 transition-transform duration-200">
                <div class="bg-violet-100 text-violet-600 rounded-full p-2">
                   <UploadCloud :size="20" :class="isUploading ? 'animate-bounce' : ''" />
                </div>
              </div>

              <div class="text-center space-y-1">
                <p class="text-sm text-neutral-600 font-medium">
                  {{ isUploading ? '上传中...' : '点击或拖拽上传' }}
                </p>
                <p class="text-[10px] text-neutral-400">
                  支持 JPG, PNG, GIF, WebP (Max 5MB)
                </p>
              </div>
            </div>
          </TabsContent>

          <!-- 2. 网络图片 Tab (样式已统一) -->
          <TabsContent value="url" class="mt-0">
            <div class="flex flex-col items-center justify-center w-full h-40 border border-neutral-200 rounded-xl bg-white p-4 space-y-4">
              
              <!-- 统一的图标容器样式 -->
              <div class="p-3 bg-neutral-50 rounded-full shadow-sm ring-1 ring-neutral-100">
                <div class="bg-violet-100 text-violet-600 rounded-full p-2">
                   <LinkIcon :size="20" />
                </div>
              </div>

              <!-- 输入区域组合 -->
              <div class="w-full flex items-center gap-2">
                <Input
                  v-model="imageUrl"
                  placeholder="https://..."
                  class="h-9 flex-1 bg-neutral-50 border-neutral-200 focus-visible:ring-violet-500 text-sm"
                  @keyup.enter="insertImage(imageUrl)"
                  auto-focus
                />
                <Button 
                  size="icon" 
                  class="h-9 w-9 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                  :disabled="!imageUrl"
                  @click="insertImage(imageUrl)"
                  title="确认插入"
                >
                  <ArrowRight :size="16" />
                </Button>
              </div>

            </div>
          </TabsContent>
        </div>
      </Tabs>
    </PopoverContent>
  </Popover>
</template>
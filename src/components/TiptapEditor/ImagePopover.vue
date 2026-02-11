<script setup lang="ts">
import { ref } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Image as ImageIcon, Link as LinkIcon } from 'lucide-vue-next'

interface Props {
  editor: Editor
}

const props = defineProps<Props>()

const isOpen = ref(false)
const imageUrl = ref('')

const openMenu = () => {
  imageUrl.value = ''
  isOpen.value = true
}

const closeMenu = () => {
  isOpen.value = false
  imageUrl.value = ''
}

const confirmImage = () => {
  if (imageUrl.value && props.editor) {
    props.editor.chain().focus().setImage({ src: imageUrl.value }).run()
  }
  closeMenu()
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button
        @click="openMenu"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        title="插入图片"
      >
        <ImageIcon :size="16" class="text-neutral-600" />
      </Button>
    </PopoverTrigger>

    <PopoverContent as-child align="start" side="bottom" class="w-80 p-0">
      <div class="space-y-3">
        <!-- 图片地址输入 -->
        <div class="space-y-2">
          <label class="text-xs font-medium text-neutral-600">图片地址</label>
          <Input
            v-model="imageUrl"
            placeholder="https://example.com/image.jpg"
            @keyup.enter="confirmImage"
            class="h-8"
          />
        </div>

        <!-- 提示信息 -->
        <div class="text-xs text-neutral-500 p-2 bg-neutral-50 rounded">
          <p class="font-medium mb-1">💡 提示</p>
          <ul class="space-y-1 text-neutral-600">
            <li>• 支持 JPG、PNG、GIF、WebP 等格式</li>
            <li>• 建议使用图片 URL 而非本地上传</li>
            <li>• 可直接粘贴图片地址</li>
          </ul>
        </div>

        <Separator />

        <!-- 确认按钮 -->
        <Button
          @click="confirmImage"
          size="sm"
          class="w-full"
        >
          <LinkIcon :size="14" class="mr-1" />
          确定
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>

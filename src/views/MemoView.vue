<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Plus,
  Maximize2,
  Zap,
  Lightbulb,
  Heart,
  Code,
  X,
  Check,
  Edit3,
  Pin,
  PinOff
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { memoApi, type Memo, type CreateMemoParams, type UpdateMemoParams } from '@/api/memo'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MemoWithColor extends Memo {
  color: string
  borderColor: string
  textColor: string
  icon: any
}

const showModal = ref(false)
const editId = ref<number | null>(null)
const isLoading = ref(false)
const isLoadingMemos = ref(false)
const showDeleteDialog = ref(false)
const deleteMemoId = ref<number | null>(null)

const memos = ref<MemoWithColor[]>([])

const form = ref({
  title: '',
  content: '',
  tag: 'IDEA',
  colorIndex: 0,
  pinned: 0
})

// 格式化时间显示
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}分钟前`
  }

  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }

  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days}天前`
  }

  // 超过7天，显示具体日期
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // 如果是今年，不显示年份
  if (year === now.getFullYear()) {
    return `${month}-${day}`
  }

  return `${year}-${month}-${day}`
}

// 颜色预设 - 对应后端数据库的颜色
const colorPresets = [
  {
    name: 'Yellow',
    bg: 'bg-amber-100/50',
    border: 'border-amber-200/50',
    text: 'text-amber-900',
    icon: Lightbulb,
    code: '#fef9e3'
  },
  {
    name: 'Blue',
    bg: 'bg-blue-100/50',
    border: 'border-blue-200/50',
    text: 'text-blue-900',
    icon: Zap,
    code: '#f4f8fe'
  },
  {
    name: 'Purple',
    bg: 'bg-purple-100/50',
    border: 'border-purple-200/50',
    text: 'text-purple-900',
    icon: Lightbulb,
    code: '#f9f3ff'
  },
  {
    name: 'Pink',
    bg: 'bg-rose-100/50',
    border: 'border-rose-200/50',
    text: 'text-rose-900',
    icon: Heart,
    code: '#fff1f2'
  },
  {
    name: 'Green',
    bg: 'bg-emerald-100/50',
    border: 'border-emerald-200/50',
    text: 'text-emerald-900',
    icon: Code,
    code: '#e8fcf2'
  }
]

// 将后端返回的颜色代码映射到颜色预设
const getColorPreset = (backgroundColor: string) => {
  return colorPresets.find((p) => p.code === backgroundColor) ?? colorPresets[0]
}

// 加载便签列表
const loadMemos = async () => {
  try {
    isLoadingMemos.value = true
    const data = await memoApi.getList()

    // 将后端数据转换为前端显示格式
    const defaultPreset = colorPresets[0]
    memos.value = data.map((memo) => {
      const preset = getColorPreset(memo.backgroundColor)
      return {
        ...memo,
        color: preset?.bg ?? defaultPreset.bg,
        borderColor: preset?.border ?? defaultPreset.border,
        textColor: preset?.text ?? defaultPreset.text,
        icon: preset?.icon ?? defaultPreset.icon
      }
    })

    // 按置顶状态和创建时间排序
    memos.value.sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return b.pinned - a.pinned // 置顶的排在前面
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } catch (error) {
    console.error('加载便签失败:', error)
    toast.error('加载便签失败')
  } finally {
    isLoadingMemos.value = false
  }
}

// 切换置顶状态
const togglePinned = async (memo: MemoWithColor) => {
  try {
    const newPinnedStatus = memo.pinned === 1 ? 0 : 1
    await memoApi.togglePinned(memo.id)
    memo.pinned = newPinnedStatus
    toast.success(newPinnedStatus === 1 ? '已置顶' : '已取消置顶')
    await loadMemos() // 重新加载以更新排序
  } catch (error) {
    console.error('切换置顶失败:', error)
    toast.error('操作失败')
  }
}

const handleOpenCreate = () => {
  editId.value = null
  form.value = { title: '', content: '', tag: 'IDEA', colorIndex: 0, pinned: 0 }
  showModal.value = true
}

const handleOpenEdit = (memo: MemoWithColor) => {
  editId.value = memo.id
  const cIdx = colorPresets.findIndex((p) => p.code === memo.backgroundColor)
  form.value = {
    title: memo.title || '',
    content: memo.content,
    tag: memo.tag?.replace('#', '') || 'IDEA',
    colorIndex: cIdx !== -1 ? cIdx : 0,
    pinned: memo.pinned
  }
  showModal.value = true
}

const handleSubmit = async (e: Event) => {
  e.preventDefault()

  if (!form.value.content.trim() && !form.value.title.trim()) {
    toast.error('标题和内容至少需要填写一项')
    return
  }

  isLoading.value = true

  try {
    const preset = colorPresets[form.value.colorIndex]

    if (editId.value) {
      // 更新便签
      const updateParams: UpdateMemoParams = {
        id: editId.value,
        title: form.value.title.trim() || undefined,
        content: form.value.content.trim(),
        tag: form.value.tag ? `#${form.value.tag.toUpperCase()}` : undefined,
        backgroundColor: preset.code,
        pinned: form.value.pinned
      }

      await memoApi.update(updateParams)
      toast.success('便签已更新')
    } else {
      // 创建便签
      const createParams: CreateMemoParams = {
        title: form.value.title.trim() || undefined,
        content: form.value.content.trim(),
        tag: form.value.tag ? `#${form.value.tag.toUpperCase()}` : undefined,
        backgroundColor: preset.code,
        pinned: form.value.pinned
      }

      await memoApi.create(createParams)
      toast.success('灵感已归档')
    }

    showModal.value = false
    await loadMemos() // 重新加载列表
  } catch (error) {
    console.error('保存便签失败:', error)
    toast.error('操作失败')
  } finally {
    isLoading.value = false
  }
}

const deleteStick = async (id: number) => {
  deleteMemoId.value = id
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!deleteMemoId.value) return

  try {
    await memoApi.delete(deleteMemoId.value)
    toast.success('便签已删除')
    await loadMemos() // 重新加载列表
  } catch (error) {
    console.error('删除便签失败:', error)
    toast.error('删除失败')
  } finally {
    showDeleteDialog.value = false
    deleteMemoId.value = null
  }
}

// 页面加载时获取便签列表
onMounted(() => {
  loadMemos()
})
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-10 pb-12 section-reveal">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-neutral-400 mt-1 italic">
          在灵感消逝前捕捉那些转瞬即逝的思想火花。
        </p>
      </div>
      <button
        @click="handleOpenCreate"
        class="flex items-center gap-3 px-6 py-2.5 bg-black text-white rounded-full text-xs font-medium hover:bg-neutral-800 shadow-xl shadow-black/20 transition-all hover:scale-105"
      >
        <Plus :size="16" />
        <span>新建灵感</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoadingMemos" class="flex items-center justify-center py-20">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-3 border-neutral-200 border-t-black rounded-full animate-spin"></div>
        <p class="text-sm text-neutral-400 mono">加载便签中...</p>
      </div>
    </div>

    <!-- 便签列表 -->
    <div
      v-else
      class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 auto-rows-[240px]"
    >
      <div
        v-for="memo in memos"
        :key="memo.id"
        @click="handleOpenEdit(memo)"
        :class="[
          'rounded-[2rem] shadow-sm relative group flex flex-col card-hover animate-in fade-in zoom-in duration-300 cursor-pointer overflow-hidden',
          memo.color,
          memo.borderColor,
          memo.textColor
        ]"
      >
        <div class="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
          <div class="flex justify-between items-center mb-3 shrink-0">
            <component :is="memo.icon" class="w-4 h-4 opacity-60" />
            <div class="flex items-center gap-2">
              <button
                v-if="memo.pinned === 1"
                @click.stop
                class="opacity-40 hover:opacity-100 transition-opacity"
                title="已置顶"
              >
                <Pin :size="12" class="fill-current" />
              </button>
              <span class="mono text-[9px] opacity-40 uppercase tracking-tighter">{{
                memo.tag || ''
              }}</span>
            </div>
          </div>
          <h4 v-if="memo.title" class="text-sm font-bold mb-2 truncate shrink-0">
            {{ memo.title }}
          </h4>
          <p
            class="text-xs font-medium leading-relaxed opacity-80 flex-1 memo-content"
            :title="memo.content"
            :style="{
              '--line-clamp': memo.title ? 4 : 6
            }"
          >
            {{ memo.content }}
          </p>
        </div>

        <div class="px-6 pb-4 pt-2 shrink-0">
          <div class="flex justify-between items-center mb-3">
            <p class="text-[9px] mono opacity-30 uppercase tracking-tighter shrink-0">
              {{ formatTime(memo.updatedAt) }}
            </p>
          </div>

          <div
            class="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div class="flex gap-2">
              <button
                @click.stop="handleOpenEdit(memo)"
                class="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
                title="编辑"
              >
                <Edit3 :size="12" class="opacity-40" />
              </button>
              <button
                @click.stop="togglePinned(memo)"
                class="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
                :title="memo.pinned === 1 ? '取消置顶' : '置顶'"
              >
                <PinOff v-if="memo.pinned === 1" :size="12" class="opacity-40" />
                <Pin v-else :size="12" class="opacity-40" />
              </button>
              <button
                @click.stop
                class="p-1.5 hover:bg-white/40 rounded-lg transition-colors"
              >
                <Maximize2 :size="12" class="opacity-40" />
              </button>
            </div>
            <button
              @click.stop="deleteStick(memo.id)"
              class="p-1.5 hover:bg-rose-100/50 hover:text-rose-600 rounded-lg transition-colors"
            >
              <X :size="12" class="opacity-40" />
            </button>
          </div>
        </div>
      </div>

      <button
        @click="handleOpenCreate"
        class="border-2 border-dashed border-black/5 bg-white/20 rounded-[2rem] flex flex-col items-center justify-center p-6 text-neutral-300 hover:text-neutral-500 hover:bg-white/40 transition-all card-hover group"
      >
        <div
          class="w-12 h-12 rounded-full border border-black/5 bg-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm"
        >
          <Plus :size="24" :stroke-width="1" />
        </div>
        <span class="mono text-[9px] font-bold uppercase tracking-widest mt-2">
          添加便签
        </span>
      </button>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold">确认删除</DialogTitle>
          <DialogDescription class="text-sm text-neutral-500">
            确定要删除这条便签吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-4">
          <Button
            variant="ghost"
            @click="showDeleteDialog = false"
            class="flex-1"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            @click="confirmDelete"
            class="flex-1"
          >
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Note Modal (Create/Edit) - Teleported to body -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          class="w-full max-w-md max-h-[90vh] overflow-auto p-6 bg-white rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        >
          <div class="p-2 border-b border-black/5 flex justify-between items-center bg-stone-50/50">
            <div>
              <h3 class="text-lg font-medium text-neutral-900">
                {{ editId ? '编辑灵感节点' : '记录瞬间灵感' }}
              </h3>
              <p class="text-[10px] mono uppercase tracking-widest text-neutral-400">
                {{ editId ? 'Update Existing Fragment' : 'Capture Thought Fragment' }}
              </p>
            </div>
            <button
              @click="showModal = false"
              class="p-2 text-neutral-300 hover:text-neutral-900 transition-colors"
            >
              <X :size="20" />
            </button>
          </div>

          <form @submit="handleSubmit" class="pt-6 space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                >便签标题</label
              >
              <input
                v-model="form.title"
                type="text"
                autofocus
                placeholder="给灵感起个名字..."
                class="w-full px-5 py-3.5 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                >内容描述</label
              >
              <textarea
                v-model="form.content"
                rows="4"
                placeholder="在这里输入你的想法、提醒或任何碎片化的信息..."
                class="w-full px-5 py-4 bg-stone-50 border border-black/5 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                  >标签</label
                >
                <div class="relative flex items-center">
                  <span class="absolute left-5 text-neutral-300 mono text-xs">#</span>
                  <input
                    v-model="form.tag"
                    type="text"
                    placeholder="IDEA..."
                    class="w-full pl-9 pr-5 py-3 bg-stone-50 border border-black/5 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-bold uppercase tracking-widest text-neutral-400 ml-1"
                  >底色</label
                >
                <div class="flex justify-between px-1">
                  <button
                    v-for="(color, idx) in colorPresets"
                    :key="idx"
                    type="button"
                    @click="form.colorIndex = idx"
                    :class="[
                      'w-8 h-8 rounded-xl border transition-all flex items-center justify-center',
                      color.bg,
                      color.border,
                      form.colorIndex === idx
                        ? 'ring-2 ring-offset-2 ring-black/10 scale-110'
                        : 'hover:scale-105 opacity-60'
                    ]"
                  >
                    <Check v-if="form.colorIndex === idx" :size="12" :class="color.text" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              class="w-full py-4 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <div v-if="isLoading" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span v-else>{{ editId ? '确认更新' : '归档灵感节点' }}</span>
            </button>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
@keyframes section-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-reveal {
  animation: section-reveal 0.8s ease-out forwards;
  opacity: 0;
}

.woven-border {
  position: relative;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
}

.memo-content {
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 6);
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>

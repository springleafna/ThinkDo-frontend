<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Send, Bot, User, Trash2, Plus, MessageSquare, Clock, Pencil } from 'lucide-vue-next'
import { useLayoutStore } from '@/stores/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { aiChatApi, type ConversationInfo, type MessageInfo } from '@/api/ai'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

const layoutStore = useLayoutStore()
const activeView = ref('ai-chat')

// 使用全局 store 的侧边栏状态和方法
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

const scrollRef = ref<HTMLElement>()
const currentSessionId = ref<string>('')
const chatSessions = ref<ChatSession[]>([])
const showDeleteDialog = ref(false)
const deleteSessionId = ref<string>('')
const isLoading = ref(false)
const isLoadingSessions = ref(false)
const showEditDialog = ref(false)
const editSessionId = ref<string>('')
const editDialogTitle = ref('')

const messages = ref<ChatMessage[]>([
  {
    role: 'model',
    text: '您好，我是 ThinkDo 智能助手。我可以协助您整理计划、分析任务优先级或进行深度思维发散。今天有什么我可以帮您的？',
    timestamp: new Date()
  }
])
const input = ref('')
const isTyping = ref(false)

// 生成会话标题
const generateSessionTitle = (firstUserMessage: string) => {
  const maxLength = 20
  let title = firstUserMessage.trim()
  if (title.length > maxLength) {
    title = title.substring(0, maxLength) + '...'
  }
  return title
}

// 创建新会话
const createNewSession = () => {
  const newSession: ChatSession = {
    id: Date.now().toString(),
    title: '新对话',
    messages: [
      {
        role: 'model',
        text: '您好，我是 ThinkDo 智能助手。我可以协助您整理计划、分析任务优先级或进行深度思维发散。今天有什么我可以帮您的？',
        timestamp: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  chatSessions.value.unshift(newSession)
  currentSessionId.value = newSession.id
  messages.value = [...newSession.messages]
}

// 转换 API 消息格式到本地格式
const convertApiMessage = (msg: MessageInfo): ChatMessage => ({
  role: msg.role === 'assistant' ? 'model' : 'user',
  text: msg.content,
  timestamp: parseDateTime(msg.createdAt)
})

// 转换 API 会话格式到本地格式
const convertApiSession = (conv: ConversationInfo): ChatSession => ({
  id: conv.conversationId,
  title: conv.title,
  messages: [], // 消息需要单独加载
  createdAt: parseDateTime(conv.createdAt),
  updatedAt: parseDateTime(conv.updatedAt)
})

// 解析后端返回的时间格式 (yyyy-MM-ddTHH:mm:ss)
const parseDateTime = (dateStr: string): Date => {
  if (!dateStr) return new Date()
  // 确保添加时区信息，防止被解析为 UTC
  return new Date(dateStr.endsWith('Z') ? dateStr : dateStr + '+08:00')
}

// 加载会话列表
const loadSessionsFromApi = async () => {
  try {
    isLoadingSessions.value = true
    const data = await aiChatApi.getConversationList()
    chatSessions.value = data.map(convertApiSession)

    if (chatSessions.value.length > 0) {
      const firstSession = chatSessions.value[0]
      if (firstSession) {
        await switchSession(firstSession.id)
      } else {
        createNewSession()
      }
    } else {
      createNewSession()
    }
  } catch (error) {
    console.error('加载会话列表失败:', error)
    createNewSession()
  } finally {
    isLoadingSessions.value = false
  }
}

// 切换会话
const switchSession = async (sessionId: string) => {
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (session) {
    currentSessionId.value = sessionId

    // 如果会话消息未加载，从 API 加载
    if (session.messages.length === 0) {
      try {
        isLoading.value = true
        const apiMessages = await aiChatApi.getMessagesByConversationId(sessionId)
        session.messages = (apiMessages || []).map(convertApiMessage)
        messages.value = [...session.messages]
      } catch (error) {
        console.error('加载消息失败:', error)
        messages.value = [{
          role: 'model',
          text: '加载消息失败，请重试',
          timestamp: new Date()
        }]
      } finally {
        isLoading.value = false
      }
    } else {
      messages.value = [...session.messages]
    }
    scrollToBottom()
  }
}

// 打开删除对话框
const openDeleteDialog = (sessionId: string) => {
  deleteSessionId.value = sessionId
  showDeleteDialog.value = true
}

// 确认删除会话
const confirmDeleteSession = async () => {
  if (deleteSessionId.value) {
    try {
      await aiChatApi.deleteConversation(deleteSessionId.value)
      chatSessions.value = chatSessions.value.filter(s => s.id !== deleteSessionId.value)
      if (currentSessionId.value === deleteSessionId.value) {
        if (chatSessions.value.length > 0) {
          const firstSession = chatSessions.value[0]
          if (firstSession) {
            await switchSession(firstSession.id)
          } else {
            createNewSession()
          }
        } else {
          createNewSession()
        }
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    } finally {
      showDeleteDialog.value = false
      deleteSessionId.value = ''
    }
  }
}

// 打开编辑标题对话框
const openEditDialog = (sessionId: string) => {
  const session = chatSessions.value.find(s => s.id === sessionId)
  if (session) {
    editSessionId.value = sessionId
    editDialogTitle.value = session.title
    showEditDialog.value = true
  }
}

// 确认更新会话标题
const confirmUpdateTitle = async () => {
  if (editSessionId.value && editDialogTitle.value.trim()) {
    try {
      await aiChatApi.updateConversation({
        conversationId: editSessionId.value,
        title: editDialogTitle.value.trim()
      })
      const session = chatSessions.value.find(s => s.id === editSessionId.value)
      if (session) {
        session.title = editDialogTitle.value.trim()
      }
      showEditDialog.value = false
    } catch (error) {
      console.error('更新会话标题失败:', error)
    }
  }
}

// 更新当前会话
const updateCurrentSession = () => {
  if (!currentSessionId.value) return

  const sessionIndex = chatSessions.value.findIndex(s => s.id === currentSessionId.value)
  if (sessionIndex !== -1) {
    const session = chatSessions.value[sessionIndex]
    if (!session) return

    session.messages = [...messages.value]
    session.updatedAt = new Date()

    // 如果是第一条用户消息，更新标题
    const userMessages = messages.value.filter(m => m.role === 'user')
    if (userMessages.length === 1 && messages.value.filter(m => m.role === 'model').length === 2) {
      const firstUserMessage = userMessages[0]
      if (firstUserMessage) {
        session.title = generateSessionTitle(firstUserMessage.text)
      }
    }

    // 移动到顶部
    chatSessions.value.splice(sessionIndex, 1)
    chatSessions.value.unshift(session)
  }
}

onMounted(() => {
  loadSessionsFromApi()
})

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTo({
        top: scrollRef.value.scrollHeight,
        behavior: 'smooth'
      })
    }
  })
}

const handleSend = async () => {
  if (!input.value.trim() || isTyping.value) return

  const userMessage: ChatMessage = {
    role: 'user',
    text: input.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  input.value = ''
  isTyping.value = true
  scrollToBottom()

  // 模拟 AI 响应
  setTimeout(() => {
    const responses = [
      '这是一个很好的问题！让我帮你分析一下...',
      '我理解你的需求。根据我的分析...',
      '这个问题很有趣！从我的角度来看...',
      '感谢你的提问！让我提供一些建议...',
      '明白你想要达到的目标。这里有几个思路...'
    ]

    const randomResponse = responses[Math.floor(Math.random() * responses.length)] || '好的，我明白了。'

    const modelMessage: ChatMessage = {
      role: 'model',
      text: randomResponse,
      timestamp: new Date()
    }

    messages.value.push(modelMessage)
    isTyping.value = false
    updateCurrentSession()
    scrollToBottom()
  }, 1000)
}

const clearChat = () => {
  if (window.confirm('确定要清空当前对话的所有内容吗？')) {
    messages.value = [{
      role: 'model',
      text: '对话已重置。我是 ThinkDo 智库 AI，随时准备协助您。',
      timestamp: new Date()
    }]
    updateCurrentSession()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <!-- 主内容区域 -->
    <main class="flex-1 flex flex-col min-w-0">
      <!-- 顶栏 -->
      <AppHeader :active-view="activeView" />

      <!-- 顶部工具栏 -->
      <div class="px-2 pt-8 bg-white/50 backdrop-blur-sm">
        <div class="flex items-center justify-between" style="padding-left: 96px; padding-right: 96px;">
          <div style="margin-left: 0px;">
            <p class="text-xs text-neutral-500">智能助手 · 随时待命</p>
          </div>
          <Button
            @click="clearChat"
            variant="ghost"
            size="sm"
            class="text-neutral-500 hover:text-rose-600"
          >
            <Trash2 :size="16" class="mr-2" />
            清空对话
          </Button>
        </div>
      </div>

      <!-- 内容区域：对话列表 + 聊天区域 -->
      <div class="flex-1 flex overflow-hidden px-24 pb-12 pt-2">
        <!-- 左侧对话列表 -->
        <aside class="w-64 mr-10">
          <Card class="h-full bg-white/90 backdrop-blur-md border-black/5 shadow-xl">
            <CardContent class="p-0 h-full flex flex-col">
              <div class="p-4 border-b border-black/5">
                <Button
                  @click="createNewSession"
                  class="w-full gap-2"
                  variant="default"
                >
                  <Plus :size="16" />
                  新对话
                </Button>
              </div>

              <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                <div
                  v-for="session in chatSessions"
                  :key="session.id"
                  @click="switchSession(session.id)"
                  class="group relative rounded-lg p-3 cursor-pointer transition-all hover:bg-stone-50"
                  :class="currentSessionId === session.id ? 'bg-stone-100' : ''"
                >
                  <div class="flex items-start gap-3">
                    <MessageSquare :size="16" class="mt-0.5 shrink-0 text-neutral-400" />
                    <div class="flex-1 min-w-0">
                      <p
                        class="text-sm font-medium truncate"
                        :class="currentSessionId === session.id ? 'text-neutral-900' : 'text-neutral-700'"
                      >
                        {{ session.title }}
                      </p>
                      <p class="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                        <Clock :size="10" />
                        {{ formatTime(session.updatedAt) }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        @click.stop="openEditDialog(session.id)"
                        class="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-stone-100 rounded-lg"
                        title="重命名"
                      >
                        <Pencil :size="14" />
                      </button>
                      <button
                        @click.stop="openDeleteDialog(session.id)"
                        class="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="删除对话"
                      >
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <!-- 右侧聊天区域 -->
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Card class="flex-1 flex flex-col overflow-hidden border-black/5 bg-white/90 backdrop-blur-md shadow-xl rounded-2xl">
            <CardContent class="flex-1 flex flex-col p-0 rounded-2xl overflow-hidden">
              <!-- 消息列表 -->
              <div
                ref="scrollRef"
                class="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar"
              >
                <div
                  v-for="(msg, i) in messages"
                  :key="i"
                  class="flex gap-3"
                  :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
                >
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    :class="msg.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-stone-100 text-neutral-600'"
                  >
                    <User v-if="msg.role === 'user'" :size="16" />
                    <Bot v-else :size="16" />
                  </div>
                  <div
                    class="max-w-[80%] space-y-1"
                    :class="msg.role === 'user' ? 'text-right' : ''"
                  >
                    <div
                      class="rounded-xl px-4 py-3 text-sm leading-relaxed"
                      :class="msg.role === 'user'
                        ? 'bg-neutral-900 text-white'
                        : 'bg-stone-50 text-neutral-800 border border-black/[0.03]'"
                    >
                      <p
                        v-for="(line, idx) in msg.text.split('\n')"
                        :key="idx"
                        :class="idx > 0 ? 'mt-2' : ''"
                      >
                        {{ line }}
                      </p>
                    </div>
                    <p class="text-[10px] text-neutral-400">
                      {{ msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                  </div>
                </div>

                <!-- 输入中状态 -->
                <div
                  v-if="isTyping"
                  class="flex gap-3"
                >
                  <div class="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <Bot :size="16" class="text-neutral-400" />
                  </div>
                  <div class="bg-stone-50 border border-black/[0.03] rounded-xl px-4 py-3">
                    <div class="flex gap-1">
                      <span class="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce"></span>
                      <span class="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce delay-100"></span>
                      <span class="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 输入区域 -->
              <div class="p-3 bg-stone-50/30">
                <div class="relative">
                  <textarea
                    v-model="input"
                    @keydown="handleKeyDown"
                    placeholder="输入消息..."
                    class="w-full bg-white border border-black/5 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-200 transition-all resize-none min-h-[44px] max-h-32 custom-scrollbar"
                    rows="1"
                  />
                  <Button
                    @click="handleSend"
                    :disabled="!input.trim() || isTyping"
                    size="icon"
                    class="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    :class="input.trim() && !isTyping ? 'bg-neutral-900 hover:bg-neutral-800' : ''"
                  >
                    <Send :size="16" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>删除对话</DialogTitle>
          <DialogDescription>
            确定要删除这个对话吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">
            取消
          </Button>
          <Button variant="destructive" @click="confirmDeleteSession">
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 编辑标题对话框 -->
    <Dialog v-model:open="showEditDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>重命名对话</DialogTitle>
          <DialogDescription>
            为这个对话设置一个新标题
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input
            v-model="editDialogTitle"
            placeholder="请输入对话标题"
            @keydown.enter="confirmUpdateTitle"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditDialog = false">
            取消
          </Button>
          <Button @click="confirmUpdateTitle">
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}
</style>

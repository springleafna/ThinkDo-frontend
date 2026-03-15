<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Send, Bot, User, Trash2, Plus, MessageSquare, Clock, Pencil, Copy, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
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
import { toast } from 'vue-sonner'

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

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isTyping = ref(false)
const showTypingIndicator = ref(false)
const aiFeedback = ref<Record<number, 'up' | 'down'>>({})

const copyMessage = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('复制成功')
  } catch (error) {
    console.error('复制失败:', error)
    toast.error('复制失败')
  }
}

const setAiFeedback = (index: number, value: 'up' | 'down') => {
  aiFeedback.value[index] = value
}

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
  // 使用临时 ID 标记新会话
  const tempId = 'temp_' + Date.now()
  const newSession: ChatSession = {
    id: tempId,
    title: '新对话',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  chatSessions.value.unshift(newSession)
  currentSessionId.value = tempId
  messages.value = []
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

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const parseInlineMarkdown = (text: string) => {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>')
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return html
}

const splitTableCells = (line: string) => {
  const cleaned = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return cleaned.split('|').map(cell => cell.trim())
}

const isTableSeparatorLine = (line: string) => {
  const cells = splitTableCells(line)
  return cells.length > 1 && cells.every(cell => /^:?-{3,}:?$/.test(cell))
}

const getTableAlign = (separatorCell: string) => {
  if (separatorCell.startsWith(':') && separatorCell.endsWith(':')) return 'center'
  if (separatorCell.endsWith(':')) return 'right'
  return 'left'
}

const renderMarkdown = (text: string) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const htmlParts: string[] = []
  const paragraphLines: string[] = []
  const listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let inCodeBlock = false
  let codeFenceChar = ''
  let codeFenceLength = 0
  let codeLang = ''
  const codeLines: string[] = []

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return
    const content = paragraphLines.map(line => parseInlineMarkdown(line)).join('<br />')
    htmlParts.push(`<p>${content}</p>`)
    paragraphLines.length = 0
  }

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null
      listItems.length = 0
      return
    }
    htmlParts.push(`<${listType}>${listItems.join('')}</${listType}>`)
    listType = null
    listItems.length = 0
  }

  const flushCodeBlock = () => {
    if (!inCodeBlock) return
    const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''
    htmlParts.push(`<pre><code${langClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
    inCodeBlock = false
    codeFenceChar = ''
    codeFenceLength = 0
    codeLang = ''
    codeLines.length = 0
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index] ?? ''
    const codeFence = line.match(/^\s*([`~]{3,})\s*([^\s`~]*)\s*$/)
    if (codeFence) {
      flushParagraph()
      flushList()
      if (inCodeBlock) {
        const closeFenceChar = codeFence[1]?.[0] ?? ''
        const closeFenceLength = codeFence[1]?.length ?? 0
        if (closeFenceChar === codeFenceChar && closeFenceLength >= codeFenceLength) {
          flushCodeBlock()
        } else {
          codeLines.push(line)
        }
      } else {
        const openFence = codeFence[1] ?? '```'
        inCodeBlock = true
        codeFenceChar = openFence[0] ?? '`'
        codeFenceLength = openFence.length
        codeLang = codeFence[2] ?? ''
      }
      index += 1
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      index += 1
      continue
    }

    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushList()
      index += 1
      continue
    }

    const nextLine = lines[index + 1]?.trim() ?? ''
    if (trimmed.includes('|') && nextLine && isTableSeparatorLine(nextLine)) {
      flushParagraph()
      flushList()

      const headers = splitTableCells(trimmed)
      const separatorCells = splitTableCells(nextLine)
      const aligns = headers.map((_, cellIndex) => {
        return getTableAlign(separatorCells[cellIndex] ?? '---')
      })
      const headerHtml = headers
        .map((header, cellIndex) => `<th style="text-align:${aligns[cellIndex]}">${parseInlineMarkdown(header)}</th>`)
        .join('')

      const rowHtmlList: string[] = []
      index += 2

      while (index < lines.length) {
        const bodyLine = lines[index] ?? ''
        const bodyTrimmed = bodyLine.trim()
        if (!bodyTrimmed || !bodyTrimmed.includes('|')) break

        const cells = splitTableCells(bodyTrimmed)
        if (cells.length === 0) break

        const rowHtml = headers
          .map((_, cellIndex) => {
            const cellText = cells[cellIndex] ?? ''
            return `<td style="text-align:${aligns[cellIndex]}">${parseInlineMarkdown(cellText)}</td>`
          })
          .join('')
        rowHtmlList.push(`<tr>${rowHtml}</tr>`)
        index += 1
      }

      htmlParts.push(`<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowHtmlList.join('')}</tbody></table>`)
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const headingLevelToken = headingMatch[1] ?? '#'
      const headingText = headingMatch[2] ?? ''
      const level = headingLevelToken.length
      htmlParts.push(`<h${level}>${parseInlineMarkdown(headingText)}</h${level}>`)
      index += 1
      continue
    }

    if (/^([-*_])\1{2,}$/.test(trimmed)) {
      flushParagraph()
      flushList()
      htmlParts.push('<hr />')
      index += 1
      continue
    }

    const blockquoteMatch = trimmed.match(/^>\s?(.*)$/)
    if (blockquoteMatch) {
      flushParagraph()
      flushList()
      const blockquoteText = blockquoteMatch[1] ?? ''
      htmlParts.push(`<blockquote><p>${parseInlineMarkdown(blockquoteText)}</p></blockquote>`)
      index += 1
      continue
    }

    const unorderedMatch = trimmed.match(/^[-*+]\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      const unorderedText = unorderedMatch[1] ?? ''
      listItems.push(`<li>${parseInlineMarkdown(unorderedText)}</li>`)
      index += 1
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      const orderedText = orderedMatch[1] ?? ''
      listItems.push(`<li>${parseInlineMarkdown(orderedText)}</li>`)
      index += 1
      continue
    }

    flushList()
    paragraphLines.push(line)
    index += 1
  }

  flushParagraph()
  flushList()
  flushCodeBlock()

  return htmlParts.join('')
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

// 流式对话
const handleSend = async () => {
  if (!input.value.trim() || isTyping.value) return

  const userQuestion = input.value.trim()
  input.value = ''

  // 添加用户消息
  const userMessage: ChatMessage = {
    role: 'user',
    text: userQuestion,
    timestamp: new Date()
  }
  messages.value.push(userMessage)
  scrollToBottom()

  // 判断是否为新会话（临时 ID 或没有消息）
  const currentSession = chatSessions.value.find(s => s.id === currentSessionId.value)
  const isNewSession = !currentSessionId.value ||
                       currentSessionId.value.startsWith('temp_') ||
                       (currentSession && currentSession.messages.length === 0)

  // 用于存储完整的响应文本
  let fullResponse = ''
  let aiMessageIndex = -1

  // 开始流式输出
  isTyping.value = true
  showTypingIndicator.value = true

  try {
    // 调用流式 API
    aiChatApi.streamChat({
      question: userQuestion,
      conversationId: isNewSession ? undefined : currentSessionId.value,
      deepThinking: false
    }, {
      onMeta: (data) => {
        // 收到 meta 事件，更新会话 ID
        if (isNewSession && data.conversationId) {
          const session = chatSessions.value.find(s => s.id === currentSessionId.value)
          if (session) {
            session.id = data.conversationId
            currentSessionId.value = data.conversationId
          }
        }
      },
      onMessage: (data) => {
        // 收到消息增量
        if (data.type === 'response' && typeof data.delta === 'string') {
          fullResponse += data.delta

          // 如果还没有创建 AI 消息，先创建
          if (aiMessageIndex === -1) {
            if (!fullResponse.trim()) {
              return
            }

            const aiMessage: ChatMessage = {
              role: 'model',
              text: fullResponse,
              timestamp: new Date()
            }
            messages.value.push(aiMessage)
            aiMessageIndex = messages.value.length - 1
            showTypingIndicator.value = false
          } else {
            // 追加内容
            const msg = messages.value[aiMessageIndex]
            if (msg) {
              msg.text = fullResponse
            }
          }
          scrollToBottom()
        }
      },
      onFinish: () => {
        // 流式输出完成
        isTyping.value = false
        showTypingIndicator.value = false
      },
      onDone: () => {
        // 连接关闭，更新会话
        isTyping.value = false
        showTypingIndicator.value = false
        updateCurrentSession()
      },
      onError: (error) => {
        console.error('流式对话错误:', error)
        isTyping.value = false
        showTypingIndicator.value = false
        if (aiMessageIndex === -1) {
          const errorMsg: ChatMessage = {
            role: 'model',
            text: '抱歉，发生了错误，请重试。',
            timestamp: new Date()
          }
          messages.value.push(errorMsg)
        }
      }
    })
  } catch (error) {
    console.error('发送消息失败:', error)
    isTyping.value = false
    showTypingIndicator.value = false
    if (aiMessageIndex === -1) {
      const errorMsg: ChatMessage = {
        role: 'model',
        text: '抱歉，发送消息失败，请重试。',
        timestamp: new Date()
      }
      messages.value.push(errorMsg)
    }
  }
}

const clearChat = () => {
  if (window.confirm('确定要清空当前对话的所有内容吗？')) {
    messages.value = []
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
                      <template v-if="msg.role === 'user'">
                        <p
                          v-for="(line, idx) in msg.text.split('\n')"
                          :key="idx"
                          :class="idx > 0 ? 'mt-2' : ''"
                        >
                          {{ line }}
                        </p>
                      </template>
                      <div
                        v-else
                        class="prose prose-sm max-w-none overflow-x-auto prose-neutral prose-p:my-2 prose-headings:my-3 prose-pre:my-3 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-code:before:content-none prose-code:after:content-none prose-code:bg-neutral-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:text-neutral-700 prose-table:my-3 prose-table:w-full prose-th:border prose-th:border-neutral-300 prose-th:bg-neutral-100 prose-th:px-2 prose-th:py-1 prose-th:font-semibold prose-td:border prose-td:border-neutral-200 prose-td:px-2 prose-td:py-1"
                        v-html="renderMarkdown(msg.text)"
                      ></div>
                    </div>
                    <div
                      class="flex items-center gap-2"
                      :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
                    >
                      <p class="text-[10px] text-neutral-400">
                        {{ msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                      </p>
                      <button
                        type="button"
                        class="h-5 w-5 inline-flex items-center justify-center rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
                        @click="copyMessage(msg.text)"
                      >
                        <Copy :size="12" />
                      </button>
                      <template v-if="msg.role === 'model'">
                        <button
                          type="button"
                          class="h-5 w-5 inline-flex items-center justify-center rounded transition-colors"
                          :class="aiFeedback[i] === 'up'
                            ? 'text-emerald-600 bg-emerald-50'
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'"
                          @click="setAiFeedback(i, 'up')"
                        >
                          <ThumbsUp :size="12" />
                        </button>
                        <button
                          type="button"
                          class="h-5 w-5 inline-flex items-center justify-center rounded transition-colors"
                          :class="aiFeedback[i] === 'down'
                            ? 'text-rose-600 bg-rose-50'
                            : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'"
                          @click="setAiFeedback(i, 'down')"
                        >
                          <ThumbsDown :size="12" />
                        </button>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- 输入中状态 -->
                <div
                  v-if="isTyping && showTypingIndicator"
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

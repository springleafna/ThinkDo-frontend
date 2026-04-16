<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue'
import { Send, Bot, User, Trash2, Plus, MessageSquare, Clock, Pencil, Copy, ThumbsUp, ThumbsDown, Sparkles, Brain, Square, Search, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { useLayoutStore } from '@/stores/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { aiChatApi, type ConversationInfo, type MessageInfo } from '@/api/ai'
import { toast } from 'vue-sonner'

interface ChatMessage {
  role: 'user' | 'model'
  text: string
  thinking?: string
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
const searchKeyword = ref('')

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isTyping = ref(false)
const showTypingIndicator = ref(false)
const aiFeedback = ref<Record<number, 'up' | 'down'>>({})
const inputRef = ref<HTMLTextAreaElement>()
const enableDeepThinking = ref(false)
const currentTaskId = ref('')
const activeStreamCancel = ref<(() => void) | null>(null)
const isStopping = ref(false)
const pendingFinishTitle = ref('')
const thinkingStates = ref<Record<number, boolean>>({})
const currentStep = ref('')
const quickPrompts = [
  '帮我记录一个灵感',
  '我还有哪些任务即将截止',
  '你会什么',
  '我的知识库里关于RAG是怎么解释的'
]

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

const useQuickPrompt = (prompt: string) => {
  input.value = prompt
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleStopGenerating = async () => {
  if (!isTyping.value || isStopping.value) return

  isStopping.value = true
  try {
    if (currentTaskId.value) {
      await aiChatApi.stopTask(currentTaskId.value)
    }
    activeStreamCancel.value?.()
    activeStreamCancel.value = null
    currentTaskId.value = ''
    isTyping.value = false
    showTypingIndicator.value = false
    updateCurrentSession()
    toast.success('已停止生成')
  } catch (error) {
    console.error('停止对话失败:', error)
    toast.error('停止失败，请重试')
  } finally {
    isStopping.value = false
  }
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
  currentSessionId.value = ''
  messages.value = []
  showTypingIndicator.value = false
  pendingFinishTitle.value = ''
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
  // 手动解析时间，确保作为本地时间处理
  const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
  if (parts && parts.length >= 7) {
    return new Date(
      parseInt(parts[1] || '0'),      // year
      parseInt(parts[2] || '0') - 1,  // month (0-based)
      parseInt(parts[3] || '0'),      // day
      parseInt(parts[4] || '0'),      // hour
      parseInt(parts[5] || '0'),      // minute
      parseInt(parts[6] || '0')       // second
    )
  }
  return new Date(dateStr)
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
  const processed: Record<string, string> = {}
  let placeholderIndex = 0
  const getPlaceholder = () => `__PLACEHOLDER_${placeholderIndex++}__`

  let html = text
  // 先处理图片，用占位符替换
  html = html.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (match, alt, url) => {
    const tag = `<img src="${url}" alt="${escapeHtml(alt)}" class="max-w-full h-auto rounded-md my-2" loading="lazy" />`
    const placeholder = getPlaceholder()
    processed[placeholder] = tag
    return placeholder
  })
  // 先处理链接，用占位符替换
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
    const tag = `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkText)}</a>`
    const placeholder = getPlaceholder()
    processed[placeholder] = tag
    return placeholder
  })
  // 对剩余内容进行HTML转义
  html = escapeHtml(html)
  // 恢复占位符
  html = html.replace(/__PLACEHOLDER_(\d+)__/g, (_, idx) => processed[`__PLACEHOLDER_${idx}__`] || _)
  // 处理代码
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
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

    // 首次问答完成后，为新会话更新标题
    if (session.title === '新对话' && pendingFinishTitle.value.trim()) {
      session.title = pendingFinishTitle.value.trim()
      pendingFinishTitle.value = ''
    } else {
      const firstUserMessage = messages.value.find(m => m.role === 'user')
      const hasModelReply = messages.value.some(m => m.role === 'model' && m.text.trim().length > 0)
      if (session.title === '新对话' && firstUserMessage && hasModelReply) {
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
  pendingFinishTitle.value = ''

  if (!currentSessionId.value) {
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
  }

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
  let fullThinking = ''
  let aiMessageIndex = -1

  // 开始流式输出
  isTyping.value = true
  showTypingIndicator.value = true
  currentStep.value = ''

  try {
    // 调用流式 API
    activeStreamCancel.value = aiChatApi.streamChat({
      question: userQuestion,
      conversationId: isNewSession ? undefined : currentSessionId.value,
      deepThinking: enableDeepThinking.value
    }, {
      onStep: (data) => {
        currentStep.value = data.message
      },
      onMeta: (data) => {
        currentTaskId.value = data.taskId || currentTaskId.value
        // 收到 meta 事件，更新会话 ID
        if (isNewSession && data.conversationId) {
          const session = chatSessions.value.find(s => s.id === currentSessionId.value)
          if (session) {
            session.id = data.conversationId
            currentSessionId.value = data.conversationId
          }
        }
      },
      onThink: (data) => {
        // 收到思考增量
        if (data.type === 'think' && typeof data.delta === 'string') {
          fullThinking += data.delta
          currentStep.value = ''

          // 如果还没有创建 AI 消息，先创建（用于显示思考中）
          if (aiMessageIndex === -1) {
            const aiMessage: ChatMessage = {
              role: 'model',
              text: '',
              thinking: fullThinking,
              timestamp: new Date()
            }
            messages.value.push(aiMessage)
            aiMessageIndex = messages.value.length - 1
            showTypingIndicator.value = false
          } else {
            // 更新思考内容
            const msg = messages.value[aiMessageIndex]
            if (msg) {
              msg.thinking = fullThinking
            }
          }
          scrollToBottom()
        }
      },
      onMessage: (data) => {
        // 收到消息增量
        if (data.type === 'response' && typeof data.delta === 'string') {
          fullResponse += data.delta
          currentStep.value = ''

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
      onFinish: (data) => {
        currentStep.value = ''
        if (data.title?.trim()) {
          pendingFinishTitle.value = data.title.trim()
        }
        // 流式输出完成
        isTyping.value = false
        showTypingIndicator.value = false
      },
      onDone: () => {
        // 连接关闭，更新会话
        currentStep.value = ''
        isTyping.value = false
        showTypingIndicator.value = false
        activeStreamCancel.value = null
        currentTaskId.value = ''
        isStopping.value = false
        updateCurrentSession()
      },
      onError: (error) => {
        console.error('流式对话错误:', error)
        currentStep.value = ''
        isTyping.value = false
        showTypingIndicator.value = false
        activeStreamCancel.value = null
        currentTaskId.value = ''
        isStopping.value = false
        pendingFinishTitle.value = ''
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
    currentStep.value = ''
    isTyping.value = false
    showTypingIndicator.value = false
    activeStreamCancel.value = null
    currentTaskId.value = ''
    isStopping.value = false
    pendingFinishTitle.value = ''
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

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 格式化时间
const formatTime = (date: Date) => {
  const now = new Date()
  // 将两个时间都设置为0点，只比较日期部分
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = today.getTime() - messageDay.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    // 今天：显示时间
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    // 昨天：显示昨天 + 时间
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days < 7) {
    // 7天内：显示星期 + 时间
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()] + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    // 更早：显示年月日 + 时间
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    // 如果是今年，不显示年份
    if (year === now.getFullYear()) {
      return `${month}-${day} ${time}`
    } else {
      return `${year}-${month}-${day} ${time}`
    }
  }
}

// 过滤后的会话列表
const filteredSessions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return chatSessions.value
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return chatSessions.value.filter(session =>
    session.title.toLowerCase().includes(keyword)
  )
})
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <!-- 主内容区域 -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- 顶栏 -->
      <AppHeader :active-view="activeView" />

      <!-- 下方对话区域 -->
      <div class="flex-1 flex min-h-0 overflow-hidden ml-2 mr-2 mb-2">
        <!-- 左侧对话列表侧栏 -->
        <aside class="w-64 max-h-[570px] mt-16 border-r border-black/5 bg-white/70 backdrop-blur-sm flex flex-col shrink-0 rounded-xl shadow-sm overflow-hidden">
        <!-- 侧栏头部 -->
        <div class="px-3 pt-3 pb-2">
          <Button
            @click="createNewSession"
            class="w-full gap-2 h-9 rounded-xl font-medium text-sm"
          >
            <Plus :size="16" />
            新建对话
          </Button>
        </div>

        <!-- 搜索框 -->
        <div class="px-4 py-2">
          <div class="relative">
            <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              v-model="searchKeyword"
              placeholder="搜索对话..."
              class="pl-9 h-8 text-sm bg-stone-50/80 border-black/5 rounded-lg focus:bg-white"
            />
          </div>
        </div>

        <!-- 对话列表 -->
        <ScrollArea class="flex-1 min-h-0 overflow-hidden px-3">
          <div class="space-y-0.5 py-1">
            <!-- 有会话时显示列表 -->
            <template v-if="filteredSessions.length > 0">
              <button
                v-for="session in filteredSessions"
                :key="session.id"
                @click="switchSession(session.id)"
                class="w-full group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all text-left"
                :class="currentSessionId === session.id
                  ? 'bg-zinc-100 shadow-sm'
                  : 'hover:bg-stone-50'"
              >
                <div class="flex items-center gap-2.5">
                  <MessageSquare :size="14" class="shrink-0" :class="currentSessionId === session.id ? 'text-zinc-700' : 'text-neutral-300'" />
                  <div class="flex-1 min-w-0">
                    <p
                      class="text-[13px] truncate leading-snug"
                      :class="currentSessionId === session.id ? 'font-semibold text-neutral-900' : 'text-neutral-600'"
                    >
                      {{ session.title }}
                    </p>
                    <p class="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1">
                      <Clock :size="10" />
                      {{ formatTime(session.updatedAt) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      @click.stop="openEditDialog(session.id)"
                      class="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-white rounded-md"
                      title="重命名"
                    >
                      <Pencil :size="12" />
                    </button>
                    <button
                      @click.stop="openDeleteDialog(session.id)"
                      class="p-1 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-md"
                      title="删除对话"
                    >
                      <Trash2 :size="12" />
                    </button>
                  </div>
                </div>
              </button>
            </template>

            <!-- 无搜索结果时显示提示 -->
            <div v-else-if="searchKeyword.trim()" class="flex flex-col items-center justify-center py-12 text-neutral-400">
              <Search :size="32" class="mb-2 opacity-50" />
              <p class="text-xs">未找到匹配的对话</p>
            </div>

            <!-- 无会话时显示提示 -->
            <div v-else class="flex flex-col items-center justify-center py-12 text-neutral-400">
              <MessageSquare :size="32" class="mb-2 opacity-50" />
              <p class="text-xs">暂无对话</p>
            </div>
          </div>
        </ScrollArea>

      </aside>

      <!-- 右侧聊天主区域 -->
      <div class="flex-1 flex flex-col min-w-0 mr-2 my-2">
        <!-- 聊天头部 -->
        <div class="h-14 border-b border-black/5 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-semibold text-neutral-800">
              {{ currentSessionId ? (chatSessions.find(s => s.id === currentSessionId)?.title || '新对话') : '新对话' }}
            </h3>
            <Badge v-if="enableDeepThinking" variant="secondary" class="text-[10px] h-5 gap-1 bg-blue-50 text-blue-700 border-blue-200/50">
              <Brain :size="10" />
              深度思考
            </Badge>
          </div>
        </div>

        <!-- 消息区域 -->
        <div
          ref="scrollRef"
          class="flex-1 overflow-y-auto custom-scrollbar"
        >
          <!-- 空状态：欢迎页面 -->
          <div
            v-if="messages.length === 0"
            class="h-full flex flex-col items-center justify-center px-10"
          >
            <div class="w-full max-w-3xl text-center">
              <!-- Hero 文字 -->
              <div class="mb-2">
                <Badge variant="outline" class="text-xs px-3 py-1 gap-1.5 border-dashed">
                  <Sparkles :size="12" class="text-zinc-500" />
                  <span class="text-zinc-500">AI 智能对话</span>
                </Badge>
              </div>
              <h1 class="text-3xl font-bold text-neutral-900 tracking-tight mt-4">
                把问题变成<span class="bg-gradient-to-r from-zinc-800 to-zinc-500 bg-clip-text text-transparent">清晰答案</span>
              </h1>
              <p class="text-sm text-neutral-400 mt-3 max-w-md mx-auto leading-relaxed">
                工具调用、知识检索与深度思考，一次对话给出准确回答
              </p>

              <!-- 输入框 -->
              <div class="mt-8 max-w-2xl mx-auto">
                <div class="relative rounded-2xl border border-black/[0.06] bg-white shadow-lg shadow-black/[0.03] overflow-hidden transition-all focus-within:shadow-xl focus-within:border-black/10">
                  <textarea
                    ref="inputRef"
                    v-model="input"
                    @keydown="handleKeyDown"
                    placeholder="输入你的问题..."
                    class="w-full bg-transparent px-5 pt-4 pb-12 text-sm focus:outline-none resize-none min-h-[100px] custom-scrollbar"
                    rows="3"
                  />
                  <div class="absolute left-4 bottom-3 flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            type="button"
                            class="h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1.5 transition-all"
                            :class="enableDeepThinking
                              ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                              : 'text-neutral-400 hover:text-neutral-600 hover:bg-stone-50'"
                            @click="enableDeepThinking = !enableDeepThinking"
                          >
                            <Brain :size="13" />
                            <span class="hidden sm:inline">深度思考</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>启用深度思考</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button
                    @click="isTyping ? handleStopGenerating() : handleSend()"
                    :disabled="isTyping ? isStopping : !input.trim()"
                    size="icon"
                    class="absolute right-3 bottom-3 h-9 w-9 rounded-xl transition-all"
                    :class="isTyping
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : (input.trim() ? 'bg-zinc-900 hover:bg-zinc-800 shadow-md' : 'bg-zinc-100 text-zinc-400')"
                  >
                    <Square v-if="isTyping" :size="14" />
                    <Send v-else :size="16" />
                  </Button>
                </div>
                <p class="text-[11px] text-neutral-300 mt-2.5 text-center">
                  Enter 发送 · Shift + Enter 换行
                </p>
              </div>

              <!-- 试试这些开场 -->
              <div class="mt-8">
                <p class="text-xs text-neutral-400 mb-3 font-medium">试试这些开场</p>
                <div class="grid grid-cols-2 gap-2.5 max-w-2xl mx-auto">
                  <button
                    v-for="(prompt, idx) in quickPrompts"
                    :key="idx"
                    type="button"
                    class="group rounded-xl border border-black/[0.04] bg-white/80 px-4 py-3 text-left text-sm text-neutral-600 transition-all hover:border-zinc-200 hover:bg-white hover:shadow-sm hover:text-neutral-800"
                    @click="useQuickPrompt(prompt)"
                  >
                    <span class="flex items-center justify-between gap-2">
                      <span>{{ prompt }}</span>
                      <ChevronRight :size="14" class="shrink-0 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                    </span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- 消息列表 -->
          <div v-else class="max-w-4xl mx-auto px-8 py-6 space-y-6">
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="flex gap-3"
              :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
            >
              <!-- 头像 -->
              <Avatar class="h-8 w-8 shrink-0 border border-black/5" :class="msg.role === 'user' ? '' : ''">
                <AvatarFallback
                  :class="msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-stone-50 text-zinc-500'"
                >
                  <User v-if="msg.role === 'user'" :size="14" />
                  <Bot v-else :size="14" />
                </AvatarFallback>
              </Avatar>
              <div
                class="max-w-[80%] space-y-1.5"
                :class="msg.role === 'user' ? 'text-right' : ''"
              >
                <div
                  class="rounded-2xl px-4 py-3 text-sm leading-relaxed inline-block text-left"
                  :class="msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-tr-md'
                    : 'bg-white text-neutral-800 border border-black/[0.04] shadow-sm rounded-tl-md'"
                >
                  <!-- 思考过程展示 -->
                  <template v-if="msg.role === 'model' && msg.thinking">
                    <Collapsible v-model:open="thinkingStates[i]" class="mb-3">
                      <CollapsibleTrigger
                        class="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors w-full text-left"
                      >
                        <Brain :size="13" />
                        <span>深度思考过程</span>
                        <component
                          :is="thinkingStates[i] ? ChevronDown : ChevronRight"
                          :size="12"
                          class="shrink-0 transition-transform duration-200"
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent class="mt-2">
                        <div class="bg-blue-50/50 rounded-lg px-3 py-2 text-xs text-blue-900/80 leading-relaxed border border-blue-200/50">
                          <div
                            class="prose prose-xs max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:my-2 prose-pre:overflow-x-auto prose-pre:rounded-md prose-pre:bg-blue-900/10 prose-pre:text-blue-900 prose-pre:px-2 prose-pre:py-1 prose-code:bg-blue-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-blue-800 prose-code:before:content-none prose-code:after:content-none prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
                            v-html="renderMarkdown(msg.thinking)"
                          ></div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </template>

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
                <!-- 消息操作栏 -->
                <div
                  class="flex items-center gap-1.5"
                  :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <span class="text-[10px] text-neutral-300">
                    {{ formatTime(msg.timestamp) }}
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          type="button"
                          class="h-6 w-6 inline-flex items-center justify-center rounded-md text-neutral-300 hover:text-neutral-500 hover:bg-stone-50 transition-colors"
                          @click="copyMessage(msg.text)"
                        >
                          <Copy :size="12" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>复制</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <!-- TODO: 下方是点赞和点踩按钮用于反馈AI回答的效果，暂时注释 -->
                  <!-- <template v-if="msg.role === 'model'">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            type="button"
                            class="h-6 w-6 inline-flex items-center justify-center rounded-md transition-colors"
                            :class="aiFeedback[i] === 'up'
                              ? 'text-emerald-500 bg-emerald-50'
                              : 'text-neutral-300 hover:text-neutral-500 hover:bg-stone-50'"
                            @click="setAiFeedback(i, 'up')"
                          >
                            <ThumbsUp :size="12" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>有帮助</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            type="button"
                            class="h-6 w-6 inline-flex items-center justify-center rounded-md transition-colors"
                            :class="aiFeedback[i] === 'down'
                              ? 'text-rose-500 bg-rose-50'
                              : 'text-neutral-300 hover:text-neutral-500 hover:bg-stone-50'"
                            @click="setAiFeedback(i, 'down')"
                          >
                            <ThumbsDown :size="12" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>需改进</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </template> -->
                </div>
              </div>
            </div>

            <!-- 输入中状态 -->
            <div
              v-if="isTyping && showTypingIndicator"
              class="flex gap-3"
            >
              <Avatar class="h-8 w-8 border border-black/5">
                <AvatarFallback class="bg-stone-50 text-zinc-400">
                  <Bot :size="14" />
                </AvatarFallback>
              </Avatar>
              <div class="bg-white border border-black/[0.04] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div v-if="currentStep" class="flex items-center gap-2 text-sm text-neutral-500">
                  <div class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                    <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-100"></span>
                    <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-200"></span>
                  </div>
                  <span>{{ currentStep }}</span>
                </div>
                <div v-else class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-100"></span>
                  <span class="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce delay-200"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部输入区域 (有消息时显示) -->
        <div v-if="messages.length > 0" class="border-t border-black/[0.04] px-8 py-3">
          <div class="max-w-4xl mx-auto">
            <div class="relative rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden focus-within:shadow-md focus-within:border-black/10 transition-all">
              <textarea
                ref="inputRef"
                v-model="input"
                @keydown="handleKeyDown"
                placeholder="输入你的问题..."
                class="w-full bg-transparent px-4 pt-3 pb-12 text-sm focus:outline-none resize-none min-h-[80px] max-h-40 custom-scrollbar"
                rows="2"
              />
              <div class="absolute left-3 bottom-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  class="h-7 px-2 rounded-lg text-xs inline-flex items-center gap-1 transition-all"
                  :class="enableDeepThinking
                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                    : 'text-neutral-400 hover:text-neutral-600 hover:bg-stone-50'"
                  @click="enableDeepThinking = !enableDeepThinking"
                >
                  <Brain :size="12" />
                  <span class="hidden sm:inline">深度思考</span>
                </button>
              </div>
              <Button
                @click="isTyping ? handleStopGenerating() : handleSend()"
                :disabled="isTyping ? isStopping : !input.trim()"
                size="icon"
                class="absolute right-2.5 bottom-2.5 h-8 w-8 rounded-xl transition-all"
                :class="isTyping
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : (input.trim() ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-zinc-100 text-zinc-400')"
              >
                <Square v-if="isTyping" :size="14" />
                <Send v-else :size="15" />
              </Button>
            </div>
            <p class="text-[10px] text-neutral-300 mt-1.5 text-center">
              Enter 发送 · Shift + Enter 换行
            </p>
          </div>
        </div>
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
  background: rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

textarea {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.08) transparent;
}

textarea::-webkit-scrollbar {
  width: 3px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
}

.delay-100 {
  animation-delay: 100ms;
}

.delay-200 {
  animation-delay: 200ms;
}

.animate-pulse.delay-100 {
  animation: pulse 1.5s ease-in-out infinite;
  animation-delay: 100ms;
}

.animate-pulse.delay-200 {
  animation: pulse 1.5s ease-in-out infinite;
  animation-delay: 200ms;
}
</style>

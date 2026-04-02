import { request } from '@/utils/request'

// 会话信息响应
export interface ConversationInfo {
  conversationId: string
  userId: number
  title: string
  summary?: string
  createdAt: string
  updatedAt: string
}

// 消息信息响应
export interface MessageInfo {
  id: number
  conversationId: number
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
}

// 更新会话请求参数
export interface UpdateConversationParams {
  conversationId: string
  title: string
}

// 流式对话参数
export interface StreamChatParams {
  question: string
  conversationId?: string
  deepThinking?: boolean
}

// SSE 事件类型
export type SseEventType = 'meta' | 'message' | 'finish' | 'done'

// SSE meta 事件数据
export interface SseMetaData {
  conversationId: string
  taskId: string
}

// SSE message 事件数据
export interface SseMessageData {
  type: 'response' | 'think'
  delta: string
}

// SSE finish 事件数据
export interface SseFinishData {
  messageId: string
  title?: string
}

// SSE 事件
export interface SseEvent<T = any> {
  event: SseEventType
  data: T
}

// SSE 回调函数
export interface SseCallbacks {
  onMeta?: (data: SseMetaData) => void
  onMessage?: (data: SseMessageData) => void
  onThink?: (data: SseMessageData) => void
  onFinish?: (data: SseFinishData) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

// AI 聊天相关 API
export const aiChatApi = {
  /**
   * 获取会话列表
   * GET /ai/chat/list
   */
  getConversationList() {
    return request.get<ConversationInfo[]>('/ai/chat/list')
  },

  /**
   * 根据会话ID获取历史消息
   * GET /ai/chat/messages/{conversationId}
   */
  getMessagesByConversationId(conversationId: string) {
    return request.get<MessageInfo[]>(`/ai/chat/messages/${conversationId}`)
  },

  /**
   * 修改会话名称
   * PUT /ai/chat/update
   */
  updateConversation(data: UpdateConversationParams) {
    return request.put<void>('/ai/chat/update', data)
  },

  /**
   * 删除会话
   * DELETE /ai/chat/delete/{conversationId}
   */
  deleteConversation(conversationId: string) {
    return request.delete<void>(`/ai/chat/delete/${conversationId}`)
  },

  /**
   * 停止指定的对话任务
   * POST /ai/chat/stop
   */
  stopTask(taskId: string) {
    return request.post<void>('/ai/chat/stop', undefined, {
      params: { taskId }
    })
  },

  /**
   * 流式对话 (SSE)
   * GET /ai/chat/sse
   */
  streamChat(params: StreamChatParams, callbacks: SseCallbacks): () => void {
    const { onMeta, onMessage, onThink, onFinish, onDone, onError } = callbacks

    // 构建 URL 参数
    const urlParams = new URLSearchParams({
      question: params.question,
      deepThinking: String(params.deepThinking ?? false)
    })

    if (params.conversationId) {
      urlParams.append('conversationId', params.conversationId)
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${baseURL}/ai/chat/rag?${urlParams.toString()}`

    // 使用 fetch 处理 SSE
    const abortController = new AbortController()

    fetch(url, {
      signal: abortController.signal,
      headers: {
        'Accept': 'text/event-stream',
        'token': localStorage.getItem('token') || ''
      }
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Response body is null')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let doneCalled = false

        const emitEvent = (eventType: SseEventType | null, data: string) => {
          if (!eventType) return

          if (eventType === 'done') {
            if (!doneCalled) {
              doneCalled = true
              onDone?.()
            }
            return
          }

          if (!data || data === '[DONE]') return

          try {
            switch (eventType) {
              case 'meta':
                onMeta?.(JSON.parse(data))
                break
              case 'message': {
                const messageData = JSON.parse(data) as SseMessageData
                if (messageData.type === 'think') {
                  onThink?.(messageData)
                } else {
                  onMessage?.(messageData)
                }
                break
              }
              case 'finish':
                onFinish?.(JSON.parse(data))
                break
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e, data)
          }
        }

        const processEventBlock = (eventBlock: string) => {
          if (!eventBlock.trim()) return

          let currentEvent: SseEventType | null = null
          const dataLines: string[] = []

          for (const rawLine of eventBlock.split('\n')) {
            const line = rawLine.trimEnd()
            if (!line) continue

            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim() as SseEventType
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5).trimStart())
            }
          }

          emitEvent(currentEvent, dataLines.join('\n'))
        }

        const processBuffer = () => {
          const blocks = buffer.split('\n\n')
          buffer = blocks.pop() || ''

          for (const block of blocks) {
            processEventBlock(block)
          }
        }

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            buffer += decoder.decode()
            processBuffer()
            processEventBlock(buffer)
            buffer = ''
            if (!doneCalled) {
              doneCalled = true
              onDone?.()
            }
            break
          }

          buffer += decoder.decode(value, { stream: true })
          processBuffer()
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          onError?.(error)
        }
      })

    // 返回取消函数
    return () => abortController.abort()
  }
}

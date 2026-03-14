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
  }
}

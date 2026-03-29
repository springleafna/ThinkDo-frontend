import { request } from '@/utils/request'

// 意图节点树响应
export interface IntentNodeTree {
  id: string
  intentCode: string
  name: string
  scope: string
  level: number
  parentCode: string | null
  description: string
  examples: string | null
  collectionName: string | null
  topK: number | null
  kind: number
  sortOrder: number
  enabled: number
  mcpToolId: string | null
  promptSnippet: string | null
  promptTemplate: string | null
  paramPromptTemplate: string | null
  children: IntentNodeTree[]
}

// 创建意图节点请求参数
export interface CreateIntentNodeParams {
  kbId?: number
  intentCode: string
  scope?: string
  name: string
  level: number
  parentCode?: string | null
  description?: string
  examples?: string[]
  collectionName?: string
  mcpToolId?: string
  topK?: number
  kind: number
  sortOrder?: number
  promptSnippet?: string
  promptTemplate?: string
  paramPromptTemplate?: string
}

// 编辑意图节点请求参数
export interface UpdateIntentNodeParams {
  id: string | number
  name?: string
  description?: string
  examples?: string
  mcpToolId?: string
  topK?: number | null
  sortOrder?: number
  promptSnippet?: string
  promptTemplate?: string
  paramPromptTemplate?: string
}

// 分页查询请求参数
export interface IntentNodePageParams {
  current?: number
  size?: number
  keyword?: string
  level?: number
  kind?: number
  enabled?: number
}

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 意图类型映射
export const IntentKindMap: Record<number, string> = {
  0: 'KB',
  1: 'SYSTEM',
  2: 'MCP'
}

// 意图层级映射
export const IntentLevelMap: Record<number, string> = {
  0: 'DOMAIN',
  1: 'CATEGORY',
  2: 'TOPIC'
}

export const intentNodeApi = {
  /**
   * 获取整棵意图树
   * GET /intent-tree
   */
  getFullTree() {
    return request.get<IntentNodeTree[]>('/intent-tree')
  },

  /**
   * 分页查询意图节点列表
   * GET /intent-node
   */
  pageQuery(params: IntentNodePageParams) {
    return request.get<PageResult<IntentNodeTree>>('/intent-node', { params })
  },

  /**
   * 创建意图节点
   * POST /intent-node
   */
  create(data: CreateIntentNodeParams) {
    return request.post<void>('/intent-node', data)
  },

  /**
   * 编辑意图节点
   * PUT /intent-node
   */
  update(data: UpdateIntentNodeParams) {
    return request.put<void>('/intent-node', data)
  },

  /**
   * 删除意图节点（级联删除子节点）
   * DELETE /intent-node/{id}
   */
  delete(id: string | number) {
    return request.delete<void>(`/intent-node/${id}`)
  },

  /**
   * 启用/禁用意图节点
   * PUT /intent-node/{id}/toggle-enabled
   */
  toggleEnabled(id: string | number) {
    return request.put<void>(`/intent-node/${id}/toggle-enabled`)
  }
}

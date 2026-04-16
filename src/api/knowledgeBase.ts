import { request, type RequestConfig } from '@/utils/request'

// 创建知识库请求参数
export interface CreateKnowledgeBaseParams {
  name: string
  embeddingModel: string
  description?: string
}

// 更新知识库请求参数
export interface UpdateKnowledgeBaseParams {
  name?: string
  description?: string
}

// 知识库信息
export interface KnowledgeBase {
  id: string
  name: string
  scope: string
  embeddingModel: string
  description?: string
  collectionName?: string
  documentCount: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 分页查询参数
export interface KnowledgeBasePageParams {
  current?: number
  size?: number
  name?: string
}

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 知识库统计信息
export interface KnowledgeStatistics {
  baseCount: number
  documentCount: number
}

// 知识库相关 API
export const knowledgeBaseApi = {
  /**
   * 创建知识库
   * POST /knowledge-base
   */
  create(data: CreateKnowledgeBaseParams) {
    return request.post<string>('/knowledge-base', data)
  },

  /**
   * 更新知识库（名称或描述）
   * PUT /knowledge-base/{kb-id}
   */
  update(kbId: string, data: UpdateKnowledgeBaseParams, config?: RequestConfig) {
    return request.put<void>(`/knowledge-base/${kbId}`, data, config)
  },

  /**
   * 删除知识库
   * DELETE /knowledge-base/{kb-id}
   */
  delete(kbId: string) {
    return request.delete<void>(`/knowledge-base/${kbId}`)
  },

  /**
   * 查询知识库详情
   * GET /knowledge-base/{kb-id}
   */
  getById(kbId: string) {
    return request.get<KnowledgeBase>(`/knowledge-base/${kbId}`)
  },

  /**
   * 分页查询知识库列表
   * GET /knowledge-base
   */
  getPage(params?: KnowledgeBasePageParams) {
    return request.get<PageResult<KnowledgeBase>>('/knowledge-base', { params })
  },

  /**
   * 获取所有知识库列表（使用大页码）
   * GET /knowledge-base
   */
  getList(params?: Omit<KnowledgeBasePageParams, 'current' | 'size'>) {
    return request.get<PageResult<KnowledgeBase>>('/knowledge-base', {
      params: { ...params, current: 1, size: 1000 }
    })
  },

  /**
   * 获取知识库统计信息
   * GET /knowledge-base/statistics
   */
  getStatistics() {
    return request.get<KnowledgeStatistics>('/knowledge-base/statistics')
  }
}

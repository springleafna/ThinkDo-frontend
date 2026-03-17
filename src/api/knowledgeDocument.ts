import { request } from '@/utils/request'

// 上传文档请求参数
export interface UploadDocumentParams {
  sourceType: 'file' | 'url'
  sourceLocation?: string
}

// 更新文档请求参数
export interface UpdateDocumentParams {
  docName?: string
  enabled?: number
  status?: string
  chunkCount?: number
}

// 文档信息
export interface KnowledgeDocument {
  id: string
  kbId: number
  docName: string
  sourceType: string
  sourceLocation: string
  scheduleEnabled: number
  scheduleCron: string
  enabled: boolean
  chunkCount: number
  fileUrl: string
  fileType: string
  fileSize: number
  chunkStrategy: string
  processMode: string
  chunkConfig: string
  pipelineId: string
  status: string
  createdBy: number
  updatedBy: number
  createdAt: string
  updatedAt: string
}

// 分页查询参数
export interface DocumentPageParams {
  pageNo?: number
  pageSize?: number
  status?: string
  keyword?: string
}

// 分页响应
export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 文档搜索返回
export interface DocumentSearchResult {
  id: string
  kbId: number
  docName: string
  kbName: string
}

// 知识库文档相关 API
export const knowledgeDocumentApi = {
  /**
   * 上传文档
   * POST /knowledge-base/{kb-id}/docs/upload
   */
  upload(kbId: string, params: UploadDocumentParams, file?: File) {
    const formData = new FormData()
    formData.append('sourceType', params.sourceType)
    if (params.sourceLocation) {
      formData.append('sourceLocation', params.sourceLocation)
    }
    if (file) {
      formData.append('file', file)
    }
    return request.upload<KnowledgeDocument>(`/knowledge-base/${kbId}/docs/upload`, formData)
  },

  /**
   * 删除文档
   * DELETE /knowledge-base/docs/{doc-id}
   */
  delete(docId: string) {
    return request.delete<void>(`/knowledge-base/docs/${docId}`)
  },

  /**
   * 查询文档详情
   * GET /knowledge-base/docs/{docId}
   */
  get(docId: string) {
    return request.get<KnowledgeDocument>(`/knowledge-base/docs/${docId}`)
  },

  /**
   * 更新文档信息
   * PUT /knowledge-base/docs/{docId}
   */
  update(docId: string, data: UpdateDocumentParams) {
    return request.put<void>(`/knowledge-base/docs/${docId}`, data)
  },

  /**
   * 分页查询文档列表
   * GET /knowledge-base/{kb-id}/docs
   */
  getPage(kbId: string, params?: DocumentPageParams) {
    return request.get<PageResult<KnowledgeDocument>>(`/knowledge-base/${kbId}/docs`, { params })
  },

  /**
   * 搜索文档
   * GET /knowledge-base/docs/search
   */
  search(keyword?: string, limit: number = 8) {
    return request.get<DocumentSearchResult[]>('/knowledge-base/docs/search', {
      params: { keyword, limit }
    })
  },

  /**
   * 启用/禁用文档
   * PATCH /knowledge-base/docs/{docId}/enable
   */
  enable(docId: string, enabled: boolean) {
    return request.patch<void>(`/knowledge-base/docs/${docId}/enable`, null, {
      params: { value: enabled }
    })
  },

  /**
   * 开始分块：抽取文本 -> 分块 -> 嵌入并写入向量库
   * POST /knowledge-base/docs/{doc-id}/chunk
   */
  startChunk(docId: string) {
    return request.post<void>(`/knowledge-base/docs/${docId}/chunk`)
  }
}

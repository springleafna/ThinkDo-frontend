import { request } from '@/utils/request'

// 上传文档请求参数
export interface UploadDocumentParams {
  sourceType: 'file' | 'url'
  sourceLocation?: string
  // 分块策略：fixed_size / structure_aware
  chunkStrategy?: 'fixed_size' | 'structure_aware'
  // 分块参数JSON（可选，优先于下面字段）
  chunkConfig?: string
  // 固定大小分块：块大小
  chunkSize?: number
  // 固定大小分块：重叠大小
  overlapSize?: number
  // 结构感知：理想块大小
  targetChars?: number
  // 结构感知：块上限
  maxChars?: number
  // 结构感知：块下限
  minChars?: number
  // 结构感知：重叠大小
  overlapChars?: number
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

// 分块日志信息
export interface ChunkLog {
  id: string
  docId: string
  status: string
  chunkStrategy: string
  extractDuration: number | null
  chunkDuration: number | null
  embeddingDuration: number | null
  otherDuration: number | null
  totalDuration: number | null
  chunkCount: number | null
  errorMessage: string | null
  startTime: string | null
  endTime: string | null
  createdAt: string
}

// 分块详情
export interface KnowledgeChunk {
  id: string
  kbId: string
  docId: string
  chunkIndex: number
  content: string
  contentHash: string
  charCount: number | null
  tokenCount: number | null
  enabled: number
  createTime: string | null
  updateTime: string | null
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
    if (params.chunkStrategy) {
      formData.append('chunkStrategy', params.chunkStrategy)
    }
    if (params.chunkConfig) {
      formData.append('chunkConfig', params.chunkConfig)
    }
    if (params.chunkSize !== undefined) {
      formData.append('chunkSize', String(params.chunkSize))
    }
    if (params.overlapSize !== undefined) {
      formData.append('overlapSize', String(params.overlapSize))
    }
    if (params.targetChars !== undefined) {
      formData.append('targetChars', String(params.targetChars))
    }
    if (params.maxChars !== undefined) {
      formData.append('maxChars', String(params.maxChars))
    }
    if (params.minChars !== undefined) {
      formData.append('minChars', String(params.minChars))
    }
    if (params.overlapChars !== undefined) {
      formData.append('overlapChars', String(params.overlapChars))
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
  },

  /**
   * 查询文档分块日志
   * GET /knowledge-base/docs/{docId}/chunk-logs
   */
  getChunkLogs(docId: string) {
    return request.get<ChunkLog[]>(`/knowledge-base/docs/${docId}/chunk-logs`)
  },

  /**
   * 查询文档分块详情列表
   * GET /knowledge-base/docs/{docId}/chunks
   */
  getChunks(docId: string) {
    return request.get<KnowledgeChunk[]>(`/knowledge-base/docs/${docId}/chunks`)
  }
}

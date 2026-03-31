import { request } from '@/utils/request'

export type AiAction = 'POLISH' | 'EXPAND' | 'CORRECT' | 'FORMAT'

export interface AiOptions {
  tone?: string
  targetLength?: string
  language?: string
  preserveMarkup?: boolean
}

export interface AiTransformReq {
  action: AiAction
  text: string
  options?: AiOptions
  context?: string
}

export interface AiStreamChunkResp {
  delta: string | null
  done: boolean
  isHtml: boolean | null
}

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || '/api'
const AI_STREAM_PATH = '/note/ai/transform/stream'

export async function streamAiTransform(
  req: AiTransformReq,
  onDelta: (delta: string) => void,
  onDone: (isHtml: boolean) => void,
  signal?: AbortSignal,
): Promise<void> {
  const url = API_BASE + AI_STREAM_PATH
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      ...(token ? { token } : {}),
    },
    body: JSON.stringify(req),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`AI接口请求失败: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const events = buffer.split('\n\n')
    buffer = events.pop() || ''

    for (const raw of events) {
      const lines = raw.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const json = line.slice(5).trim()
        if (!json) continue
        try {
          const obj = JSON.parse(json) as AiStreamChunkResp
          if (obj.done) {
            onDone(Boolean(obj.isHtml))
          } else if (obj.delta) {
            onDelta(obj.delta)
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}

// 创建笔记请求参数
export interface CreateNoteParams {
  title: string
  content: string
  categoryId?: number
  tags?: string
}

// 更新笔记请求参数
export interface UpdateNoteParams {
  id: number
  title?: string
  content?: string
  categoryId?: number
  tags?: string
}

// 笔记信息
export interface Note {
  id: number
  title: string
  content: string
  categoryId?: number
  categoryName?: string
  tags?: string
  favorited: number
  createdAt: string
  updatedAt: string
}

// 笔记列表项信息
export interface NoteListItem {
  id: number
  title: string
  preview: string
  categoryId?: number
  categoryName?: string
  tags?: string
  favorited: number
  createdAt: string
  updatedAt: string
}

// 笔记查询参数
export interface NoteQueryParams {
  categoryId?: number
  keyword?: string
  favorited?: number
}

// 分类统计信息
export interface CategoryCount {
  categoryId: number
  categoryName: string
  count: number
}

// 笔记统计信息
export interface NoteStatistics {
  totalCount: number
  favoritedCount: number
  unclassifiedCount: number
  categoryCounts: CategoryCount[]
}

// 笔记相关 API
export const noteApi = {
  /**
   * 创建笔记
   * POST /note/create
   */
  create(data: CreateNoteParams) {
    return request.post<number>('/note/create', data)
  },

  /**
   * 更新笔记
   * PUT /note/update
   */
  update(data: UpdateNoteParams) {
    return request.put<void>('/note/update', data)
  },

  /**
   * 删除笔记
   * DELETE /note/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/note/delete/${id}`)
  },

  /**
   * 获取笔记详情
   * GET /note/detail/{id}
   */
  getById(id: number) {
    return request.get<Note>(`/note/detail/${id}`)
  },

  /**
   * 获取笔记列表
   * GET /note/list
   */
  getList(params?: NoteQueryParams) {
    return request.get<NoteListItem[]>('/note/list', { params })
  },

  /**
   * 搜索笔记
   * GET /note/search
   */
  search(keyword: string) {
    return request.get<NoteListItem[]>('/note/search', { params: { keyword } })
  },

  /**
   * 切换笔记收藏状态
   * PUT /note/toggleFavorited/{id}
   */
  toggleFavorited(id: number) {
    return request.put<void>(`/note/toggleFavorited/${id}`)
  },

  /**
   * 获取笔记统计信息
   * GET /note/statistics
   */
  getStatistics() {
    return request.get<NoteStatistics>('/note/statistics')
  },

  getRecentNotes() {
    return request.get<NoteListItem[]>('/note/recent')
  },

  /**
   * 上传笔记图片
   * POST /note/image/upload
   */
  uploadImage(file: File) {
    const form = new FormData()
    form.append('file', file)
    return request.post<string>('/note/image/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

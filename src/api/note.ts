import { request } from '@/utils/request'

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
   * GET /note/{id}
   */
  getById(id: number) {
    return request.get<Note>(`/note/${id}`)
  },

  /**
   * 获取笔记列表
   * GET /note/list
   */
  getList(params?: NoteQueryParams) {
    return request.get<Note[]>('/note/list', { params })
  },

  /**
   * 搜索笔记
   * GET /note/search
   */
  search(keyword: string) {
    return request.get<Note[]>('/note/search', { params: { keyword } })
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
  }
}

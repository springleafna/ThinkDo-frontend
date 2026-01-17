import { request } from '@/utils/request'

// 便签创建请求参数
export interface CreateMemoParams {
  title?: string
  content: string
  tag?: string
  backgroundColor?: string
  pinned?: number
}

// 便签更新请求参数
export interface UpdateMemoParams {
  id: number
  title?: string
  content?: string
  tag?: string
  backgroundColor?: string
  pinned?: number
}

// 便签信息
export interface Memo {
  id: number
  title?: string
  content: string
  tag?: string
  backgroundColor: string
  pinned: number
  createdAt: string
  updatedAt: string
}

// 便签查询参数
export interface MemoQueryParams {
  tag?: string
  backgroundColor?: string
  pinned?: number
  keyword?: string
}

// 便签相关 API
export const memoApi = {
  /**
   * 创建便签
   * POST /plan/memo/create
   */
  create(data: CreateMemoParams) {
    return request.post<number>('/plan/memo/create', data)
  },

  /**
   * 更新便签
   * PUT /plan/memo/update
   */
  update(data: UpdateMemoParams) {
    return request.put<void>('/plan/memo/update', data)
  },

  /**
   * 删除便签
   * DELETE /plan/memo/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/plan/memo/delete/${id}`)
  },

  /**
   * 获取便签详情
   * GET /plan/memo/{id}
   */
  getById(id: number) {
    return request.get<Memo>(`/plan/memo/${id}`)
  },

  /**
   * 获取便签列表
   * GET /plan/memo/list
   */
  getList(params?: MemoQueryParams) {
    return request.get<Memo[]>('/plan/memo/list', { params })
  },

  /**
   * 切换便签置顶状态
   * PUT /plan/memo/togglePinned/{id}
   */
  togglePinned(id: number) {
    return request.put<void>(`/plan/memo/togglePinned/${id}`)
  },

  /**
   * 获取最新修改的两个便签
   * GET /plan/memo/latest
   */
  getLatestMemos() {
    return request.get<Memo[]>('/plan/memo/latest')
  }
}

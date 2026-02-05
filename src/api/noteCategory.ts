import { request } from '@/utils/request'

// 创建笔记分类请求参数
export interface CreateNoteCategoryParams {
  name: string
}

// 更新笔记分类请求参数
export interface UpdateNoteCategoryParams {
  id: number
  name: string
}

// 笔记分类信息
export interface NoteCategory {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

// 笔记分类相关 API
export const noteCategoryApi = {
  /**
   * 创建笔记分类
   * POST /note/category/create
   */
  create(data: CreateNoteCategoryParams) {
    return request.post<number>('/note/category/create', data)
  },

  /**
   * 更新笔记分类
   * PUT /note/category/update
   */
  update(data: UpdateNoteCategoryParams) {
    return request.put<void>('/note/category/update', data)
  },

  /**
   * 删除笔记分类
   * DELETE /note/category/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/note/category/delete/${id}`)
  },

  /**
   * 获取笔记分类列表
   * GET /note/category/list
   */
  getList() {
    return request.get<NoteCategory[]>('/note/category/list')
  }
}

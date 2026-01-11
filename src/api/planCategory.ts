import { request } from '@/utils/request'

// 创建计划分类请求参数
export interface CreatePlanCategoryParams {
  name: string
}

// 更新计划分类请求参数
export interface UpdatePlanCategoryParams {
  id: number
  name: string
}

// 计划分类信息
export interface PlanCategory {
  id: number
  name: string
  planCount: number
  createdAt: string
  updatedAt: string
}

// 计划分类相关 API
export const planCategoryApi = {
  /**
   * 创建计划分类
   * POST /plan/category/create
   */
  create(data: CreatePlanCategoryParams) {
    return request.post<number>('/plan/category/create', data)
  },

  /**
   * 更新计划分类
   * PUT /plan/category/update
   */
  update(data: UpdatePlanCategoryParams) {
    return request.put<void>('/plan/category/update', data)
  },

  /**
   * 删除计划分类
   * DELETE /plan/category/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/plan/category/delete/${id}`)
  },

  /**
   * 获取计划分类详情
   * GET /plan/category/{id}
   */
  getById(id: number) {
    return request.get<PlanCategory>(`/plan/category/${id}`)
  },

  /**
   * 获取计划分类列表
   * GET /plan/category/list
   */
  getList() {
    return request.get<PlanCategory[]>('/plan/category/list')
  }
}

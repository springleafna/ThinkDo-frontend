import { request } from '@/utils/request'

// 创建计划步骤请求参数
export interface CreatePlanStepParams {
  planId: number
  title: string
}

// 更新计划步骤请求参数
export interface UpdatePlanStepParams {
  id: number
  title?: string
  status?: number
}

// 计划步骤信息
export interface PlanStep {
  id: number
  planId: number
  title: string
  status: number
  createdAt: string
  updatedAt: string
}

// 计划步骤相关 API
export const planStepApi = {
  /**
   * 创建计划步骤
   * POST /plan/step/create
   */
  create(data: CreatePlanStepParams) {
    return request.post<number>('/plan/step/create', data)
  },

  /**
   * 更新计划步骤
   * PUT /plan/step/update
   */
  update(data: UpdatePlanStepParams) {
    return request.put<void>('/plan/step/update', data)
  },

  /**
   * 删除计划步骤
   * DELETE /plan/step/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/plan/step/delete/${id}`)
  },

  /**
   * 获取计划步骤详情
   * GET /plan/step/{id}
   */
  getById(id: number) {
    return request.get<PlanStep>(`/plan/step/${id}`)
  },

  /**
   * 获取指定计划的所有步骤列表
   * GET /plan/step/list/{planId}
   */
  getListByPlanId(planId: number) {
    return request.get<PlanStep[]>(`/plan/step/list/${planId}`)
  },

  /**
   * 切换步骤完成状态
   * PUT /plan/step/toggleStatus/{id}
   */
  toggleStatus(id: number) {
    return request.put<void>(`/plan/step/toggleStatus/${id}`)
  }
}

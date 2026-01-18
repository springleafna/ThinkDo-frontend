import { request } from '@/utils/request'

// 创建计划请求参数
export interface CreatePlanParams {
  categoryId?: number
  title: string
  description?: string
  priority?: number
  quadrant?: number
  tags?: string
  startTime?: string
  dueTime?: string
  repeatType?: number
  repeatConf?: string
  repeatUntil?: string
}

// 更新计划请求参数
export interface UpdatePlanParams {
  id: number
  categoryId?: number
  title?: string
  description?: string
  priority?: number
  quadrant?: number
  tags?: string
  startTime?: string
  dueTime?: string
  repeatType?: number
  repeatConf?: string
  repeatUntil?: string
  status?: number
}

// 计划信息
export interface Plan {
  id: number
  categoryId?: number
  categoryName?: string
  title: string
  description?: string
  priority: number
  quadrant: number
  tags?: string
  startTime?: string
  dueTime?: string
  repeatType: number
  repeatConf?: string
  repeatUntil?: string
  status: number
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// 计划查询参数
export interface PlanQueryParams {
  categoryId?: number
  keyword?: string
  priority?: number
  quadrant?: number
  tags?: string
  status?: number
  repeatType?: number
  startTimeFrom?: string
  startTimeTo?: string
  dueTimeFrom?: string
  dueTimeTo?: string
}

// 计划相关 API
export const planApi = {
  /**
   * 创建计划
   * POST /plan/plan/create
   */
  create(data: CreatePlanParams) {
    return request.post<number>('/plan/plan/create', data)
  },

  /**
   * 更新计划
   * PUT /plan/plan/update
   */
  update(data: UpdatePlanParams) {
    return request.put<void>('/plan/plan/update', data)
  },

  /**
   * 删除计划
   * DELETE /plan/plan/delete/{id}
   */
  delete(id: number) {
    return request.delete<void>(`/plan/plan/delete/${id}`)
  },

  /**
   * 获取计划详情
   * GET /plan/plan/{id}
   */
  getById(id: number) {
    return request.get<Plan>(`/plan/plan/${id}`)
  },

  /**
   * 获取计划列表
   * GET /plan/plan/list
   */
  getList(params?: PlanQueryParams) {
    return request.get<Plan[]>('/plan/plan/list', { params })
  },

  /**
   * 切换计划完成状态
   * PUT /plan/plan/toggleStatus/{id}
   */
  toggleStatus(id: number) {
    return request.put<void>(`/plan/plan/toggleStatus/${id}`)
  },

  /**
   * 获取四象限计划列表
   * GET /plan/plan/quadrant
   */
  getQuadrantPlans() {
    return request.get<PlanQuadrantResp>('/plan/plan/quadrant')
  }
}

// 四象限计划响应
export interface PlanQuadrantResp {
  importantUrgent: Plan[]
  importantNotUrgent: Plan[]
  urgentNotImportant: Plan[]
  notImportantNotUrgent: Plan[]
  unclassified: Plan[]
}

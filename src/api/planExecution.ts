import { request } from '@/utils/request'

// 创建每日计划请求参数
export interface CreatePlanExecutionParams {
  title: string
  priority?: number
  startTime?: string
  dueTime?: string
  tags?: string
  executeDate: string
}

// 更新每日计划请求参数
export interface UpdatePlanExecutionParams {
  id: number
  title?: string
  priority?: number
  startTime?: string
  dueTime?: string
  tags?: string
}

// 每日清单信息
export interface PlanExecution {
  id: number
  planId: number
  planTitle: string
  planType: number
  executeDate: string
  status: number
  priority?: number
  startTime?: string
  dueTime?: string
  tags?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// API方法
export const planExecutionApi = {
  // 创建每日计划
  create(params: CreatePlanExecutionParams): Promise<number> {
    return request.post('/plan/execution/create', params)
  },

  // 更新每日计划
  update(params: UpdatePlanExecutionParams): Promise<void> {
    return request.put('/plan/execution/update', params)
  },

  // 删除每日清单
  delete(id: number): Promise<void> {
    return request.delete(`/plan/execution/delete/${id}`)
  },

  // 切换每日清单状态
  toggleStatus(id: number): Promise<void> {
    return request.put(`/plan/execution/toggleStatus/${id}`)
  },

  // 获取今日每日清单列表
  getTodayList(): Promise<PlanExecution[]> {
    return request.get('/plan/execution/list/today')
  }
}

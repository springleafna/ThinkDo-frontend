import { request } from '@/utils/request'

// ==================== 通用类型 ====================

export interface PageReq {
  pageNum: number
  pageSize: number
}

export interface PageResp<T> {
  records: T[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

// ==================== 用户管理 ====================

export interface AdminUserQueryReq extends PageReq {
  username?: string
  role?: string
}

export interface AdminUserInfo {
  id: number
  username: string
  role: string
  roleDescription: string
  createdAt: string
  updatedAt: string
}

export interface AdminChangeUserRoleReq {
  userId: number
  roleName: string
}

export interface AdminResetPasswordReq {
  userId: number
  newPassword: string
}

export const adminUserApi = {
  getList(params: AdminUserQueryReq) {
    return request.get<PageResp<AdminUserInfo>>('/admin/user/list', { params })
  },
  changeRole(data: AdminChangeUserRoleReq) {
    return request.put<void>('/admin/user/changeRole', data)
  },
  delete(id: number) {
    return request.delete<void>(`/admin/user/delete/${id}`)
  },
  resetPassword(data: AdminResetPasswordReq) {
    return request.put<void>('/admin/user/resetPassword', data)
  }
}

// ==================== 笔记管理 ====================

export interface AdminNoteQueryReq extends PageReq {
  userId?: number
  username?: string
  keyword?: string
  favorited?: number
}

export interface AdminNoteInfo {
  id: number
  userId: number
  username: string
  title: string
  preview: string | null
  categoryId: number | null
  categoryName: string | null
  tags: string | null
  favorited: number
  createdAt: string
  updatedAt: string
}

export interface AdminNoteDetail extends AdminNoteInfo {
  content: string | null
}

export const adminNoteApi = {
  getList(params: AdminNoteQueryReq) {
    return request.get<PageResp<AdminNoteInfo>>('/admin/note/list', { params })
  },
  getDetail(id: number) {
    return request.get<AdminNoteDetail>(`/admin/note/detail/${id}`)
  },
  delete(id: number) {
    return request.delete<void>(`/admin/note/delete/${id}`)
  }
}

// ==================== 计划管理 ====================

export interface AdminPlanQueryReq extends PageReq {
  userId?: number
  username?: string
  keyword?: string
  type?: number
  priority?: number
  status?: number
  quadrant?: number
}

export interface AdminPlanInfo {
  id: number
  userId: number
  username: string
  type: number
  categoryId: number | null
  categoryName: string | null
  title: string
  description: string | null
  priority: number
  quadrant: number
  tags: string | null
  startTime: string | null
  dueTime: string | null
  repeatType: number
  status: number
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminPlanDetail extends AdminPlanInfo {
  repeatConf: string | null
  repeatUntil: string | null
  steps: PlanStepInfo[]
}

export interface PlanStepInfo {
  id: number
  title: string
  status: number
}

export const adminPlanApi = {
  getList(params: AdminPlanQueryReq) {
    return request.get<PageResp<AdminPlanInfo>>('/admin/plan/list', { params })
  },
  getDetail(id: number) {
    return request.get<AdminPlanDetail>(`/admin/plan/detail/${id}`)
  },
  delete(id: number) {
    return request.delete<void>(`/admin/plan/delete/${id}`)
  }
}

// ==================== 便签管理 ====================

export interface AdminMemoQueryReq extends PageReq {
  userId?: number
  username?: string
  keyword?: string
  tag?: string
  pinned?: number
}

export interface AdminMemoInfo {
  id: number
  userId: number
  username: string
  title: string | null
  content: string | null
  tag: string | null
  backgroundColor: string
  pinned: number
  createdAt: string
  updatedAt: string
}

export const adminMemoApi = {
  getList(params: AdminMemoQueryReq) {
    return request.get<PageResp<AdminMemoInfo>>('/admin/memo/list', { params })
  },
  getDetail(id: number) {
    return request.get<AdminMemoInfo>(`/admin/memo/detail/${id}`)
  },
  delete(id: number) {
    return request.delete<void>(`/admin/memo/delete/${id}`)
  }
}

// ==================== 会话管理 ====================

export interface AdminConversationQueryReq extends PageReq {
  keyword?: string
  userId?: number
  username?: string
  startTime?: string
  endTime?: string
}

export interface AdminConversationInfo {
  conversationId: string
  userId: number
  username: string
  title: string
  messageCount: number
  lastTime: string
  createdAt: string
  updatedAt: string
}

export interface AdminConversationMessageItem {
  id: number
  role: string
  content: string
  createdAt: string
}

export interface AdminConversationDetail {
  conversationId: string
  userId: number
  username: string
  title: string
  summary: string | null
  lastTime: string
  createdAt: string
  messages: AdminConversationMessageItem[]
}

export const adminConversationApi = {
  /**
   * 分页查询会话列表
   * GET /admin/conversation/list
   */
  getList(params: AdminConversationQueryReq) {
    return request.get<PageResp<AdminConversationInfo>>('/admin/conversation/list', { params })
  },
  /**
   * 获取会话详情（含消息记录）
   * GET /admin/conversation/detail/{conversationId}
   */
  getDetail(conversationId: string) {
    return request.get<AdminConversationDetail>(`/admin/conversation/detail/${conversationId}`)
  },
  /**
   * 删除会话
   * DELETE /admin/conversation/delete/{conversationId}
   */
  delete(conversationId: string) {
    return request.delete<void>(`/admin/conversation/delete/${conversationId}`)
  },
  /**
   * 批量删除会话
   * DELETE /admin/conversation/batchDelete
   */
  batchDelete(conversationIds: string[]) {
    return request.delete<void>('/admin/conversation/batchDelete', { data: conversationIds })
  }
}

// ==================== 运营总览 ====================

export interface AdminDashboardStats {
  userTotal: number
  conversationTotal: number
  documentTotal: number
  noteTotal: number
  planTotal: number
  memoTotal: number
}

export interface AdminDashboardTrend {
  userRegisterCount: number
  userRegisterCompare: string
  conversationCreateCount: number
  conversationCreateCompare: string
  documentUploadCount: number
  documentUploadCompare: string
  contentCreateCount: number
  contentCreateCompare: string
}

export const adminDashboardApi = {
  /**
   * 获取运营总览统计数据
   * GET /admin/dashboard/stats
   */
  getStats() {
    return request.get<AdminDashboardStats>('/admin/dashboard/stats')
  },
  /**
   * 获取今日趋势数据
   * GET /admin/dashboard/trend
   */
  getTrend() {
    return request.get<AdminDashboardTrend>('/admin/dashboard/trend')
  }
}

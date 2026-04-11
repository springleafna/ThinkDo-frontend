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

export const adminUserApi = {
  getList(params: AdminUserQueryReq) {
    return request.get<PageResp<AdminUserInfo>>('/admin/user/list', { params })
  },
  changeRole(data: AdminChangeUserRoleReq) {
    return request.put<void>('/admin/user/changeRole', data)
  },
  delete(id: number) {
    return request.delete<void>(`/admin/user/delete/${id}`)
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

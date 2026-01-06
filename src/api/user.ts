import { request } from '@/utils/request'

// 用户相关接口类型定义
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  createdAt: string
}

// 用户登录请求参数
export interface LoginParams {
  username: string
  password: string
}

// 用户登录响应
export interface LoginResponse {
  token: string
}

// 用户注册请求参数
export interface RegisterParams {
  username: string
  password: string
}

// 用户相关 API
export const userApi = {
  /**
   * 用户登录
   * POST /system/user/login
   */
  login(data: LoginParams) {
    return request.post<string>('/system/user/login', data)
  },

  /**
   * 用户注册
   * POST /system/user/register
   */
  register(data: RegisterParams) {
    return request.post<void>('/system/user/register', data)
  },

  /**
   * 退出登录
   * POST /system/user/logout
   */
  logout() {
    return request.post<void>('/system/user/logout')
  },

  // 获取用户信息
  getUserInfo() {
    return request.get<User>('/user/info')
  },

  // 更新用户信息
  updateUserInfo(data: Partial<User>) {
    return request.put<User>('/user/info', data)
  }
}

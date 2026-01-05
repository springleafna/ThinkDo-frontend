import { request } from '@/utils/request'

// 用户相关接口类型定义
export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  createdAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterParams {
  username: string
  email: string
  password: string
}

// 用户相关 API
export const userApi = {
  // 登录
  login(data: LoginParams) {
    return request.post<LoginResponse>('/auth/login', data)
  },

  // 注册
  register(data: RegisterParams) {
    return request.post('/auth/register', data)
  },

  // 获取用户信息
  getUserInfo() {
    return request.get<User>('/user/info')
  },

  // 更新用户信息
  updateUserInfo(data: Partial<User>) {
    return request.put<User>('/user/info', data)
  },

  // 退出登录
  logout() {
    return request.post('/auth/logout')
  }
}

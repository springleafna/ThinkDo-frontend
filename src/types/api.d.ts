// 通用请求参数接口
export interface PageParams {
  page?: number
  pageSize?: number
  keyword?: string
}

// 通用分页响应接口
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// 通用 API 响应接口
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

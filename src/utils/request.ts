import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/user'
import router from '@/router'

export interface RequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
}

export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  success: boolean
}

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers['token'] = token
    }

    return config
  },
  (error: any) => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 处理 401 未登录的函数
const handleUnauthorized = () => {
  toast.error('登录已过期，请重新登录')
  localStorage.removeItem('token')

  // 清除用户状态
  const userStore = useUserStore()
  userStore.logout()

  // 跳转到登录页
  router.push('/auth')
}

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data, config } = response

    if (config.responseType === 'blob') {
      return response
    }

    // 处理后端返回的业务状态码 401
    if (data.code === 401) {
      handleUnauthorized()
      return Promise.reject(new Error('未登录'))
    }

    if (data.code === 0 || data.success === true) {
      return data.data
    }

    const errorMessage = data.message || '请求失败'
    toast.error(errorMessage)

    return Promise.reject(new Error(errorMessage))
  },
  (error: any) => {
    let message = '请求失败'

    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          handleUnauthorized()
          return Promise.reject(error)
        case 403:
          message = '没有权限访问'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = data.message || `请求失败 (${status})`
      }
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    } else {
      message = error.message || '请求配置错误'
    }

    toast.error(message)
    console.error('响应错误：', error)

    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return service.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return service.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return service.put(url, data, config)
  },

  delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    return service.delete(url, config)
  },

  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return service.patch(url, data, config)
  },

  // 文件上传
  upload<T = any>(url: string, formData: FormData, config?: RequestConfig): Promise<T> {
    return service.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 文件下载
  download(url: string, config?: RequestConfig): Promise<Blob> {
    return service.get(url, {
      ...config,
      responseType: 'blob'
    })
  }
}

export default service

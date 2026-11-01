// apis/request.ts — axios 实例与拦截器封装

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios'
import type { ApiResponse } from '@/types'

/** 创建 axios 实例 */
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器：注入 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：解包 data，统一错误处理
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    // 业务错误码（非 200）抛出
    if (res.code !== undefined && res.code !== 200) {
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // 未登录跳转
      localStorage.removeItem('token')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

/** 泛型请求方法：返回解包后的 data */
async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await request.request<ApiResponse<T>>(config)
  return response.data.data
}

export const http = {
  get: <T>(url: string, params?: object) =>
    requestData<T>({ method: 'GET', url, params }),
  post: <T>(url: string, data?: object) =>
    requestData<T>({ method: 'POST', url, data }),
  put: <T>(url: string, data?: object) =>
    requestData<T>({ method: 'PUT', url, data }),
  delete: <T>(url: string) => requestData<T>({ method: 'DELETE', url }),
}

export default request

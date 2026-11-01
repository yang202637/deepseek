// 通用响应与分页类型定义

/** 后端统一响应包装 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 分页请求参数 */
export interface PageParams {
  page: number
  pageSize: number
  keyword?: string
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** 用户角色枚举 */
export type UserRole = 'super_admin' | 'operator' | 'user'

/** 用户实体 */
export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  dataScope: 'all' | 'self'
  status: 'active' | 'disabled'
  createdAt: string
}

/** 用户创建/更新入参 */
export interface UserPayload {
  username: string
  email: string
  role: UserRole
  dataScope: 'all' | 'self'
}

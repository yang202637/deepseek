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

/** 用户实体（API 响应） */
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

// ===== RBAC 类型 =====

/** 角色实体 */
export interface Role {
  id: number
  name: string
  code: string
  description: string
  dataScope: 'all' | 'self'
  isSystem: boolean
  createdAt: string
}

/** 角色创建/更新入参 */
export interface RolePayload {
  name: string
  description: string
  dataScope: 'all' | 'self'
}

/** 权限实体 */
export interface Permission {
  id: number
  module: string
  code: string
  name: string
  description: string
  createdAt: string
}

/** 权限创建/更新入参 */
export interface PermissionPayload {
  module: string
  code: string
  name: string
  description: string
}

/** 登录请求 */
export interface LoginRequest {
  username: string
  password: string
}

/** 登录响应（含 token） */
export interface TokenResponse {
  access_token: string
  expires_in: number
}

/** 当前登录用户授权信息 */
export interface AuthUser {
  id: number
  username: string
  email: string
  is_superuser: boolean
  permissions: string[]
  dataScope: 'all' | 'self'
}

/** 登录结果 */
export interface LoginResult {
  token: string
  user: AuthUser
}

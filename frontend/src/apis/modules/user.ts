// apis/modules/user.ts — 用户相关异步请求（纯 HTTP 调用，不含业务逻辑）

import { http } from '@/apis/request'
import type { PageParams, PageResult, User, UserPayload } from '@/types'

/** 分页查询用户 */
export function getUserPage(params: PageParams) {
  return http.get<PageResult<User>>('/users', params)
}

/** 查询单个用户 */
export function getUserById(id: number) {
  return http.get<User>(`/users/${id}`)
}

/** 创建用户 */
export function createUser(data: UserPayload) {
  return http.post<User>('/users', data)
}

/** 更新用户 */
export function updateUser(id: number, data: Partial<UserPayload>) {
  return http.put<User>(`/users/${id}`, data)
}

/** 删除用户 */
export function deleteUser(id: number) {
  return http.delete<void>(`/users/${id}`)
}

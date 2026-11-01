// services/user.ts — 用户业务逻辑层：在 apis 之上做校验、转换、聚合

import * as userApi from '@/apis/modules/user'
import type { PageParams, User, UserPayload } from '@/types'

/** 校验用户入参，返回错误信息，无错返回 null */
function validateUser(data: UserPayload): string | null {
  if (!data.username || data.username.trim().length < 2) {
    return '用户名至少 2 个字符'
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return '邮箱格式不正确'
  }
  return null
}

/** 分页查询用户（透传） */
export async function fetchUserPage(params: PageParams) {
  return userApi.getUserPage(params)
}

/** 创建用户：带业务校验 */
export async function addUser(data: UserPayload): Promise<User> {
  const error = validateUser(data)
  if (error) {
    throw new Error(error)
  }
  return userApi.createUser(data)
}

/** 更新用户：带业务校验 */
export async function editUser(id: number, data: Partial<UserPayload>) {
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('邮箱格式不正确')
  }
  return userApi.updateUser(id, data)
}

/** 删除用户 */
export function removeUser(id: number) {
  return userApi.deleteUser(id)
}

/** 统计活跃用户数（业务聚合示例） */
export function countActiveUsers(users: User[]): number {
  return users.filter((u) => u.status === 'active').length
}

// services/user.ts — 用户业务逻辑层

import * as userApi from '@/apis/modules/user'
import type { PageParams, User, UserPayload } from '@/types'

export function validateUser(data: UserPayload): string | null {
  if (!data.username || data.username.trim().length < 2) return '用户名至少 2 个字符'
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return '邮箱格式不正确'
  return null
}

export async function fetchUserPage(params: PageParams) {
  return userApi.getUserPage(params)
}

export async function addUser(data: UserPayload): Promise<User> {
  const error = validateUser(data)
  if (error) throw new Error(error)
  return userApi.createUser(data)
}

export async function editUser(id: number, data: Partial<UserPayload>) {
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('邮箱格式不正确')
  }
  return userApi.updateUser(id, data)
}

export function removeUser(id: number) {
  return userApi.deleteUser(id)
}

export function countActiveUsers(users: User[]): number {
  return users.filter((u) => u.status === 'active').length
}

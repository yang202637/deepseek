// services/permission.ts — 权限业务逻辑层
import * as permApi from '@/apis/modules/permission'
import type { PageParams, Permission, PermissionPayload } from '@/types'

export function validatePermission(data: Partial<PermissionPayload>): string | null {
  if (data.code !== undefined && !data.code.includes(':')) return '权限编码格式应为 模块:操作（如 agent:view）'
  if (data.name !== undefined && data.name.trim().length < 2) return '权限名称至少 2 个字符'
  return null
}

export async function fetchPermissionPage(params: PageParams) {
  return permApi.getPermissionPage(params)
}

export async function addPermission(data: PermissionPayload): Promise<Permission> {
  const error = validatePermission(data)
  if (error) throw new Error(error)
  return permApi.createPermission(data)
}

export async function updatePermission(id: number, data: Partial<PermissionPayload>) {
  const error = validatePermission(data)
  if (error) throw new Error(error)
  return permApi.updatePermission(id, data)
}

export function removePermission(id: number) {
  return permApi.deletePermission(id)
}

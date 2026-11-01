// services/role.ts — 角色业务逻辑层
import * as roleApi from '@/apis/modules/role'
import type { PageParams, Role, RolePayload } from '@/types'

export function validateRole(data: Partial<RolePayload>): string | null {
  if (data.name !== undefined && data.name.trim().length < 2) return '角色名称至少 2 个字符'
  return null
}

export async function fetchRolePage(params: PageParams) {
  return roleApi.getRolePage(params)
}

export async function addRole(data: RolePayload): Promise<Role> {
  const error = validateRole(data)
  if (error) throw new Error(error)
  return roleApi.createRole(data)
}

export async function updateRole(id: number, data: Partial<RolePayload>) {
  const error = validateRole(data)
  if (error) throw new Error(error)
  return roleApi.updateRole(id, data)
}

export function removeRole(id: number) {
  return roleApi.deleteRole(id)
}

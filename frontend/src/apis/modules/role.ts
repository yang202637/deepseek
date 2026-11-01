// apis/modules/role.ts — 角色管理接口

import { http } from '@/apis/request'
import type { PageParams, PageResult, Role, RolePayload } from '@/types'

/** 分页搜索角色 */
export function getRolePage(params: PageParams) {
  return http.get<PageResult<Role>>('/roles/search', params)
}

/** 创建角色 */
export function createRole(data: RolePayload) {
  return http.post<Role>('/roles', data)
}

/** 更新角色 */
export function updateRole(id: number, data: Partial<RolePayload>) {
  return http.put<Role>(`/roles/${id}`, data)
}

/** 删除角色 */
export function deleteRole(id: number) {
  return http.delete<void>(`/roles/${id}`)
}

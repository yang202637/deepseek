// apis/modules/permission.ts — 权限管理接口

import { http } from '@/apis/request'
import type { PageParams, PageResult, Permission, PermissionPayload } from '@/types'

/** 分页搜索权限 */
export function getPermissionPage(params: PageParams) {
  return http.get<PageResult<Permission>>('/permissions/search', params)
}

/** 创建权限 */
export function createPermission(data: PermissionPayload) {
  return http.post<Permission>('/permissions', data)
}

/** 更新权限 */
export function updatePermission(id: number, data: Partial<PermissionPayload>) {
  return http.put<Permission>(`/permissions/${id}`, data)
}

/** 删除权限 */
export function deletePermission(id: number) {
  return http.delete<void>(`/permissions/${id}`)
}

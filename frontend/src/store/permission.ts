// store/permission.ts — 权限状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PageResult, Permission, PermissionPayload } from '@/types'
import * as permService from '@/services/permission'

export const usePermissionStore = defineStore('permission', () => {
  const list = ref<Permission[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchPage(page = 1, pageSize = 10, keyword?: string) {
    loading.value = true
    try {
      const res: PageResult<Permission> = await permService.fetchPermissionPage({ page, pageSize, keyword })
      list.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function add(data: PermissionPayload) {
    return permService.addPermission(data)
  }

  async function update(id: number, data: Partial<PermissionPayload>) {
    return permService.updatePermission(id, data)
  }

  async function remove(id: number) {
    return permService.removePermission(id)
  }

  return { list, total, loading, fetchPage, add, update, remove }
})

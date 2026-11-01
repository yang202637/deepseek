// store/role.ts — 角色状态管理
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PageResult, Role, RolePayload } from '@/types'
import * as roleService from '@/services/role'

export const useRoleStore = defineStore('role', () => {
  const list = ref<Role[]>([])
  const total = ref(0)
  const loading = ref(false)

  async function fetchPage(page = 1, pageSize = 10, keyword?: string) {
    loading.value = true
    try {
      const res: PageResult<Role> = await roleService.fetchRolePage({ page, pageSize, keyword })
      list.value = res.items
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  async function add(data: RolePayload) {
    return roleService.addRole(data)
  }

  async function update(id: number, data: Partial<RolePayload>) {
    return roleService.updateRole(id, data)
  }

  async function remove(id: number) {
    return roleService.removeRole(id)
  }

  return { list, total, loading, fetchPage, add, update, remove }
})

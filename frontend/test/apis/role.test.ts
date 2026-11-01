import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { getRolePage, createRole, updateRole, deleteRole } from '@/apis/modules/role'

let mock: MockAdapter
beforeEach(() => { mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('role api', () => {
  it('getRolePage 返回分页结果', async () => {
    mock.onGet('/roles/search').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, name: 'test' }], total: 1, page: 1, pageSize: 10 }
    })
    const res = await getRolePage({ page: 1, pageSize: 10 })
    expect(res.total).toBe(1)
    expect(res.items).toHaveLength(1)
  })

  it('createRole 创建角色', async () => {
    mock.onPost('/roles').reply(200, {
      code: 200, message: 'success',
      data: { id: 4, name: '新角色', code: 'new_role', dataScope: 'self', isSystem: false, description: '', createdAt: '2026-11-01' }
    })
    const res = await createRole({ name: '新角色', dataScope: 'self', description: '' })
    expect(res.id).toBe(4)
  })

  it('updateRole 更新角色', async () => {
    mock.onPut('/roles/1').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, name: '超管', code: 'super_admin', dataScope: 'all', isSystem: true, description: '系统超级管理员', createdAt: '2026-10-25' }
    })
    const res = await updateRole(1, { name: '超管' })
    expect(res.name).toBe('超管')
  })

  it('deleteRole 删除角色返回 void', async () => {
    mock.onDelete('/roles/3').reply(200, { code: 200, message: 'success', data: null })
    await expect(deleteRole(3)).resolves.toBeNull()
  })
})

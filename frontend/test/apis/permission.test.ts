import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { getPermissionPage, createPermission, deletePermission } from '@/apis/modules/permission'

let mock: MockAdapter
beforeEach(() => { mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('permission api', () => {
  it('getPermissionPage 返回分页结果', async () => {
    mock.onGet('/permissions/search').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, module: 'agent', code: 'agent:view', name: '查看 Agent', description: '' }], total: 1, page: 1, pageSize: 10 }
    })
    const res = await getPermissionPage({ page: 1, pageSize: 10 })
    expect(res.total).toBe(1)
    expect(res.items[0].code).toBe('agent:view')
  })

  it('createPermission 创建权限', async () => {
    mock.onPost('/permissions').reply(200, {
      code: 200, message: 'success',
      data: { id: 43, module: 'agent', code: 'agent:delete', name: '删除 Agent', description: '', createdAt: '2026-11-01' }
    })
    const res = await createPermission({ module: 'agent', code: 'agent:delete', name: '删除 Agent', description: '' })
    expect(res.code).toBe('agent:delete')
  })

  it('deletePermission 删除权限', async () => {
    mock.onDelete('/permissions/43').reply(200, { code: 200, message: 'success', data: null })
    await expect(deletePermission(43)).resolves.toBeNull()
  })
})

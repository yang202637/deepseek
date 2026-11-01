import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { usePermissionStore } from '@/store/permission'

let mock: MockAdapter
beforeEach(() => { setActivePinia(createPinia()) ; mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('permission store', () => {
  it('fetchPage 获取权限列表', async () => {
    mock.onGet('/permissions/search').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, module: 'agent', code: 'agent:view', name: '查看 Agent', description: '', createdAt: '' }], total: 1, page: 1, pageSize: 10 }
    })
    const store = usePermissionStore()
    await store.fetchPage(1, 10)
    expect(store.total).toBe(1)
    expect(store.list[0].code).toBe('agent:view')
  })

  it('add 创建权限', async () => {
    mock.onPost('/permissions').reply(200, {
      code: 200, message: 'success',
      data: { id: 43, module: 'agent', code: 'agent:delete', name: '删除 Agent', description: '', createdAt: '2026-11-01' }
    })
    const store = usePermissionStore()
    const p = await store.add({ module: 'agent', code: 'agent:delete', name: '删除 Agent', description: '' })
    expect(p.code).toBe('agent:delete')
  })
})

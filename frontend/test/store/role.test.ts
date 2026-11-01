import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { useRoleStore } from '@/store/role'

let mock: MockAdapter
beforeEach(() => { setActivePinia(createPinia()) ; mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('role store', () => {
  it('fetchPage 获取角色列表', async () => {
    mock.onGet('/roles/search').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, name: 'test', code: 'test', dataScope: 'self', isSystem: false, description: '', createdAt: '' }], total: 1, page: 1, pageSize: 10 }
    })
    const store = useRoleStore()
    await store.fetchPage(1, 10)
    expect(store.total).toBe(1)
  })

  it('add 创建角色', async () => {
    mock.onPost('/roles').reply(200, {
      code: 200, message: 'success',
      data: { id: 4, name: '新角色', code: 'new_role', dataScope: 'self', isSystem: false, description: '', createdAt: '2026-11-01' }
    })
    const store = useRoleStore()
    const r = await store.add({ name: '新角色', dataScope: 'self', description: '' })
    expect(r.name).toBe('新角色')
  })
})

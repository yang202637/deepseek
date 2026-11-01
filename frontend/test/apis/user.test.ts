// test/apis/user.test.ts — 用户 API 层测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { getUserPage, getUserById, createUser, updateUser, deleteUser } from '@/apis/modules/user'

let mock: MockAdapter
beforeEach(() => { mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('user api', () => {
  it('getUserPage 返回分页结果', async () => {
    mock.onGet('/users').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, username: 'user1' }], total: 1, page: 1, pageSize: 10 },
    })
    const res = await getUserPage({ page: 1, pageSize: 10 })
    expect(res.total).toBe(1)
    expect(res.items).toHaveLength(1)
  })

  it('getUserById 返回单个用户', async () => {
    mock.onGet('/users/1').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, username: 'admin', email: 'a@x.com', role: 'super_admin', dataScope: 'all', status: 'active', createdAt: '' },
    })
    const res = await getUserById(1)
    expect(res.username).toBe('admin')
  })

  it('createUser 创建用户', async () => {
    mock.onPost('/users').reply(200, {
      code: 200, message: 'success',
      data: { id: 6, username: 'newuser', email: 'n@x.com', role: 'user', dataScope: 'self', status: 'active', createdAt: '' },
    })
    const res = await createUser({ username: 'newuser', email: 'n@x.com', role: 'user', dataScope: 'self' })
    expect(res.id).toBe(6)
  })

  it('updateUser 更新用户', async () => {
    mock.onPut('/users/1').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, username: 'admin', email: 'a@x.com', role: 'user', dataScope: 'self', status: 'active', createdAt: '' },
    })
    const res = await updateUser(1, { role: 'user' })
    expect(res.role).toBe('user')
  })

  it('deleteUser 删除用户返回 null', async () => {
    mock.onDelete('/users/1').reply(200, { code: 200, message: 'success', data: null })
    await expect(deleteUser(1)).resolves.toBeNull()
  })
})

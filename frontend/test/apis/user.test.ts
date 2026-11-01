// test/apis/user.test.ts — API 层（含 mock 拦截）测试

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { getUserPage, createUser, deleteUser } from '@/apis/modules/user'

let mock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(request)
})

afterEach(() => {
  mock.restore()
})

describe('user api', () => {
  it('getUserPage 解包 data 并返回分页结果', async () => {
    mock.onGet('/users').reply(200, {
      code: 200,
      message: 'success',
      data: { items: [{ id: 1, username: 'user1' }], total: 1, page: 1, pageSize: 10 },
    })

    const res = await getUserPage({ page: 1, pageSize: 10 })
    expect(res.total).toBe(1)
    expect(res.items).toHaveLength(1)
    expect(res.items[0].username).toBe('user1')
  })

  it('createUser 发起 POST 并返回新用户', async () => {
    mock.onPost('/users').reply(200, {
      code: 200,
      message: 'success',
      data: { id: 13, username: 'newuser' },
    })

    const res = await createUser({
      username: 'newuser',
      email: 'new@x.com',
      role: 'user',
      dataScope: 'self',
    })
    expect(res.id).toBe(13)
    expect(res.username).toBe('newuser')
  })

  it('deleteUser 解包返回 null（data 为 null）', async () => {
    mock.onDelete('/users/1').reply(200, { code: 200, message: 'success', data: null })
    await expect(deleteUser(1)).resolves.toBeNull()
  })
})

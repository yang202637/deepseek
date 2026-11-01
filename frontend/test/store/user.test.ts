// test/store/user.test.ts — Pinia store 测试（含 mock）

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { useUserStore } from '@/store/user'

let mock: MockAdapter

beforeEach(() => {
  setActivePinia(createPinia())
  mock = new MockAdapter(request)
})

afterEach(() => {
  mock.restore()
})

describe('user store', () => {
  it('fetchPage 写入 list 与 total', async () => {
    mock.onGet('/users').reply(200, {
      code: 200,
      message: 'success',
      data: {
        items: [{ id: 1, username: 'user1' }, { id: 2, username: 'user2' }],
        total: 2,
        page: 1,
        pageSize: 10,
      },
    })

    const store = useUserStore()
    await store.fetchPage(1, 10)

    expect(store.total).toBe(2)
    expect(store.list).toHaveLength(2)
  })

  it('add 创建用户后刷新列表', async () => {
    // POST /users 返回新用户
    mock.onPost('/users').reply(200, {
      code: 200,
      message: 'success',
      data: { id: 99, username: 'added', email: 'a@x.com', role: 'user', dataScope: 'self', status: 'active', createdAt: '' },
    })
    // 创建后内部调 fetchPage 刷新列表
    mock.onGet('/users').reply(200, {
      code: 200,
      message: 'success',
      data: { items: [{ id: 99, username: 'added' }], total: 1, page: 1, pageSize: 10 },
    })

    const store = useUserStore()
    const created = await store.add({ username: 'added', email: 'a@x.com', role: 'user', dataScope: 'self' })

    expect(created.id).toBe(99)
    expect(store.total).toBe(1)
    expect(store.list[0].username).toBe('added')
  })
})

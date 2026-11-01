import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { useUserStore } from '@/store/user'

let mock: MockAdapter

beforeEach(() => { setActivePinia(createPinia()) ; mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('user store', () => {
  it('fetchPage 写入 list 与 total', async () => {
    mock.onGet('/users').reply(200, {
      code: 200, message: 'success',
      data: { items: [{ id: 1, username: 'u1' }], total: 1, page: 1, pageSize: 10 }
    })
    const store = useUserStore()
    await store.fetchPage(1, 10)
    expect(store.total).toBe(1)
    expect(store.list).toHaveLength(1)
    expect(store.list[0].username).toBe('u1')
  })
})

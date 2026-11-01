import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { useAuthStore } from '@/store/auth'

let mock: MockAdapter

beforeEach(() => {
  setActivePinia(createPinia())
  mock = new MockAdapter(request)
  localStorage.clear()
})

afterEach(() => {
  mock.restore()
  localStorage.clear()
})

describe('auth store', () => {
  it('login 成功后设置 token 和用户', async () => {
    mock.onPost('/auth/login').reply(200, {
      code: 200, message: 'success', data: { access_token: 'tok1', expires_in: 1800 }
    })
    mock.onGet('/users/me').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, username: 'admin', email: 'a@x.com', is_superuser: true, permissions: ['agent:view'], dataScope: 'all' }
    })

    const store = useAuthStore()
    await store.login({ username: 'admin', password: '123456' })

    expect(store.isLoggedIn).toBe(true)
    expect(store.token).toBe('tok1')
    expect(store.isSuperuser).toBe(true)
    expect(store.dataScope).toBe('all')
  })

  it('hasPermission 超管返回 true', async () => {
    mock.onPost('/auth/login').reply(200, {
      code: 200, message: 'success', data: { access_token: 'tok', expires_in: 1800 }
    })
    mock.onGet('/users/me').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, username: 'admin', email: 'a@x.com', is_superuser: true, permissions: [], dataScope: 'all' }
    })

    const store = useAuthStore()
    await store.login({ username: 'admin', password: 'x' })
    expect(store.hasPermission('任意权限')).toBe(true)
  })

  it('logout 清除状态', async () => {
    const store = useAuthStore()
    store.logout()
    expect(store.isLoggedIn).toBe(false)
    expect(store.user).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})

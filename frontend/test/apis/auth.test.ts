import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import { login, getMe } from '@/apis/modules/auth'

let mock: MockAdapter

beforeEach(() => { mock = new MockAdapter(request) })
afterEach(() => { mock.restore() })

describe('auth api', () => {
  it('login 成功返回 token', async () => {
    mock.onPost('/auth/login').reply(200, {
      code: 200, message: 'success', data: { access_token: 'tok', expires_in: 1800 }
    })
    const res = await login({ username: 'admin', password: '123456' })
    expect(res.access_token).toBe('tok')
    expect(res.expires_in).toBe(1800)
  })

  it('login 失败返回业务错误', async () => {
    mock.onPost('/auth/login').reply(200, { code: 10002, message: '用户不存在', data: null })
    await expect(login({ username: 'bad', password: 'x' }))
      .rejects.toThrow('用户不存在')
  })

  it('getMe 返回授权信息', async () => {
    mock.onGet('/users/me').reply(200, {
      code: 200, message: 'success',
      data: { id: 1, username: 'admin', email: 'a@x.com', is_superuser: true, permissions: ['agent:view'], dataScope: 'all' }
    })
    const res = await getMe()
    expect(res.is_superuser).toBe(true)
    expect(res.permissions).toContain('agent:view')
    expect(res.dataScope).toBe('all')
  })
})

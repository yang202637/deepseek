// mock/index.ts — Mock 拦截（axios-mock-adapter）

import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import type { PageResult, User } from '@/types'

// 内存 mock 数据
const users: User[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  username: `user${i + 1}`,
  email: `user${i + 1}@chenguang.ai`,
  role: i === 0 ? 'super_admin' : i < 4 ? 'operator' : 'user',
  dataScope: i < 4 ? 'all' : 'self',
  status: i % 5 === 0 ? 'disabled' : 'active',
  createdAt: '2026-11-01',
}))

/** 启用 mock */
export function setupMock() {
  const mock = new MockAdapter(request, { delayResponse: 100 })

  // GET /users 分页
  mock.onGet('/users').reply((config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.pageSize ?? 10)
    const keyword = (config.params?.keyword ?? '') as string
    const filtered = keyword
      ? users.filter((u) => u.username.includes(keyword))
      : users
    const start = (page - 1) * pageSize
    const data: PageResult<User> = {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    }
    return [200, { code: 200, message: 'success', data }]
  })

  // GET /users/:id
  mock.onGet(/\/users\/\d+$/).reply((config) => {
    const id = Number(config.url!.split('/').pop())
    const user = users.find((u) => u.id === id)
    return user
      ? [200, { code: 200, message: 'success', data: user }]
      : [200, { code: 404, message: '用户不存在', data: null }]
  })

  // POST /users
  mock.onPost('/users').reply((config) => {
    const payload = JSON.parse(config.data) as Partial<User>
    const user: User = {
      id: users.length + 1,
      username: payload.username!,
      email: payload.email!,
      role: payload.role!,
      dataScope: payload.dataScope!,
      status: 'active',
      createdAt: '2026-11-01',
    }
    users.unshift(user)
    return [200, { code: 200, message: 'success', data: user }]
  })

  // PUT /users/:id
  mock.onPut(/\/users\/\d+$/).reply((config) => {
    const id = Number(config.url!.split('/').pop())
    const payload = JSON.parse(config.data) as Partial<User>
    const user = users.find((u) => u.id === id)
    if (user) Object.assign(user, payload)
    return user
      ? [200, { code: 200, message: 'success', data: user }]
      : [200, { code: 404, message: '用户不存在', data: null }]
  })

  // DELETE /users/:id
  mock.onDelete(/\/users\/\d+$/).reply((config) => {
    const id = Number(config.url!.split('/').pop())
    const idx = users.findIndex((u) => u.id === id)
    if (idx >= 0) users.splice(idx, 1)
    return [200, { code: 200, message: 'success', data: null }]
  })

  return mock
}

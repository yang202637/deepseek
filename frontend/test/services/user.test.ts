import { describe, it, expect } from 'vitest'
import { countActiveUsers } from '@/services/user'
import type { User } from '@/types'

describe('user service', () => {
  it('countActiveUsers 统计活跃用户数', () => {
    const users: User[] = [
      { id: 1, username: 'a', email: 'a@x.com', role: 'user', dataScope: 'self', status: 'active', createdAt: '' },
      { id: 2, username: 'b', email: 'b@x.com', role: 'user', dataScope: 'self', status: 'disabled', createdAt: '' },
      { id: 3, username: 'c', email: 'c@x.com', role: 'operator', dataScope: 'all', status: 'active', createdAt: '' },
    ]
    expect(countActiveUsers(users)).toBe(2)
  })

  it('空列表返回 0', () => {
    expect(countActiveUsers([])).toBe(0)
  })
})

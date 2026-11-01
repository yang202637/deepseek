import { describe, it, expect } from 'vitest'
import { validateRole } from '@/services/role'

describe('role service', () => {
  it('有效角色校验通过', () => {
    expect(validateRole({ name: '测试角色', dataScope: 'self', description: '描述' })).toBeNull()
  })

  it('名称为空返回错误', () => {
    expect(validateRole({ name: '', dataScope: 'self', description: '' })).toBe('角色名称至少 2 个字符')
  })

  it('名称过短返回错误', () => {
    expect(validateRole({ name: 'a', dataScope: 'all', description: '' })).toBe('角色名称至少 2 个字符')
  })
})

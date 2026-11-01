import { describe, it, expect } from 'vitest'
import { validatePermission } from '@/services/permission'

describe('permission service', () => {
  it('有效权限校验通过', () => {
    expect(validatePermission({ module: 'agent', code: 'agent:view', name: '查看 Agent', description: '' })).toBeNull()
  })

  it('编码缺少冒号返回错误', () => {
    expect(validatePermission({ module: 'agent', code: 'agentview', name: '查看', description: '' })).toBe('权限编码格式应为 模块:操作（如 agent:view）')
  })

  it('名称为空返回错误', () => {
    expect(validatePermission({ module: 'agent', code: 'agent:view', name: '', description: '' })).toBe('权限名称至少 2 个字符')
  })
})

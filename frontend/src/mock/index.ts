// mock/index.ts — RBAC 模块 Mock 数据与拦截
import MockAdapter from 'axios-mock-adapter'
import request from '@/apis/request'
import type { PageResult, User, Role, Permission } from '@/types'

const users: User[] = [
  { id: 1, username: 'admin', email: 'admin@cg.ai', role: 'super_admin', dataScope: 'all', status: 'active', createdAt: '2026-10-25' },
  { id: 2, username: 'zhangsan', email: 'zhang@cg.ai', role: 'user', dataScope: 'self', status: 'active', createdAt: '2026-10-20' },
  { id: 3, username: 'lisi', email: 'li@cg.ai', role: 'operator', dataScope: 'all', status: 'active', createdAt: '2026-10-18' },
  { id: 4, username: 'wangwu', email: 'wang@cg.ai', role: 'user', dataScope: 'self', status: 'disabled', createdAt: '2026-10-15' },
  { id: 5, username: 'zhaoliu', email: 'zhao@cg.ai', role: 'user', dataScope: 'self', status: 'active', createdAt: '2026-10-10' },
]

const roles: Role[] = [
  { id: 1, name: '超管', code: 'super_admin', description: '系统超级管理员', dataScope: 'all', isSystem: true, createdAt: '2026-10-25' },
  { id: 2, name: '运营人员', code: 'operator', description: '可查看全部数据', dataScope: 'all', isSystem: false, createdAt: '2026-10-25' },
  { id: 3, name: '普通用户', code: 'user', description: '仅可查看自己创建的资源', dataScope: 'self', isSystem: false, createdAt: '2026-10-25' },
]

const permissions: Permission[] = [
  { id: 1, module: 'user', code: 'user:view', name: '查看用户', description: '分页搜索/查看用户列表', createdAt: '2026-10-25' },
  { id: 2, module: 'user', code: 'user:create', name: '创建用户', description: '新建用户账号', createdAt: '2026-10-25' },
  { id: 3, module: 'role', code: 'role:view', name: '查看角色', description: '分页搜索角色', createdAt: '2026-10-25' },
  { id: 4, module: 'permission', code: 'permission:view', name: '查看权限', description: '分页搜索权限', createdAt: '2026-10-25' },
  { id: 5, module: 'agent', code: 'agent:view', name: '查看 Agent', description: '查看 Agent 列表与详情', createdAt: '2026-10-25' },
  { id: 6, module: 'agent', code: 'agent:create', name: '创建 Agent', description: '新建 Agent 配置', createdAt: '2026-10-25' },
  { id: 7, module: 'model', code: 'model:view', name: '查看模型', description: '查看模型列表', createdAt: '2026-10-25' },
  { id: 8, module: 'knowledge', code: 'knowledge:view', name: '查看知识库', description: '查看知识库列表', createdAt: '2026-10-25' },
  { id: 9, module: 'tool', code: 'tool:view', name: '查看工具', description: '查看工具列表', createdAt: '2026-10-25' },
  { id: 10, module: 'prompt', code: 'prompt:view', name: '查看 Prompt', description: '查看 Prompt 列表', createdAt: '2026-10-25' },
]

/** 安全解析 config.data（axios 序列化后为 JSON 字符串） */
function parseBody<T>(config: { data?: unknown }): T {
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as T
    } catch {
      return {} as T
    }
  }
  return (config.data ?? {}) as T
}

export function setupMock() {
  const mock = new MockAdapter(request, { delayResponse: 100 })

  // ===== 认证 =====
  mock.onPost('/auth/login').reply((config) => {
    const payload = parseBody<{ username?: string; password?: string }>(config)
    if (payload.username === 'admin') {
      return [200, { code: 200, message: 'success', data: { access_token: 'mock-admin-token', expires_in: 1800 } }]
    }
    return [200, { code: 10002, message: '用户不存在', data: null }]
  })

  mock.onGet('/users/me').reply(() => [
    200,
    {
      code: 200,
      message: 'success',
      data: {
        id: 1,
        username: 'admin',
        email: 'admin@cg.ai',
        is_superuser: true,
        permissions: ['user:view', 'user:create', 'role:view', 'permission:view', 'agent:view', 'agent:create', 'model:view', 'knowledge:view', 'tool:view', 'prompt:view'],
        dataScope: 'all',
      },
    },
  ])

  // ===== 用户 =====
  mock.onGet('/users').reply((config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.pageSize ?? 10)
    const keyword = (config.params?.keyword ?? '') as string
    const filtered = keyword
      ? users.filter((u) => u.username.includes(keyword) || u.email.includes(keyword))
      : users
    const start = (page - 1) * pageSize
    return [200, { code: 200, message: 'success', data: { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize } }]
  })

  mock.onPost('/users').reply((config) => {
    const p = parseBody<Partial<User>>(config)
    const user: User = {
      id: users.length + 1,
      username: p.username!,
      email: p.email!,
      role: p.role || 'user',
      dataScope: p.dataScope || 'self',
      status: 'active',
      createdAt: '2026-11-01',
    }
    users.unshift(user)
    return [200, { code: 200, message: 'success', data: user }]
  })

  mock.onDelete(/\/users\/\d+$/).reply(() => {
    return [200, { code: 200, message: 'success', data: null }]
  })

  // ===== 角色 =====
  mock.onGet('/roles/search').reply((config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.pageSize ?? 10)
    const keyword = (config.params?.keyword ?? '') as string
    const filtered = keyword
      ? roles.filter((r) => r.name.includes(keyword) || r.code.includes(keyword))
      : roles
    const start = (page - 1) * pageSize
    return [200, { code: 200, message: 'success', data: { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize } }]
  })

  mock.onPost('/roles').reply((config) => {
    const p = parseBody<Partial<Role>>(config)
    const role: Role = {
      id: roles.length + 1,
      name: p.name!,
      code: p.name!.toLowerCase().replace(/\s/g, '_'),
      description: p.description || '',
      dataScope: p.dataScope || 'self',
      isSystem: false,
      createdAt: '2026-11-01',
    }
    roles.unshift(role)
    return [200, { code: 200, message: 'success', data: role }]
  })

  mock.onDelete(/\/roles\/\d+$/).reply(() => {
    return [200, { code: 200, message: 'success', data: null }]
  })

  // ===== 权限 =====
  mock.onGet('/permissions/search').reply((config) => {
    const page = Number(config.params?.page ?? 1)
    const pageSize = Number(config.params?.pageSize ?? 10)
    const keyword = (config.params?.keyword ?? '') as string
    const filtered = keyword
      ? permissions.filter((p) => p.code.includes(keyword) || p.name.includes(keyword))
      : permissions
    const start = (page - 1) * pageSize
    return [200, { code: 200, message: 'success', data: { items: filtered.slice(start, start + pageSize), total: filtered.length, page, pageSize } }]
  })

  mock.onPost('/permissions').reply((config) => {
    const p = parseBody<Partial<Permission>>(config)
    const perm: Permission = {
      id: permissions.length + 1,
      module: p.module!,
      code: p.code!,
      name: p.name!,
      description: p.description || '',
      createdAt: '2026-11-01',
    }
    permissions.push(perm)
    return [200, { code: 200, message: 'success', data: perm }]
  })

  mock.onDelete(/\/permissions\/\d+$/).reply(() => {
    return [200, { code: 200, message: 'success', data: null }]
  })

  return mock
}

// services/auth.ts — 认证业务逻辑层
import * as authApi from '@/apis/modules/auth'
import type { LoginRequest } from '@/types'

export async function doLogin(data: LoginRequest): Promise<{ token: string; user: unknown }> {
  const resp = await authApi.login(data)
  return { token: resp.access_token, user: null }
}

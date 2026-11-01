// apis/modules/auth.ts — 认证相关接口

import { http } from '@/apis/request'
import type { LoginRequest, TokenResponse, AuthUser } from '@/types'

/** 用户登录 */
export function login(data: LoginRequest) {
  return http.post<TokenResponse>('/auth/login', data)
}

/** 获取当前用户信息（含权限码、数据范围） */
export function getMe() {
  return http.get<AuthUser>('/users/me')
}

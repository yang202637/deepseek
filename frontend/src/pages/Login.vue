<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请填写用户名和密码'
    return
  }
  loading.value = true
  try {
    await auth.login({ username: username.value.trim(), password: password.value })
    router.push('/users')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="handleLogin">
      <div class="logo">
        <div class="logo-icon">辰</div>
        <div class="logo-text">辰光 Agent 平台</div>
      </div>
      <p class="subtitle">RBAC 授权管理系统</p>
      <BaseInput v-model="username" placeholder="用户名" />
      <BaseInput v-model="password" type="password" placeholder="密码" />
      <p v-if="error" class="error">{{ error }}</p>
      <BaseButton variant="primary" :disabled="loading" @click="handleLogin">
        {{ loading ? '登录中...' : '登 录' }}
      </BaseButton>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
}
.card {
  background: #fff;
  padding: 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 320px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
}
.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}
.error {
  font-size: 13px;
  color: #ef4444;
}
</style>

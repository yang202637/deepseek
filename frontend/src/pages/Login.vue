<script setup lang="ts">
// pages/Login.vue — 登录页

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'

const router = useRouter()
const username = ref('')
const password = ref('')

function login() {
  // 简化示例：直接写入 token 后跳转
  localStorage.setItem('token', 'mock-token')
  router.push('/users')
}
</script>

<template>
  <div class="login">
    <form class="card" @submit.prevent="login">
      <h1>辰光 Agent 平台</h1>
      <BaseInput v-model="username" placeholder="用户名" />
      <BaseInput v-model="password" placeholder="密码" />
      <BaseButton variant="primary" @click="login">登录</BaseButton>
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
h1 {
  font-size: 20px;
  text-align: center;
  margin-bottom: 8px;
}
</style>

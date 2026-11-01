<script setup lang="ts">
// pages/Users.vue — 用户管理页（串联 store → services → apis）

import { onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import BaseButton from '@/components/BaseButton.vue'
import type { User } from '@/types'

const userStore = useUserStore()
const keyword = ref('')

async function load() {
  await userStore.fetchPage(1, 10, keyword.value || undefined)
}

function onSearch() {
  load()
}

onMounted(load)
</script>

<template>
  <div class="page">
    <header class="head">
      <h1>用户管理</h1>
      <input v-model="keyword" placeholder="搜索用户名" @keyup.enter="onSearch" />
      <BaseButton @click="onSearch">搜索</BaseButton>
    </header>

    <p v-if="userStore.loading" class="loading">加载中…</p>

    <table v-else class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>角色</th>
          <th>数据范围</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in userStore.list" :key="u.id">
          <td>{{ u.id }}</td>
          <td>{{ u.username }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.role }}</td>
          <td>{{ u.dataScope }}</td>
          <td>{{ u.status === 'active' ? '活跃' : '禁用' }}</td>
        </tr>
      </tbody>
    </table>

    <p class="total">共 {{ userStore.total }} 条</p>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
}
.head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}
.head input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}
th,
td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}
th {
  background: #f8fafc;
  font-weight: 600;
  color: #64748b;
}
.loading {
  color: #64748b;
}
.total {
  margin-top: 12px;
  color: #64748b;
  font-size: 13px;
}
</style>

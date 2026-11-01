<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

interface User {
  id: number
  username: string
  email: string
  role: string
  dataScope: 'all' | 'self'
  status: 'active' | 'disabled'
  createdAt: string
}

interface Role {
  id: number
  name: string
  code: string
  dataScope: 'all' | 'self'
  isSystem: boolean
}

const users = ref<User[]>([
  { id: 1, username: 'admin', email: 'admin@chenguang.ai', role: '超管', dataScope: 'all', status: 'active', createdAt: '2026-10-01' },
  { id: 2, username: 'zhangsan', email: 'zhangsan@chenguang.ai', role: '运营人员', dataScope: 'all', status: 'active', createdAt: '2026-10-05' },
  { id: 3, username: 'lisi', email: 'lisi@chenguang.ai', role: '普通用户', dataScope: 'self', status: 'active', createdAt: '2026-10-10' },
  { id: 4, username: 'wangwu', email: 'wangwu@chenguang.ai', role: '普通用户', dataScope: 'self', status: 'disabled', createdAt: '2026-10-12' },
  { id: 5, username: 'zhaoliu', email: 'zhaoliu@chenguang.ai', role: '运营人员', dataScope: 'all', status: 'active', createdAt: '2026-10-15' },
])

const roles = ref<Role[]>([
  { id: 1, name: '超管', code: 'super_admin', dataScope: 'all', isSystem: true },
  { id: 2, name: '运营人员', code: 'operator', dataScope: 'all', isSystem: false },
  { id: 3, name: '普通用户', code: 'user', dataScope: 'self', isSystem: false },
])

const keyword = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingUser = ref<User | null>(null)
const deletingUser = ref<User | null>(null)

const formData = ref({
  username: '',
  email: '',
  role: 'user' as string,
  dataScope: 'self' as 'all' | 'self',
})

const filteredUsers = () => {
  if (!keyword.value) return users.value
  const kw = keyword.value.toLowerCase()
  return users.value.filter(u => u.username.toLowerCase().includes(kw) || u.email.toLowerCase().includes(kw))
}

function openCreate() {
  formData.value = { username: '', email: '', role: 'user', dataScope: 'self' }
  showCreateModal.value = true
}

function openEdit(user: User) {
  editingUser.value = user
  formData.value = { username: user.username, email: user.email, role: user.role, dataScope: user.dataScope }
  showEditModal.value = true
}

function openDelete(user: User) {
  deletingUser.value = user
  showDeleteModal.value = true
}

function handleCreate() {
  if (!formData.value.username || !formData.value.email) return
  const newUser: User = {
    id: Math.max(...users.value.map(u => u.id)) + 1,
    ...formData.value,
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
  }
  users.value.unshift(newUser)
  showCreateModal.value = false
}

function handleEdit() {
  if (!editingUser.value) return
  const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
  if (idx !== -1) {
    users.value[idx] = { ...users.value[idx], ...formData.value }
  }
  showEditModal.value = false
}

function handleDelete() {
  if (!deletingUser.value) return
  users.value = users.value.filter(u => u.id !== deletingUser.value!.id)
  showDeleteModal.value = false
}

function toggleStatus(user: User) {
  user.status = user.status === 'active' ? 'disabled' : 'active'
}
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <h1>用户管理</h1>
        <span class="subtitle">管理系统中的所有用户账号</span>
      </div>
      <BaseButton @click="openCreate">+ 新增用户</BaseButton>
    </header>

    <div class="filters">
      <input v-model="keyword" placeholder="搜索用户名或邮箱..." class="search-input" />
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>用户名</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>数据范围</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers()" :key="user.id">
            <td>
              <div class="user-cell">
                <div class="avatar" :class="`avatar-${user.id % 6}`">{{ user.username[0].toUpperCase() }}</div>
                <span>{{ user.username }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td><span class="badge badge-role">{{ user.role }}</span></td>
            <td>
              <span class="badge" :class="user.dataScope === 'all' ? 'badge-blue' : 'badge-gray'">
                {{ user.dataScope === 'all' ? '全部数据' : '仅本人' }}
              </span>
            </td>
            <td>
              <span class="badge" :class="user.status === 'active' ? 'badge-green' : 'badge-red'">
                {{ user.status === 'active' ? '活跃' : '禁用' }}
              </span>
            </td>
            <td class="text-muted">{{ user.createdAt }}</td>
            <td>
              <div class="actions">
                <button class="btn-icon" @click="openEdit(user)" title="编辑">✏️</button>
                <button class="btn-icon" @click="toggleStatus(user)" :title="user.status === 'active' ? '禁用' : '启用'">
                  {{ user.status === 'active' ? '🚫' : '✅' }}
                </button>
                <button v-if="user.username !== 'admin'" class="btn-icon btn-danger" @click="openDelete(user)" title="删除">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="filteredUsers().length === 0">
        <p>暂无用户数据</p>
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal v-model="showCreateModal" title="新增用户">
      <div class="form-group">
        <label>用户名 *</label>
        <input v-model="formData.username" placeholder="请输入用户名" />
      </div>
      <div class="form-group">
        <label>邮箱 *</label>
        <input v-model="formData.email" type="email" placeholder="请输入邮箱" />
      </div>
      <div class="form-group">
        <label>角色</label>
        <select v-model="formData.role">
          <option value="user">普通用户</option>
          <option value="operator">运营人员</option>
        </select>
      </div>
      <div class="form-group">
        <label>数据范围</label>
        <select v-model="formData.dataScope">
          <option value="self">仅本人数据</option>
          <option value="all">全部数据</option>
        </select>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showCreateModal = false">取消</BaseButton>
        <BaseButton @click="handleCreate">确认创建</BaseButton>
      </div>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal v-model="showEditModal" :title="`编辑用户 - ${editingUser?.username}`">
      <div class="form-group">
        <label>用户名</label>
        <input v-model="formData.username" disabled />
      </div>
      <div class="form-group">
        <label>邮箱</label>
        <input v-model="formData.email" type="email" />
      </div>
      <div class="form-group">
        <label>角色</label>
        <select v-model="formData.role">
          <option value="user">普通用户</option>
          <option value="operator">运营人员</option>
          <option value="super_admin">超管</option>
        </select>
      </div>
      <div class="form-group">
        <label>数据范围</label>
        <select v-model="formData.dataScope">
          <option value="self">仅本人数据</option>
          <option value="all">全部数据</option>
        </select>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showEditModal = false">取消</BaseButton>
        <BaseButton @click="handleEdit">保存修改</BaseButton>
      </div>
    </BaseModal>

    <!-- Delete Modal -->
    <BaseModal v-model="showDeleteModal" title="确认删除">
      <p class="delete-warning">确定要删除用户 <strong>{{ deletingUser?.username }}</strong> 吗？此操作不可恢复。</p>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showDeleteModal = false">取消</BaseButton>
        <BaseButton variant="danger" @click="handleDelete">确认删除</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.page { padding: 24px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.header-left h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.header-left .subtitle { color: #64748b; font-size: 14px; }
.filters { margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; width: 300px; font-size: 14px; }
.table-container { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
th { background: #f8fafc; font-weight: 600; color: #64748b; font-size: 13px; }
tr:hover td { background: #f8fafc; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #fff; font-size: 14px; }
.avatar-0 { background: linear-gradient(135deg, #3B82F6, #1D4ED8); }
.avatar-1 { background: linear-gradient(135deg, #10B981, #047857); }
.avatar-2 { background: linear-gradient(135deg, #8B5CF6, #6D28D9); }
.avatar-3 { background: linear-gradient(135deg, #F59E0B, #D97706); }
.avatar-4 { background: linear-gradient(135deg, #EF4444, #B91C1C); }
.avatar-5 { background: linear-gradient(135deg, #06B6D4, #0E7490); }
.badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-role { background: #EDE9FE; color: #6D28D9; }
.badge-blue { background: #DBEAFE; color: #1E40AF; }
.badge-green { background: #D1FAE5; color: #065F46; }
.badge-red { background: #FEE2E2; color: #991B1B; }
.badge-gray { background: #F1F5F9; color: #64748B; }
.actions { display: flex; gap: 4px; }
.btn-icon { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; }
.btn-icon:hover { background: #f1f5f9; }
.btn-icon.btn-danger:hover { background: #fee2e2; }
.text-muted { color: #64748b; font-size: 13px; }
.empty-state { padding: 40px; text-align: center; color: #64748b; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.form-group input, .form-group select { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.delete-warning { color: #64748b; margin-bottom: 16px; }
.delete-warning strong { color: #ef4444; }
</style>

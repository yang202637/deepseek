<script setup lang="ts">
// pages/RBAC/Roles.vue — 角色管理页面
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

interface Role {
  id: number
  name: string
  code: string
  description: string
  dataScope: 'all' | 'self'
  isSystem: boolean
  createdAt: string
}

const roles = ref<Role[]>([
  { id: 1, name: '超管', code: 'super_admin', description: '系统超级管理员', dataScope: 'all', isSystem: true, createdAt: '2026-10-25' },
  { id: 2, name: '运营人员', code: 'operator', description: '可查看全部数据', dataScope: 'all', isSystem: false, createdAt: '2026-10-25' },
  { id: 3, name: '普通用户', code: 'user', description: '仅可查看自己创建的资源', dataScope: 'self', isSystem: false, createdAt: '2026-10-25' },
])

const keyword = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingRole = ref<Role | null>(null)

const formData = ref({
  name: '',
  code: '',
  description: '',
  dataScope: 'self' as 'all' | 'self',
})

const filteredRoles = () => {
  if (!keyword.value) return roles.value
  const kw = keyword.value.toLowerCase()
  return roles.value.filter(r => r.name.toLowerCase().includes(kw) || r.code.toLowerCase().includes(kw))
}

function openCreate() {
  formData.value = { name: '', code: '', description: '', dataScope: 'self' }
  showCreateModal.value = true
}

function openEdit(role: Role) {
  editingRole.value = role
  formData.value = { name: role.name, code: role.code, description: role.description, dataScope: role.dataScope }
  showEditModal.value = true
}

function openDelete(role: Role) {
  editingRole.value = role
  showDeleteModal.value = true
}

function handleCreate() {
  if (!formData.value.name || !formData.value.code) return
  const newRole: Role = {
    id: Math.max(...roles.value.map(r => r.id)) + 1,
    ...formData.value,
    isSystem: false,
    createdAt: new Date().toISOString().split('T')[0],
  }
  roles.value.unshift(newRole)
  showCreateModal.value = false
}

function handleEdit() {
  if (!editingRole.value) return
  const idx = roles.value.findIndex(r => r.id === editingRole.value!.id)
  if (idx !== -1 && !editingRole.value.isSystem) {
    roles.value[idx] = { ...roles.value[idx], ...formData.value }
  }
  showEditModal.value = false
}

function handleDelete() {
  if (!editingRole.value || editingRole.value.isSystem) return
  roles.value = roles.value.filter(r => r.id !== editingRole.value!.id)
  showDeleteModal.value = false
}
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <h1>角色管理</h1>
        <span class="subtitle">管理系统角色与数据访问范围</span>
      </div>
      <BaseButton @click="openCreate">+ 新增角色</BaseButton>
    </header>

    <div class="filters">
      <input v-model="keyword" placeholder="搜索角色名称或编码..." class="search-input" />
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>角色名称</th>
            <th>角色编码</th>
            <th>数据范围</th>
            <th>描述</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in filteredRoles()" :key="role.id">
            <td>{{ role.id }}</td>
            <td>
              <span>{{ role.name }}</span>
              <span v-if="role.isSystem" class="badge badge-system">系统</span>
            </td>
            <td><code>{{ role.code }}</code></td>
            <td>
              <span class="badge" :class="role.dataScope === 'all' ? 'badge-blue' : 'badge-gray'">
                {{ role.dataScope === 'all' ? '全部数据' : '仅本人' }}
              </span>
            </td>
            <td class="text-muted">{{ role.description }}</td>
            <td class="text-muted">{{ role.createdAt }}</td>
            <td>
              <div class="actions">
                <button v-if="!role.isSystem" class="btn-icon" @click="openEdit(role)" title="编辑">✏️</button>
                <button v-if="!role.isSystem" class="btn-icon btn-danger" @click="openDelete(role)" title="删除">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="filteredRoles().length === 0">
        <p>暂无角色数据</p>
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal v-model="showCreateModal" title="新增角色">
      <div class="form-group">
        <label>角色名称 *</label>
        <input v-model="formData.name" placeholder="请输入角色名称" />
      </div>
      <div class="form-group">
        <label>角色编码 *</label>
        <input v-model="formData.code" placeholder="例: operator" />
        <div class="form-hint">英文标识，创建后不可修改</div>
      </div>
      <div class="form-group">
        <label>数据范围</label>
        <select v-model="formData.dataScope">
          <option value="self">仅本人数据</option>
          <option value="all">全部数据</option>
        </select>
      </div>
      <div class="form-group">
        <label>角色描述</label>
        <textarea v-model="formData.description" placeholder="可选，用于说明角色用途"></textarea>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showCreateModal = false">取消</BaseButton>
        <BaseButton @click="handleCreate">确认创建</BaseButton>
      </div>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal v-model="showEditModal" :title="`编辑角色 - ${editingRole?.name}`">
      <div class="form-group">
        <label>角色名称</label>
        <input v-model="formData.name" :disabled="editingRole?.isSystem" />
      </div>
      <div class="form-group">
        <label>角色编码</label>
        <input v-model="formData.code" disabled />
        <div class="form-hint">编码创建后不可修改</div>
      </div>
      <div class="form-group">
        <label>数据范围</label>
        <select v-model="formData.dataScope" :disabled="editingRole?.isSystem">
          <option value="self">仅本人数据</option>
          <option value="all">全部数据</option>
        </select>
      </div>
      <div class="form-group">
        <label>角色描述</label>
        <textarea v-model="formData.description"></textarea>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showEditModal = false">取消</BaseButton>
        <BaseButton :disabled="editingRole?.isSystem" @click="handleEdit">保存修改</BaseButton>
      </div>
    </BaseModal>

    <!-- Delete Modal -->
    <BaseModal v-model="showDeleteModal" title="确认删除">
      <p class="delete-warning">
        确定要删除角色 <strong>{{ editingRole?.name }}</strong> 吗？此操作不可恢复。
      </p>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showDeleteModal = false">取消</BaseButton>
        <BaseButton variant="danger" :disabled="!editingRole || editingRole.isSystem" @click="handleDelete">确认删除</BaseButton>
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
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
th { background: #f8fafc; font-weight: 600; color: #64748b; }
tr:hover td { background: #f8fafc; }
.badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-system { background: #DBEAFE; color: #1E40AF; }
.badge-blue { background: #DBEAFE; color: #1E40AF; }
.badge-gray { background: #F1F5F9; color: #64748B; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.actions { display: flex; gap: 4px; }
.btn-icon { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 4px; background: #fff; cursor: pointer; font-size: 14px; }
.btn-icon:hover { background: #f1f5f9; }
.btn-icon.btn-danger:hover { background: #fee2e2; }
.text-muted { color: #64748b; font-size: 13px; }
.empty-state { text-align: center; padding: 40px; color: #64748b; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.form-group textarea { min-height: 80px; resize: vertical; }
.form-hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.delete-warning { color: #64748b; margin-bottom: 16px; }
.delete-warning strong { color: #ef4444; }
</style>

<script setup lang="ts">
// pages/RBAC/Permissions.vue — 权限管理页面
import { ref, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import BaseButton from '@/components/BaseButton.vue'

interface Permission {
  id: number
  module: string
  code: string
  name: string
  description: string
  createdAt: string
}

const permissions = ref<Permission[]>([
  { id: 1, module: 'user', code: 'user:view', name: '查看用户', description: '分页搜索/查看用户列表', createdAt: '2026-10-25' },
  { id: 2, module: 'user', code: 'user:create', name: '创建用户', description: '新建用户账号', createdAt: '2026-10-25' },
  { id: 3, module: 'user', code: 'user:update', name: '编辑用户', description: '修改用户信息', createdAt: '2026-10-25' },
  { id: 4, module: 'user', code: 'user:delete', name: '删除用户', description: '删除用户账号', createdAt: '2026-10-25' },
  { id: 5, module: 'user', code: 'user:assign-role', name: '分配角色', description: '给用户分配或变更角色', createdAt: '2026-10-25' },
  { id: 6, module: 'role', code: 'role:view', name: '查看角色', description: '分页搜索角色', createdAt: '2026-10-25' },
  { id: 7, module: 'role', code: 'role:create', name: '创建角色', description: '新建角色', createdAt: '2026-10-25' },
  { id: 8, module: 'role', code: 'role:update', name: '编辑角色', description: '修改角色信息', createdAt: '2026-10-25' },
  { id: 9, module: 'role', code: 'role:delete', name: '删除角色', description: '删除角色', createdAt: '2026-10-25' },
  { id: 10, module: 'role', code: 'role:assign-permission', name: '分配权限', description: '给角色分配或变更权限', createdAt: '2026-10-25' },
  { id: 11, module: 'permission', code: 'permission:view', name: '查看权限', description: '分页搜索权限', createdAt: '2026-10-25' },
  { id: 12, module: 'permission', code: 'permission:create', name: '创建权限', description: '新建权限定义', createdAt: '2026-10-25' },
  { id: 13, module: 'permission', code: 'permission:update', name: '编辑权限', description: '修改权限信息', createdAt: '2026-10-25' },
  { id: 14, module: 'permission', code: 'permission:delete', name: '删除权限', description: '删除权限定义', createdAt: '2026-10-25' },
  { id: 15, module: 'agent', code: 'agent:view', name: '查看 Agent', description: '查看 Agent 列表与详情', createdAt: '2026-10-25' },
  { id: 16, module: 'agent', code: 'agent:create', name: '创建 Agent', description: '新建 Agent 配置', createdAt: '2026-10-25' },
  { id: 17, module: 'agent', code: 'agent:update', name: '编辑 Agent', description: '修改 Agent 配置', createdAt: '2026-10-25' },
  { id: 18, module: 'agent', code: 'agent:delete', name: '删除 Agent', description: '删除 Agent', createdAt: '2026-10-25' },
  { id: 19, module: 'agent', code: 'agent:publish', name: '发布 Agent', description: '发布/回滚 Agent 版本', createdAt: '2026-10-25' },
  { id: 20, module: 'model', code: 'model:view', name: '查看模型', description: '查看模型列表', createdAt: '2026-10-25' },
  { id: 21, module: 'model', code: 'model:create', name: '创建模型', description: '新建模型配置', createdAt: '2026-10-25' },
  { id: 22, module: 'model', code: 'model:update', name: '编辑模型', description: '修改模型配置', createdAt: '2026-10-25' },
  { id: 23, module: 'model', code: 'model:delete', name: '删除模型', description: '删除模型', createdAt: '2026-10-25' },
  { id: 24, module: 'model', code: 'model:test', name: '测试模型', description: '测试模型连接', createdAt: '2026-10-25' },
  { id: 25, module: 'provider', code: 'provider:view', name: '查看供应商', description: '查看供应商列表', createdAt: '2026-10-25' },
  { id: 26, module: 'provider', code: 'provider:create', name: '创建供应商', description: '新建供应商', createdAt: '2026-10-25' },
  { id: 27, module: 'provider', code: 'provider:update', name: '编辑供应商', description: '修改供应商信息', createdAt: '2026-10-25' },
  { id: 28, module: 'provider', code: 'provider:delete', name: '删除供应商', description: '删除供应商', createdAt: '2026-10-25' },
  { id: 29, module: 'provider', code: 'provider:test', name: '测试连接', description: '测试供应商连接', createdAt: '2026-10-25' },
  { id: 30, module: 'prompt', code: 'prompt:view', name: '查看 Prompt', description: '查看 Prompt 列表', createdAt: '2026-10-25' },
  { id: 31, module: 'prompt', code: 'prompt:create', name: '创建 Prompt', description: '新建 Prompt', createdAt: '2026-10-25' },
  { id: 32, module: 'prompt', code: 'prompt:update', name: '编辑 Prompt', description: '修改 Prompt', createdAt: '2026-10-25' },
  { id: 33, module: 'prompt', code: 'prompt:delete', name: '删除 Prompt', description: '删除 Prompt', createdAt: '2026-10-25' },
  { id: 34, module: 'prompt', code: 'prompt:publish', name: '发布 Prompt', description: '发布/回滚 Prompt 版本', createdAt: '2026-10-25' },
  { id: 35, module: 'knowledge', code: 'knowledge:view', name: '查看知识库', description: '查看知识库列表', createdAt: '2026-10-25' },
  { id: 36, module: 'knowledge', code: 'knowledge:create', name: '创建知识库', description: '新建知识库', createdAt: '2026-10-25' },
  { id: 37, module: 'knowledge', code: 'knowledge:update', name: '编辑知识库', description: '修改知识库配置', createdAt: '2026-10-25' },
  { id: 38, module: 'knowledge', code: 'knowledge:delete', name: '删除知识库', description: '删除知识库', createdAt: '2026-10-25' },
  { id: 39, module: 'knowledge', code: 'knowledge:document-manage', name: '管理文档', description: '上传/处理/删除文档', createdAt: '2026-10-25' },
  { id: 40, module: 'tool', code: 'tool:view', name: '查看工具', description: '查看工具列表', createdAt: '2026-10-25' },
  { id: 41, module: 'tool', code: 'tool:create', name: '创建工具', description: '新建工具', createdAt: '2026-10-25' },
  { id: 42, module: 'tool', code: 'tool:update', name: '编辑工具', description: '修改工具配置', createdAt: '2026-10-25' },
  { id: 43, module: 'tool', code: 'tool:delete', name: '删除工具', description: '删除工具', createdAt: '2026-10-25' },
  { id: 44, module: 'tool', code: 'tool:test', name: '测试工具', description: '测试工具 API', createdAt: '2026-10-25' },
])

const modules = ['user', 'role', 'permission', 'agent', 'model', 'provider', 'prompt', 'knowledge', 'tool']

const keyword = ref('')
const activeModule = ref<string>('all')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const editingPerm = ref<Permission | null>(null)

const formData = ref({
  module: 'agent',
  code: '',
  name: '',
  description: '',
})

const filteredPermissions = () => {
  let result = permissions.value
  if (activeModule.value !== 'all') {
    result = result.filter(p => p.module === activeModule.value)
  }
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    result = result.filter(p => p.code.includes(kw) || p.name.includes(kw))
  }
  return result
}

function openCreate() {
  formData.value = { module: 'agent', code: '', name: '', description: '' }
  showCreateModal.value = true
}

function openEdit(perm: Permission) {
  editingPerm.value = perm
  formData.value = { module: perm.module, code: perm.code, name: perm.name, description: perm.description }
  showEditModal.value = true
}

function openDelete(perm: Permission) {
  editingPerm.value = perm
  showDeleteModal.value = true
}

function handleCreate() {
  if (!formData.value.code || !formData.value.name) return
  const newPerm: Permission = {
    id: Math.max(...permissions.value.map(p => p.id)) + 1,
    ...formData.value,
    createdAt: new Date().toISOString().split('T')[0],
  }
  permissions.value.push(newPerm)
  showCreateModal.value = false
}

function handleEdit() {
  if (!editingPerm.value) return
  const idx = permissions.value.findIndex(p => p.id === editingPerm.value!.id)
  if (idx !== -1) {
    permissions.value[idx] = { ...permissions.value[idx], ...formData.value }
  }
  showEditModal.value = false
}

function handleDelete() {
  if (!editingPerm.value) return
  permissions.value = permissions.value.filter(p => p.id !== editingPerm.value!.id)
  showDeleteModal.value = false
}

onMounted(() => {})
</script>

<template>
  <div class="page">
    <header class="header">
      <div class="header-left">
        <h1>权限管理</h1>
        <span class="subtitle">管理系统权限码，共 {{ permissions.length }} 个</span>
      </div>
      <BaseButton @click="openCreate">+ 新增权限</BaseButton>
    </header>

    <div class="module-tabs">
      <span
        v-for="mod in ['all', ...modules]"
        :key="mod"
        class="tab"
        :class="{ active: activeModule === mod }"
        @click="activeModule = mod"
      >
        {{ mod === 'all' ? '全部' : mod }}
        <span class="count">({{ mod === 'all' ? permissions.length : permissions.filter(p => p.module === mod).length }})</span>
      </span>
    </div>

    <div class="filters">
      <input v-model="keyword" placeholder="搜索权限编码或名称..." class="search-input" />
    </div>

    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>模块</th>
            <th>权限编码</th>
            <th>名称</th>
            <th>描述</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filteredPermissions()" :key="p.id">
            <td>{{ p.id }}</td>
            <td><span class="badge badge-module">{{ p.module }}</span></td>
            <td><code>{{ p.code }}</code></td>
            <td>{{ p.name }}</td>
            <td class="text-muted">{{ p.description }}</td>
            <td>
              <div class="actions">
                <button class="btn-link" @click="openEdit(p)">编辑</button>
                <button class="btn-link btn-danger" @click="openDelete(p)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="empty-state" v-if="filteredPermissions().length === 0">
        <p>暂无匹配的权限</p>
      </div>
    </div>

    <!-- Create Modal -->
    <BaseModal v-model="showCreateModal" title="新增权限">
      <div class="form-group">
        <label>所属模块 <span class="req">*</span></label>
        <select v-model="formData.module">
          <option v-for="m in modules" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>权限编码 <span class="req">*</span></label>
        <input v-model="formData.code" placeholder="格式: 模块:操作，如 agent:view" />
        <div class="form-hint">创建后不可修改</div>
      </div>
      <div class="form-group">
        <label>权限名称 <span class="req">*</span></label>
        <input v-model="formData.name" placeholder="请输入权限名称" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea v-model="formData.description" placeholder="可选，简要说明该权限用途"></textarea>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showCreateModal = false">取消</BaseButton>
        <BaseButton @click="handleCreate">创建权限</BaseButton>
      </div>
    </BaseModal>

    <!-- Edit Modal -->
    <BaseModal v-model="showEditModal" :title="`编辑权限 — ${editingPerm?.code}`">
      <div class="form-group">
        <label>权限编码</label>
        <input v-model="formData.code" disabled />
        <div class="form-hint">编码创建后不可修改</div>
      </div>
      <div class="form-group">
        <label>权限名称</label>
        <input v-model="formData.name" />
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea v-model="formData.description"></textarea>
      </div>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showEditModal = false">取消</BaseButton>
        <BaseButton @click="handleEdit">保存修改</BaseButton>
      </div>
    </BaseModal>

    <!-- Delete Modal -->
    <BaseModal v-model="showDeleteModal" title="确认删除">
      <p class="delete-warning">
        确定要删除权限 <strong>{{ editingPerm?.code }}</strong>（{{ editingPerm?.name }}）吗？
        此操作不可恢复，已分配给角色的该权限也将同步移除。
      </p>
      <div class="modal-footer">
        <BaseButton variant="secondary" @click="showDeleteModal = false">取消</BaseButton>
        <BaseButton variant="danger" @click="handleDelete">确认删除</BaseButton>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.page { padding: 24px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.header-left h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
.header-left .subtitle { color: #64748b; font-size: 14px; }
.module-tabs { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
.tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid #e2e8f0;
}
.tab:hover { background: #f1f5f9; }
.tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.tab .count { margin-left: 4px; opacity: 0.7; }
.filters { margin-bottom: 16px; }
.search-input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; width: 280px; }
.table-container { background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
.table { width: 100%; border-collapse: collapse; }
th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
th { background: #f8fafc; font-weight: 600; color: #64748b; }
tbody tr:hover td { background: #f8fafc; }
.badge { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
.badge-module { background: #ede9fe; color: #5b21b6; }
code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-family: monospace; }
.actions { display: flex; gap: 4px; }
.btn-link { background: none; color: #3b82f6; padding: 4px 8px; font-size: 13px; border: none; cursor: pointer; }
.btn-link:hover { text-decoration: underline; }
.btn-link.btn-danger { color: #ef4444; }
.btn-link.btn-danger:hover { background: #fee2e2; }
.text-muted { color: #64748b; font-size: 13px; }
.empty-state { text-align: center; padding: 40px; color: #64748b; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.form-group { margin-bottom: 16px; }
.form-group label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 6px; }
.form-group label .req { color: #ef4444; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }
.form-group textarea { min-height: 80px; resize: vertical; }
.form-hint { font-size: 12px; color: #94a3b8; margin-top: 4px; }
.delete-warning { color: #64748b; margin-bottom: 16px; line-height: 1.6; }
.delete-warning strong { color: #ef4444; }
</style>

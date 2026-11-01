<script setup lang="ts">
// components/BaseButton.vue — 公共按钮组件

defineProps<{
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()

defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <button
    class="btn"
    :class="`btn--${variant || 'primary'}`"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<style scoped>
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn--primary {
  background: #2563eb;
  color: #fff;
}
.btn--primary:hover {
  background: #1d4ed8;
}
.btn--secondary {
  background: #fff;
  color: #475569;
  border-color: #e2e8f0;
}
.btn--secondary:hover {
  border-color: #94a3b8;
}
.btn--danger {
  background: #ef4444;
  color: #fff;
}
.btn--danger:hover {
  background: #dc2626;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

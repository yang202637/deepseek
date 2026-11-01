<script setup lang="ts">
// components/BaseInput.vue — 公共输入组件

import { computed } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  error?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
</script>

<template>
  <div class="field">
    <input
      v-model="value"
      class="input"
      :class="{ 'input--error': error }"
      :placeholder="placeholder"
    />
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
}
.input:focus {
  border-color: #2563eb;
}
.input--error {
  border-color: #ef4444;
}
.error {
  font-size: 12px;
  color: #ef4444;
}
</style>

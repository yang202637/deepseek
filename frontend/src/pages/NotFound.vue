<script setup lang="ts">
// pages/NotFound.vue — 404 页
</script>

<template>
  <div class="nf">
    <h1>404</h1>
    <p>页面不存在</p>
  </div>
</template>

<style scoped>
.nf {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.nf h1 {
  font-size: 48px;
  font-weight: 700;
}
.nf p {
  color: #64748b;
}
</style>

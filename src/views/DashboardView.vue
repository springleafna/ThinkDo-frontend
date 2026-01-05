<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 flex items-center justify-center">
    <div class="text-center space-y-6">
      <h1 class="text-5xl font-light tracking-tight text-neutral-900">Dashboard</h1>
      <p class="text-neutral-500">控制台页面开发中...</p>
      <button
        @click="router.push('/')"
        class="px-6 py-3 bg-black text-white rounded-xl text-sm font-medium hover:scale-105 transition-transform"
      >
        返回首页
      </button>
    </div>
  </div>
</template>

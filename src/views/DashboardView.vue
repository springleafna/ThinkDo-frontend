<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const router = useRouter()
const isSidebarOpen = ref(true)
const activeView = ref('dashboard')

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto p-8 md:p-12 pt-8 custom-scrollbar relative z-10">
        <div class="section-reveal" style="animation-delay: 0.2s">
          <div class="mb-8">
            <h2 class="text-4xl font-light tracking-tight text-neutral-900 mb-2">欢迎回来</h2>
            <p class="text-neutral-500">主控台正在建设中...</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="i in 6"
              :key="i"
              class="bg-white border border-black/5 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div class="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mb-4">
                <div class="w-6 h-6 bg-stone-200 rounded"></div>
              </div>
              <div class="h-4 bg-stone-100 rounded mb-3 w-3/4"></div>
              <div class="h-3 bg-stone-50 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
@keyframes section-reveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-reveal {
  animation: section-reveal 0.8s ease-out forwards;
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}
</style>

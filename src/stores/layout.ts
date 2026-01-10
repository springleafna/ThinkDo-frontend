import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // 从 localStorage 读取侧边栏状态，默认为 true
  const isSidebarOpen = ref<boolean>(
    localStorage.getItem('sidebarOpen') === 'false' ? false : true
  )

  // 切换侧边栏状态
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
    // 持久化到 localStorage
    localStorage.setItem('sidebarOpen', String(isSidebarOpen.value))
  }

  // 设置侧边栏状态
  const setSidebarOpen = (open: boolean) => {
    isSidebarOpen.value = open
    localStorage.setItem('sidebarOpen', String(open))
  }

  return {
    isSidebarOpen,
    toggleSidebar,
    setSidebarOpen
  }
})

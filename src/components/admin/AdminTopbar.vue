<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, House, LogOut } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

defineProps<{
  title: string
  subtitle: string
}>()

const router = useRouter()
const userStore = useUserStore()

const goToAuth = () => {
  router.push('/auth')
}

const goToLanding = () => {
  router.push('/')
}

const handleLogout = async () => {
  try {
    await userApi.logout()
    userStore.logout()
    toast.success('已退出登录')
    router.push('/auth')
  } catch {
    // 即使接口失败也清除本地状态
    userStore.logout()
    router.push('/auth')
  }
}
</script>

<template>
  <header class="border border-slate-200 bg-white px-5 py-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-slate-900">
          {{ title }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          当前待处理 12 项
        </div>
        <Button variant="outline" class="rounded-md border-slate-200 bg-white" @click="goToLanding">
          <House class="size-4" />
          返回首页
        </Button>
        <Button variant="outline" class="rounded-md border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700" @click="handleLogout">
          <LogOut class="size-4" />
          退出登录
        </Button>
        <Button variant="outline" class="rounded-md border-slate-200 bg-white" @click="goToAuth">
          <ArrowLeft class="size-4" />
          回到登录页
        </Button>
      </div>
    </div>
  </header>
</template>

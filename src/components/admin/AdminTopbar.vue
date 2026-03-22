<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft, House } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle: string
}>()

const router = useRouter()

const goToAuth = () => {
  router.push('/auth')
}

const goToLanding = () => {
  router.push('/')
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
        <Button variant="outline" class="rounded-md border-slate-200 bg-white" @click="goToAuth">
          <ArrowLeft class="size-4" />
          回到登录页
        </Button>
      </div>
    </div>
  </header>
</template>

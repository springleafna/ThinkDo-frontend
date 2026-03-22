<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  ChevronLeft,
  Lock,
  ShieldCheck,
  User
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { userApi, type LoginParams, type RegisterParams } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

type AuthMode = 'login' | 'register'

const mode = ref<AuthMode>('login')
const isLoading = ref(false)

const formData = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const errors = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateForm = () => {
  errors.value = {
    username: '',
    password: '',
    confirmPassword: ''
  }

  let isValid = true

  if (!formData.value.username.trim()) {
    errors.value.username = '用户名不能为空'
    isValid = false
  }

  if (!formData.value.password) {
    errors.value.password = '密码不能为空'
    isValid = false
  } else if (formData.value.password.length < 6 || formData.value.password.length > 20) {
    errors.value.password = '密码长度需要在 6 到 20 位之间'
    isValid = false
  }

  if (mode.value === 'register') {
    if (!formData.value.confirmPassword) {
      errors.value.confirmPassword = '请再次输入密码'
      isValid = false
    } else if (formData.value.password !== formData.value.confirmPassword) {
      errors.value.confirmPassword = '两次输入的密码不一致'
      isValid = false
    }
  }

  return isValid
}

const handleSubmit = async (event: Event) => {
  event.preventDefault()

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    if (mode.value === 'login') {
      const loginParams: LoginParams = {
        username: formData.value.username.trim(),
        password: formData.value.password
      }

      const token = await userApi.login(loginParams)

      userStore.setToken(token)
      userStore.setUsername(formData.value.username.trim())

      toast.success('登录成功')
      router.push('/dashboard')
    } else {
      const registerParams: RegisterParams = {
        username: formData.value.username.trim(),
        password: formData.value.password
      }

      await userApi.register(registerParams)

      toast.success('注册成功，请登录')
      mode.value = 'login'
      formData.value.password = ''
      formData.value.confirmPassword = ''
    }
  } catch (error) {
    console.error('认证失败:', error)
  } finally {
    isLoading.value = false
  }
}

const onBackToLanding = () => {
  router.push('/')
}

const onEnterAdmin = () => {
  router.push('/admin')
}

const switchMode = (newMode: AuthMode) => {
  mode.value = newMode
  errors.value = {
    username: '',
    password: '',
    confirmPassword: ''
  }
  formData.value.confirmPassword = ''
}
</script>

<template>
  <div class="min-h-screen w-full bg-[#fcfaf7] p-6">
    <div class="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md items-center">
      <section class="w-full section-reveal">
        <button
          @click="onBackToLanding"
          class="mb-8 flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-neutral-400 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft :size="14" />
          返回首页
        </button>

        <div class="rounded-[2.5rem] border border-black/5 bg-white p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)]">
          <div class="mb-6 flex gap-8 border-b border-black/5 pb-1">
            <button
              @click="switchMode('login')"
              :class="[
                'relative pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all',
                mode === 'login' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'
              ]"
            >
              登录账号
              <div
                v-if="mode === 'login'"
                class="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-indigo-600 animate-in fade-in slide-in-from-left-2"
              ></div>
            </button>
            <button
              @click="switchMode('register')"
              :class="[
                'relative pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all',
                mode === 'register' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'
              ]"
            >
              注册成员
              <div
                v-if="mode === 'register'"
                class="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-indigo-600 animate-in fade-in slide-in-from-left-2"
              ></div>
            </button>
          </div>

          <form class="space-y-5" @submit="handleSubmit">
            <div class="space-y-1">
              <label class="ml-1 text-[12px] font-bold uppercase tracking-widest text-neutral-400">用户名</label>
              <div class="relative flex items-center">
                <User class="absolute left-5 text-neutral-300" :size="16" />
                <input
                  v-model="formData.username"
                  type="text"
                  placeholder="输入你的用户名"
                  :class="[
                    'w-full rounded-2xl border bg-stone-50 py-3.5 pl-12 pr-4 text-sm transition-all placeholder:text-neutral-300 focus:outline-none focus:ring-4',
                    errors.username
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-black/5 focus:ring-indigo-100'
                  ]"
                />
              </div>
              <p class="ml-1 min-h-[14px] text-[12px] text-red-500">{{ errors.username || '' }}</p>
            </div>

            <div class="space-y-1">
              <div class="flex items-center justify-between px-1">
                <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400">密码</label>
                <button
                  v-if="mode === 'login'"
                  type="button"
                  class="text-[11px] font-bold uppercase tracking-tighter text-indigo-600 hover:underline"
                >
                  忘记密码？
                </button>
              </div>
              <div class="relative flex items-center">
                <Lock class="absolute left-5 text-neutral-300" :size="16" />
                <input
                  v-model="formData.password"
                  type="password"
                  placeholder="6 到 20 位密码"
                  :class="[
                    'w-full rounded-2xl border bg-stone-50 py-3.5 pl-12 pr-4 text-sm transition-all placeholder:text-neutral-300 focus:outline-none focus:ring-4',
                    errors.password
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-black/5 focus:ring-indigo-100'
                  ]"
                />
              </div>
              <p class="ml-1 min-h-[14px] text-[10px] text-red-500">{{ errors.password || '' }}</p>
            </div>

            <div
              v-if="mode === 'register'"
              class="space-y-1 animate-in fade-in slide-in-from-top-2"
            >
              <label class="ml-1 text-[12px] font-bold uppercase tracking-widest text-neutral-400">确认密码</label>
              <div class="relative flex items-center">
                <Lock class="absolute left-5 text-neutral-300" :size="16" />
                <input
                  v-model="formData.confirmPassword"
                  type="password"
                  placeholder="再次输入密码"
                  :class="[
                    'w-full rounded-2xl border bg-stone-50 py-3.5 pl-12 pr-4 text-sm transition-all placeholder:text-neutral-300 focus:outline-none focus:ring-4',
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-black/5 focus:ring-indigo-100'
                  ]"
                />
              </div>
              <p class="ml-1 min-h-[14px] text-[10px] text-red-500">{{ errors.confirmPassword || '' }}</p>
            </div>

            <button
              type="submit"
              :disabled="isLoading"
              :class="[
                'flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-black py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-black/10 transition-all hover:scale-[1.02] active:scale-95',
                isLoading ? 'cursor-not-allowed opacity-80' : ''
              ]"
            >
              <div
                v-if="isLoading"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"
              ></div>
              <template v-else>
                {{ mode === 'login' ? '登录' : '注册' }}
                <ArrowRight :size="16" />
              </template>
            </button>
          </form>
          <div v-if="mode === 'login'" class="mt-5">
            <button
              type="button"
              @click="onEnterAdmin"
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-white py-3 text-sm font-medium text-indigo-600 transition-all hover:bg-indigo-50"
            >
              <ShieldCheck :size="16" />
              进入管理员页面
            </button>
          </div>
        </div>
      </section>
    </div>
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
</style>

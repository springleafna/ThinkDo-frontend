<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Sparkles,
  Lock,
  ArrowRight,
  Github,
  Chrome,
  User,
  ChevronLeft
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

const validateForm = (): boolean => {
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
    errors.value.password = '密码长度必须在6-20位之间'
    isValid = false
  }

  if (mode.value === 'register') {
    if (!formData.value.confirmPassword) {
      errors.value.confirmPassword = '请确认密码'
      isValid = false
    } else if (formData.value.password !== formData.value.confirmPassword) {
      errors.value.confirmPassword = '两次输入的密码不一致'
      isValid = false
    }
  }

  return isValid
}

const handleSubmit = async (e: Event) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  isLoading.value = true

  try {
    if (mode.value === 'login') {
      // 登录
      const loginParams: LoginParams = {
        username: formData.value.username.trim(),
        password: formData.value.password
      }

      const token = await userApi.login(loginParams)

      // 保存 token 和用户名到 store
      userStore.setToken(token)
      userStore.setUsername(formData.value.username.trim())

      toast.success('登录成功')
      router.push('/dashboard')
    } else {
      // 注册
      const registerParams: RegisterParams = {
        username: formData.value.username.trim(),
        password: formData.value.password
      }

      await userApi.register(registerParams)

      toast.success('注册成功，请登录')

      // 切换到登录模式
      mode.value = 'login'
      formData.value.password = ''
      formData.value.confirmPassword = ''
    }
  } catch (error) {
    // 错误信息已经在 request.ts 的拦截器中处理
    console.error('认证失败:', error)
  } finally {
    isLoading.value = false
  }
}

const onBackToLanding = () => {
  router.push('/')
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
  <div class="min-h-screen w-full flex items-center justify-center p-6 bg-[#fcfaf7]">
    <div class="w-full max-w-md section-reveal">
      <button
        @click="onBackToLanding"
        class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 mb-8 transition-colors group"
      >
        <ChevronLeft :size="14" class="group-hover:-translate-x-1 transition-transform" />
        返回首页
      </button>

      <div class="flex flex-col items-center mb-10 text-center">
        <div class="bg-[#1c1917] text-white p-4 rounded-2xl shadow-xl shadow-black/10 mb-6 transform hover:scale-110 transition-transform">
          <Sparkles :size="32" />
        </div>
        <h1 class="text-3xl font-light tracking-tight text-neutral-900">ThinkDo 认证中心</h1>
      </div>

      <div class="woven-border bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-black/5 relative overflow-hidden">
        <div class="flex gap-8 mb-10 border-b border-black/5 pb-1">
          <button
            @click="switchMode('login')"
            :class="[
              'pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative',
              mode === 'login' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'
            ]"
          >
            登录账号
            <div
              v-if="mode === 'login'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-left-2"
            ></div>
          </button>
          <button
            @click="switchMode('register')"
            :class="[
              'pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative',
              mode === 'register' ? 'text-neutral-900' : 'text-neutral-300 hover:text-neutral-500'
            ]"
          >
            注册成员
            <div
              v-if="mode === 'register'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full animate-in fade-in slide-in-from-left-2"
            ></div>
          </button>
        </div>

        <form @submit="handleSubmit" class="space-y-6">
          <div class="space-y-2">
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">用户名</label>
            <div class="relative flex items-center">
              <User class="absolute left-5 text-neutral-300" :size="16" />
              <input
                v-model="formData.username"
                type="text"
                placeholder="你的用户名"
                :class="[
                  'w-full pl-12 pr-4 py-3.5 bg-stone-50 border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all placeholder:text-neutral-300',
                  errors.username
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-black/5 focus:ring-indigo-100'
                ]"
              />
            </div>
            <p class="text-[12px] text-red-500 ml-1 min-h-[14px]">{{ errors.username || '' }}</p>
          </div>

          <div class="space-y-2">
            <div class="flex justify-between items-center px-1">
              <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400">安全密钥</label>
              <button
                v-if="mode === 'login'"
                type="button"
                class="text-[11px] font-bold text-indigo-600 hover:underline uppercase tracking-tighter"
              >
                忘记密钥？
              </button>
            </div>
            <div class="relative flex items-center">
              <Lock class="absolute left-5 text-neutral-300" :size="16" />
              <input
                v-model="formData.password"
                type="password"
                placeholder="6-20位密码"
                :class="[
                  'w-full pl-12 pr-4 py-3.5 bg-stone-50 border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all placeholder:text-neutral-300',
                  errors.password
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-black/5 focus:ring-indigo-100'
                ]"
              />
            </div>
            <p class="text-[10px] text-red-500 ml-1 min-h-[14px]">{{ errors.password || '' }}</p>
          </div>

          <div
            v-if="mode === 'register'"
            class="space-y-2 animate-in fade-in slide-in-from-top-2"
          >
            <label class="text-[12px] font-bold uppercase tracking-widest text-neutral-400 ml-1">确认密钥</label>
            <div class="relative flex items-center">
              <Lock class="absolute left-5 text-neutral-300" :size="16" />
              <input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                :class="[
                  'w-full pl-12 pr-4 py-3.5 bg-stone-50 border rounded-2xl text-sm focus:outline-none focus:ring-4 transition-all placeholder:text-neutral-300',
                  errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-black/5 focus:ring-indigo-100'
                ]"
              />
            </div>
            <p class="text-[10px] text-red-500 ml-1 min-h-[14px]">{{ errors.confirmPassword || '' }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            :class="[
              'w-full py-4 rounded-2xl bg-black text-white text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 overflow-hidden',
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            ]"
          >
            <div v-if="isLoading" class="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <template v-else>
              {{ mode === 'login' ? '登录' : '注册' }}
              <ArrowRight :size="16" />
            </template>
          </button>
        </form>

        <div class="mt-10">
          <div class="relative flex items-center justify-center mb-8">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-black/5"></div>
            </div>
            <span class="relative bg-white px-4 text-[9px] mono uppercase tracking-widest text-neutral-300">第三方同步</span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <button class="flex items-center justify-center gap-3 py-3 border border-black/5 rounded-2xl hover:bg-stone-50 transition-all">
              <Github :size="18" class="text-neutral-900" />
              <span class="text-[10px] font-bold uppercase tracking-widest">Github</span>
            </button>
            <button class="flex items-center justify-center gap-3 py-3 border border-black/5 rounded-2xl hover:bg-stone-50 transition-all">
              <Chrome :size="18" class="text-neutral-900" />
              <span class="text-[10px] font-bold uppercase tracking-widest">Google</span>
            </button>
          </div>
        </div>
      </div>
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

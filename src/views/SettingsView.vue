<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  Check,
  Loader2
} from 'lucide-vue-next'
import { userApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { toast } from 'vue-sonner'

const router = useRouter()
const userStore = useUserStore()
const isSidebarOpen = ref(true)
const activeView = ref('settings')

// 当前活动标签
const activeTab = ref('account')

// 账号设置
const usernameForm = ref({
  username: userStore.username || '',
  currentPassword: ''
})

// 密码修改
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 显示密码
const showPassword = ref({
  current: false, // 账号设置中的当前密码
  old: false,     // 修改密码中的当前密码
  new: false,
  confirm: false
})

// 加载状态
const saving = ref({
  username: false,
  password: false
})

// 保存用户名
const saveUsername = async () => {
  if (!usernameForm.value.username.trim()) {
    toast.error('用户名不能为空')
    return
  }
  if (!usernameForm.value.currentPassword) {
    toast.error('请输入当前密码以验证身份')
    return
  }

  saving.value.username = true
  try {
    await userApi.updateUsername({
      newUsername: usernameForm.value.username,
      password: usernameForm.value.currentPassword
    }, { showErrorMessage: false })
    userStore.setUsername(usernameForm.value.username)
    toast.success('用户名修改成功')
    usernameForm.value.currentPassword = ''
  } catch (error: any) {
    toast.error(error.message || '用户名修改失败')
  } finally {
    saving.value.username = false
  }
}

// 修改密码
const changePassword = async () => {
  if (!passwordForm.value.oldPassword) {
    toast.error('请输入当前密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    toast.error('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    toast.error('新密码长度至少为6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('两次输入的密码不一致')
    return
  }

  saving.value.password = true
  try {
    await userApi.updatePassword(passwordForm.value, { showErrorMessage: false })
    toast.success('密码修改成功，请重新登录')
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error: any) {
    toast.error(error.message || '密码修改失败')
  } finally {
    saving.value.password = false
  }
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen w-full overflow-hidden relative bg-[#fcfaf7]">
    <AppSidebar v-model:active-view="activeView" :is-open="isSidebarOpen" @toggle="toggleSidebar" />

    <main class="flex-1 flex flex-col min-w-0 z-10">
      <AppHeader :active-view="activeView" />

      <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div class="max-w-5xl mx-auto space-y-6 pb-8">
          <!-- 页面标题 -->
          <div>
            <h1 class="text-3xl font-medium tracking-tight text-neutral-900 mb-2">设置</h1>
            <p class="text-neutral-500">管理您的账户信息</p>
          </div>

          <Separator class="bg-black/5" />

          <!-- 设置标签页 -->
          <Tabs v-model="activeTab" class="space-y-6">
            <TabsList class="bg-white border border-black/5 p-1 rounded-xl shadow-sm">
              <TabsTrigger value="account" class="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
                <User :size="16" class="mr-2" />
                账号
              </TabsTrigger>
              <TabsTrigger value="security" class="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
                <KeyRound :size="16" class="mr-2" />
                安全
              </TabsTrigger>
            </TabsList>

            <!-- 账号设置 -->
            <TabsContent value="account" class="space-y-6">
              <Card class="border-black/5 shadow-sm">
                <CardHeader>
                  <CardTitle class="text-lg flex items-center gap-2">
                    <User :size="20" />
                    个人资料
                  </CardTitle>
                  <CardDescription>更新您的个人信息</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="space-y-2 max-w-md">
                    <label class="text-sm font-medium text-neutral-700">用户名</label>
                    <Input
                      v-model="usernameForm.username"
                      placeholder="请输入新用户名"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">当前密码</label>
                    <div class="relative max-w-md">
                      <Input
                        v-model="usernameForm.currentPassword"
                        :type="showPassword.current ? 'text' : 'password'"
                        placeholder="请输入当前密码以验证身份"
                      />
                      <button
                        @click="showPassword.current = !showPassword.current"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Eye v-if="showPassword.current" :size="16" />
                        <EyeOff v-else :size="16" />
                      </button>
                    </div>
                  </div>
                  <div class="pt-2">
                    <Button
                      @click="saveUsername"
                      :disabled="saving.username"
                      class="bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Loader2 v-if="saving.username" :size="16" class="mr-2 animate-spin" />
                      <Save v-else :size="16" class="mr-2" />
                      保存修改
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- 安全设置 -->
            <TabsContent value="security" class="space-y-6">
              <Card class="border-black/5 shadow-sm">
                <CardHeader>
                  <CardTitle class="text-lg flex items-center gap-2">
                    <KeyRound :size="20" />
                    修改密码
                  </CardTitle>
                  <CardDescription>定期修改密码以保护账户安全</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">当前密码</label>
                    <div class="relative max-w-md">
                      <Input
                        v-model="passwordForm.oldPassword"
                        :type="showPassword.old ? 'text' : 'password'"
                        placeholder="请输入当前密码"
                      />
                      <button
                        @click="showPassword.old = !showPassword.old"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Eye v-if="showPassword.old" :size="16" />
                        <EyeOff v-else :size="16" />
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">新密码</label>
                    <div class="relative max-w-md">
                      <Input
                        v-model="passwordForm.newPassword"
                        :type="showPassword.new ? 'text' : 'password'"
                        placeholder="请输入新密码（至少6位）"
                      />
                      <button
                        @click="showPassword.new = !showPassword.new"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Eye v-if="showPassword.new" :size="16" />
                        <EyeOff v-else :size="16" />
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">确认新密码</label>
                    <div class="relative max-w-md">
                      <Input
                        v-model="passwordForm.confirmPassword"
                        :type="showPassword.confirm ? 'text' : 'password'"
                        placeholder="请再次输入新密码"
                      />
                      <button
                        @click="showPassword.confirm = !showPassword.confirm"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Eye v-if="showPassword.confirm" :size="16" />
                        <EyeOff v-else :size="16" />
                      </button>
                    </div>
                  </div>
                  <div class="pt-2">
                    <Button
                      @click="changePassword"
                      :disabled="saving.password"
                      class="bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Loader2 v-if="saving.password" :size="16" class="mr-2 animate-spin" />
                      <Check v-else :size="16" class="mr-2" />
                      修改密码
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
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

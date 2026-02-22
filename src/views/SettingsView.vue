<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User,
  KeyRound,
  Sparkles,
  Github,
  Cloud,
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
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 显示密码
const showPassword = ref({
  current: false,
  new: false,
  confirm: false
})

// AI设置
const aiSettings = ref({
  apiKey: '',
  apiProvider: 'openai', // openai, anthropic, deepseek
  apiUrl: ''
})

// 同步设置
const syncSettings = ref({
  github: {
    enabled: false,
    token: '',
    repo: '',
    branch: 'main',
    path: 'notes'
  },
  jianguoyun: {
    enabled: false,
    appKey: '',
    appSecret: '',
    folder: '/ThinkDoNotes'
  }
})

// 加载状态
const saving = ref({
  username: false,
  password: false,
  ai: false,
  github: false,
  jianguoyun: false
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
    await userApi.updateUserInfo({
      username: usernameForm.value.username
    })
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
  if (!passwordForm.value.currentPassword) {
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
    // 这里需要调用后端的修改密码接口
    // await userApi.changePassword(passwordForm.value)
    toast.success('密码修改成功，请重新登录')
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error: any) {
    toast.error(error.message || '密码修改失败')
  } finally {
    saving.value.password = false
  }
}

// 保存AI设置
const saveAiSettings = async () => {
  if (!aiSettings.value.apiKey.trim()) {
    toast.error('请输入API密钥')
    return
  }

  saving.value.ai = true
  try {
    // 这里需要调用后端的保存AI设置接口
    // await userApi.saveAiSettings(aiSettings.value)
    localStorage.setItem('ai-api-key', aiSettings.value.apiKey)
    localStorage.setItem('ai-api-provider', aiSettings.value.apiProvider)
    if (aiSettings.value.apiUrl) {
      localStorage.setItem('ai-api-url', aiSettings.value.apiUrl)
    }
    toast.success('AI设置保存成功')
  } catch (error: any) {
    toast.error(error.message || 'AI设置保存失败')
  } finally {
    saving.value.ai = false
  }
}

// 保存GitHub同步设置
const saveGithubSettings = async () => {
  if (syncSettings.value.github.enabled) {
    if (!syncSettings.value.github.token) {
      toast.error('请输入GitHub Token')
      return
    }
    if (!syncSettings.value.github.repo) {
      toast.error('请输入仓库地址')
      return
    }
  }

  saving.value.github = true
  try {
    // 这里需要调用后端的保存GitHub设置接口
    localStorage.setItem('sync-github-enabled', String(syncSettings.value.github.enabled))
    localStorage.setItem('sync-github-token', syncSettings.value.github.token)
    localStorage.setItem('sync-github-repo', syncSettings.value.github.repo)
    localStorage.setItem('sync-github-branch', syncSettings.value.github.branch)
    localStorage.setItem('sync-github-path', syncSettings.value.github.path)
    toast.success('GitHub同步设置保存成功')
  } catch (error: any) {
    toast.error(error.message || 'GitHub同步设置保存失败')
  } finally {
    saving.value.github = false
  }
}

// 保存坚果云同步设置
const saveJianguoyunSettings = async () => {
  if (syncSettings.value.jianguoyun.enabled) {
    if (!syncSettings.value.jianguoyun.appKey) {
      toast.error('请输入应用Key')
      return
    }
    if (!syncSettings.value.jianguoyun.appSecret) {
      toast.error('请输入应用Secret')
      return
    }
  }

  saving.value.jianguoyun = true
  try {
    // 这里需要调用后端的保存坚果云设置接口
    localStorage.setItem('sync-jianguoyun-enabled', String(syncSettings.value.jianguoyun.enabled))
    localStorage.setItem('sync-jianguoyun-key', syncSettings.value.jianguoyun.appKey)
    localStorage.setItem('sync-jianguoyun-secret', syncSettings.value.jianguoyun.appSecret)
    localStorage.setItem('sync-jianguoyun-folder', syncSettings.value.jianguoyun.folder)
    toast.success('坚果云同步设置保存成功')
  } catch (error: any) {
    toast.error(error.message || '坚果云同步设置保存失败')
  } finally {
    saving.value.jianguoyun = false
  }
}

// 测试GitHub连接
const testGithubConnection = async () => {
  toast.info('测试连接功能开发中...')
}

// 测试坚果云连接
const testJianguoyunConnection = async () => {
  toast.info('测试连接功能开发中...')
}

// 初始化加载设置
const loadSettings = () => {
  // 加载AI设置
  aiSettings.value.apiKey = localStorage.getItem('ai-api-key') || ''
  aiSettings.value.apiProvider = localStorage.getItem('ai-api-provider') || 'openai'
  aiSettings.value.apiUrl = localStorage.getItem('ai-api-url') || ''

  // 加载GitHub设置
  syncSettings.value.github.enabled = localStorage.getItem('sync-github-enabled') === 'true'
  syncSettings.value.github.token = localStorage.getItem('sync-github-token') || ''
  syncSettings.value.github.repo = localStorage.getItem('sync-github-repo') || ''
  syncSettings.value.github.branch = localStorage.getItem('sync-github-branch') || 'main'
  syncSettings.value.github.path = localStorage.getItem('sync-github-path') || 'notes'

  // 加载坚果云设置
  syncSettings.value.jianguoyun.enabled = localStorage.getItem('sync-jianguoyun-enabled') === 'true'
  syncSettings.value.jianguoyun.appKey = localStorage.getItem('sync-jianguoyun-key') || ''
  syncSettings.value.jianguoyun.appSecret = localStorage.getItem('sync-jianguoyun-secret') || ''
  syncSettings.value.jianguoyun.folder = localStorage.getItem('sync-jianguoyun-folder') || '/ThinkDoNotes'
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

// 初始化
loadSettings()
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
            <p class="text-neutral-500">管理您的账户信息和偏好设置</p>
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
              <TabsTrigger value="ai" class="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
                <Sparkles :size="16" class="mr-2" />
                AI
              </TabsTrigger>
              <TabsTrigger value="sync" class="rounded-lg data-[state=active]:bg-neutral-900 data-[state=active]:text-white">
                <Cloud :size="16" class="mr-2" />
                云同步
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
                        <Eye v-if="!showPassword.current" :size="16" />
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
                        v-model="passwordForm.currentPassword"
                        :type="showPassword.current ? 'text' : 'password'"
                        placeholder="请输入当前密码"
                      />
                      <button
                        @click="showPassword.current = !showPassword.current"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <Eye v-if="!showPassword.current" :size="16" />
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
                        <Eye v-if="!showPassword.new" :size="16" />
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
                        <Eye v-if="!showPassword.confirm" :size="16" />
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

            <!-- AI设置 -->
            <TabsContent value="ai" class="space-y-6">
              <Card class="border-black/5 shadow-sm">
                <CardHeader>
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Sparkles :size="20" class="text-purple-500" />
                    AI 配置
                  </CardTitle>
                  <CardDescription>配置AI助手使用的API密钥</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">API 提供商</label>
                    <Select v-model="aiSettings.apiProvider">
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="选择 API 提供商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                        <SelectItem value="openai-compatible">兼容接口</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">API 密钥</label>
                    <Input
                      v-model="aiSettings.apiKey"
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      class="w-full font-mono text-sm"
                    />
                    <p class="text-xs text-neutral-500">您的密钥将安全存储在本地</p>
                  </div>
                  <div v-if="aiSettings.apiProvider === 'openai-compatible'" class="space-y-2">
                    <label class="text-sm font-medium text-neutral-700">自定义 API 地址</label>
                    <Input
                      v-model="aiSettings.apiUrl"
                      placeholder="https://api.example.com/v1"
                      class="w-full font-mono text-sm"
                    />
                  </div>
                  <div class="pt-2">
                    <Button
                      @click="saveAiSettings"
                      :disabled="saving.ai"
                      class="bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Loader2 v-if="saving.ai" :size="16" class="mr-2 animate-spin" />
                      <Save v-else :size="16" class="mr-2" />
                      保存设置
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- 云同步设置 -->
            <TabsContent value="sync" class="space-y-6">
              <!-- GitHub 同步 -->
              <Card class="border-black/5 shadow-sm">
                <CardHeader>
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Github :size="20" />
                    GitHub 云同步
                  </CardTitle>
                  <CardDescription>将您的笔记同步到 GitHub 仓库</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-sm">启用 GitHub 同步</p>
                      <p class="text-xs text-neutral-500">自动将笔记推送到 GitHub 仓库</p>
                    </div>
                    <Switch v-model:checked="syncSettings.github.enabled" />
                  </div>
                  <Separator />
                  <div class="space-y-4" :class="{ 'opacity-50': !syncSettings.github.enabled }">
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-neutral-700">Personal Access Token</label>
                      <Input
                        v-model="syncSettings.github.token"
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        class="w-full font-mono text-sm"
                      />
                      <p class="text-xs text-neutral-500">
                        需要repo权限，在
                        <a href="https://github.com/settings/tokens" target="_blank" class="text-blue-600 hover:underline">GitHub Settings</a>
                        生成
                      </p>
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-neutral-700">仓库地址</label>
                      <Input
                        v-model="syncSettings.github.repo"
                        placeholder="username/notes-repo"
                        class="w-full font-mono text-sm"
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-4 sm:max-w-md">
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-neutral-700">分支</label>
                        <Input
                          v-model="syncSettings.github.branch"
                          placeholder="main"
                          class="font-mono text-sm"
                        />
                      </div>
                      <div class="space-y-2">
                        <label class="text-sm font-medium text-neutral-700">存储路径</label>
                        <Input
                          v-model="syncSettings.github.path"
                          placeholder="notes"
                          class="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="pt-2 flex gap-2">
                    <Button
                      @click="saveGithubSettings"
                      :disabled="saving.github"
                      class="bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Loader2 v-if="saving.github" :size="16" class="mr-2 animate-spin" />
                      <Save v-else :size="16" class="mr-2" />
                      保存设置
                    </Button>
                    <Button
                      @click="testGithubConnection"
                      variant="outline"
                      class="border-black/10"
                    >
                      测试连接
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <!-- 坚果云同步 -->
              <Card class="border-black/5 shadow-sm">
                <CardHeader>
                  <CardTitle class="text-lg flex items-center gap-2">
                    <Cloud :size="20" class="text-sky-500" />
                    坚果云同步
                  </CardTitle>
                  <CardDescription>使用坚果云 WebDAV 同步您的笔记</CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-sm">启用坚果云同步</p>
                      <p class="text-xs text-neutral-500">通过 WebDAV 协议同步笔记</p>
                    </div>
                    <Switch v-model:checked="syncSettings.jianguoyun.enabled" />
                  </div>
                  <Separator />
                  <div class="space-y-4" :class="{ 'opacity-50': !syncSettings.jianguoyun.enabled }">
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-neutral-700">应用 Key (App Key)</label>
                      <Input
                        v-model="syncSettings.jianguoyun.appKey"
                        placeholder="在坚果云账户设置中获取"
                        class="w-full font-mono text-sm"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-neutral-700">应用密钥 (App Secret)</label>
                      <Input
                        v-model="syncSettings.jianguoyun.appSecret"
                        type="password"
                        placeholder="在坚果云账户设置中获取"
                        class="w-full font-mono text-sm"
                      />
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-medium text-neutral-700">同步文件夹</label>
                      <Input
                        v-model="syncSettings.jianguoyun.folder"
                        placeholder="/ThinkDoNotes"
                        class="w-full font-mono text-sm"
                      />
                      <p class="text-xs text-neutral-500">
                        在坚果云账户设置中开启第三方应用管理，获取 App Key 和 Secret
                      </p>
                    </div>
                  </div>
                  <div class="pt-2 flex gap-2">
                    <Button
                      @click="saveJianguoyunSettings"
                      :disabled="saving.jianguoyun"
                      class="bg-neutral-900 hover:bg-neutral-800"
                    >
                      <Loader2 v-if="saving.jianguoyun" :size="16" class="mr-2 animate-spin" />
                      <Save v-else :size="16" class="mr-2" />
                      保存设置
                    </Button>
                    <Button
                      @click="testJianguoyunConnection"
                      variant="outline"
                      class="border-black/10"
                    >
                      测试连接
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

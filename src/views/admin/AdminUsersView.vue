<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, KeyRound } from 'lucide-vue-next'
import { adminUserApi, type AdminUserInfo } from '@/api/admin'
import { toast } from 'vue-sonner'

const loading = ref(false)
const users = ref<AdminUserInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const filterRole = ref<string | undefined>(undefined)

// 角色分配对话框
const showRoleDialog = ref(false)
const roleForm = ref({ userId: 0, username: '', roleName: 'USER' })

// 删除确认对话框
const showDeleteDialog = ref(false)
const deletingUser = ref<AdminUserInfo | null>(null)

// 重置密码确认对话框
const showResetPasswordDialog = ref(false)
const resettingUser = ref<AdminUserInfo | null>(null)

// 总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 获取角色 badge 样式
const getRoleClass = (role: string) => {
  if (role === 'ADMIN') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

// 获取角色中文名
const getRoleLabel = (role: string) => {
  return role === 'ADMIN' ? '管理员' : '普通用户'
}

// 格式化时间
const formatTime = (t: string | null) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

// 加载数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await adminUserApi.getList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      username: searchUsername.value || undefined,
      role: filterRole.value === 'all' ? undefined : filterRole.value
    })
    users.value = res.records
    total.value = res.total
  } catch {
    toast.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pageNum.value = 1
  fetchData()
}

// 清空筛选
const clearFilters = () => {
  searchUsername.value = ''
  filterRole.value = undefined
  pageNum.value = 1
  fetchData()
}

// 翻页
const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  pageNum.value = page
  fetchData()
}

// 打开角色分配对话框
const openRoleDialog = (user: AdminUserInfo) => {
  roleForm.value = { userId: user.id, username: user.username, roleName: user.role }
  showRoleDialog.value = true
}

// 提交角色变更
const handleRoleChange = async () => {
  try {
    await adminUserApi.changeRole({
      userId: roleForm.value.userId,
      roleName: roleForm.value.roleName
    })
    toast.success('角色修改成功')
    showRoleDialog.value = false
    fetchData()
  } catch {
    toast.error('角色修改失败')
  }
}

// 打开删除确认对话框
const openDeleteDialog = (user: AdminUserInfo) => {
  deletingUser.value = user
  showDeleteDialog.value = true
}

// 确认删除用户
const confirmDelete = async () => {
  if (!deletingUser.value) return
  try {
    await adminUserApi.delete(deletingUser.value.id)
    toast.success('用户删除成功')
    showDeleteDialog.value = false
    fetchData()
  } catch {
    toast.error('用户删除失败')
  }
}

// 打开重置密码确认对话框
const openResetPasswordDialog = (user: AdminUserInfo) => {
  resettingUser.value = user
  showResetPasswordDialog.value = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  if (!resettingUser.value) return
  try {
    await adminUserApi.resetPassword({
      userId: resettingUser.value.id,
      newPassword: '123456'
    })
    toast.success('密码重置成功，新密码为：123456')
    showResetPasswordDialog.value = false
  } catch {
    toast.error('密码重置失败')
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchUsername"
              placeholder="搜索用户名"
              class="!h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="w-[130px]">
            <Select v-model="filterRole" @update:model-value="handleSearch">
              <SelectTrigger class="!h-10 w-full border-slate-200 bg-white text-slate-600">
                <SelectValue placeholder="全部角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="USER">普通用户</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="lg" class="rounded-md border-slate-200 bg-white" @click="clearFilters">
            清空筛选
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div v-if="loading" class="flex items-center justify-center py-12 text-sm text-slate-500">
          加载中...
        </div>
        <div v-else-if="users.length === 0" class="flex items-center justify-center py-12 text-sm text-slate-500">
          暂无数据
        </div>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px] text-left text-sm">
              <thead class="bg-slate-50 text-slate-500">
                <tr>
                  <th class="px-4 py-3 font-medium">用户名</th>
                  <th class="px-4 py-3 font-medium">角色</th>
                  <th class="px-4 py-3 font-medium">创建时间</th>
                  <th class="px-4 py-3 font-medium">更新时间</th>
                  <th class="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id" class="border-t border-slate-200">
                  <td class="px-4 py-3 text-slate-900">{{ user.username }}</td>
                  <td class="px-4 py-3">
                    <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getRoleClass(user.role)]">
                      {{ getRoleLabel(user.role) }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(user.createdAt) }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ formatTime(user.updatedAt) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2">
                      <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs" @click="openRoleDialog(user)">
                        分配角色
                      </Button>
                      <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs" @click="openResetPasswordDialog(user)">
                        重置密码
                      </Button>
                      <Button variant="outline" class="h-8 rounded-md border-rose-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50" @click="openDeleteDialog(user)">
                        删除
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="mt-4 flex items-center justify-between text-sm text-slate-500">
            <span>共 {{ total }} 条，第 {{ pageNum }} / {{ totalPages || 1 }} 页</span>
            <div class="flex gap-1">
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="pageNum <= 1" @click="handlePageChange(pageNum - 1)">
                <ChevronLeft class="size-4" />
              </Button>
              <Button variant="outline" size="icon" class="h-8 w-8 rounded-md border-slate-200" :disabled="pageNum >= totalPages" @click="handlePageChange(pageNum + 1)">
                <ChevronRight class="size-4" />
              </Button>
            </div>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- 角色分配对话框 -->
    <Teleport to="body">
      <div v-if="showRoleDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showRoleDialog = false">
        <div class="w-[320px] rounded-lg border border-slate-200 bg-white p-5 shadow-lg">
          <h3 class="text-base font-semibold text-slate-900">分配角色</h3>
          <p class="mt-2 text-sm text-slate-500">用户：{{ roleForm.username }}</p>
          <div class="mt-4">
            <label class="mb-1.5 block text-sm font-medium text-slate-700">角色</label>
            <Select v-model="roleForm.roleName">
              <SelectTrigger class="h-9 w-full border-slate-200 bg-white text-slate-600 text-sm">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent class="w-full min-w-0">
                <SelectItem value="USER">普通用户</SelectItem>
                <SelectItem value="ADMIN">管理员</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <Button variant="outline" class="h-8 rounded-md border-slate-200 px-3 text-sm" @click="showRoleDialog = false">取消</Button>
            <Button class="h-8 rounded-md bg-slate-900 px-3 text-sm text-white hover:bg-slate-800" @click="handleRoleChange">确认</Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="w-[360px] p-5">
        <DialogHeader class="space-y-2">
          <DialogTitle class="text-base font-semibold">删除用户</DialogTitle>
          <DialogDescription class="text-sm text-slate-600">
            确定删除用户「{{ deletingUser?.username }}」吗？此操作不可恢复。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-4 flex justify-end gap-2">
          <Button variant="outline" class="h-8 rounded-md border-slate-200 px-3 text-sm" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" class="h-8 rounded-md px-3 text-sm" @click="confirmDelete">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 重置密码确认对话框 -->
    <Dialog v-model:open="showResetPasswordDialog">
      <DialogContent class="w-[360px] p-5">
        <DialogHeader class="space-y-2">
          <DialogTitle class="text-base font-semibold">重置密码</DialogTitle>
          <DialogDescription class="text-sm text-slate-600">
            确定重置用户「{{ resettingUser?.username }}」的密码吗？密码将重置为 <span class="font-medium text-slate-900">123456</span>。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter class="mt-4 flex justify-end gap-2">
          <Button variant="outline" class="h-8 rounded-md border-slate-200 px-3 text-sm" @click="showResetPasswordDialog = false">取消</Button>
          <Button class="h-8 rounded-md bg-slate-900 px-3 text-sm text-white hover:bg-slate-800" @click="confirmResetPassword">确认重置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

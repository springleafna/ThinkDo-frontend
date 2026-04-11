<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { adminUserApi, type AdminUserInfo } from '@/api/admin'
import { toast } from 'vue-sonner'

const loading = ref(false)
const users = ref<AdminUserInfo[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const searchUsername = ref('')
const filterRole = ref<string>('')

// 角色分配对话框
const showRoleDialog = ref(false)
const roleForm = ref({ userId: 0, username: '', roleName: 'USER' })

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
      role: filterRole.value || undefined
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
  filterRole.value = ''
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

// 删除用户
const handleDelete = async (user: AdminUserInfo) => {
  if (!confirm(`确定删除用户「${user.username}」吗？此操作不可恢复。`)) return
  try {
    await adminUserApi.delete(user.id)
    toast.success('用户删除成功')
    fetchData()
  } catch {
    toast.error('用户删除失败')
  }
}

onMounted(() => fetchData())
</script>

<template>
  <div class="space-y-4">
    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle class="text-xl font-semibold text-slate-900">用户账号列表</CardTitle>
            <CardDescription class="mt-2 text-sm leading-6 text-slate-500">
              对应 tb_user、tb_user_role，查看账号状态、角色分配和最近更新时间。共 {{ total }} 个用户。
            </CardDescription>
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              v-model="searchUsername"
              placeholder="搜索用户名"
              class="h-10 border-slate-200 bg-white pl-10"
              @keyup.enter="handleSearch"
            />
          </div>
          <select
            v-model="filterRole"
            class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600"
            @change="handleSearch"
          >
            <option value="">全部角色</option>
            <option value="USER">普通用户</option>
            <option value="ADMIN">管理员</option>
          </select>
          <Button variant="outline" class="h-10 rounded-md border-slate-200 bg-white" @click="clearFilters">
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
                      <Button variant="outline" class="h-8 rounded-md border-rose-200 bg-white px-3 text-xs text-rose-600 hover:bg-rose-50" @click="handleDelete(user)">
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
        <div class="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
          <h3 class="text-lg font-semibold text-slate-900">分配角色</h3>
          <p class="mt-2 text-sm text-slate-500">用户：{{ roleForm.username }}</p>
          <div class="mt-4">
            <label class="mb-1 block text-sm font-medium text-slate-700">角色</label>
            <select v-model="roleForm.roleName" class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <option value="USER">普通用户</option>
              <option value="ADMIN">管理员</option>
            </select>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <Button variant="outline" class="rounded-md border-slate-200" @click="showRoleDialog = false">取消</Button>
            <Button class="rounded-md bg-slate-900 text-white hover:bg-slate-800" @click="handleRoleChange">确认</Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
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
import { Search, UserPlus } from 'lucide-vue-next'

const summary = [
  { label: '用户总数', value: '3,286' },
  { label: '管理员账号', value: '12' },
  { label: '角色数量', value: '2' },
  { label: '待复核权限', value: '5' }
]

const userRows = [
  {
    username: 'zhangmin',
    role: 'ADMIN',
    createdAt: '2026-01-12 10:24',
    updatedAt: '2026-03-22 09:10',
    status: '正常',
    deleted: '否'
  },
  {
    username: 'wangning',
    role: 'USER',
    createdAt: '2026-02-06 14:32',
    updatedAt: '2026-03-22 14:55',
    status: '正常',
    deleted: '否'
  },
  {
    username: 'liyue',
    role: 'ADMIN',
    createdAt: '2026-02-18 09:08',
    updatedAt: '2026-03-21 18:20',
    status: '待复核',
    deleted: '否'
  },
  {
    username: 'chentao',
    role: 'USER',
    createdAt: '2026-03-08 20:16',
    updatedAt: '2026-03-22 08:30',
    status: '正常',
    deleted: '否'
  }
]

const roleRows = [
  {
    role: 'USER',
    description: '普通用户，使用对话、知识库、笔记与计划能力',
    relationCount: '3,274',
    table: 'tb_role / tb_user_role'
  },
  {
    role: 'ADMIN',
    description: '管理员账号，可进入后台并治理平台数据',
    relationCount: '12',
    table: 'tb_role / tb_user_role'
  }
]

const getStatusClass = (status: string) => {
  if (status === '待复核') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}
</script>

<template>
  <div class="space-y-4">
    <section class="grid gap-4 md:grid-cols-4">
      <Card v-for="item in summary" :key="item.label" class="border-slate-200 bg-white shadow-none">
        <CardHeader class="pb-2">
          <CardDescription class="text-sm text-slate-500">{{ item.label }}</CardDescription>
          <CardTitle class="text-2xl font-semibold text-slate-900">{{ item.value }}</CardTitle>
        </CardHeader>
      </Card>
    </section>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader class="gap-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle class="text-xl font-semibold text-slate-900">用户账号列表</CardTitle>
            <CardDescription class="mt-2 text-sm leading-6 text-slate-500">
              对应 tb_user、tb_user_role，查看账号状态、角色分配和最近更新时间。
            </CardDescription>
          </div>
          <div class="flex gap-3">
            <Button variant="outline" class="rounded-md border-slate-200 bg-white">
              导出账号
            </Button>
            <Button variant="outline" class="rounded-md border-slate-200 bg-white">
              <UserPlus class="size-4" />
              新建管理员
            </Button>
          </div>
        </div>

        <div class="flex flex-col gap-3 lg:flex-row">
          <div class="relative max-w-md flex-1">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input model-value="" placeholder="搜索用户名或角色" class="h-10 border-slate-200 bg-white pl-10" />
          </div>
          <select class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>全部角色</option>
            <option>USER</option>
            <option>ADMIN</option>
          </select>
          <select class="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>全部状态</option>
            <option>正常</option>
            <option>待复核</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[980px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">用户名</th>
                <th class="px-4 py-3 font-medium">角色</th>
                <th class="px-4 py-3 font-medium">创建时间</th>
                <th class="px-4 py-3 font-medium">更新时间</th>
                <th class="px-4 py-3 font-medium">删除标记</th>
                <th class="px-4 py-3 font-medium">状态</th>
                <th class="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in userRows" :key="row.username" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.username }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.role }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.createdAt }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.updatedAt }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.deleted }}</td>
                <td class="px-4 py-3">
                  <Badge variant="outline" :class="['rounded-md px-2 py-0.5 text-xs', getStatusClass(row.status)]">
                    {{ row.status }}
                  </Badge>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">查看</Button>
                    <Button variant="outline" class="h-8 rounded-md border-slate-200 bg-white px-3 text-xs">分配角色</Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    <Card class="border-slate-200 bg-white shadow-none">
      <CardHeader>
        <CardTitle class="text-xl font-semibold text-slate-900">角色与权限关系</CardTitle>
        <CardDescription class="text-sm text-slate-500">
          结合 tb_role 与 tb_user_role，查看当前角色定义与关联规模。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-slate-50 text-slate-500">
              <tr>
                <th class="px-4 py-3 font-medium">角色</th>
                <th class="px-4 py-3 font-medium">说明</th>
                <th class="px-4 py-3 font-medium">关联用户数</th>
                <th class="px-4 py-3 font-medium">关联表</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in roleRows" :key="row.role" class="border-t border-slate-200">
                <td class="px-4 py-3 text-slate-900">{{ row.role }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.description }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.relationCount }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.table }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

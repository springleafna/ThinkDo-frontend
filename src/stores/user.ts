import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const username = ref<string>(localStorage.getItem('username') || '')
  const role = ref<string>(localStorage.getItem('role') || '')

  const setToken = (newToken: string) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUsername = (newUsername: string) => {
    username.value = newUsername
    if (newUsername) {
      localStorage.setItem('username', newUsername)
    } else {
      localStorage.removeItem('username')
    }
  }

  const setRole = (newRole: string) => {
    role.value = newRole
    if (newRole) {
      localStorage.setItem('role', newRole)
    } else {
      localStorage.removeItem('role')
    }
  }

  const logout = () => {
    setToken('')
    setUsername('')
    setRole('')
  }

  const isLoggedIn = () => {
    return !!token.value
  }

  const isAdmin = () => {
    return role.value === 'ADMIN'
  }

  return {
    token,
    username,
    role,
    setToken,
    setUsername,
    setRole,
    logout,
    isLoggedIn,
    isAdmin
  }
})

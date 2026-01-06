import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const username = ref<string>(localStorage.getItem('username') || '')

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

  const logout = () => {
    setToken('')
    setUsername('')
  }

  const isLoggedIn = () => {
    return !!token.value
  }

  return {
    token,
    username,
    setToken,
    setUsername,
    logout,
    isLoggedIn
  }
})

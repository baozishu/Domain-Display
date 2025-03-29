"use client"

import React from "react"

// 添加用户信息接口
interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: "admin" | "editor"
}

// Update the interface to match our API
interface AuthContextType {
  isLoggedIn: boolean
  user: User | null
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  resetPassword: () => Promise<boolean>
  resetPasswordByCode: (securityCode: string) => Promise<boolean>
  getCurrentPassword: () => Promise<string | null>
  getSecurityCode: () => Promise<string>
  updateSecurityCode: (securityCode: string) => Promise<boolean>
}

// Create the context with default values
const AuthContext = React.createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  login: async () => false,
  logout: async () => {},
  updatePassword: async () => false,
  resetPassword: async () => false,
  resetPasswordByCode: async () => false,
  getCurrentPassword: async () => null,
  getSecurityCode: async () => "",
  updateSecurityCode: async () => false,
})

// 模拟默认用户信息
const DEFAULT_USER: User = {
  id: "1",
  name: "管理员",
  email: "admin@example.com",
  role: "admin",
  avatarUrl: "/admin-avatar.png"
}

// Update the AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Check database structure
  const checkDatabase = async () => {
    try {
      console.log("检查数据库结构...")
      const response = await fetch("/api/check-db")
      if (response.ok) {
        console.log("数据库检查完成")
      } else {
        console.error("数据库检查失败:", await response.text())
      }
    } catch (error) {
      console.error("数据库检查请求失败:", error)
    }
  }

  // Check login status on mount
  React.useEffect(() => {
    let isMounted = true

    async function checkAuthStatus() {
      if (!isMounted) return

      try {
        // 首先检查并修复数据库结构
        await checkDatabase()
        
        const response = await fetch("/api/auth")
        if (response.ok) {
          const data = await response.json()
          if (isMounted) {
            setIsLoggedIn(data.isLoggedIn)
            if (data.isLoggedIn) {
              // 如果登录成功，获取用户信息 (从API或使用默认值)
              const userResponse = await fetch("/api/auth/user")
              if (userResponse.ok) {
                const userData = await userResponse.json()
                setUser(userData)
              } else {
                // 使用默认用户信息
                setUser(DEFAULT_USER)
              }
            } else {
              setUser(null)
            }
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        // 开发环境下使用默认值
        if (process.env.NODE_ENV === "development") {
          setIsLoggedIn(true)
          setUser(DEFAULT_USER)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkAuthStatus()

    return () => {
      isMounted = false
    }
  }, [])

  // Login function
  const login = async (password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with password:", password)

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      console.log("Login response status:", response.status)

      const data = await response.json()
      console.log("Login response data:", data)

      if (response.ok) {
        setIsLoggedIn(true)
        
        // 登录成功，获取用户信息
        try {
          const userResponse = await fetch("/api/auth/user")
          if (userResponse.ok) {
            const userData = await userResponse.json()
            setUser(userData)
          } else {
            // 使用默认用户信息
            setUser(DEFAULT_USER)
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUser(DEFAULT_USER)
        }
        
        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const response = await fetch("/api/auth", {
        method: "DELETE",
      })

      if (response.ok) {
        setIsLoggedIn(false)
        setUser(null)
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      return response.ok
    } catch (error) {
      console.error("Update password error:", error)
      return false
    }
  }

  // Reset password
  const resetPassword = async (): Promise<boolean> => {
    try {
      // Use the reset API to reset the password to default
      const response = await fetch("/api/auth/reset", {
        method: "POST",
      })

      return response.ok
    } catch (error) {
      console.error("Reset password error:", error)
      return false
    }
  }

  // Reset password by code
  const resetPasswordByCode = async (securityCode: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/reset-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ securityCode }),
      })

      return response.ok
    } catch (error) {
      console.error("Reset password by code error:", error)
      return false
    }
  }

  // Get current password
  const getCurrentPassword = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/current-password")
      
      if (response.ok) {
        const data = await response.json()
        return data.currentPassword
      }
      
      return null
    } catch (error) {
      console.error("Get current password error:", error)
      return null
    }
  }

  // Get security code
  const getSecurityCode = async (): Promise<string> => {
    try {
      const response = await fetch("/api/auth/security-code")
      
      if (response.ok) {
        const data = await response.json()
        return data.securityCode || ""
      }
      
      console.error("安全码请求失败:", response.status, response.statusText)
      return ""
    } catch (error) {
      console.error("获取安全码出错:", error)
      return ""
    }
  }

  // Update security code
  const updateSecurityCode = async (securityCode: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/security-code", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ securityCode }),
      })

      return response.ok
    } catch (error) {
      console.error("Update security code error:", error)
      return false
    }
  }

  const contextValue = {
    isLoggedIn,
    user,
    login,
    logout,
    updatePassword,
    resetPassword,
    resetPasswordByCode,
    getCurrentPassword,
    getSecurityCode,
    updateSecurityCode,
  }

  if (loading) {
    // You could return a loading indicator here if needed
    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

// 使用认证上下文的钩子
export function useAuth() {
  return React.useContext(AuthContext)
}


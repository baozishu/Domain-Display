"use client"

import React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, KeyRound, Loader2, RefreshCw, ShieldAlert } from "lucide-react"

export default function LoginPage() {
  const [password, setPassword] = React.useState("")
  const [securityCode, setSecurityCode] = React.useState("")
  const [loginError, setLoginError] = React.useState("")
  const [resetMessage, setResetMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [redirecting, setRedirecting] = React.useState(false)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const [showResetForm, setShowResetForm] = React.useState(false)
  const { isLoggedIn, login, resetPasswordByCode } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    // 如果用户已登录，重定向到首页
    if (isLoggedIn) {
      setRedirecting(true)
      router.push("/dashboard")
    }
  }, [isLoggedIn, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setIsLoggingIn(true)

    if (!password) {
      setLoginError("请输入密码")
      setIsLoggingIn(false)
      return
    }

    try {
      const success = await login(password)
      if (success) {
        setRedirecting(true)
        router.push("/dashboard")
      } else {
        setLoginError("登录失败：密码错误")
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoginError(`登录失败：${error instanceof Error ? error.message : "未知错误"}`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetMessage(null)
    setIsResetting(true)

    if (!securityCode) {
      setResetMessage({ type: "error", text: "请输入安全码" })
      setIsResetting(false)
      return
    }

    try {
      const success = await resetPasswordByCode(securityCode)
      if (success) {
        setResetMessage({ 
          type: "success", 
          text: "密码已重置为默认值：admin123，请使用此密码登录" 
        })
        setSecurityCode("")
        // 3秒后切换回登录表单
        setTimeout(() => {
          setShowResetForm(false)
        }, 3000)
      } else {
        setResetMessage({ type: "error", text: "重置密码失败：安全码错误或其他错误" })
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setResetMessage({ 
        type: "error", 
        text: `重置密码失败：${error instanceof Error ? error.message : "未知错误"}` 
      })
    } finally {
      setIsResetting(false)
    }
  }

  const toggleResetForm = () => {
    setShowResetForm(!showResetForm)
    setLoginError("")
    setResetMessage(null)
  }

  // 如果正在重定向，显示加载状态
  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">正在重定向...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {showResetForm ? "重置密码" : "管理员登录"}
          </CardTitle>
          <CardDescription className="text-center">
            {showResetForm 
              ? "使用安全码重置为默认密码" 
              : "输入密码登录后台管理系统"}
          </CardDescription>
        </CardHeader>

        {showResetForm ? (
          // 重置密码表单
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4 pt-4">
              {resetMessage && (
                <Alert variant={resetMessage.type === "success" ? "default" : "destructive"}>
                  {resetMessage.type === "success" ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{resetMessage.text}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="securityCode">安全码</Label>
                <div className="relative">
                  <Input
                    id="securityCode"
                    type="text"
                    placeholder="输入管理员安全码"
                    value={securityCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecurityCode(e.target.value)}
                    className="pr-10 font-mono"
                  />
                  <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  输入在控制台设置的安全码，重置密码为默认值
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isResetting}>
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    重置中...
                  </>
                ) : (
                  "重置密码"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={toggleResetForm}
              >
                返回登录
              </Button>
            </CardFooter>
          </form>
        ) : (
          // 登录表单
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="输入管理员密码"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    登录中...
                  </>
                ) : (
                  "登录"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={toggleResetForm}
              >
                忘记密码？使用安全码重置
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}


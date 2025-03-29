"use client"

import React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, RefreshCw, Lock, Loader2, Eye, EyeOff, Key, Shield, ShieldAlert, ShieldCheck, Shuffle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function PasswordManager() {
  const { updatePassword, resetPassword, getCurrentPassword } = useAuth()
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [savedPassword, setSavedPassword] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [fetchingPassword, setFetchingPassword] = React.useState(false)
  const [passwordStrength, setPasswordStrength] = React.useState(0)
  const [lastActivity, setLastActivity] = React.useState<Date | null>(null)
  const [showTips, setShowTips] = React.useState(false)

  // 加载当前密码
  React.useEffect(() => {
    const fetchCurrentPassword = async () => {
      setFetchingPassword(true)
      try {
        const password = await getCurrentPassword()
        setSavedPassword(password)
        // 设置最后活动时间为当前时间
        setLastActivity(new Date())
      } catch (error) {
        console.error("获取当前密码错误:", error)
      } finally {
        setFetchingPassword(false)
      }
    }

    fetchCurrentPassword()
  }, [getCurrentPassword])

  // 计算密码强度
  React.useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    // 长度检查
    if (newPassword.length >= 8) strength += 25
    // 包含数字
    if (/\d/.test(newPassword)) strength += 25
    // 包含小写字母
    if (/[a-z]/.test(newPassword)) strength += 25
    // 包含大写字母或特殊字符
    if (/[A-Z]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword)) strength += 25

    setPasswordStrength(strength)
  }, [newPassword])

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500"
    if (passwordStrength <= 50) return "bg-orange-500"
    if (passwordStrength <= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "非常弱"
    if (passwordStrength <= 50) return "弱"
    if (passwordStrength <= 75) return "中等"
    return "强"
  }

  const getStrengthIcon = () => {
    if (passwordStrength <= 25) return <ShieldAlert className="h-4 w-4 text-red-500" />
    if (passwordStrength <= 75) return <Shield className="h-4 w-4 text-yellow-500" />
    return <ShieldCheck className="h-4 w-4 text-green-500" />
  }

  // 生成随机密码
  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    
    // 确保至少包含一个特殊字符
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    // 确保至少包含一个数字
    password += "0123456789"[Math.floor(Math.random() * 10)];
    
    // 确保至少包含一个大写字母
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    
    // 确保至少包含一个小写字母
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    
    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // 打乱字符顺序
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setNewPassword(password);
    setConfirmPassword(password);
  };

  const handleUpdatePassword = React.useCallback(async () => {
    setMessage(null)
    setIsLoading(true)

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setMessage({ type: "error", text: "请填写所有字段" })
        setIsLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setMessage({ type: "error", text: "两次输入的新密码不一致" })
        setIsLoading(false)
        return
      }

      if (newPassword.length < 6) {
        setMessage({ type: "error", text: "新密码长度应至少为6个字符" })
        setIsLoading(false)
        return
      }

      const success = await updatePassword(currentPassword, newPassword)

      if (success) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setSavedPassword(newPassword) // 更新当前显示的密码
        setLastActivity(new Date()) // 更新最后活动时间
        setMessage({ type: "success", text: "密码已成功更新，下次登录请使用新密码" })
      } else {
        setMessage({ type: "error", text: "当前密码不正确或更新失败" })
      }
    } catch (error) {
      console.error("密码更新错误:", error)
      setMessage({ type: "error", text: "密码更新过程中发生错误，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }, [currentPassword, newPassword, confirmPassword, updatePassword])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUpdatePassword()
  }

  const handleResetPassword = async () => {
    if (confirm("确定要重置密码为默认值吗？这将使您退出登录，并需要使用默认密码重新登录。")) {
      setIsLoading(true)
      try {
        const success = await resetPassword()

        if (success) {
          setSavedPassword("admin123") // 更新当前显示的密码为默认密码
          setLastActivity(new Date()) // 更新最后活动时间
          setMessage({ type: "success", text: "密码已重置为默认值: admin123，请使用此密码重新登录" })
          // 5秒后重定向到登录页
          setTimeout(() => {
            window.location.href = "/login"
          }, 5000)
        } else {
          setMessage({ type: "error", text: "重置密码失败，请稍后重试" })
        }
      } catch (error) {
        console.error("密码重置错误:", error)
        setMessage({ type: "error", text: "密码重置过程中发生错误，请稍后重试" })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-primary">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center space-x-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>密码管理</CardTitle>
        </div>
        <CardDescription>更新或重置管理员密码</CardDescription>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* 当前密码展示部分 */}
        <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-muted">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">当前管理员密码</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="relative">
            {fetchingPassword ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-sm">加载中...</span>
              </div>
            ) : savedPassword ? (
              <div className="font-mono text-base p-2 bg-background rounded border">
                {showPassword ? savedPassword : '•'.repeat(savedPassword.length)}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">无法获取当前密码</span>
            )}
          </div>

          {/* 最后活动时间 */}
          {lastActivity && (
            <div className="mt-2 text-xs text-muted-foreground">
              最后更新时间: {lastActivity.toLocaleString('zh-CN')}
            </div>
          )}
        </div>

        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : undefined}
            className={`mb-4 ${message.type === "success" ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900" : undefined}`}
          >
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <AlertDescription className={message.type === "success" ? "text-green-600 dark:text-green-400" : undefined}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
        
        {/* 安全提示 */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs mb-2"
            onClick={() => setShowTips(!showTips)}
          >
            {showTips ? "隐藏安全提示" : "查看安全提示"}
          </Button>
          
          {showTips && (
            <div className="text-xs p-3 bg-muted/20 rounded-lg border border-muted space-y-1">
              <p className="font-medium">密码安全提示：</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>使用至少8个字符的密码</li>
                <li>混合使用大小写字母、数字和特殊符号</li>
                <li>避免使用个人信息作为密码</li>
                <li>定期更换密码以提高安全性</li>
                <li>不要在多个网站使用相同的密码</li>
              </ul>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium">当前密码</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="输入当前密码"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="new-password" className="text-sm font-medium">新密码</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs flex items-center gap-1"
                onClick={generatePassword}
              >
                <Shuffle className="h-3 w-3" />
                生成强密码
              </Button>
            </div>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="输入新密码（至少6个字符）"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* 密码强度指示器 */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {getStrengthIcon()}
                    <span className="text-xs">密码强度: {getStrengthText()}</span>
                  </div>
                  <span className="text-xs">{passwordStrength}%</span>
                </div>
                <Progress value={passwordStrength} className={`h-1.5 ${getStrengthColor()}`} />
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span className="text-xs text-muted-foreground">至少8个字符</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${/\d/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span className="text-xs text-muted-foreground">包含数字</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${/[a-z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span className="text-xs text-muted-foreground">包含小写字母</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${(/[A-Z]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword)) ? "bg-green-500" : "bg-gray-300"}`}></div>
                    <span className="text-xs text-muted-foreground">包含大写或特殊字符</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">确认新密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">两次输入的密码不一致</p>
            )}
          </div>
          
          <CardFooter className="flex justify-between flex-col sm:flex-row gap-4 px-0 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="transition-all duration-200 hover:scale-105 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  更新密码
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleResetPassword} 
              disabled={isLoading}
              className="transition-all duration-200 hover:border-red-300 hover:text-red-500 w-full sm:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              重置为默认密码
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  )
}


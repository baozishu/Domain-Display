"use client"

import React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, Shield, Loader2, RefreshCw } from "lucide-react"

export default function SecurityCodeManager() {
  const { getSecurityCode, updateSecurityCode } = useAuth()
  const [securityCode, setSecurityCode] = React.useState("")
  const [currentSecurityCode, setCurrentSecurityCode] = React.useState("")
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [fetchingCode, setFetchingCode] = React.useState(false)

  // 加载当前安全码
  React.useEffect(() => {
    const fetchSecurityCode = async () => {
      setFetchingCode(true)
      try {
        // 首先检查数据库结构
        try {
          await fetch("/api/check-db")
          console.log("已检查数据库结构")
        } catch (checkError) {
          console.error("数据库结构检查失败:", checkError)
        }
        
        // 获取安全码
        const code = await getSecurityCode().catch(() => "");
        setCurrentSecurityCode(code)
      } catch (error) {
        console.error("获取安全码错误:", error)
        setMessage({ type: "error", text: "获取安全码失败，请刷新页面重试" })
        // 即使获取失败，也不影响用户设置新的安全码
        setCurrentSecurityCode("")
      } finally {
        setFetchingCode(false)
      }
    }

    fetchSecurityCode()
  }, [getSecurityCode])

  // 生成随机安全码
  const generateSecurityCode = () => {
    const length = 8
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    
    for (let i = 0; i < length; i++) {
      code += charset[Math.floor(Math.random() * charset.length)]
    }
    
    setSecurityCode(code)
  }

  const handleUpdateSecurityCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setIsLoading(true)

    try {
      if (!securityCode) {
        setMessage({ type: "error", text: "请输入安全码" })
        return
      }

      const success = await updateSecurityCode(securityCode)

      if (success) {
        setCurrentSecurityCode(securityCode)
        setMessage({ type: "success", text: "安全码已成功更新" })
      } else {
        setMessage({ type: "error", text: "更新安全码失败" })
      }
    } catch (error) {
      console.error("安全码更新错误:", error)
      setMessage({ type: "error", text: "安全码更新过程中发生错误，请稍后重试" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg border-t-4 border-t-primary">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>安全码管理</CardTitle>
        </div>
        <CardDescription>
          设置安全码后，可以在登录页面使用安全码重置密码
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"}>
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>当前安全码</Label>
          {fetchingCode ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground text-sm">正在加载...</span>
            </div>
          ) : (
            <div className="p-2 border rounded-md bg-muted/30">
              {currentSecurityCode ? (
                <span className="font-mono">{currentSecurityCode}</span>
              ) : (
                <span className="text-muted-foreground text-sm">未设置安全码</span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleUpdateSecurityCode}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="securityCode">新安全码</Label>
              <div className="flex space-x-2">
                <Input
                  id="securityCode"
                  value={securityCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecurityCode(e.target.value)}
                  placeholder="输入新安全码"
                  className="font-mono"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateSecurityCode}
                  title="生成随机安全码"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                安全码用于在忘记密码时重置密码，请妥善保管
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                "更新安全码"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
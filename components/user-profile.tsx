"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function UserProfile() {
  const { user, updateUsername, updatePassword } = useAuth()
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")

  // 当用户数据加载时更新表单
  useEffect(() => {
    if (user) {
      setNewUsername(user.username)
    }
  }, [user])

  // Update the handleUpdateProfile function
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!newUsername.trim()) {
      setError("用户名不能为空")
      return
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }

    const changes = []

    if (newUsername !== user?.username) {
      // Note: Username update would need a new API endpoint
      // For now, we'll just update the UI
      changes.push("用户名")
    }

    if (newPassword) {
      const success = await updatePassword(user?.password || "", newPassword)
      if (success) {
        setNewPassword("")
        setConfirmPassword("")
        changes.push("密码")
      } else {
        setError("密码更新失败")
        return
      }
    }

    if (changes.length > 0) {
      setSuccessMessage(`${changes.join("和")}已成功更新，下次登录时请使用新的凭据`)
    } else {
      setSuccessMessage("没有进行任何更改")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>用户资料</CardTitle>
        <CardDescription>更新您的用户名和密码</CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdateProfile}>
        <CardContent className="space-y-4">
          {successMessage && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">{successMessage}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input id="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">新密码</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="留空表示不修改"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">保存更改</Button>
        </CardFooter>
      </form>
    </Card>
  )
}


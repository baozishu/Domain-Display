"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard-layout"
import DatabaseBackupManager from "@/components/database-backup-manager"
import { Database, Shield } from "lucide-react"

export default function BackupPage() {
  const { isLoggedIn } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    // 如果用户未登录，重定向到登录页面
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  // 如果用户未登录，不渲染内容
  if (!isLoggedIn) {
    return null
  }

  return (
    <DashboardLayout activeTab="backup">
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">数据库备份管理</h1>
            <p className="text-muted-foreground">安全备份、恢复和重置您的数据</p>
          </div>
          <div className="animate-fade-in">
            <div className="p-3 bg-primary/10 rounded-full">
              <Database className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="animate-slide-up">
          <div className="bg-gradient-to-br from-muted/50 to-background p-1 rounded-xl">
            <DatabaseBackupManager />
          </div>
          
          <div className="mt-6 flex justify-center">
            <div className="max-w-xl text-center text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border border-muted-foreground/10 flex items-center">
              <Shield className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
              <span>
                数据安全提示：建议您定期备份重要数据，并将备份文件保存在安全的位置。重置数据库操作不可撤销，请谨慎执行。
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 
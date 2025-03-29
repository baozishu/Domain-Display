"use client"

import React from "react"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import DashboardLayout from "@/components/dashboard-layout"
import PasswordManager from "@/components/password-manager"
import SecurityCodeManager from "@/components/security-code-manager"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Globe, Database, Cog, ShieldCheck, Fingerprint, Shield } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
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
    <DashboardLayout activeTab="dashboard">
      <div className="space-y-8 pb-10">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">控制台</h1>
          <p className="text-muted-foreground">管理您的域名、备份和安全设置</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="域名管理"
            description="管理您的域名数据和展示信息"
            icon={Globe}
            href="/dashboard/domains"
          />
          <DashboardCard
            title="备份管理"
            description="导出或导入您的数据备份"
            icon={Database}
            href="/dashboard/backup"
          />
          <DashboardCard
            title="网站设置"
            description="自定义网站外观和功能"
            icon={Cog}
            href="/dashboard/settings"
          />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Fingerprint className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">账户安全</h2>
                <p className="text-sm text-muted-foreground">管理您的管理员账户和密码设置</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-background to-muted/30 p-1 rounded-xl shadow-lg border border-muted/40">
              <PasswordManager />
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">安全码设置</h2>
                <p className="text-sm text-muted-foreground">设置用于重置密码的安全码</p>
              </div>
            </div>
            <div className="bg-gradient-to-br from-background to-muted/30 p-1 rounded-xl shadow-lg border border-muted/40">
              <SecurityCodeManager />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function DashboardCard({
  title,
  description,
  icon: Icon,
  href,
}: {
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
}) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <div className="p-1.5 bg-background rounded-full shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <CardDescription className="mb-4 min-h-[2.5rem]">{description}</CardDescription>
        <Button variant="default" size="sm" className="w-full group" asChild>
          <Link href={href}>
            进入管理
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}


import type React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Globe, 
  Database,
  Settings, 
  FileText,
  LogOut,
  Menu,
  Cog
} from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: "dashboard" | "domains" | "backup" | "settings"
}

export default function DashboardLayout({ children, activeTab }: DashboardLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)]">
      {/* 侧边栏导航 - 桌面端 */}
      <div className="hidden md:flex w-64 flex-col border-r bg-gray-50/50">
        <div className="p-4">
          <h2 className="text-lg font-semibold">管理控制台</h2>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            isActive={activeTab === "dashboard"}
          >
            控制台
          </NavItem>
          <NavItem href="/dashboard/domains" icon={<Settings className="h-5 w-5" />} isActive={activeTab === "domains"}>
            域名管理
          </NavItem>
          <NavItem href="/dashboard/backup" icon={<Database className="h-5 w-5" />} isActive={activeTab === "backup"}>
            备份管理
          </NavItem>
          <NavItem href="/dashboard/settings" icon={<Cog className="h-5 w-5" />} isActive={activeTab === "settings"}>
            网站设置
          </NavItem>
        </nav>
      </div>

      {/* 移动端顶部导航 */}
      <div className="md:hidden border-b w-full">
        <div className="flex overflow-x-auto p-2 space-x-1">
          <MobileNavItem href="/dashboard" isActive={activeTab === "dashboard"}>
            首页
          </MobileNavItem>
          <MobileNavItem href="/dashboard/domains" isActive={activeTab === "domains"}>
            域名
          </MobileNavItem>
          <MobileNavItem href="/dashboard/backup" isActive={activeTab === "backup"}>
            备份
          </MobileNavItem>
          <MobileNavItem href="/dashboard/settings" isActive={activeTab === "settings"}>
            设置
          </MobileNavItem>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-6xl">{children}</div>
      </div>
    </div>
  )
}

// 侧边栏导航项
function NavItem({
  href,
  icon,
  isActive,
  children,
}: {
  href: string
  icon: React.ReactNode
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </Link>
  )
}

// 移动端导航项
function MobileNavItem({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Button variant={isActive ? "default" : "ghost"} size="sm" asChild className="flex-shrink-0">
      <Link href={href}>{children}</Link>
    </Button>
  )
}


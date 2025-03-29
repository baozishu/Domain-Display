"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { 
  LogOut, 
  LayoutDashboard, 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function UserMenu() {
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("登出失败:", error);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {/* 控制台按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-primary/10" 
            >
              <Link href="/dashboard" className="flex items-center">
                <LayoutDashboard className="h-4 w-4 mr-1" />
                <span>控制台</span>
              </Link>
            </Button>
          </TooltipTrigger>
        </Tooltip>

        {/* 退出登录按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-1 md:inline-block">退出</span>
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}


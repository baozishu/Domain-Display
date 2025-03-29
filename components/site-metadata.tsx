"use client"

import { useEffect } from "react"
import { useSite } from "@/contexts/site-context"

export function SiteMetadata() {
  const { settings } = useSite()

  // 在客户端渲染后设置元数据
  useEffect(() => {
    try {
      // 更新页面标题
      if (settings.siteName) {
        document.title = settings.siteName
        console.log("已更新页面标题:", settings.siteName)
      }

      // 更新网站图标
      if (settings.favicon) {
        const updateFavicon = () => {
          // 查找现有的favicon链接
          let existingFavicon = document.querySelector('link[rel="icon"]')
          let existingAppleIcon = document.querySelector('link[rel="apple-touch-icon"]')

          if (existingFavicon) {
            // 如果存在，更新href
            existingFavicon.setAttribute("href", settings.favicon)
          } else {
            // 如果不存在，创建新的
            existingFavicon = document.createElement("link")
            existingFavicon.rel = "icon"
            existingFavicon.href = settings.favicon
            document.head.appendChild(existingFavicon)
          }

          if (existingAppleIcon) {
            // 如果存在，更新href
            existingAppleIcon.setAttribute("href", settings.favicon)
          } else {
            // 如果不存在，创建新的
            existingAppleIcon = document.createElement("link")
            existingAppleIcon.rel = "apple-touch-icon"
            existingAppleIcon.href = settings.favicon
            document.head.appendChild(existingAppleIcon)
          }

          console.log("已更新网站图标:", settings.favicon)
        }

        updateFavicon()
      }
    } catch (error) {
      console.error("更新网站元数据失败:", error)
    }
  }, [settings.siteName, settings.favicon])

  // 这个组件不渲染任何内容
  return null
}


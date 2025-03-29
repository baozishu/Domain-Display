"use client"

import { useSite } from "@/contexts/site-context"

interface RegistrarIconProps {
  iconName?: string
  className?: string
}

export function RegistrarIcon({ iconName, className = "h-5 w-5 text-muted-foreground" }: RegistrarIconProps) {
  const { settings } = useSite()

  // 提取类名中的尺寸
  const sizeMatch = className.match(/(h|w)-(\d+)/)
  const size = sizeMatch ? sizeMatch[2] : "5"
  const width = `${size}px`
  const height = `${size}px`

  // 如果没有图标名称，返回默认图标
  if (!iconName || !settings?.registrarIcons?.[iconName.toLowerCase()]) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={width}
        height={height}
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    )
  }

  // 使用dangerouslySetInnerHTML渲染SVG
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{
        __html: settings.registrarIcons[iconName.toLowerCase()],
      }}
    />
  )
}


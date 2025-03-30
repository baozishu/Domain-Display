"use client"

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react"

// 导入JSON数据
import domainsData from "@/data/domains.json"
import soldDomainsData from "@/data/sold-domains.json"
import friendlyLinksData from "@/data/friendly-links.json"

interface Domain {
  id: string
  name: string
  extension: string
  status: string
  registrar?: string
  registrarIcon?: string
  registrationTime?: string
  expirationTime?: string
  purchaseUrl?: string
  soldTo?: string
  soldDate?: string
}

interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
}

interface DomainContextType {
  domains: Domain[]
  soldDomains: Domain[]
  friendlyLinks: FriendlyLink[]
  isLoading: boolean
}

// 创建上下文
const DomainContext = createContext<DomainContextType>({
  domains: [],
  soldDomains: [],
  friendlyLinks: [],
  isLoading: true,
})

// 上下文提供者组件
export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [soldDomains, setSoldDomains] = useState<Domain[]>([])
  const [friendlyLinks, setFriendlyLinks] = useState<FriendlyLink[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // 加载数据
      setDomains(domainsData as Domain[])
      setSoldDomains(soldDomainsData as Domain[])
      setFriendlyLinks(friendlyLinksData as FriendlyLink[])
    } catch (error) {
      console.error("加载域名数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <DomainContext.Provider value={{ domains, soldDomains, friendlyLinks, isLoading }}>
      {children}
    </DomainContext.Provider>
  )
}

// 自定义Hook，方便在组件中使用域名数据
export function useDomains() {
  const context = useContext(DomainContext)
  if (!context) {
    throw new Error("useDomains 必须在 DomainProvider 内部使用")
  }
  return context
} 
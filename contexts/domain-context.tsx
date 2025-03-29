"use client"

import React from "react"

// 使用类型声明方式
type ReactNode = React.ReactNode

interface Domain {
  id: string
  name: string
  extension: string
  status: "active" | "available" | "sold"
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
  updateDomains: (newDomains: Domain[]) => void
  updateSoldDomains: (newSoldDomains: Domain[]) => void
  updateFriendlyLinks: (newFriendlyLinks: FriendlyLink[]) => void
  resetToDefaults: () => void
  loading: boolean
  error: string | null
}

// Default data for fallback
const DEFAULT_DOMAINS: Domain[] = [
  {
    id: "1",
    name: "example",
    extension: ".com",
    status: "available",
    registrar: "阿里云",
    registrarIcon: "aliyun",
    registrationTime: "2023-05-15",
    expirationTime: "2025-05-15",
    purchaseUrl: "https://wanwang.aliyun.com/domain/searchresult?keyword=example.com",
  },
]

const DEFAULT_SOLD_DOMAINS: Domain[] = [
  {
    id: "s1",
    name: "premium",
    extension: ".com",
    status: "sold",
    soldTo: "科技解决方案公司",
    soldDate: "2025-02-15",
  },
]

const DEFAULT_FRIENDLY_LINKS: FriendlyLink[] = [
  {
    id: "1",
    name: "域名注册服务",
    url: "https://example.com/register",
    description: "提供专业的域名注册和管理服务",
  },
]

// Create context with default values
const DomainContext = React.createContext<DomainContextType>({
  domains: DEFAULT_DOMAINS,
  soldDomains: DEFAULT_SOLD_DOMAINS,
  friendlyLinks: DEFAULT_FRIENDLY_LINKS,
  updateDomains: () => {},
  updateSoldDomains: () => {},
  updateFriendlyLinks: () => {},
  resetToDefaults: () => {},
  loading: false,
  error: null,
})

export function DomainProvider({ children }: { children: ReactNode }) {
  const [domains, setDomains] = React.useState<Domain[]>(DEFAULT_DOMAINS)
  const [soldDomains, setSoldDomains] = React.useState<Domain[]>(DEFAULT_SOLD_DOMAINS)
  const [friendlyLinks, setFriendlyLinks] = React.useState<FriendlyLink[]>(DEFAULT_FRIENDLY_LINKS)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)
  const [retryTimer, setRetryTimer] = React.useState<NodeJS.Timeout | null>(null)

  // Load data from API with retry mechanism
  React.useEffect(() => {
    let isMounted = true

    async function loadData() {
      if (!isMounted) return

      setLoading(true)
      setError(null)

      try {
        // Load domains data
        const domainsResponse = await fetch("/api/domains")
        if (!domainsResponse.ok) {
          throw new Error(`Failed to load domains: ${domainsResponse.status}`)
        }
        const domainsData = await domainsResponse.json()
        if (isMounted) setDomains(domainsData)

        // Load sold domains data
        try {
          const soldDomainsResponse = await fetch("/api/sold-domains")
          if (soldDomainsResponse.ok) {
            const soldDomainsData = await soldDomainsResponse.json()
            if (isMounted) setSoldDomains(soldDomainsData)
          } else {
            console.warn("Failed to load sold domains, using defaults")
          }
        } catch (soldError) {
          console.error("Error loading sold domains:", soldError)
          // Continue with defaults
        }

        // Load friendly links data
        try {
          const linksResponse = await fetch("/api/friendly-links")
          if (linksResponse.ok) {
            const linksData = await linksResponse.json()
            if (isMounted) setFriendlyLinks(linksData)
          } else {
            console.warn("Failed to load friendly links, using defaults")
          }
        } catch (linksError) {
          console.error("Error loading friendly links:", linksError)
          // Continue with defaults
        }

        if (isMounted) {
          setLoading(false)
          setError(null)
          setRetryCount(0)

          // Clear any existing retry timer
          if (retryTimer) {
            clearTimeout(retryTimer)
            setRetryTimer(null)
          }
        }
      } catch (err) {
        console.error("Error loading domain data:", err)
        if (isMounted) {
          setError(`加载数据失败: ${err instanceof Error ? err.message : String(err)}`)

          // Keep using the current data (or defaults if none)
          if (domains.length === 0) setDomains(DEFAULT_DOMAINS)
          if (soldDomains.length === 0) setSoldDomains(DEFAULT_SOLD_DOMAINS)
          if (friendlyLinks.length === 0) setFriendlyLinks(DEFAULT_FRIENDLY_LINKS)

          setLoading(false)

          // Set up retry with exponential backoff if we haven't tried too many times
          if (retryCount < 3 && isMounted) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
            const timer = setTimeout(() => {
              if (isMounted) {
                setRetryCount((prev: number) => prev + 1)
                loadData()
              }
            }, delay)

            setRetryTimer(timer)
          }
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
  }, [])

  // Update domains data
  const updateDomains = async (newDomains: Domain[]) => {
    try {
      setLoading(true)

      // Find domains to delete
      const domainsToDelete = domains.filter((domain: Domain) => !newDomains.some((newDomain) => newDomain.id === domain.id))

      // Delete domains
      for (const domain of domainsToDelete) {
        try {
          const response = await fetch(`/api/domains?id=${domain.id}`, { method: "DELETE" })
          if (!response.ok) {
            console.warn(`Failed to delete domain: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error("Error deleting domain:", error)
          // Continue with other operations
        }
      }

      // Update or create domains
      for (const domain of newDomains) {
        const existingDomain = domains.find((d: Domain) => d.id === domain.id)

        try {
          if (existingDomain) {
            // Update existing domain
            const response = await fetch("/api/domains", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(domain),
            })
            if (!response.ok) {
              console.warn(`Failed to update domain: ${response.status} ${response.statusText}`)
            }
          } else {
            // Create new domain
            const response = await fetch("/api/domains", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(domain),
            })
            if (!response.ok) {
              console.warn(`Failed to create domain: ${response.status} ${response.statusText}`)
            }
          }
        } catch (error) {
          console.error("Error updating/creating domain:", error)
          // Continue with other operations
        }
      }

      // Update local state regardless of API success
      setDomains(newDomains)
      setLoading(false)
    } catch (err) {
      console.error("Error updating domains:", err)
      setError("更新域名数据失败: " + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  // Update sold domains data
  const updateSoldDomains = async (newSoldDomains: Domain[]) => {
    try {
      setLoading(true)

      // Find domains to delete
      const domainsToDelete = soldDomains.filter((domain: Domain) => !newSoldDomains.some((newDomain) => newDomain.id === domain.id))

      // Delete domains
      for (const domain of domainsToDelete) {
        try {
          const response = await fetch(`/api/sold-domains?id=${domain.id}`, { method: "DELETE" })
          if (!response.ok) {
            console.warn(`Failed to delete sold domain: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error("Error deleting sold domain:", error)
          // Continue with other operations
        }
      }

      // Update or create domains
      for (const domain of newSoldDomains) {
        const existingDomain = soldDomains.find((d: Domain) => d.id === domain.id)

        try {
          if (existingDomain) {
            // Update existing domain
            const response = await fetch("/api/sold-domains", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(domain),
            })
            if (!response.ok) {
              console.warn(`Failed to update sold domain: ${response.status} ${response.statusText}`)
            }
          } else {
            // Create new domain
            const response = await fetch("/api/sold-domains", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(domain),
            })
            if (!response.ok) {
              console.warn(`Failed to create sold domain: ${response.status} ${response.statusText}`)
            }
          }
        } catch (error) {
          console.error("Error updating/creating sold domain:", error)
          // Continue with other operations
        }
      }

      // Update local state regardless of API success
      setSoldDomains(newSoldDomains)
      setLoading(false)
    } catch (err) {
      console.error("Error updating sold domains:", err)
      setError("更新已售域名数据失败: " + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  // Update friendly links data
  const updateFriendlyLinks = async (newFriendlyLinks: FriendlyLink[]) => {
    try {
      setLoading(true)

      // Find links to delete
      const linksToDelete = friendlyLinks.filter((link: FriendlyLink) => !newFriendlyLinks.some((newLink) => newLink.id === link.id))

      // Delete links
      for (const link of linksToDelete) {
        try {
          const response = await fetch(`/api/friendly-links?id=${link.id}`, { method: "DELETE" })
          if (!response.ok) {
            console.warn(`Failed to delete friendly link: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error("Error deleting friendly link:", error)
          // Continue with other operations
        }
      }

      // Update or create links
      for (const link of newFriendlyLinks) {
        const existingLink = friendlyLinks.find((l: FriendlyLink) => l.id === link.id)

        try {
          if (existingLink) {
            // Update existing link
            const response = await fetch("/api/friendly-links", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(link),
            })
            if (!response.ok) {
              console.warn(`Failed to update friendly link: ${response.status} ${response.statusText}`)
            }
          } else {
            // Create new link
            const response = await fetch("/api/friendly-links", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(link),
            })
            if (!response.ok) {
              console.warn(`Failed to create friendly link: ${response.status} ${response.statusText}`)
            }
          }
        } catch (error) {
          console.error("Error updating/creating friendly link:", error)
          // Continue with other operations
        }
      }

      // Update local state regardless of API success
      setFriendlyLinks(newFriendlyLinks)
      setLoading(false)
    } catch (err) {
      console.error("Error updating friendly links:", err)
      setError("更新友情链接数据失败: " + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  // Reset all data to defaults
  const resetToDefaults = async () => {
    try {
      setLoading(true)

      // Reset domains
      await fetch("/api/domains/reset", { method: "POST" })
      setDomains(DEFAULT_DOMAINS)

      // Reset sold domains
      await fetch("/api/sold-domains/reset", { method: "POST" })
      setSoldDomains(DEFAULT_SOLD_DOMAINS)

      // Reset friendly links
      await fetch("/api/friendly-links/reset", { method: "POST" })
      setFriendlyLinks(DEFAULT_FRIENDLY_LINKS)

      setLoading(false)
    } catch (err) {
      console.error("Error resetting data:", err)
      setError("重置数据失败: " + (err instanceof Error ? err.message : String(err)))
      setLoading(false)
    }
  }

  return (
    <DomainContext.Provider
      value={{
        domains,
        soldDomains,
        friendlyLinks,
        updateDomains,
        updateSoldDomains,
        updateFriendlyLinks,
        resetToDefaults,
        loading,
        error,
      }}
    >
      {children}
    </DomainContext.Provider>
  )
}

export function useDomains() {
  return React.useContext(DomainContext)
}


import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { DomainProvider } from "@/contexts/domain-context"
import { SiteProvider } from "@/contexts/site-context"
import { DatabaseProvider } from "@/contexts/database-context"
import { MainNav } from "@/components/main-nav"
import { SiteMetadata } from "@/components/site-metadata"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  generator: 'v0.dev'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <head>
        {/* 添加一个默认的favicon，稍后会被SiteMetadata组件更新 */}
        <link rel="icon" href="/favicon.ico" />
        <title>域名展示</title>
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <DatabaseProvider>
            <DomainProvider>
              <SiteProvider>
                <SiteMetadata />
                <div className="flex flex-col min-h-screen">
                  <MainNav />
                  <main className="flex-1">{children}</main>
                </div>
              </SiteProvider>
            </DomainProvider>
          </DatabaseProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

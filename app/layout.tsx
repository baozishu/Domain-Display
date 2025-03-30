import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DomainProvider } from "@/contexts/domain-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "域名展示",
  description: "展示和管理您的域名集合",
  icons: {
    icon: [
      // 使用外部图片链接作为favicon
      { url: "https://xn--1xa.team/img/favicon.ico", type: "image/png" },
    ],
    apple: [
      // 同样使用外部图片链接作为apple图标
      { url: "https://xn--1xa.team/img/favicon.ico", type: "image/png" },
    ],
  },
    generator: ''
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <DomainProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
          </div>
        </DomainProvider>
      </body>
    </html>
  )
}
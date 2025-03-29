import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getDb } from "@/lib/db"

// 重置数据库
export async function POST(request: NextRequest) {
  try {
    const db = await getDb()
    
    // 先备份当前数据库 - 创建恢复点
    const timestamp = Date.now()
    const backupDir = path.join(process.cwd(), ".data", "backups")
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const backupPath = path.join(backupDir, `reset-backup-${timestamp}.sqlite`)
    
    // 备份当前数据库状态 - 直接复制文件
    const dbPath = path.join(process.cwd(), ".data", "database.sqlite")
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
    }
    
    // 清空所有表
    await db.exec("DELETE FROM domains")
    await db.exec("DELETE FROM sold_domains")
    await db.exec("DELETE FROM friendly_links")
    await db.exec("DELETE FROM site_settings")
    
    // 创建一些示例数据
    
    // 1. 示例域名
    const exampleDomains = [
      {
        id: "example1",
        name: "example",
        extension: ".com",
        price: 888,
        description: "示例域名",
        registrarIcon: "godaddy",
        addedAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: "example2",
        name: "示例",
        extension: ".com",
        price: 666,
        description: "中文示例域名",
        registrarIcon: "namecheap",
        addedAt: Date.now(),
        updatedAt: Date.now()
      }
    ]
    
    for (const domain of exampleDomains) {
      await db.run(`
        INSERT INTO domains (id, name, extension, price, description, registrarIcon, addedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        domain.id,
        domain.name,
        domain.extension,
        domain.price,
        domain.description,
        domain.registrarIcon,
        domain.addedAt,
        domain.updatedAt
      ])
    }
    
    // 2. 示例友情链接
    const exampleLinks = [
      {
        id: "link1",
        name: "示例友情链接",
        url: "https://example.com",
        description: "这是一个示例友情链接",
        createdAt: Date.now()
      }
    ]
    
    for (const link of exampleLinks) {
      await db.run(`
        INSERT INTO friendly_links (id, name, url, description, createdAt)
        VALUES (?, ?, ?, ?, ?)
      `, [
        link.id,
        link.name,
        link.url,
        link.description,
        link.createdAt
      ])
    }
    
    // 3. 示例站点设置
    const defaultSettings = {
      siteName: "域名管理系统",
      logoType: "text",
      logoText: "DomainManager",
      registrarIcons: [
        { id: "godaddy", name: "GoDaddy", url: "https://www.godaddy.com" },
        { id: "namecheap", name: "Namecheap", url: "https://www.namecheap.com" }
      ]
    }
    
    for (const [key, value] of Object.entries(defaultSettings)) {
      const valueStr = typeof value === "string" ? value : JSON.stringify(value)
      
      await db.run(`
        INSERT OR REPLACE INTO site_settings (key, value)
        VALUES (?, ?)
      `, [key, valueStr])
    }
    
    return NextResponse.json({ 
      success: true,
      message: "数据库已重置为初始状态",
      backupCreated: fs.existsSync(backupPath)
    })
  } catch (error) {
    console.error("重置数据库失败:", error)
    return NextResponse.json(
      { error: "重置数据库失败" },
      { status: 500 }
    )
  }
} 
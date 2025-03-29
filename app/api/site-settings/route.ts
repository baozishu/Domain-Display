import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import fs from "fs"
import path from "path"

// Default settings for fallback
const DEFAULT_SETTINGS = {
  siteName: "域名展示",
  logoType: "text",
  logoText: "域名展示",
  favicon: "https://xn--1xa.team/img/favicon.ico",
  registrarIcons: {
    aliyun: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>`,
    tencent: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
    godaddy: `<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>`,
    namecheap: `<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>`,
    huawei: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>`,
  },
}

// GET: Get site settings
export async function GET() {
  try {
    // Check if database directory exists
    const dbDir = path.join(process.cwd(), ".data")
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log("Created database directory for site settings")
    }

    const db = await getDb()

    // Ensure the site_settings table exists with correct schema
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)

    // 检查是否有旧的表结构
    const tableInfo = await db.all<Array<{name: string}>>(`PRAGMA table_info(site_settings)`)
    const hasOldSchema = tableInfo.some(col => col.name === 'id')
    
    if (hasOldSchema) {
      console.log("检测到旧的表结构，进行迁移")
      // 备份旧数据
      const oldData = await db.get(`SELECT * FROM site_settings WHERE id = 'default'`)
      
      // 删除旧表并创建新表
      await db.exec(`DROP TABLE site_settings`)
      await db.exec(`
        CREATE TABLE site_settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `)
      
      // 迁移旧数据到新表结构
      if (oldData) {
        await db.run(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, 
          ['siteName', oldData.site_name || '域名展示'])
        await db.run(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, 
          ['logoType', oldData.logo_type || 'text'])
        await db.run(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, 
          ['logoText', oldData.logo_text || '域名展示'])
        
        if (oldData.logo_image) {
          await db.run(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, 
            ['logoImage', oldData.logo_image])
        }
        
        await db.run(`INSERT INTO site_settings (key, value) VALUES (?, ?)`, 
          ['favicon', oldData.favicon || 'https://xn--1xa.team/img/favicon.ico'])
      }
    }

    // 检查是否有默认值
    const siteName = await db.get(`SELECT value FROM site_settings WHERE key = 'siteName'`)
    
    if (!siteName) {
      console.log("Site settings table is empty, inserting default data")
      // 插入默认值
      const defaultSettings = [
        { key: 'siteName', value: '域名展示' },
        { key: 'logoType', value: 'text' },
        { key: 'logoText', value: '域名展示' },
        { key: 'favicon', value: 'https://xn--1xa.team/img/favicon.ico' }
      ]
      
      for (const setting of defaultSettings) {
        await db.run(
          `INSERT INTO site_settings (key, value) VALUES (?, ?)`,
          [setting.key, setting.value]
        )
      }
    }

    // Ensure the registrar_icons table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if the table is empty
    const iconsCount = await db.get("SELECT COUNT(*) as count FROM registrar_icons")

    // If empty, insert default icons
    if (iconsCount.count === 0) {
      console.log("Registrar icons table is empty, inserting default data")
      await db.run(`
        INSERT INTO registrar_icons (id, name, svg)
        VALUES 
          ('1', 'aliyun', '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>'),
          ('2', 'tencent', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'),
          ('3', 'godaddy', '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>'),
          ('4', 'namecheap', '<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>'),
          ('5', 'huawei', '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>')
      `)
    }

    // 构建设置对象
    const formattedSettings: any = {
      registrarIcons: {}
    }
    
    // 获取所有设置
    const settings = await db.all<Array<{key: string, value: string}>>(`SELECT key, value FROM site_settings`)
    
    // 填充设置对象
    for (const setting of settings) {
      formattedSettings[setting.key] = setting.value
    }

    // Fetch registrar icons
    try {
      const icons = await db.all<Array<{name: string, svg: string}>>(`SELECT name, svg FROM registrar_icons`)
      const registrarIcons = icons.reduce((acc: Record<string, string>, icon) => {
        acc[icon.name] = icon.svg
        return acc
      }, {})

      formattedSettings.registrarIcons = registrarIcons
    } catch (error) {
      console.error("Error fetching registrar icons:", error)
      // Use default icons as fallback
      formattedSettings.registrarIcons = DEFAULT_SETTINGS.registrarIcons
    }

    return NextResponse.json(formattedSettings)
  } catch (error) {
    console.error("Error fetching site settings:", error)
    // Return default settings as fallback
    return NextResponse.json(DEFAULT_SETTINGS)
  }
}

// PUT: Update site settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const settings = body.settings || {} // 获取要更新的设置项
    
    const db = await getDb()

    // Ensure the site_settings table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)

    // 处理注册商图标的特殊更新
    if (settings.registrarIcons) {
      // 确保表存在
      await db.exec(`
        CREATE TABLE IF NOT EXISTS registrar_icons (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          svg TEXT NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `)
      
      // 清空表内容
      await db.run(`DELETE FROM registrar_icons`)
      
      // 添加新图标
      for (const [name, svg] of Object.entries(settings.registrarIcons)) {
        try {
          await db.run(
            `INSERT INTO registrar_icons (id, name, svg) VALUES (?, ?, ?)`,
            [Date.now().toString() + Math.random().toString(36).substring(2, 7), name, svg as string]
          )
        } catch (err) {
          console.error(`添加注册商图标 ${name} 失败:`, err)
        }
      }
      
      // 从要更新的设置中移除注册商图标，因为已单独处理
      delete settings.registrarIcons
    }

    // 更新其他设置
    for (const [key, value] of Object.entries(settings)) {
      // 检查该键是否已存在
      const existingSetting = await db.get(`SELECT key FROM site_settings WHERE key = ?`, [key])
      
      if (existingSetting) {
        // 更新现有设置
        await db.run(
          `UPDATE site_settings SET value = ? WHERE key = ?`,
          [value, key]
        )
      } else {
        // 插入新设置
        await db.run(
          `INSERT INTO site_settings (key, value) VALUES (?, ?)`,
          [key, value]
        )
      }
    }

    // 获取更新后的所有设置
    const updatedSettings: any = {
      registrarIcons: {}
    }
    
    // 获取所有设置
    const allSettings = await db.all<Array<{key: string, value: string}>>(`SELECT key, value FROM site_settings`)
    
    // 填充设置对象
    for (const setting of allSettings) {
      updatedSettings[setting.key] = setting.value
    }
    
    // 获取所有注册商图标
    const icons = await db.all<Array<{name: string, svg: string}>>(`SELECT name, svg FROM registrar_icons`)
    const registrarIcons = icons.reduce((acc: Record<string, string>, icon) => {
      acc[icon.name] = icon.svg
      return acc
    }, {})
    
    updatedSettings.registrarIcons = registrarIcons

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings
    })
  } catch (error) {
    console.error("Error updating site settings:", error)
    return NextResponse.json({ error: "Failed to update site settings", details: String(error) }, { status: 500 })
  }
}


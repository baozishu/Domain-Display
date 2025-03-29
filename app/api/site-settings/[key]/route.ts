import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// 更新单个设置项
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params
    const { value } = await request.json()
    
    if (!key) {
      return NextResponse.json(
        { error: "设置键名不能为空" },
        { status: 400 }
      )
    }
    
    const db = await getDb()
    
    // 确保表结构正确
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)
    
    // 特殊处理注册商图标
    if (key === "registrarIcons") {
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
      
      // 清空现有注册商图标
      await db.run(`DELETE FROM registrar_icons`)
      
      // 添加新的注册商图标
      for (const [name, svg] of Object.entries(value)) {
        await db.run(
          `INSERT INTO registrar_icons (id, name, svg) VALUES (?, ?, ?)`,
          [Date.now().toString() + Math.random().toString(36).substring(2, 7), name, svg as string]
        )
      }
    } else {
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
    
    return NextResponse.json({ 
      success: true, 
      key,
      updated: true
    })
  } catch (error) {
    console.error(`更新设置[${params.key}]失败:`, error)
    return NextResponse.json(
      { error: "更新设置失败", details: String(error) },
      { status: 500 }
    )
  }
} 
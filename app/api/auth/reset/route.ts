import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

// 重置密码
export async function POST() {
  try {
    // 获取数据库连接
    const db = await getDb()
    console.log("重置密码: 成功获取数据库连接")

    // 确保auth表存在
    await db.exec(`
      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        security_code TEXT DEFAULT '',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)
    console.log("重置密码: 确保auth表存在")

    // 检查是否存在admin记录
    const adminExists = await db.get(`SELECT id FROM auth WHERE id = 'admin'`)
    
    if (adminExists) {
      // 如果存在，更新密码
      console.log("重置密码: 找到admin记录，正在更新...")
      await db.run(`
        UPDATE auth 
        SET password = 'admin123', is_logged_in = 0, updated_at = strftime('%s', 'now') 
        WHERE id = 'admin'
      `)
    } else {
      // 如果不存在，创建新记录
      console.log("重置密码: 未找到admin记录，正在创建...")
      await db.run(`
        INSERT INTO auth (id, password, security_code, is_logged_in)
        VALUES ('admin', 'admin123', '', 0)
      `)
    }

    // 清除认证cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth")
    console.log("重置密码: 已清除认证cookie")

    return NextResponse.json({ 
      success: true, 
      message: "密码已重置为默认值: admin123"
    })
  } catch (error) {
    console.error("重置密码错误:", error)
    return NextResponse.json({ 
      error: "重置密码失败", 
      details: String(error) 
    }, { status: 500 })
  }
}


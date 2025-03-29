import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

// POST: 使用安全码重置密码
export async function POST(request: NextRequest) {
  try {
    const { securityCode } = await request.json()

    if (!securityCode) {
      return NextResponse.json({ error: "安全码不能为空" }, { status: 400 })
    }

    const db = await getDb()

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

    // 获取admin记录
    const auth = await db.get(`SELECT * FROM auth WHERE id = 'admin'`)

    if (!auth) {
      return NextResponse.json({ error: "未找到管理员账户" }, { status: 404 })
    }

    // 验证安全码
    if (!auth.security_code || auth.security_code !== securityCode) {
      return NextResponse.json({ error: "安全码不正确" }, { status: 401 })
    }

    // 重置密码为默认值
    await db.run(`
      UPDATE auth 
      SET password = 'admin123', is_logged_in = 0, updated_at = strftime('%s', 'now') 
      WHERE id = 'admin'
    `)

    // 清除认证cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth")

    return NextResponse.json({ 
      success: true, 
      message: "密码已成功重置为默认值: admin123" 
    })
  } catch (error) {
    console.error("使用安全码重置密码失败:", error)
    return NextResponse.json({ 
      error: "重置密码失败", 
      details: String(error) 
    }, { status: 500 })
  }
} 
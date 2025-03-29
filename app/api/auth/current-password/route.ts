import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET: 获取当前密码
export async function GET() {
  try {
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

    // 获取当前密码
    const auth = await db.get(`SELECT password FROM auth WHERE id = 'admin'`)
    const currentPassword = auth?.password || "admin123"

    return NextResponse.json({ currentPassword })
  } catch (error) {
    console.error("获取当前密码失败:", error)
    return NextResponse.json({ error: "获取当前密码失败" }, { status: 500 })
  }
} 
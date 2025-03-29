import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

// 登出
export async function POST() {
  try {
    const db = await getDb()

    // 更新登录状态
    await db.run(`UPDATE auth SET is_logged_in = 0, updated_at = strftime('%s', 'now') WHERE id = 'admin'`)

    // 删除认证cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}


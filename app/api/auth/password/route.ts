import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyPassword } from "@/lib/db/services"

// 更新密码
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()
    console.log("更新密码: 收到密码更新请求")

    if (!currentPassword || !newPassword) {
      console.log("更新密码: 缺少参数")
      return NextResponse.json({ 
        error: "当前密码和新密码都是必需的" 
      }, { status: 400 })
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(currentPassword)
    
    if (!isPasswordValid) {
      console.log("更新密码: 当前密码无效")
      return NextResponse.json({ 
        error: "当前密码不正确" 
      }, { status: 401 })
    }

    // 获取数据库连接
    const db = await getDb()
    console.log("更新密码: 成功获取数据库连接")

    // 确保auth表存在
    await db.exec(`
      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // 更新密码
    await db.run(`
      UPDATE auth 
      SET password = ?, updated_at = strftime('%s', 'now') 
      WHERE id = 'admin'
    `, [newPassword])
    
    console.log("更新密码: 密码已成功更新")

    return NextResponse.json({ 
      success: true,
      message: "密码更新成功" 
    })
  } catch (error) {
    console.error("更新密码错误:", error)
    return NextResponse.json({ 
      error: "更新密码失败", 
      details: String(error) 
    }, { status: 500 })
  }
}


import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET: 获取当前安全码
export async function GET() {
  console.log("API: 开始获取安全码")
  
  try {
    // 获取数据库连接
    console.log("API: 尝试获取数据库连接")
    const db = await getDb()
    console.log("API: 成功获取数据库连接")

    // 确保auth表存在并包含security_code字段
    console.log("API: 确保auth表存在")
    try {
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
      console.log("API: auth表创建或已存在")
    } catch (tableError) {
      console.error("API: 创建auth表失败:", tableError)
      return NextResponse.json({ 
        error: "创建auth表失败", 
        details: String(tableError) 
      }, { status: 500 })
    }

    // 获取安全码
    console.log("API: 尝试查询安全码")
    let auth
    try {
      auth = await db.get(`SELECT security_code FROM auth WHERE id = 'admin'`)
      console.log("API: 安全码查询结果:", auth)
    } catch (queryError) {
      console.error("API: 查询安全码失败:", queryError)
      return NextResponse.json({ 
        error: "查询安全码失败", 
        details: String(queryError) 
      }, { status: 500 })
    }
    
    const securityCode = auth?.security_code || ""
    console.log("API: 返回安全码:", securityCode)

    return NextResponse.json({ securityCode })
  } catch (error) {
    console.error("API: 获取安全码失败:", error)
    // 更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : "无堆栈信息"
    
    console.error("API: 错误详情:", errorMessage)
    console.error("API: 错误堆栈:", errorStack)
    
    return NextResponse.json({ 
      error: "获取安全码失败", 
      details: errorMessage,
      errorTime: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT: 更新安全码
export async function PUT(request: NextRequest) {
  console.log("API: 开始更新安全码")
  
  try {
    const data = await request.json()
    console.log("API: 收到更新安全码请求数据:", data)
    
    const { securityCode } = data

    if (securityCode === undefined) {
      console.log("API: 安全码参数缺失")
      return NextResponse.json({ error: "安全码不能为空" }, { status: 400 })
    }

    // 获取数据库连接
    console.log("API: 尝试获取数据库连接")
    const db = await getDb()
    console.log("API: 成功获取数据库连接")

    // 确保auth表存在
    console.log("API: 确保auth表存在")
    try {
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
      console.log("API: auth表创建或已存在")
    } catch (tableError) {
      console.error("API: 创建auth表失败:", tableError)
      return NextResponse.json({ 
        error: "创建auth表失败", 
        details: String(tableError) 
      }, { status: 500 })
    }

    // 检查是否存在admin记录
    console.log("API: 检查admin记录是否存在")
    let adminExists
    try {
      adminExists = await db.get(`SELECT id FROM auth WHERE id = 'admin'`)
      console.log("API: admin记录查询结果:", adminExists)
    } catch (queryError) {
      console.error("API: 查询admin记录失败:", queryError)
      return NextResponse.json({ 
        error: "查询admin记录失败", 
        details: String(queryError) 
      }, { status: 500 })
    }
    
    try {
      if (adminExists) {
        // 更新安全码
        console.log("API: 更新admin安全码")
        await db.run(`
          UPDATE auth 
          SET security_code = ?, updated_at = strftime('%s', 'now') 
          WHERE id = 'admin'
        `, [securityCode])
      } else {
        // 创建记录
        console.log("API: 创建admin记录")
        await db.run(`
          INSERT INTO auth (id, password, security_code, is_logged_in)
          VALUES ('admin', 'admin123', ?, 0)
        `, [securityCode])
      }
      console.log("API: 安全码更新成功")
    } catch (updateError) {
      console.error("API: 更新安全码失败:", updateError)
      return NextResponse.json({ 
        error: "更新安全码失败", 
        details: String(updateError) 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "安全码已更新" })
  } catch (error) {
    console.error("API: 更新安全码失败:", error)
    // 更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : "无堆栈信息"
    
    console.error("API: 错误详情:", errorMessage)
    console.error("API: 错误堆栈:", errorStack)
    
    return NextResponse.json({ 
      error: "更新安全码失败", 
      details: errorMessage,
      errorTime: new Date().toISOString()
    }, { status: 500 })
  }
} 
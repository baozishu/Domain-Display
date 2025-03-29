import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// GET: 检查并修复数据库
export async function GET() {
  console.log("[API] 开始检查数据库结构")
  
  try {
    // 获取数据库连接
    console.log("[API] 尝试获取数据库连接")
    const db = await getDb()
    console.log("[API] 成功获取数据库连接")

    // 检查auth表是否存在
    console.log("[API] 检查auth表")
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='auth'")
    
    if (tables.length === 0) {
      console.log("[API] auth表不存在，创建新表")
      // 创建auth表
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
      
      // 创建默认管理员账户
      await db.run(`
        INSERT INTO auth (id, password, security_code, is_logged_in)
        VALUES ('admin', 'admin123', '', 0)
      `)
      console.log("[API] 已创建auth表和默认账户")
    } else {
      console.log("[API] auth表已存在，检查结构")
      
      // 检查表结构
      const columns = await db.all("PRAGMA table_info(auth)")
      const hasSecurityCode = columns.some((col: any) => col.name === 'security_code')
      
      if (!hasSecurityCode) {
        console.log("[API] 添加security_code字段")
        try {
          // SQLite添加列
          await db.exec(`ALTER TABLE auth ADD COLUMN security_code TEXT DEFAULT ''`)
          console.log("[API] security_code字段添加成功")
        } catch (alterError) {
          console.error("[API] 添加字段失败:", alterError)
          // 创建临时表方法
          await db.exec(`
            BEGIN TRANSACTION;
            
            -- 创建新表
            CREATE TABLE auth_new (
              id TEXT PRIMARY KEY DEFAULT 'admin',
              password TEXT DEFAULT 'admin123',
              security_code TEXT DEFAULT '',
              is_logged_in INTEGER DEFAULT 0,
              created_at INTEGER DEFAULT (strftime('%s', 'now')),
              updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            );
            
            -- 复制数据
            INSERT INTO auth_new (id, password, is_logged_in, created_at, updated_at)
            SELECT id, password, is_logged_in, created_at, updated_at FROM auth;
            
            -- 删除旧表
            DROP TABLE auth;
            
            -- 重命名新表
            ALTER TABLE auth_new RENAME TO auth;
            
            COMMIT;
          `)
          console.log("[API] 通过重建表添加security_code字段成功")
        }
      } else {
        console.log("[API] security_code字段已存在")
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "数据库检查和修复完成" 
    })
  } catch (error) {
    console.error("[API] 数据库检查失败:", error)
    return NextResponse.json({ 
      error: "数据库检查失败", 
      details: String(error) 
    }, { status: 500 })
  }
} 
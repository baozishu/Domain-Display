import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getDb, backupDatabase } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// 备份目录路径
const BACKUP_DIR = path.join(process.cwd(), ".data", "backups")

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// 创建备份
export async function POST(request: NextRequest) {
  try {
    const { name, format = "sqlite" } = await request.json()
    
    if (!name) {
      return NextResponse.json(
        { error: "备份名称不能为空" },
        { status: 400 }
      )
    }
    
    // 生成文件名
    const id = uuidv4()
    const timestamp = Date.now()
    const fileName = `${name.replace(/\s+/g, "-")}-${timestamp}`
    const fileExt = format === "db" ? ".db" : ".sqlite"
    const filePath = path.join(BACKUP_DIR, fileName + fileExt)
    
    // 创建SQLite或DB备份
    await backupDatabase(filePath)
    
    // 返回备份信息
    const stats = fs.statSync(filePath)
    
    return NextResponse.json({
      id,
      fileName: path.basename(filePath),
      size: stats.size,
      format,
      createdAt: timestamp,
    })
  } catch (error) {
    console.error("创建备份失败:", error)
    return NextResponse.json(
      { error: "创建备份失败" },
      { status: 500 }
    )
  }
} 
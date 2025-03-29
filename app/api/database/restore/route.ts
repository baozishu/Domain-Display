import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { restoreDatabase } from "@/lib/db"

// 备份目录路径
const BACKUP_DIR = path.join(process.cwd(), ".data", "backups")

// A恢复备份
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: "备份ID不能为空" },
        { status: 400 }
      )
    }
    
    // 如果备份目录不存在，返回错误
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json(
        { error: "备份目录不存在" },
        { status: 404 }
      )
    }
    
    // 查找匹配ID的备份文件
    const files = fs.readdirSync(BACKUP_DIR)
    const backupFile = files.find(file => 
      file.startsWith(id) || file.replace(/\.(sqlite|db)$/, "") === id
    )
    
    if (!backupFile) {
      return NextResponse.json(
        { error: "备份文件不存在" },
        { status: 404 }
      )
    }
    
    const filePath = path.join(BACKUP_DIR, backupFile)
    
    // 恢复数据库
    await restoreDatabase(filePath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("恢复备份失败:", error)
    return NextResponse.json(
      { error: "恢复备份失败" },
      { status: 500 }
    )
  }
} 
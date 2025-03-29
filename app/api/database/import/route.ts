import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { restoreDatabase, getDb } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// 备份目录路径
const BACKUP_DIR = path.join(process.cwd(), ".data", "backups")
// 临时目录路径
const TEMP_DIR = path.join(process.cwd(), ".data", "temp")

// 确保目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

// 导入备份文件
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    
    if (!file) {
      return NextResponse.json(
        { error: "未提供文件" },
        { status: 400 }
      )
    }
    
    // 检查文件类型
    const fileName = file.name
    const isSqlite = fileName.endsWith(".sqlite")
    const isDb = fileName.endsWith(".db")
    
    if (!isSqlite && !isDb) {
      return NextResponse.json(
        { error: "仅支持 .sqlite 或 .db 文件" },
        { status: 400 }
      )
    }
    
    // 生成临时文件路径
    const tempFilePath = path.join(TEMP_DIR, `temp-${Date.now()}-${fileName}`)
    
    // 将上传的文件保存到临时文件
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(tempFilePath, buffer)
    
    // 生成备份ID和文件名
    const id = uuidv4()
    const timestamp = Date.now()
    const fileExt = isDb ? ".db" : ".sqlite"
    const backupFileName = `imported-${path.basename(fileName, path.extname(fileName))}-${timestamp}${fileExt}`
    const backupFilePath = path.join(BACKUP_DIR, backupFileName)
    
    // 将临时文件移动到备份目录
    fs.copyFileSync(tempFilePath, backupFilePath)
    fs.unlinkSync(tempFilePath)
    
    // 恢复数据库
    await restoreDatabase(backupFilePath)
    
    const stats = fs.statSync(backupFilePath)
    
    return NextResponse.json({
      success: true,
      backup: {
        id,
        fileName: backupFileName,
        size: stats.size,
        format: isDb ? "db" : "sqlite",
        createdAt: timestamp
      }
    })
  } catch (error) {
    console.error("导入备份文件失败:", error)
    return NextResponse.json(
      { error: "导入备份文件失败" },
      { status: 500 }
    )
  }
} 
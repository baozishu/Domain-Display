import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// 备份目录路径
const BACKUP_DIR = path.join(process.cwd(), ".data", "backups")

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

// 获取备份列表
export async function GET() {
  try {
    // 检查目录是否存在
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({ backups: [] })
    }

    // 获取目录中的所有文件
    const files = fs.readdirSync(BACKUP_DIR)
    
    // 过滤出.sqlite和.db文件并转换为备份对象
    const backups = files
      .filter(file => file.endsWith(".sqlite") || file.endsWith(".db"))
      .map(fileName => {
        const filePath = path.join(BACKUP_DIR, fileName)
        const stats = fs.statSync(filePath)
        
        return {
          id: fileName.replace(/\.(sqlite|db)$/, ""),
          fileName: fileName,
          size: stats.size,
          format: fileName.endsWith(".db") ? "db" : "sqlite",
          createdAt: stats.birthtimeMs
        }
      })
      // 按创建时间降序排序
      .sort((a, b) => b.createdAt - a.createdAt)
    
    return NextResponse.json({ backups })
  } catch (error) {
    console.error("获取备份列表失败:", error)
    return NextResponse.json({ error: "获取备份列表失败" }, { status: 500 })
  }
} 
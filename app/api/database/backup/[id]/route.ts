import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

// 备份目录路径
const BACKUP_DIR = path.join(process.cwd(), ".data", "backups")

// 删除备份
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
    // 如果备份目录不存在，直接返回成功
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({ success: true })
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
    
    // 删除备份文件
    const filePath = path.join(BACKUP_DIR, backupFile)
    fs.unlinkSync(filePath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("删除备份失败:", error)
    return NextResponse.json(
      { error: "删除备份失败" },
      { status: 500 }
    )
  }
}

// 下载备份
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    
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
    
    // 读取备份文件
    const filePath = path.join(BACKUP_DIR, backupFile)
    const fileBuffer = fs.readFileSync(filePath)
    
    // 设置响应头，使用encodeURIComponent对文件名进行编码
    const headers = new Headers()
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(backupFile)}"`)
    headers.set("Content-Type", "application/octet-stream")
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error("下载备份失败:", error)
    return NextResponse.json(
      { error: "下载备份失败" },
      { status: 500 }
    )
  }
} 
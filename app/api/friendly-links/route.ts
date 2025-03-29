import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Default friendly links for fallback
const DEFAULT_FRIENDLY_LINKS = [
  {
    id: "1",
    name: "域名注册服务",
    url: "https://example.com/register",
    description: "提供专业的域名注册和管理服务",
  },
  {
    id: "2",
    name: "网站建设平台",
    url: "https://example.com/website-builder",
    description: "快速搭建专业网站的一站式平台",
  },
]

// GET: 获取所有友情链接
export async function GET() {
  try {
    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS friendly_links (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if the table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM friendly_links")

    // If empty, insert default data
    if (count.count === 0) {
      console.log("Friendly links table is empty, inserting default data")
      for (const link of DEFAULT_FRIENDLY_LINKS) {
        await db.run(
          `INSERT INTO friendly_links (id, name, url, description)
           VALUES (?, ?, ?, ?)`,
          [link.id, link.name, link.url, link.description || null],
        )
      }
    }

    const links = await db.all(`SELECT * FROM friendly_links`)

    return NextResponse.json(links)
  } catch (error) {
    console.error("Error fetching friendly links:", error)
    return NextResponse.json(DEFAULT_FRIENDLY_LINKS)
  }
}

// POST: 创建新友情链接
export async function POST(request: NextRequest) {
  try {
    const link = await request.json()
    const db = await getDb()

    // 生成ID（如果没有提供）
    const id = link.id || uuidv4()

    await db.run(
      `INSERT INTO friendly_links (id, name, url, description)
       VALUES (?, ?, ?, ?)`,
      [id, link.name, link.url, link.description || null],
    )

    return NextResponse.json({ id, ...link })
  } catch (error) {
    console.error("Error creating friendly link:", error)
    return NextResponse.json({ error: "Failed to create friendly link" }, { status: 500 })
  }
}

// PUT: 更新友情链接
export async function PUT(request: NextRequest) {
  try {
    const link = await request.json()
    const db = await getDb()

    await db.run(
      `UPDATE friendly_links 
       SET name = ?, url = ?, description = ?, updated_at = strftime('%s', 'now')
       WHERE id = ?`,
      [link.name, link.url, link.description || null, link.id],
    )

    return NextResponse.json(link)
  } catch (error) {
    console.error("Error updating friendly link:", error)
    return NextResponse.json({ error: "Failed to update friendly link" }, { status: 500 })
  }
}

// DELETE: 删除友情链接
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Link ID is required" }, { status: 400 })
    }

    const db = await getDb()
    await db.run("DELETE FROM friendly_links WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting friendly link:", error)
    return NextResponse.json({ error: "Failed to delete friendly link" }, { status: 500 })
  }
}


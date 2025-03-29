import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Default sold domains for fallback
const DEFAULT_SOLD_DOMAINS = [
  {
    id: "s1",
    name: "premium",
    extension: ".com",
    status: "sold",
    soldTo: "科技解决方案公司",
    soldDate: "2025-02-15",
  },
  {
    id: "s2",
    name: "digital",
    extension: ".io",
    status: "sold",
    soldTo: "创意代理公司",
    soldDate: "2025-01-20",
  },
]

// GET: 获取所有已售域名
export async function GET() {
  try {
    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS sold_domains (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        extension TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sold',
        sold_to TEXT,
        sold_date TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if the table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM sold_domains")

    // If empty, insert default data
    if (count.count === 0) {
      console.log("Sold domains table is empty, inserting default data")
      for (const domain of DEFAULT_SOLD_DOMAINS) {
        await db.run(
          `INSERT INTO sold_domains (id, name, extension, status, sold_to, sold_date)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            domain.id,
            domain.name,
            domain.extension,
            domain.status || "sold",
            domain.soldTo || null,
            domain.soldDate || null,
          ],
        )
      }
    }

    const domains = await db.all(`SELECT * FROM sold_domains`)

    // 转换字段名为驼峰命名
    const formattedDomains = domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      extension: domain.extension,
      status: domain.status,
      soldTo: domain.sold_to,
      soldDate: domain.sold_date,
    }))

    return NextResponse.json(formattedDomains)
  } catch (error) {
    console.error("Error fetching sold domains:", error)
    return NextResponse.json(DEFAULT_SOLD_DOMAINS)
  }
}

// POST: 创建新已售域名
export async function POST(request: NextRequest) {
  try {
    const domain = await request.json()
    const db = await getDb()

    // 生成ID（如果没有提供）
    const id = domain.id || uuidv4()

    await db.run(
      `INSERT INTO sold_domains (id, name, extension, status, sold_to, sold_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, domain.name, domain.extension, domain.status || "sold", domain.soldTo || null, domain.soldDate || null],
    )

    return NextResponse.json({ id, ...domain })
  } catch (error) {
    console.error("Error creating sold domain:", error)
    return NextResponse.json({ error: "Failed to create sold domain" }, { status: 500 })
  }
}

// PUT: 更新已售域名
export async function PUT(request: NextRequest) {
  try {
    const domain = await request.json()
    const db = await getDb()

    await db.run(
      `UPDATE sold_domains 
       SET name = ?, extension = ?, status = ?, sold_to = ?, sold_date = ?, updated_at = strftime('%s', 'now')
       WHERE id = ?`,
      [
        domain.name,
        domain.extension,
        domain.status || "sold",
        domain.soldTo || null,
        domain.soldDate || null,
        domain.id,
      ],
    )

    return NextResponse.json(domain)
  } catch (error) {
    console.error("Error updating sold domain:", error)
    return NextResponse.json({ error: "Failed to update sold domain" }, { status: 500 })
  }
}

// DELETE: 删除已售域名
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    const db = await getDb()
    await db.run("DELETE FROM sold_domains WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sold domain:", error)
    return NextResponse.json({ error: "Failed to delete sold domain" }, { status: 500 })
  }
}


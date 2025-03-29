import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

// Default domains for fallback
const DEFAULT_DOMAINS = [
  {
    id: "1",
    name: "example",
    extension: ".com",
    status: "available",
    registrar: "阿里云",
    registrarIcon: "aliyun",
    registrationTime: "2023-05-15",
    expirationTime: "2025-05-15",
    purchaseUrl: "https://wanwang.aliyun.com/domain/searchresult?keyword=example.com",
  },
  {
    id: "2",
    name: "mywebsite",
    extension: ".org",
    status: "available",
    registrar: "腾讯云",
    registrarIcon: "tencent",
    registrationTime: "2022-11-20",
    expirationTime: "2024-11-20",
    purchaseUrl: "https://dnspod.cloud.tencent.com/domain/buy?domain=mywebsite.org",
  },
]

// GET: Get all domains
export async function GET() {
  try {
    // Check if database directory exists
    const dbDir = path.join(process.cwd(), ".data")
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log("Created database directory")
    }

    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        extension TEXT NOT NULL,
        status TEXT NOT NULL,
        registrar TEXT,
        registrar_icon TEXT,
        registration_time TEXT,
        expiration_time TEXT,
        purchase_url TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if the table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM domains")

    // If empty, insert default data
    if (count.count === 0) {
      console.log("Domains table is empty, inserting default data")
      for (const domain of DEFAULT_DOMAINS) {
        await db.run(
          `INSERT INTO domains (id, name, extension, status, registrar, registrar_icon, registration_time, expiration_time, purchase_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            domain.id,
            domain.name,
            domain.extension,
            domain.status,
            domain.registrar || null,
            domain.registrarIcon || null,
            domain.registrationTime || null,
            domain.expirationTime || null,
            domain.purchaseUrl || null,
          ],
        )
      }
    }

    // Get all domains
    const domains = await db.all(`SELECT * FROM domains`)

    // Convert field names to camelCase
    const formattedDomains = domains.map((domain) => ({
      id: domain.id,
      name: domain.name,
      extension: domain.extension,
      status: domain.status,
      registrar: domain.registrar,
      registrarIcon: domain.registrar_icon,
      registrationTime: domain.registration_time,
      expirationTime: domain.expiration_time,
      purchaseUrl: domain.purchase_url,
    }))

    return NextResponse.json(formattedDomains)
  } catch (error) {
    console.error("Error fetching domains:", error)
    // Return default domains as fallback
    return NextResponse.json(DEFAULT_DOMAINS)
  }
}

// POST: Create new domain
export async function POST(request: NextRequest) {
  try {
    const domain = await request.json()
    const db = await getDb()

    // Generate ID (if not provided)
    const id = domain.id || uuidv4()

    await db.run(
      `INSERT INTO domains (id, name, extension, status, registrar, registrar_icon, registration_time, expiration_time, purchase_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        domain.name,
        domain.extension,
        domain.status,
        domain.registrar || null,
        domain.registrarIcon || null,
        domain.registrationTime || null,
        domain.expirationTime || null,
        domain.purchaseUrl || null,
      ],
    )

    return NextResponse.json({ id, ...domain })
  } catch (error) {
    console.error("Error creating domain:", error)
    return NextResponse.json({ error: "Failed to create domain", details: String(error) }, { status: 500 })
  }
}

// PUT: Update domain
export async function PUT(request: NextRequest) {
  try {
    const domain = await request.json()
    const db = await getDb()

    await db.run(
      `UPDATE domains 
       SET name = ?, extension = ?, status = ?, registrar = ?, registrar_icon = ?, 
           registration_time = ?, expiration_time = ?, purchase_url = ?, updated_at = strftime('%s', 'now')
       WHERE id = ?`,
      [
        domain.name,
        domain.extension,
        domain.status,
        domain.registrar || null,
        domain.registrarIcon || null,
        domain.registrationTime || null,
        domain.expirationTime || null,
        domain.purchaseUrl || null,
        domain.id,
      ],
    )

    return NextResponse.json(domain)
  } catch (error) {
    console.error("Error updating domain:", error)
    return NextResponse.json({ error: "Failed to update domain", details: String(error) }, { status: 500 })
  }
}

// DELETE: Delete domain
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    const db = await getDb()
    await db.run("DELETE FROM domains WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting domain:", error)
    return NextResponse.json({ error: "Failed to delete domain", details: String(error) }, { status: 500 })
  }
}


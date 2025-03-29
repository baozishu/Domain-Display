import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

// Default registrar icons for fallback
const DEFAULT_REGISTRAR_ICONS = {
  aliyun: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>`,
  tencent: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
  godaddy: `<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>`,
  namecheap: `<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>`,
  huawei: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>`,
}

// GET: Get all registrar icons
export async function GET() {
  try {
    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if the table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM registrar_icons")

    // If empty, insert default data
    if (count.count === 0) {
      console.log("Registrar icons table is empty, inserting default data")
      for (const [name, svg] of Object.entries(DEFAULT_REGISTRAR_ICONS)) {
        await db.run(
          `INSERT INTO registrar_icons (id, name, svg)
           VALUES (?, ?, ?)`,
          [uuidv4(), name, svg],
        )
      }
    }

    const icons = await db.all(`SELECT name, svg FROM registrar_icons`)

    // Convert to object with name as key
    const registrarIcons = icons.reduce((acc, icon) => {
      acc[icon.name] = icon.svg
      return acc
    }, {})

    return NextResponse.json(registrarIcons)
  } catch (error) {
    console.error("Error fetching registrar icons:", error)
    return NextResponse.json(DEFAULT_REGISTRAR_ICONS)
  }
}

// POST: Create new registrar icon
export async function POST(request: NextRequest) {
  try {
    const { name, svg } = await request.json()

    if (!name || !svg) {
      return NextResponse.json({ error: "Name and SVG are required" }, { status: 400 })
    }

    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if icon with this name already exists
    const existingIcon = await db.get(`SELECT * FROM registrar_icons WHERE name = ?`, [name])
    if (existingIcon) {
      return NextResponse.json({ error: "Icon with this name already exists" }, { status: 409 })
    }

    const id = uuidv4()
    await db.run(`INSERT INTO registrar_icons (id, name, svg) VALUES (?, ?, ?)`, [id, name, svg])

    return NextResponse.json({ id, name, svg })
  } catch (error) {
    console.error("Error creating registrar icon:", error)
    return NextResponse.json({ error: "Failed to create registrar icon" }, { status: 500 })
  }
}

// PUT: Update registrar icon
export async function PUT(request: NextRequest) {
  try {
    const { name, svg } = await request.json()

    if (!name || !svg) {
      return NextResponse.json({ error: "Name and SVG are required" }, { status: 400 })
    }

    const db = await getDb()

    // Ensure the table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if icon exists
    const existingIcon = await db.get(`SELECT * FROM registrar_icons WHERE name = ?`, [name])
    if (!existingIcon) {
      // If icon doesn't exist, create it
      const id = uuidv4()
      await db.run(`INSERT INTO registrar_icons (id, name, svg) VALUES (?, ?, ?)`, [id, name, svg])
      return NextResponse.json({ id, name, svg })
    }

    await db.run(`UPDATE registrar_icons SET svg = ?, updated_at = strftime('%s', 'now') WHERE name = ?`, [svg, name])

    return NextResponse.json({ name, svg })
  } catch (error) {
    console.error("Error updating registrar icon:", error)
    return NextResponse.json({ error: "Failed to update registrar icon" }, { status: 500 })
  }
}

// DELETE: Delete registrar icon
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get("name")

    if (!name) {
      return NextResponse.json({ error: "Icon name is required" }, { status: 400 })
    }

    const db = await getDb()
    await db.run(`DELETE FROM registrar_icons WHERE name = ?`, [name])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting registrar icon:", error)
    return NextResponse.json({ error: "Failed to delete registrar icon" }, { status: 500 })
  }
}


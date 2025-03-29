import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

// POST: 重置站点设置
export async function POST() {
  try {
    const db = await getDb()

    // Ensure the site_settings table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        site_name TEXT DEFAULT '域名展示',
        logo_type TEXT DEFAULT 'text',
        logo_text TEXT DEFAULT '域名展示',
        logo_image TEXT,
        favicon TEXT DEFAULT 'https://xn--1xa.team/img/favicon.ico',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if default settings exist
    const existingSettings = await db.get(`SELECT * FROM site_settings WHERE id = 'default'`)

    if (!existingSettings) {
      // Insert default settings
      await db.run(`
        INSERT INTO site_settings (id, site_name, logo_type, logo_text, favicon)
        VALUES ('default', '域名展示', 'text', '域名展示', 'https://xn--1xa.team/img/favicon.ico')
      `)
    } else {
      // Reset to default values
      await db.run(`
        UPDATE site_settings
        SET site_name = '域名展示',
            logo_type = 'text',
            logo_text = '域名展示',
            logo_image = NULL,
            favicon = 'https://xn--1xa.team/img/favicon.ico',
            updated_at = strftime('%s', 'now')
        WHERE id = 'default'
      `)
    }

    // Reset registrar icons
    await db.exec(`
      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Delete all existing icons
    await db.run(`DELETE FROM registrar_icons`)

    // Insert default icons
    await db.run(`
      INSERT INTO registrar_icons (id, name, svg)
      VALUES 
        ('1', 'aliyun', '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>'),
        ('2', 'tencent', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'),
        ('3', 'godaddy', '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>'),
        ('4', 'namecheap', '<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>'),
        ('5', 'huawei', '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>')
    `)

    return NextResponse.json({ success: true, message: "Site settings reset successfully" })
  } catch (error) {
    console.error("Error resetting site settings:", error)
    return NextResponse.json({ error: "Failed to reset site settings", details: String(error) }, { status: 500 })
  }
}


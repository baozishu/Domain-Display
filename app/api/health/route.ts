import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import { getDb } from "@/lib/db"

export async function GET() {
  const diagnostics = {
    status: "checking",
    dbFile: {
      exists: false,
      writable: false,
      size: 0,
      path: "",
    },
    dbConnection: false,
    tables: {},
    error: null,
  }

  try {
    // Check database file
    const dbDir = path.join(process.cwd(), ".data")
    const dbPath = path.join(dbDir, "domain-display.db")
    diagnostics.dbFile.path = dbPath

    if (fs.existsSync(dbPath)) {
      diagnostics.dbFile.exists = true
      diagnostics.dbFile.size = fs.statSync(dbPath).size

      try {
        fs.accessSync(dbPath, fs.constants.W_OK)
        diagnostics.dbFile.writable = true
      } catch (error) {
        diagnostics.dbFile.writable = false
      }
    }

    // Test database connection
    try {
      const db = await getDb()
      diagnostics.dbConnection = true

      // Check tables
      const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")

      for (const table of tables) {
        const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`)
        diagnostics.tables[table.name] = count.count
      }

      diagnostics.status = "healthy"
    } catch (error) {
      diagnostics.dbConnection = false
      diagnostics.error = String(error)
      diagnostics.status = "error"
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    diagnostics.status = "error"
    diagnostics.error = String(error)
    return NextResponse.json(diagnostics, { status: 500 })
  }
}


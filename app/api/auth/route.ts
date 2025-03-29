import { type NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { cookies } from "next/headers"

// Default admin credentials
const DEFAULT_ADMIN = {
  id: "admin",
  password: "admin123",
  is_logged_in: 0,
}

// GET: Get auth status (for checking if logged in)
export async function GET() {
  try {
    const db = await getDb()

    // Ensure auth table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        security_code TEXT DEFAULT '',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if auth table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM auth")

    // If empty, insert default admin
    if (count.count === 0) {
      await db.run(`
        INSERT INTO auth (id, password, security_code, is_logged_in)
        VALUES ('admin', 'admin123', '', 0)
      `)
      console.log("Default admin account created")
    }

    // Get auth status from cookie first (more reliable)
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("auth")

    if (authCookie?.value === "true") {
      return NextResponse.json({ isLoggedIn: true })
    }

    // Fallback to database check
    const auth = await db.get(`SELECT is_logged_in FROM auth WHERE id = 'admin'`)

    return NextResponse.json({
      isLoggedIn: auth ? Boolean(auth.is_logged_in) : false,
    })
  } catch (error) {
    console.error("Error fetching auth status:", error)
    return NextResponse.json({ isLoggedIn: false })
  }
}

// POST: Login
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const db = await getDb()

    // Ensure auth table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        security_code TEXT DEFAULT '',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    // Check if auth table is empty
    const count = await db.get("SELECT COUNT(*) as count FROM auth")

    // If empty, insert default admin
    if (count.count === 0) {
      await db.run(`
        INSERT INTO auth (id, password, security_code, is_logged_in)
        VALUES ('admin', 'admin123', '', 0)
      `)
      console.log("Default admin account created during login")
    }

    // Get admin record
    const auth = await db.get(`SELECT * FROM auth WHERE id = 'admin'`)

    // If no admin record found, create one with default password
    if (!auth) {
      await db.run(`
        INSERT INTO auth (id, password, security_code, is_logged_in)
        VALUES ('admin', 'admin123', '', 0)
      `)

      // Check if the provided password matches the default
      if (password !== "admin123") {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 })
      }
    } else if (auth.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Update login status
    await db.run(`UPDATE auth SET is_logged_in = 1, updated_at = strftime('%s', 'now') WHERE id = 'admin'`)

    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set("auth", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })

    return NextResponse.json({ success: true, isLoggedIn: true })
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Login failed", details: String(error) }, { status: 500 })
  }
}

// PUT: Update password
export async function PUT(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    const db = await getDb()

    // Ensure auth table exists
    await db.exec(`
      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        security_code TEXT DEFAULT '',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `)

    const auth = await db.get(`SELECT * FROM auth WHERE id = 'admin'`)

    if (!auth) {
      return NextResponse.json({ error: "Auth record not found" }, { status: 404 })
    }

    if (auth.password !== currentPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Update password
    await db.run(`UPDATE auth SET password = ?, updated_at = strftime('%s', 'now') WHERE id = 'admin'`, [newPassword])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating password:", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}

// DELETE: Logout
export async function DELETE() {
  try {
    const db = await getDb()

    // Update login status
    await db.run(`UPDATE auth SET is_logged_in = 0, updated_at = strftime('%s', 'now') WHERE id = 'admin'`)

    // Clear auth cookie
    const cookieStore = await cookies()
    cookieStore.delete("auth")

    return NextResponse.json({ success: true, isLoggedIn: false })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}


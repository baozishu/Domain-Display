import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// 获取认证状态
export async function GET() {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("auth")

    return NextResponse.json({
      isLoggedIn: authCookie?.value === "true",
    })
  } catch (error) {
    console.error("Error checking auth status:", error)
    return NextResponse.json({ error: "Failed to check auth status" }, { status: 500 })
  }
}


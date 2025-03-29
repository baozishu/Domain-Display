import { NextResponse } from "next/server"
import { resetDatabase } from "@/lib/db/index"

export async function POST() {
  console.log("[API] 开始执行数据库重置操作");
  
  try {
    // 添加超时保护
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("数据库重置操作超时")), 30000)
    );
    
    // 使用Promise.race确保不会无限等待
    await Promise.race([
      resetDatabase(),
      timeout
    ]);
    
    console.log("[API] 数据库重置成功");
    return NextResponse.json({ success: true, message: "Database reset successfully" });
  } catch (error) {
    console.error("[API] 数据库重置失败:", error);
    
    // 详细的错误信息
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";
    
    // 记录更多信息以便调试
    console.error("[API] 错误详情:", errorMessage);
    console.error("[API] 错误堆栈:", errorStack);
    
    return NextResponse.json(
      { 
        error: "Failed to reset database", 
        details: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}


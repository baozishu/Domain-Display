import sqlite3 from "sqlite3"
import { open } from "sqlite"
import path from "path"
import fs from "fs"

// 全局数据库连接变量
let db: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

// Get database connection with better error handling
export async function getDb() {
  // If we already have a connection, return it
  if (db) {
    return db
  }

  // If initialization is in progress, wait for it
  if (isInitializing && initPromise) {
    return initPromise
  }

  isInitializing = true
  initPromise = initializeDb()

  try {
    db = await initPromise
    isInitializing = false
    return db
  } catch (error) {
    isInitializing = false
    initPromise = null
    console.error("Failed to initialize database:", error)
    throw error
  }
}

// Initialize database connection
async function initializeDb() {
  try {
    // Ensure database directory exists
    const dbDir = path.join(process.cwd(), ".data")
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log("Created database directory:", dbDir)
    }

    const dbPath = path.join(dbDir, "domain-display.db")
    let needsRecreate = false

    // Check if database file exists and is writable
    if (fs.existsSync(dbPath)) {
      try {
        // Test if file is writable
        fs.accessSync(dbPath, fs.constants.W_OK)
      } catch (error) {
        console.error("Database file exists but is not writable:", error)
        // Try to fix permissions
        try {
          fs.chmodSync(dbPath, 0o666)
          console.log("Updated database file permissions")
        } catch (permError) {
          console.error("Failed to update database file permissions:", permError)
          needsRecreate = true
        }
      }

      // If file is too small or empty, it might be corrupted
      if (fs.statSync(dbPath).size < 100) {
        console.warn("Database file appears to be corrupted (too small)")
        needsRecreate = true
      }
    }

    // If we need to recreate the database file
    if (needsRecreate || !fs.existsSync(dbPath)) {
      try {
        console.log("Attempting to recreate database file")
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath)
        }
      } catch (error) {
        console.error("Failed to delete existing database file:", error)
        // Continue anyway and try to open the database
      }
    }

    // Open database connection with a longer timeout
    const database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      // @ts-ignore - timeout参数在某些SQLite库实现中可用，但类型定义未包含
      timeout: 10000, // 10 seconds timeout
    })

    // Test the connection with a simple query
    try {
      await database.get("SELECT 1")
    } catch (error) {
      console.error("Database connection test failed:", error)
      throw new Error("Database connection test failed")
    }

    console.log("Database connection established successfully")
    return database
  } catch (error) {
    console.error("Failed to open database connection:", error)
    throw error
  }
}

// Initialize database schema
export async function initDb() {
  try {
    const db = await getDb()

    // Create tables
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
      );

      CREATE TABLE IF NOT EXISTS sold_domains (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        extension TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sold',
        sold_to TEXT,
        sold_date TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS friendly_links (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        site_name TEXT DEFAULT '域名展示',
        logo_type TEXT DEFAULT 'text',
        logo_text TEXT DEFAULT '域名展示',
        logo_image TEXT,
        favicon TEXT DEFAULT 'https://xn--1xa.team/img/favicon.ico',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS registrar_icons (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        svg TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS auth (
        id TEXT PRIMARY KEY DEFAULT 'admin',
        password TEXT DEFAULT 'admin123',
        is_logged_in INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `)

    console.log("Database tables created successfully")
    return db
  } catch (error) {
    console.error("Failed to initialize database schema:", error)
    throw error
  }
}

// Check if table is empty
export async function isTableEmpty(tableName: string): Promise<boolean> {
  try {
    const db = await getDb()
    const result = await db.get(`SELECT COUNT(*) as count FROM ${tableName}`)
    return result.count === 0
  } catch (error) {
    console.error(`Error checking if table ${tableName} is empty:`, error)
    // If there's an error (like table doesn't exist), assume it's empty
    return true
  }
}

// Import default data
export async function importDefaultData() {
  try {
    const db = await getDb();
    
    // 首先检查各表是否为空
    const domainsEmpty = await isTableEmpty("domains");
    const soldDomainsEmpty = await isTableEmpty("sold_domains");
    const linksEmpty = await isTableEmpty("friendly_links");
    const settingsEmpty = await isTableEmpty("site_settings");
    const iconsEmpty = await isTableEmpty("registrar_icons");
    const authEmpty = await isTableEmpty("auth");
    
    // 导入默认域名
    if (domainsEmpty) {
      try {
        await db.run(`
          INSERT INTO domains (id, name, extension, status, registrar, registrar_icon)
          VALUES 
            ('1', 'example', '.com', 'available', 'Aliyun', 'aliyun'),
            ('2', 'premium', '.cn', 'available', 'Tencent', 'tencent'),
            ('3', 'business', '.net', 'available', 'GoDaddy', 'godaddy'),
            ('4', 'startup', '.io', 'available', 'Namecheap', 'namecheap'),
            ('5', 'tech', '.co', 'available', 'Huawei', 'huawei')
        `);
        console.log("Default domains imported");
      } catch (error) {
        console.error("导入默认域名失败:", error);
      }
    }

    // 导入默认已售域名
    if (soldDomainsEmpty) {
      try {
        await db.run(`
          INSERT INTO sold_domains (id, name, extension, status, sold_to, sold_date)
          VALUES 
            ('s1', 'premium', '.com', 'sold', '科技解决方案公司', '2025-02-15'),
            ('s2', 'digital', '.io', 'sold', '创意代理公司', '2025-01-20'),
            ('s3', 'ecommerce', '.store', 'sold', '在线零售有限公司', '2024-12-10')
        `);
        console.log("Default sold domains imported");
      } catch (error) {
        console.error("导入默认已售域名失败:", error);
      }
    }

    // 导入默认友情链接
    if (linksEmpty) {
      try {
        await db.run(`
          INSERT INTO friendly_links (id, name, url, description)
          VALUES 
            ('1', '域名注册服务', 'https://example.com/register', '提供专业的域名注册和管理服务'),
            ('2', '网站建设平台', 'https://example.com/website-builder', '快速搭建专业网站的一站式平台'),
            ('3', '域名行情分析', 'https://example.com/domain-market', '最新域名市场趋势和价值分析'),
            ('4', '云服务提供商', 'https://example.com/cloud', '高性能云服务器和存储解决方案'),
            ('5', '域名投资指南', 'https://example.com/investment', '专业的域名投资策略和建议')
        `);
        console.log("Default friendly links imported");
      } catch (error) {
        console.error("导入默认友情链接失败:", error);
      }
    }

    // 导入默认站点设置
    if (settingsEmpty) {
      try {
        await db.run(`
          INSERT INTO site_settings (id, site_name, logo_type, logo_text, favicon)
          VALUES ('default', '域名展示', 'text', '域名展示', 'https://xn--1xa.team/img/favicon.ico')
        `);
        console.log("Default site settings imported");
      } catch (error) {
        console.error("导入默认站点设置失败:", error);
      }
    }

    // 导入默认注册商图标
    if (iconsEmpty) {
      try {
        await db.run(`
          INSERT INTO registrar_icons (id, name, svg)
          VALUES 
            ('1', 'aliyun', '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>'),
            ('2', 'tencent', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'),
            ('3', 'godaddy', '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>'),
            ('4', 'namecheap', '<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>'),
            ('5', 'huawei', '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>')
        `);
        console.log("Default registrar icons imported");
      } catch (error) {
        console.error("导入默认注册商图标失败:", error);
      }
    }

    // 导入默认认证数据
    if (authEmpty) {
      try {
        await db.run(`
          INSERT INTO auth (id, password, is_logged_in)
          VALUES ('admin', 'admin123', 0)
        `);
        console.log("Default auth data imported");
      } catch (error) {
        console.error("导入默认认证数据失败:", error);
      }
    }
  } catch (error) {
    console.error("Failed to import default data:", error);
    throw error;
  }
}

// Reset database
export async function resetDatabase() {
  try {
    // 关闭旧连接，避免数据库锁定问题
    if (db) {
      try {
        await db.close();
        db = null;
      } catch (closeErr) {
        console.error("关闭数据库连接失败，继续尝试重置:", closeErr);
      }
    }
    
    // 重新获取连接
    const database = await getDb();
    
    try {
      // 直接清空表，不使用事务，避免事务锁定问题
      await database.run("DELETE FROM domains");
      await database.run("DELETE FROM sold_domains");
      await database.run("DELETE FROM friendly_links");
      await database.run("DELETE FROM site_settings");
      await database.run("DELETE FROM registrar_icons");
      await database.run("DELETE FROM auth");
      
      console.log("所有表数据已清空");
      
      // 导入默认数据前，确保连接正常
      await database.get("SELECT 1 as test");
      
      // Re-import default data
      await importDefaultData();
      
      return { success: true }
    } catch (error) {
      console.error("清空表数据失败:", error);
      throw error;
    }
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}

// Setup database on startup
export async function setupDatabase() {
  try {
    await initDb()
    await importDefaultData()
    console.log("Database setup completed successfully")
  } catch (error) {
    console.error("Database setup failed:", error)
    throw error
  }
}

// 升级数据库结构
export async function upgradeDatabase() {
  try {
    const db = await getDb()
    
    // 检查auth表是否存在security_code列
    const tableInfo = await db.all("PRAGMA table_info(auth)")
    const hasSecurityCode = tableInfo.some((col: {name: string}) => col.name === 'security_code')
    
    if (!hasSecurityCode) {
      console.log("正在添加security_code字段到auth表...")
      await db.exec(`
        ALTER TABLE auth ADD COLUMN security_code TEXT DEFAULT '';
      `)
      console.log("security_code字段添加成功")
    }
    
    return { success: true }
  } catch (error) {
    console.error("升级数据库结构失败:", error)
    throw error
  }
}


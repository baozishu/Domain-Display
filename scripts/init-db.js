const fs = require("fs")
const path = require("path")
const sqlite3 = require("sqlite3")
const { open } = require("sqlite")

// Ensure database directory exists
const dbDir = path.join(process.cwd(), ".data")
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, "domain-display.db")

console.log("🔄 Initializing database...")

async function initializeDatabase() {
  // First, check if the database file exists and is valid
  if (fs.existsSync(dbPath)) {
    try {
      // Check if file is writable
      fs.accessSync(dbPath, fs.constants.W_OK)
      console.log("✅ Database file exists and is writable")

      // Check if file is not empty/corrupted
      const stats = fs.statSync(dbPath)
      if (stats.size < 100) {
        console.warn("⚠️ Database file appears to be corrupted (too small)")
        await recreateDatabase()
      }
    } catch (error) {
      console.error("❌ Database file exists but is not writable:", error)
      await recreateDatabase()
    }
  } else {
    console.log("⚠️ Database file does not exist, creating new one")
    await createNewDatabase()
  }
}

async function recreateDatabase() {
  try {
    console.log("🔄 Recreating database file")

    // Try to delete the existing file
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath)
        console.log("✅ Removed existing database file")
      } catch (error) {
        console.error("❌ Failed to delete existing database file:", error)
        // Try to rename it instead
        try {
          const backupPath = `${dbPath}.bak.${Date.now()}`
          fs.renameSync(dbPath, backupPath)
          console.log(`✅ Renamed existing database file to ${backupPath}`)
        } catch (renameError) {
          console.error("❌ Failed to rename existing database file:", renameError)
          throw new Error("Cannot create a new database file")
        }
      }
    }

    await createNewDatabase()
  } catch (error) {
    console.error("❌ Failed to recreate database:", error)
    process.exit(1)
  }
}

async function createNewDatabase() {
  try {
    // Create a new database file
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    // Set proper permissions
    try {
      fs.chmodSync(dbPath, 0o666)
      console.log("✅ Set database file permissions")
    } catch (error) {
      console.warn("⚠️ Failed to set database file permissions:", error)
    }

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

    console.log("✅ Database tables created")

    // Import default data
    await importDefaultData(db)

    // Close the database
    await db.close()

    console.log("✅ New database created successfully")
  } catch (error) {
    console.error("❌ Failed to create new database:", error)
    throw error
  }
}

async function importDefaultData(db) {
  try {
    // Insert default domains
    await db.run(`
      INSERT INTO domains (id, name, extension, status, registrar, registrar_icon, registration_time, expiration_time, purchase_url)
      VALUES 
        ('1', 'example', '.com', 'available', '阿里云', 'aliyun', '2023-05-15', '2025-05-15', 'https://wanwang.aliyun.com/domain/searchresult?keyword=example.com'),
        ('2', 'mywebsite', '.org', 'available', '腾讯云', 'tencent', '2022-11-20', '2024-11-20', 'https://dnspod.cloud.tencent.com/domain/buy?domain=mywebsite.org'),
        ('3', 'coolproject', '.io', 'available', 'GoDaddy', 'godaddy', '2024-01-10', '2026-01-10', 'https://www.godaddy.com/domainsearch/find?domainToCheck=coolproject.io'),
        ('4', 'portfolio', '.dev', 'available', 'Namecheap', 'namecheap', '2023-08-05', '2025-08-05', 'https://www.namecheap.com/domains/registration/results/?domain=portfolio.dev'),
        ('5', 'business', '.co', 'available', '华为云', 'huawei', '2024-03-22', '2026-03-22', 'https://www.huaweicloud.com/product/domain.html')
    `)
    console.log("✅ Default domains imported")

    // Insert default sold domains
    await db.run(`
      INSERT INTO sold_domains (id, name, extension, status, sold_to, sold_date)
      VALUES 
        ('s1', 'premium', '.com', 'sold', '科技解决方案公司', '2025-02-15'),
        ('s2', 'digital', '.io', 'sold', '创意代理公司', '2025-01-20'),
        ('s3', 'ecommerce', '.store', 'sold', '在线零售有限公司', '2024-12-10')
    `)
    console.log("✅ Default sold domains imported")

    // Insert default friendly links
    await db.run(`
      INSERT INTO friendly_links (id, name, url, description)
      VALUES 
        ('1', '域名注册服务', 'https://example.com/register', '提供专业的域名注册和管理服务'),
        ('2', '网站建设平台', 'https://example.com/website-builder', '快速搭建专业网站的一站式平台'),
        ('3', '域名行情分析', 'https://example.com/domain-market', '最新域名市场趋势和价值分析'),
        ('4', '云服务提供商', 'https://example.com/cloud', '高性能云服务器和存储解决方案'),
        ('5', '域名投资指南', 'https://example.com/investment', '专业的域名投资策略和建议')
    `)
    console.log("✅ Default friendly links imported")

    // Insert default site settings
    await db.run(`
      INSERT INTO site_settings (id, site_name, logo_type, logo_text, favicon)
      VALUES ('default', '域名展示', 'text', '域名展示', 'https://xn--1xa.team/img/favicon.ico')
    `)
    console.log("✅ Default site settings imported")

    // Insert default registrar icons
    await db.run(`
      INSERT INTO registrar_icons (id, name, svg)
      VALUES 
        ('1', 'aliyun', '<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>'),
        ('2', 'tencent', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'),
        ('3', 'godaddy', '<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>'),
        ('4', 'namecheap', '<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>'),
        ('5', 'huawei', '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>')
    `)
    console.log("✅ Default registrar icons imported")

    // Insert default auth
    await db.run(`
      INSERT INTO auth (id, password, is_logged_in)
      VALUES ('admin', 'admin123', 0)
    `)
    console.log("✅ Default auth data imported")
  } catch (error) {
    console.error("❌ Failed to import default data:", error)
    throw error
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log("✅ Database initialization completed successfully")
  })
  .catch((error) => {
    console.error("❌ Database initialization failed:", error)
    process.exit(1)
  })


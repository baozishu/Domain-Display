import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

// 确保数据库目录存在
const DATA_DIR = path.join(process.cwd(), '.data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

// 扩展的数据库类型，包含异步方法
interface EnhancedDatabase extends Database.Database {
  get(sql: string, params?: any[]): Promise<any>;
  all<T = any>(sql: string, params?: any[]): Promise<T>;
  run(sql: string, params?: any[]): Promise<any>;
  execAsync(sql: string): Promise<void>;
}

// 单例数据库连接
let dbInstance: EnhancedDatabase | null = null;

// 获取数据库实例
export function getDb(): EnhancedDatabase {
  if (!dbInstance) {
    // 创建基础实例
    const db = new Database(DB_PATH) as EnhancedDatabase;
    
    // 启用外键约束
    db.pragma('foreign_keys = ON');
    
    // 增强数据库实例，添加异步API包装
    enhanceDbInstance(db);
    
    // 初始化数据库表
    initDb(db);
    
    dbInstance = db;
  }
  
  return dbInstance;
}

// 增强数据库实例，添加兼容API
function enhanceDbInstance(db: EnhancedDatabase): void {
  // 添加get方法 - 用于获取单条记录
  db.get = function(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.get(...params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };

  // 添加all方法 - 用于获取多条记录
  db.all = function<T = any>(sql: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.all(...params);
        resolve(result as T);
      } catch (error) {
        reject(error);
      }
    });
  };

  // 添加run方法 - 用于执行SQL并返回结果信息
  db.run = function(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  };

  // 添加exec方法的异步版本
  db.execAsync = function(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        db.exec(sql);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}

// 初始化数据库表
function initDb(db: EnhancedDatabase): void {
  // 创建域名表
  db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      price REAL,
      description TEXT,
      registrar TEXT,
      registrar_icon TEXT,
      registrationTime TEXT,
      expirationTime TEXT,
      purchaseUrl TEXT,
      status TEXT DEFAULT 'available',
      addedAt INTEGER,
      updatedAt INTEGER
    )
  `);
  
  // 创建已售域名表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sold_domains (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      extension TEXT NOT NULL,
      soldPrice REAL,
      soldAt INTEGER,
      description TEXT,
      soldTo TEXT,
      status TEXT DEFAULT 'sold'
    )
  `);
  
  // 创建友情链接表
  db.exec(`
    CREATE TABLE IF NOT EXISTS friendly_links (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      createdAt INTEGER
    )
  `);
  
  // 创建站点设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  
  // 创建认证表
  db.exec(`
    CREATE TABLE IF NOT EXISTS auth (
      id TEXT PRIMARY KEY DEFAULT 'admin',
      password TEXT DEFAULT 'admin123',
      security_code TEXT DEFAULT '123456',
      is_logged_in INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);
}

// 直接导出一个默认的数据库实例，用于Pages API路由
const db = getDb();
export default db;

// 数据库备份函数
export async function backupDatabase(targetPath: string): Promise<void> {
  const db = getDb();
  
  return new Promise<void>((resolve, reject) => {
    try {
      // 确保目录存在
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 备份数据库
      db.backup(targetPath)
        .then(() => resolve())
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

// 数据库恢复函数
export async function restoreDatabase(sourcePath: string): Promise<void> {
  // 关闭现有连接
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  
  return new Promise<void>((resolve, reject) => {
    try {
      // 确保源文件存在
      if (!fs.existsSync(sourcePath)) {
        reject(new Error('源备份文件不存在'));
        return;
      }
      
      // 复制源文件到目标位置
      fs.copyFileSync(sourcePath, DB_PATH);
      
      // 重新连接数据库
      getDb();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
} 
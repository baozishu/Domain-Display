import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const settings = db.prepare('SELECT * FROM site_settings').all();
      
      // 转换为键值对格式
      const settingsObj: Record<string, any> = {};
      settings.forEach((setting: any) => {
        try {
          settingsObj[setting.key] = JSON.parse(setting.value);
        } catch {
          settingsObj[setting.key] = setting.value;
        }
      });
      
      return res.status(200).json(settingsObj);
    } 
    else if (req.method === 'POST') {
      const { key, value } = req.body;
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO site_settings (key, value)
        VALUES (?, ?)
      `);
      
      stmt.run(
        key,
        typeof value === 'string' ? value : JSON.stringify(value)
      );
      
      return res.status(201).json({ success: true });
    }
    else if (req.method === 'PUT') {
      // 批量更新站点设置
      const { settings } = req.body;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ error: '无效的数据格式，应提供settings对象' });
      }
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO site_settings (key, value)
        VALUES (?, ?)
      `);
      
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(
          key,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      }
      
      return res.status(200).json({ success: true });
    }
    else if (req.method === 'DELETE') {
      // 清除所有站点设置
      db.prepare('DELETE FROM site_settings').run();
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('站点设置API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
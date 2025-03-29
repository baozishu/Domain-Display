import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const domains = db.prepare('SELECT * FROM domains').all();
      return res.status(200).json(domains);
    } 
    else if (req.method === 'POST') {
      const domain = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO domains (id, name, extension, price, description, registrarIcon, addedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        domain.id,
        domain.name,
        domain.extension,
        domain.price || 0,
        domain.description || '',
        domain.registrarIcon || '',
        Date.now(),
        Date.now()
      );
      
      return res.status(201).json({ success: true, id: domain.id });
    }
    else if (req.method === 'PUT') {
      // 批量更新域名
      const { domains } = req.body;
      
      if (!Array.isArray(domains)) {
        return res.status(400).json({ error: '无效的数据格式，应提供domains数组' });
      }
      
      // 先清除所有现有域名
      db.prepare('DELETE FROM domains').run();
      
      // 批量插入新域名
      const insertStmt = db.prepare(`
        INSERT INTO domains (id, name, extension, price, description, registrarIcon, addedAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const domain of domains) {
        insertStmt.run(
          domain.id,
          domain.name,
          domain.extension,
          domain.price || 0,
          domain.description || '',
          domain.registrarIcon || '',
          domain.addedAt || Date.now(),
          domain.updatedAt || Date.now()
        );
      }
      
      return res.status(200).json({ success: true });
    }
    else if (req.method === 'DELETE') {
      // 清除所有域名
      db.prepare('DELETE FROM domains').run();
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('域名API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
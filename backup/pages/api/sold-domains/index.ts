import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const soldDomains = db.prepare('SELECT * FROM sold_domains').all();
      return res.status(200).json(soldDomains);
    } 
    else if (req.method === 'POST') {
      const domain = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO sold_domains (id, name, extension, soldPrice, soldAt, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        domain.id,
        domain.name,
        domain.extension,
        domain.soldPrice || 0,
        domain.soldAt || Date.now(),
        domain.description || ''
      );
      
      return res.status(201).json({ success: true, id: domain.id });
    }
    else if (req.method === 'PUT') {
      // 批量更新已售域名
      const { domains } = req.body;
      
      if (!Array.isArray(domains)) {
        return res.status(400).json({ error: '无效的数据格式，应提供domains数组' });
      }
      
      // 先清除所有现有域名
      db.prepare('DELETE FROM sold_domains').run();
      
      // 批量插入新域名
      const insertStmt = db.prepare(`
        INSERT INTO sold_domains (id, name, extension, soldPrice, soldAt, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for (const domain of domains) {
        insertStmt.run(
          domain.id,
          domain.name,
          domain.extension,
          domain.soldPrice || 0,
          domain.soldAt || Date.now(),
          domain.description || ''
        );
      }
      
      return res.status(200).json({ success: true });
    }
    else if (req.method === 'DELETE') {
      // 清除所有已售域名
      db.prepare('DELETE FROM sold_domains').run();
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('已售域名API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
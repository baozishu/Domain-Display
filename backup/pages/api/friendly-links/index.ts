import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const links = db.prepare('SELECT * FROM friendly_links').all();
      return res.status(200).json(links);
    } 
    else if (req.method === 'POST') {
      const link = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO friendly_links (id, name, url, createdAt)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run(
        link.id,
        link.name,
        link.url,
        link.createdAt || Date.now()
      );
      
      return res.status(201).json({ success: true, id: link.id });
    }
    else if (req.method === 'PUT') {
      // 批量更新友情链接
      const { links } = req.body;
      
      if (!Array.isArray(links)) {
        return res.status(400).json({ error: '无效的数据格式，应提供links数组' });
      }
      
      // 先清除所有现有链接
      db.prepare('DELETE FROM friendly_links').run();
      
      // 批量插入新链接
      const insertStmt = db.prepare(`
        INSERT INTO friendly_links (id, name, url, createdAt)
        VALUES (?, ?, ?, ?)
      `);
      
      for (const link of links) {
        insertStmt.run(
          link.id,
          link.name,
          link.url,
          link.createdAt || Date.now()
        );
      }
      
      return res.status(200).json({ success: true });
    }
    else if (req.method === 'DELETE') {
      // 清除所有友情链接
      db.prepare('DELETE FROM friendly_links').run();
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('友情链接API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
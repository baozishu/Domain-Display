import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const link = db.prepare('SELECT * FROM friendly_links WHERE id = ?').get(id);
      
      if (!link) {
        return res.status(404).json({ error: '找不到友情链接' });
      }
      
      return res.status(200).json(link);
    } 
    else if (req.method === 'PUT') {
      const link = req.body;
      
      const stmt = db.prepare(`
        UPDATE friendly_links 
        SET name = ?, url = ?
        WHERE id = ?
      `);
      
      stmt.run(
        link.name,
        link.url,
        id
      );
      
      return res.status(200).json({ success: true });
    } 
    else if (req.method === 'DELETE') {
      db.prepare('DELETE FROM friendly_links WHERE id = ?').run(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('友情链接API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
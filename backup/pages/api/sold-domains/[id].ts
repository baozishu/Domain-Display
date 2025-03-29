import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const domain = db.prepare('SELECT * FROM sold_domains WHERE id = ?').get(id);
      
      if (!domain) {
        return res.status(404).json({ error: '找不到已售域名' });
      }
      
      return res.status(200).json(domain);
    } 
    else if (req.method === 'PUT') {
      const domain = req.body;
      
      const stmt = db.prepare(`
        UPDATE sold_domains 
        SET name = ?, extension = ?, soldPrice = ?, description = ?
        WHERE id = ?
      `);
      
      stmt.run(
        domain.name,
        domain.extension,
        domain.soldPrice || 0,
        domain.description || '',
        id
      );
      
      return res.status(200).json({ success: true });
    } 
    else if (req.method === 'DELETE') {
      db.prepare('DELETE FROM sold_domains WHERE id = ?').run(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('已售域名API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
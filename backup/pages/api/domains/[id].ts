import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  try {
    if (req.method === 'GET') {
      const domain = db.prepare('SELECT * FROM domains WHERE id = ?').get(id);
      
      if (!domain) {
        return res.status(404).json({ error: '找不到域名' });
      }
      
      return res.status(200).json(domain);
    } 
    else if (req.method === 'PUT') {
      const domain = req.body;
      
      const stmt = db.prepare(`
        UPDATE domains 
        SET name = ?, extension = ?, price = ?, description = ?, 
            registrarIcon = ?, updatedAt = ?
        WHERE id = ?
      `);
      
      stmt.run(
        domain.name,
        domain.extension,
        domain.price || 0,
        domain.description || '',
        domain.registrarIcon || '',
        Date.now(),
        id
      );
      
      return res.status(200).json({ success: true });
    } 
    else if (req.method === 'DELETE') {
      db.prepare('DELETE FROM domains WHERE id = ?').run(id);
      return res.status(200).json({ success: true });
    }
    
    return res.status(405).json({ error: '不支持的方法' });
  } catch (error) {
    console.error('域名API错误:', error);
    return res.status(500).json({ error: '服务器错误' });
  }
} 
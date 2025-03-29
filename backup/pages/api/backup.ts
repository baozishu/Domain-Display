import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // 直接复制数据库文件作为备份
      const dbPath = path.join(process.cwd(), 'data', 'domains.db');
      const backupPath = path.join(process.cwd(), 'data', `backup-${Date.now()}.db`);
      
      fs.copyFileSync(dbPath, backupPath);
      
      // 将文件返回给客户端下载
      const fileBuffer = fs.readFileSync(backupPath);
      
      res.setHeader('Content-Disposition', `attachment; filename="domain-backup-${new Date().toISOString().slice(0,10)}.db"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      return res.send(fileBuffer);
    } catch (error) {
      console.error('备份错误:', error);
      return res.status(500).json({ error: '备份失败' });
    }
  }
  
  return res.status(405).json({ error: '方法不允许' });
} 
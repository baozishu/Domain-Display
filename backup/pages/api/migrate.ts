import type { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }
  
  try {
    const { domains, soldDomains, friendlyLinks, siteSettings } = req.body;
    
    // 开始事务
    const transaction = db.transaction(() => {
      // 迁移域名数据
      if (domains && Array.isArray(domains)) {
        const insertDomain = db.prepare(`
          INSERT OR REPLACE INTO domains 
          (id, name, extension, price, description, registrarIcon, addedAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        domains.forEach(domain => {
          insertDomain.run(
            domain.id,
            domain.name,
            domain.extension,
            domain.price || 0,
            domain.description || '',
            domain.registrarIcon || '',
            domain.addedAt || Date.now(),
            Date.now()
          );
        });
      }
      
      // 迁移已售域名数据
      if (soldDomains && Array.isArray(soldDomains)) {
        const insertSoldDomain = db.prepare(`
          INSERT OR REPLACE INTO sold_domains
          (id, name, extension, soldPrice, soldAt, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        soldDomains.forEach(domain => {
          insertSoldDomain.run(
            domain.id,
            domain.name,
            domain.extension,
            domain.soldPrice || 0,
            domain.soldAt || Date.now(),
            domain.description || ''
          );
        });
      }
      
      // 迁移友情链接
      if (friendlyLinks && Array.isArray(friendlyLinks)) {
        const insertLink = db.prepare(`
          INSERT OR REPLACE INTO friendly_links
          (id, name, url, createdAt)
          VALUES (?, ?, ?, ?)
        `);
        
        friendlyLinks.forEach(link => {
          insertLink.run(
            link.id,
            link.name,
            link.url,
            link.createdAt || Date.now()
          );
        });
      }
      
      // 迁移网站设置
      if (siteSettings && typeof siteSettings === 'object') {
        const insertSetting = db.prepare(`
          INSERT OR REPLACE INTO site_settings (key, value)
          VALUES (?, ?)
        `);
        
        Object.entries(siteSettings).forEach(([key, value]) => {
          insertSetting.run(key, JSON.stringify(value));
        });
      }
    });
    
    // 执行事务
    transaction();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('迁移错误:', error);
    return res.status(500).json({ error: '迁移失败' });
  }
} 
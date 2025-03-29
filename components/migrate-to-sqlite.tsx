import React from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, ArrowRight } from 'lucide-react';

export default function MigrateToSqlite() {
  const [migrating, setMigrating] = React.useState(false);
  const [message, setMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const handleMigrate = async () => {
    try {
      setMigrating(true);
      setMessage(null);
      
      // 从localStorage获取所有数据
      const domains = JSON.parse(localStorage.getItem('domain-display-domains') || '[]');
      const soldDomains = JSON.parse(localStorage.getItem('domain-display-sold-domains') || '[]');
      const friendlyLinks = JSON.parse(localStorage.getItem('domain-display-friendly-links') || '[]');
      const siteSettings = JSON.parse(localStorage.getItem('domain-display-site-settings') || '{}');
      
      // 发送到迁移API
      const response = await axios.post('/api/migrate', {
        domains,
        soldDomains,
        friendlyLinks,
        siteSettings
      });
      
      if (response.data.success) {
        setMessage({
          type: 'success',
          text: '成功将数据从localStorage迁移到SQLite数据库'
        });
      } else {
        throw new Error('迁移失败');
      }
    } catch (error) {
      console.error('迁移失败:', error);
      setMessage({
        type: 'error',
        text: '迁移失败: ' + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setMigrating(false);
    }
  };
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>数据库迁移工具</CardTitle>
        <CardDescription>将数据从浏览器本地存储迁移到SQLite数据库</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium">LocalStorage 到 SQLite</h3>
              <p className="text-xs text-gray-500">永久保存您的数据到服务器</p>
            </div>
          </div>
          <Button onClick={handleMigrate} disabled={migrating}>
            {migrating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                迁移中...
              </>
            ) : (
              <>
                开始迁移
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        
        {message && (
          <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
            <AlertDescription>
              {message.text}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 
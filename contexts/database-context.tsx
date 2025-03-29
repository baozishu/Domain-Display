"use client";

import React from 'react';
import { useDomainsDb } from '@/hooks/useDomainsDb';
import { useSoldDomainsDb } from '@/hooks/useSoldDomainsDb';
import { useFriendlyLinksDb } from '@/hooks/useFriendlyLinksDb';
import { useSiteSettingsDb } from '@/hooks/useSiteSettingsDb';
import axios from 'axios';

interface DatabaseContextType {
  domains: any[];
  soldDomains: any[];
  friendlyLinks: any[];
  siteSettings: Record<string, any>;
  loading: boolean;
  refreshData: () => Promise<void>;
  addDomain: (domain: any) => Promise<void>;
  updateDomain: (id: string, domain: any) => Promise<void>;
  deleteDomain: (id: string) => Promise<void>;
  addSoldDomain: (domain: any) => Promise<void>;
  updateSoldDomain: (id: string, domain: any) => Promise<void>;
  deleteSoldDomain: (id: string) => Promise<void>;
  markAsSold: (domain: any, soldPrice: number) => Promise<void>;
  addFriendlyLink: (link: any) => Promise<void>;
  updateFriendlyLink: (id: string, link: any) => Promise<void>;
  deleteFriendlyLink: (id: string) => Promise<void>;
  updateSiteSetting: (key: string, value: any) => Promise<void>;
  exportDatabase: () => Promise<Record<string, any> | null>;
  importDatabase: (data: Record<string, any>) => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const DatabaseContext = React.createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  // 使用域名钩子
  const { 
    domains, loading: domainsLoading, fetchDomains, addDomain, updateDomain, deleteDomain
  } = useDomainsDb();
  
  // 使用已售域名钩子
  const { 
    soldDomains, loading: soldDomainsLoading, fetchSoldDomains, 
    addSoldDomain, updateSoldDomain, deleteSoldDomain, markAsSold 
  } = useSoldDomainsDb();
  
  // 使用友情链接钩子
  const { 
    links: friendlyLinks, loading: linksLoading, fetchLinks, 
    addLink, updateLink, deleteLink 
  } = useFriendlyLinksDb();
  
  // 使用站点设置钩子
  const { 
    settings: siteSettings, loading: settingsLoading, 
    fetchSettings, updateSetting 
  } = useSiteSettingsDb();
  
  // 合并加载状态
  const loading = domainsLoading || soldDomainsLoading || linksLoading || settingsLoading;
  
  // 刷新所有数据的函数
  const refreshData = async () => {
    await Promise.all([
      fetchDomains(),
      fetchSoldDomains(),
      fetchLinks(),
      fetchSettings()
    ]);
  };

  // 导出数据库
  const exportDatabase = async () => {
    try {
      await refreshData();
      return {
        domains,
        soldDomains,
        friendlyLinks,
        siteSettings,
        exportDate: Date.now()
      };
    } catch (error) {
      console.error("导出数据库失败:", error);
      return null;
    }
  };

  // 导入数据库 - 仅仅是演示，实际上需要完整实现
  const importDatabase = async (data: Record<string, any>) => {
    try {
      // 验证数据
      if (!data || typeof data !== 'object') {
        throw new Error("无效的数据格式");
      }

      // 执行导入操作
      // 由于我们没有完整实现批量更新，这里仅演示部分功能
      if (Array.isArray(data.domains)) {
        for (const domain of data.domains) {
          await addDomain(domain);
        }
      }
      
      if (Array.isArray(data.soldDomains)) {
        for (const domain of data.soldDomains) {
          await addSoldDomain(domain);
        }
      }
      
      if (Array.isArray(data.friendlyLinks)) {
        for (const link of data.friendlyLinks) {
          await addLink(link);
        }
      }
      
      if (data.siteSettings && typeof data.siteSettings === 'object') {
        for (const [key, value] of Object.entries(data.siteSettings)) {
          await updateSetting(key, value);
        }
      }

      // 刷新数据以加载更改
      await refreshData();
      
    } catch (error) {
      console.error("导入数据库失败:", error);
      throw error;
    }
  };

  // 重置数据库
  const resetDatabase = async () => {
    // 最多尝试3次
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      try {
        // 调用API直接重置整个数据库
        await axios.post('/api/reset');
        console.log(`数据库重置成功(尝试 ${attempts}/${maxAttempts})`);
        
        // 刷新数据以确认所有内容都已清除
        await refreshData();
        return;
      } catch (error) {
        console.error(`重置数据库失败(尝试 ${attempts}/${maxAttempts}):`, error);
        
        if (attempts >= maxAttempts) {
          // 已达到最大尝试次数，抛出错误
          throw error;
        }
        
        // 等待一秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`尝试重新重置数据库 (${attempts+1}/${maxAttempts})...`);
      }
    }
  };
  
  return (
    <DatabaseContext.Provider 
      value={{
        domains,
        soldDomains,
        friendlyLinks,
        siteSettings,
        loading,
        refreshData,
        addDomain,
        updateDomain,
        deleteDomain,
        addSoldDomain,
        updateSoldDomain,
        deleteSoldDomain,
        markAsSold,
        addFriendlyLink: addLink,
        updateFriendlyLink: updateLink,
        deleteFriendlyLink: deleteLink,
        updateSiteSetting: updateSetting,
        exportDatabase,
        importDatabase,
        resetDatabase
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = React.useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
} 
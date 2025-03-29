"use client";

import React from "react"
import axios from 'axios';
import { SiteSettings } from '@/lib/types';

export function useSiteSettingsDb() {
  const [settings, setSettings] = React.useState<SiteSettings>({} as SiteSettings);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/site-settings');
      setSettings(response.data || {});
      setError(null);
    } catch (err) {
      setError('获取站点设置失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const updateSetting = async (key: string, value: any) => {
    try {
      // 创建一个只包含要更新的单个键值对的设置对象
      const partialSettings: Partial<SiteSettings> = {
        [key]: value
      } as any;
      
      // 使用批量更新接口
      await axios.put('/api/site-settings', { 
        settings: partialSettings 
      });
      
      return fetchSettings();
    } catch (err) {
      console.error('更新站点设置失败:', err);
      throw err;
    }
  };
  
  // 清除所有站点设置
  const clearAll = async () => {
    try {
      await axios.post('/api/site-settings/reset');
      return fetchSettings();
    } catch (err) {
      console.error('重置站点设置失败:', err);
      throw err;
    }
  };
  
  // 批量更新站点设置
  const updateAllSettings = async (settingsData: SiteSettings) => {
    try {
      await axios.put('/api/site-settings', { settings: settingsData });
      return fetchSettings();
    } catch (err) {
      console.error('批量更新站点设置失败:', err);
      throw err;
    }
  };
  
  // 重置为默认设置
  const resetSettings = async () => {
    try {
      await axios.post('/api/site-settings/reset');
      return fetchSettings();
    } catch (err) {
      console.error('重置站点设置失败:', err);
      throw err;
    }
  };
  
  // 初始加载
  React.useEffect(() => {
    fetchSettings();
  }, []);
  
  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSetting,
    clearAll: resetSettings, // 使用resetSettings替代clearAll保持接口兼容
    updateAllSettings,
    resetSettings
  };
} 
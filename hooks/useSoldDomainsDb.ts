"use client";

import React from "react"
import axios from 'axios';
import { Domain, SoldDomain } from '@/lib/types';

export function useSoldDomainsDb() {
  const [soldDomains, setSoldDomains] = React.useState<SoldDomain[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchSoldDomains = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sold-domains');
      setSoldDomains(response.data);
      setError(null);
    } catch (err) {
      setError('获取已售域名失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const addSoldDomain = async (domain: SoldDomain) => {
    try {
      await axios.post('/api/sold-domains', domain);
      return fetchSoldDomains();
    } catch (err) {
      console.error('添加已售域名失败:', err);
      throw err;
    }
  };
  
  const updateSoldDomain = async (id: string, domain: SoldDomain) => {
    try {
      await axios.put(`/api/sold-domains/${id}`, domain);
      return fetchSoldDomains();
    } catch (err) {
      console.error('更新已售域名失败:', err);
      throw err;
    }
  };
  
  const deleteSoldDomain = async (id: string) => {
    try {
      await axios.delete(`/api/sold-domains/${id}`);
      return fetchSoldDomains();
    } catch (err) {
      console.error('删除已售域名失败:', err);
      throw err;
    }
  };
  
  // 将域名标记为已售
  const markAsSold = async (domain: Domain, soldPrice: number) => {
    try {
      const soldDomain: SoldDomain = {
        id: domain.id,
        name: domain.name,
        extension: domain.extension,
        soldPrice,
        description: domain.description,
        soldAt: Date.now()
      };
      
      // 添加到已售列表并从待售列表中删除
      await addSoldDomain(soldDomain);
      await axios.delete(`/api/domains/${domain.id}`);
      
      return fetchSoldDomains();
    } catch (err) {
      console.error('标记域名为已售失败:', err);
      throw err;
    }
  };
  
  // 清除所有已售域名
  const clearAll = async () => {
    try {
      await axios.delete('/api/sold-domains');
      return fetchSoldDomains();
    } catch (err) {
      console.error('清除所有已售域名失败:', err);
      throw err;
    }
  };
  
  // 批量更新已售域名
  const updateAll = async (domainsData: SoldDomain[]) => {
    try {
      await axios.put('/api/sold-domains', { domains: domainsData });
      return fetchSoldDomains();
    } catch (err) {
      console.error('批量更新已售域名失败:', err);
      throw err;
    }
  };
  
  // 初始加载
  React.useEffect(() => {
    fetchSoldDomains();
  }, []);
  
  return {
    soldDomains,
    loading,
    error,
    fetchSoldDomains,
    addSoldDomain,
    updateSoldDomain,
    deleteSoldDomain,
    markAsSold,
    clearAll,
    updateAll
  };
} 
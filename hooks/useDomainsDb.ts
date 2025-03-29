"use client";

import React from "react"
import axios from 'axios';
import { Domain } from '@/lib/types';

export function useDomainsDb() {
  const [domains, setDomains] = React.useState<Domain[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchDomains = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/domains');
      setDomains(response.data);
      setError(null);
    } catch (err) {
      setError('获取域名失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const addDomain = async (domain: Domain) => {
    try {
      await axios.post('/api/domains', domain);
      return fetchDomains();
    } catch (err) {
      console.error('添加域名失败:', err);
      throw err;
    }
  };
  
  const updateDomain = async (id: string, domain: Domain) => {
    try {
      await axios.put(`/api/domains/${id}`, domain);
      return fetchDomains();
    } catch (err) {
      console.error('更新域名失败:', err);
      throw err;
    }
  };
  
  const deleteDomain = async (id: string) => {
    try {
      await axios.delete(`/api/domains/${id}`);
      return fetchDomains();
    } catch (err) {
      console.error('删除域名失败:', err);
      throw err;
    }
  };
  
  // 清除所有域名
  const clearAll = async () => {
    try {
      await axios.delete('/api/domains');
      return fetchDomains();
    } catch (err) {
      console.error('清除所有域名失败:', err);
      throw err;
    }
  };
  
  // 批量更新域名
  const updateAll = async (domainsData: Domain[]) => {
    try {
      await axios.put('/api/domains', { domains: domainsData });
      return fetchDomains();
    } catch (err) {
      console.error('批量更新域名失败:', err);
      throw err;
    }
  };
  
  // 初始加载
  React.useEffect(() => {
    fetchDomains();
  }, []);
  
  return {
    domains,
    loading,
    error,
    fetchDomains,
    addDomain,
    updateDomain,
    deleteDomain,
    clearAll,
    updateAll
  };
} 
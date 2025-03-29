"use client";

import React from "react"
import axios from 'axios';
import { FriendlyLink } from '@/lib/types';

export function useFriendlyLinksDb() {
  const [links, setLinks] = React.useState<FriendlyLink[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/friendly-links');
      setLinks(response.data);
      setError(null);
    } catch (err) {
      setError('获取友情链接失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const addLink = async (link: FriendlyLink) => {
    try {
      await axios.post('/api/friendly-links', link);
      return fetchLinks();
    } catch (err) {
      console.error('添加友情链接失败:', err);
      throw err;
    }
  };
  
  const updateLink = async (id: string, link: FriendlyLink) => {
    try {
      await axios.put(`/api/friendly-links/${id}`, link);
      return fetchLinks();
    } catch (err) {
      console.error('更新友情链接失败:', err);
      throw err;
    }
  };
  
  const deleteLink = async (id: string) => {
    try {
      await axios.delete(`/api/friendly-links/${id}`);
      return fetchLinks();
    } catch (err) {
      console.error('删除友情链接失败:', err);
      throw err;
    }
  };
  
  // 清除所有友情链接
  const clearAll = async () => {
    try {
      await axios.delete('/api/friendly-links');
      return fetchLinks();
    } catch (err) {
      console.error('清除所有友情链接失败:', err);
      throw err;
    }
  };
  
  // 批量更新友情链接
  const updateAll = async (linksData: FriendlyLink[]) => {
    try {
      await axios.put('/api/friendly-links', { links: linksData });
      return fetchLinks();
    } catch (err) {
      console.error('批量更新友情链接失败:', err);
      throw err;
    }
  };
  
  // 初始加载
  React.useEffect(() => {
    fetchLinks();
  }, []);
  
  return {
    links,
    loading,
    error,
    fetchLinks,
    addLink,
    updateLink,
    deleteLink,
    clearAll,
    updateAll
  };
} 
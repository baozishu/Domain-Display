"use client"

import React from "react"
import { useSiteSettingsDb } from '@/hooks/useSiteSettingsDb'

// Define site settings type
interface SiteSettings {
  siteName: string
  logoType: "text" | "image"
  logoImage?: string
  logoText?: string
  favicon: string
  registrarIcons: {
    [key: string]: string
  }
}

// Define site context type
interface SiteContextType {
  settings: SiteSettings
  updateSiteName: (name: string) => void
  updateLogoType: (type: "text" | "image") => void
  updateLogoImage: (url: string) => void
  updateLogoText: (text: string) => void
  updateFavicon: (url: string) => void
  addRegistrarIcon: (name: string, svg: string) => void
  updateRegistrarIcon: (name: string, svg: string) => void
  removeRegistrarIcon: (name: string) => void
  resetSettings: () => void
  loading: boolean
  error: string | null
}

// Default settings
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "域名展示",
  logoType: "text",
  logoText: "域名展示",
  favicon: "https://xn--1xa.team/img/favicon.ico",
  registrarIcons: {
    aliyun: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/></svg>`,
    tencent: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
    godaddy: `<svg viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2"/></svg>`,
    namecheap: `<svg viewBox="0 0 24 24"><path d="M12 2 L2 7 L12 12 L22 7 Z" /><path d="M2 17 L12 22 L22 17" /><path d="M2 12 L12 17 L22 12" /></svg>`,
    huawei: `<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2" /><rect x="2" y="14" width="20" height="8" rx="2" ry="2" /></svg>`,
  },
}

// Create context with default values
const SiteContext = React.createContext<SiteContextType>({
  settings: DEFAULT_SETTINGS,
  updateSiteName: () => {},
  updateLogoType: () => {},
  updateLogoImage: () => {},
  updateLogoText: () => {},
  updateFavicon: () => {},
  addRegistrarIcon: () => {},
  updateRegistrarIcon: () => {},
  removeRegistrarIcon: () => {},
  resetSettings: () => {},
  loading: false,
  error: null,
})

// Site settings provider component
export function SiteProvider({ children }: { children: React.ReactNode }) {
  const { settings: dbSettings, loading, error, updateSetting } = useSiteSettingsDb()

  // 合并默认设置和数据库设置
  const settings = dbSettings || DEFAULT_SETTINGS

  // 更新站点名称
  const updateSiteName = async (name: string) => {
    try {
      await updateSetting('siteName', name)
    } catch (error) {
      console.error('更新站点名称失败:', error)
    }
  }

  // 更新Logo类型
  const updateLogoType = async (type: "text" | "image") => {
    try {
      await updateSetting('logoType', type)
    } catch (error) {
      console.error('更新Logo类型失败:', error)
    }
  }

  // 更新Logo图片
  const updateLogoImage = async (url: string) => {
    try {
      await updateSetting('logoImage', url)
    } catch (error) {
      console.error('更新Logo图片失败:', error)
    }
  }

  // 更新Logo文字
  const updateLogoText = async (text: string) => {
    try {
      await updateSetting('logoText', text)
    } catch (error) {
      console.error('更新Logo文字失败:', error)
    }
  }

  // 更新Favicon
  const updateFavicon = async (url: string) => {
    try {
      await updateSetting('favicon', url)
    } catch (error) {
      console.error('更新Favicon失败:', error)
    }
  }

  // 添加注册商图标
  const addRegistrarIcon = async (name: string, svg: string) => {
    try {
      const updatedIcons = {
        ...(settings.registrarIcons || {}),
        [name]: svg
      }
      
      await updateSetting('registrarIcons', updatedIcons)
    } catch (error) {
      console.error('添加注册商图标失败:', error)
    }
  }

  // 更新注册商图标
  const updateRegistrarIcon = async (name: string, svg: string) => {
    try {
      const updatedIcons = {
        ...(settings.registrarIcons || {}),
        [name]: svg
      }
      
      await updateSetting('registrarIcons', updatedIcons)
    } catch (error) {
      console.error('更新注册商图标失败:', error)
    }
  }

  // 删除注册商图标
  const removeRegistrarIcon = async (name: string) => {
    try {
      const updatedIcons = { ...(settings.registrarIcons || {}) }
      delete updatedIcons[name]
      
      await updateSetting('registrarIcons', updatedIcons)
    } catch (error) {
      console.error('删除注册商图标失败:', error)
    }
  }

  // 重置设置
  const resetSettings = async () => {
    try {
      for (const key in DEFAULT_SETTINGS) {
        if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
          const value = DEFAULT_SETTINGS[key as keyof SiteSettings]
          await updateSetting(key, value)
        }
      }
    } catch (error) {
      console.error('重置设置失败:', error)
    }
  }

  return (
    <SiteContext.Provider
      value={{
        settings,
        updateSiteName,
        updateLogoType,
        updateLogoImage,
        updateLogoText,
        updateFavicon,
        addRegistrarIcon,
        updateRegistrarIcon,
        removeRegistrarIcon,
        resetSettings,
        loading,
        error
      }}
    >
      {children}
    </SiteContext.Provider>
  )
}

// Hook to use site context
export function useSite() {
  return React.useContext(SiteContext)
} 
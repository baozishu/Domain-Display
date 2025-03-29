// 域名类型
export interface Domain {
  id: string;
  name: string;
  extension: string;
  price?: number;
  description?: string;
  registrarIcon?: string;
  addedAt: number;
  updatedAt: number;
}

// 已售域名类型
export interface SoldDomain {
  id: string;
  name: string;
  extension: string;
  soldPrice: number;
  soldAt: number;
  description?: string;
}

// 友情链接类型
export interface FriendlyLink {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

// 站点设置类型
export interface SiteSettings {
  siteName: string;
  logoType: 'text' | 'image';
  logoText: string;
  logoImage: string;
  favicon: string;
  registrarIcons: Record<string, string>;
  [key: string]: any;
} 
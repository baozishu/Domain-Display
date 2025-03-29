/**
 * 生成一个唯一ID
 * 使用一个简单的算法，非加密强度
 * 只用于应用内部标识，不作为安全凭证
 */
export function generateId(prefix: string = ''): string {
  return prefix + Math.random().toString(36).substring(2, 15) + 
    Math.random().toString(36).substring(2, 15);
} 
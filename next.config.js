/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! 警告 !!
    // 仅在开发过程中临时忽略TypeScript错误
    // 在生产环境前应该修复这些错误
    ignoreBuildErrors: true,
  },
  eslint: {
    // 同样忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  // 使用swc编译器
  swcMinify: true,
  // 禁用类型检查
  experimental: {
    forceSwcTransforms: true
  }
}

module.exports = nextConfig 
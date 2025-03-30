# 域名展示平台

![项目截图](2025_134943.webp)

一个简洁、美观的域名管理和展示平台，用于集中展示您的域名资产。

## 功能特点

- 🏷️ **扩展名筛选**：按域名后缀过滤
- 📊 **分类展示**：区分活跃域名和已售域名
- 🔄 **响应式设计**：完美适配各种设备尺寸
- 🔗 **友情链接**：展示合作伙伴
- 🎨 **优雅界面**：采用现代化UI设计

## 技术栈

- **框架**：Next.js 15
- **UI库**：Radix UI + Tailwind CSS
- **状态管理**：React Context API
- **数据格式**：JSON
- **图标**：Lucide React

## 快速开始

### 前置要求

- Node.js 18.0.0 或更高版本
- pnpm 8.0.0 或更高版本

### 安装

```bash
# 克隆项目
git clone <项目仓库URL>

# 进入项目目录
cd 域名展示平台

# 安装依赖
pnpm install
```

### 开发

```bash
# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000 查看应用。

### 构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务
pnpm start
```

## 项目结构

```
├── app/                # Next.js App Router
│   ├── layout.tsx      # 应用布局
│   ├── page.tsx        # 主页面
│   └── globals.css     # 全局样式
├── components/         # 组件目录
│   ├── ui/             # UI组件
│   └── registrar-icon.tsx  # 注册商图标
├── contexts/           # React 上下文
│   └── domain-context.tsx  # 域名数据上下文
├── data/               # 数据文件
│   ├── domains.json    # 域名数据
│   ├── sold-domains.json  # 已售域名
│   └── friendly-links.json  # 友情链接
├── public/             # 静态资源
└── multi-domain-display.tsx  # 主展示组件
```

## 数据格式

### 域名数据 (domains.json)

```json
[
  {
    "id": "1",
    "name": "example",
    "extension": ".com",
    "status": "active",
    "registrar": "Aliyun",
    "registrarIcon": "aliyun",
    "registrationTime": "2023-01-01",
    "expirationTime": "2024-01-01"
  }
]
```

### 已售域名 (sold-domains.json)

```json
[
  {
    "id": "1",
    "name": "sold-example",
    "extension": ".com",
    "status": "sold",
    "soldTo": "某公司",
    "soldDate": "2023-05-15"
  }
]
```

## 自定义

### 添加新域名

编辑 `data/domains.json` 文件，按照格式添加新的域名记录。

### 添加新注册商

在 `components/registrar-icon.tsx` 文件中添加新的注册商图标组件。

### 修改站点设置

在 `app/layout.tsx` 文件中修改站点标题、描述等元数据。

### 修改样式

样式主要通过 Tailwind CSS 实现，您可以修改组件中的样式类或调整 `tailwind.config.ts` 文件。

## 部署

该项目可以部署在任何支持 Next.js 的平台上，如 Vercel、Netlify 或自托管服务器。

```bash
# 使用 Vercel 部署
pnpm dlx vercel
```

## 许可证

MIT 
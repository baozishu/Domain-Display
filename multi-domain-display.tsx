"use client"
import React from "react"
import { ShoppingCart, CheckCircle2, ExternalLink, Calendar, Filter, PieChart, Building, Terminal, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { RegistrarIcon } from "@/components/registrar-icon"
import { useDomains } from "@/contexts/domain-context"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Domain {
  id: string
  name: string
  extension: string
  status: "active" | "available" | "sold"
  registrar?: string
  registrarIcon?: string
  registrationTime?: string
  expirationTime?: string
  purchaseUrl?: string
  soldTo?: string
  soldDate?: string
}

interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
}

export default function MultiDomainDisplay() {
  // 使用域名上下文而不是直接导入JSON
  const { domains, soldDomains, friendlyLinks } = useDomains()
  
  // 添加状态过滤
  const [domainFilter, setDomainFilter] = React.useState<"all" | "available" | "sold">("all")
  
  // 添加注册商筛选
  const [registrarFilter, setRegistrarFilter] = React.useState<string>("all")
  
  // 添加域名后缀筛选
  const [extensionFilter, setExtensionFilter] = React.useState<string>("all")
  
  // 添加动画效果状态
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  // 加载完成后触发动画
  React.useEffect(() => {
    setIsLoaded(true)
  }, [])

  // Function to format date in a more readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  }

  // 获取所有注册商列表
  const registrars = React.useMemo(() => {
    const registrarSet = new Set<string>();
    domains.forEach((domain: Domain) => {
      if (domain.registrar) {
        registrarSet.add(domain.registrar);
      }
    });
    return Array.from(registrarSet).sort();
  }, [domains]);
  
  // 获取所有域名后缀列表
  const domainExtensions = React.useMemo(() => {
    const extensionSet = new Set<string>();
    // 从待售域名中获取后缀
    domains.forEach((domain: Domain) => {
      if (domain.extension) {
        extensionSet.add(domain.extension.toLowerCase());
      }
    });
    // 从已售域名中获取后缀
    soldDomains.forEach((domain: Domain) => {
      if (domain.extension) {
        extensionSet.add(domain.extension.toLowerCase());
      }
    });
    return Array.from(extensionSet).sort();
  }, [domains, soldDomains]);

  // 根据筛选条件获取要显示的域名列表
  const getFilteredDomains = () => {
    // 先按域名状态筛选
    let filtered = [];
    switch (domainFilter) {
      case "available":
        filtered = domains;
        break;
      case "sold":
        filtered = soldDomains;
        break;
      case "all":
      default:
        filtered = [...domains, ...soldDomains];
        break;
    }
    
    // 再按注册商筛选（只对待售域名有效）
    if (registrarFilter !== "all" && domainFilter !== "sold") {
      filtered = filtered.filter((domain: Domain) => 
        domain.status !== "sold" && domain.registrar === registrarFilter
      );
    }
    
    // 按域名后缀筛选
    if (extensionFilter !== "all") {
      filtered = filtered.filter((domain: Domain) => 
        domain.extension.toLowerCase() === extensionFilter
      );
    }
    
    return filtered;
  }

  // 获取经过筛选的域名
  const filteredDomains = getFilteredDomains();

  // 计算各类型域名数量，用于显示徽章
  const availableCount = domains.length;
  const soldCount = soldDomains.length;
  const totalCount = availableCount + soldCount;
  
  // 按扩展名分组域名
  const domainsByExtension = filteredDomains.reduce((acc: Record<string, Domain[]>, domain: Domain) => {
    const ext = domain.extension.toLowerCase();
    if (!acc[ext]) {
      acc[ext] = [];
    }
    acc[ext].push(domain);
    return acc;
  }, {} as Record<string, Domain[]>);
  
  // 获取所有扩展名并排序
  const extensions = Object.keys(domainsByExtension).sort();

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className={`text-center mb-10 transition-all duration-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-bold tracking-tight mb-4">域名展示</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">管理和展示您的域名集合</p>
      </header>

      {/* 统计卡片 */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 transition-all duration-500 delay-100 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">总域名数</p>
              <p className="text-2xl font-bold text-blue-900">{totalCount}</p>
            </div>
            <PieChart className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800">待售域名</p>
              <p className="text-2xl font-bold text-amber-900">{availableCount}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-amber-500 opacity-80" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">已售域名</p>
              <p className="text-2xl font-bold text-green-900">{soldCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* 过滤器区域 */}
      <div className={`flex flex-col gap-6 mb-8 transition-all duration-500 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* 域名状态过滤器 */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold mb-2">域名列表</h2>
            <p className="text-sm text-muted-foreground hidden sm:block">选择域名状态进行筛选</p>
          </div>
          
          <Tabs 
            value={domainFilter} 
            onValueChange={(value: string) => setDomainFilter(value as "all" | "available" | "sold")}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="relative">
                全部
                <Badge variant="secondary" className="ml-1 absolute top-0 right-0 -mt-1 -mr-1 text-[10px] h-4 min-w-4 px-1">
                  {totalCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="available" className="relative">
                待售
                <Badge variant="secondary" className="ml-1 absolute top-0 right-0 -mt-1 -mr-1 text-[10px] h-4 min-w-4 px-1">
                  {availableCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="sold" className="relative">
                已售
                <Badge variant="secondary" className="ml-1 absolute top-0 right-0 -mt-1 -mr-1 text-[10px] h-4 min-w-4 px-1">
                  {soldCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* 筛选区域 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-t pt-4">
          {/* 注册商筛选 - 仅在显示全部或待售域名时显示 */}
          {domainFilter !== "sold" && registrars.length > 0 && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">注册商：</span>
              <Select 
                value={registrarFilter} 
                onValueChange={(value: string) => setRegistrarFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择注册商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center justify-between w-full">
                      <span>全部注册商</span>
                    </div>
                  </SelectItem>
                  {registrars.map((registrar: string) => (
                    <SelectItem key={registrar} value={registrar}>
                      <div className="flex items-center gap-2">
                        <RegistrarIcon 
                          iconName={domains.find((d: Domain) => d.registrar === registrar)?.registrarIcon} 
                          className="h-4 w-4" 
                        />
                        <span>{registrar}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* 域名后缀筛选 - 始终显示 */}
          {domainExtensions.length > 0 && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">域名后缀：</span>
              <Select 
                value={extensionFilter} 
                onValueChange={(value: string) => setExtensionFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择后缀" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span>全部后缀</span>
                  </SelectItem>
                  {domainExtensions.map((extension: string) => (
                    <SelectItem key={extension} value={extension}>
                      <span>{extension}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      
      {/* 分组显示域名 */}
      <div className={`space-y-8 transition-all duration-500 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {extensions.length > 0 ? (
          extensions.map(extension => (
            <div key={extension} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="text-sm py-1 px-3 rounded-lg">
                  {extension}
                </Badge>
                <Separator className="flex-1" />
                <span className="text-sm text-muted-foreground">
                  {domainsByExtension[extension].length} 个域名
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainsByExtension[extension].map((domain: Domain) => (
                  <Card 
                    key={domain.id} 
                    className={`overflow-hidden transition-all duration-300 hover:shadow-md ${domain.status === "sold" ? "bg-muted/30" : ""}`}>
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 border-b">
                        {domain.status !== "sold" ? (
                          <>
                            <div className="flex items-center">
                              <RegistrarIcon iconName={domain.registrarIcon} className="h-5 w-5 text-muted-foreground mr-2" />
                              <span className="text-sm font-medium">{domain.registrar || "未知商家"}</span>
                            </div>
                            {domain.registrationTime && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(domain.registrationTime)}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                              <span className="text-sm font-medium">已售出</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {domain.soldDate && formatDate(domain.soldDate)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-1 flex items-center">
                          <span className="text-foreground">{domain.name}</span>
                          <span className="text-muted-foreground">{domain.extension}</span>
                        </h2>
                        
                        {domain.status !== "sold" ? (
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center">
                              <div
                                className={`h-2 w-2 rounded-full ${domain.status === "active" ? "bg-green-500" : "bg-amber-500"} mr-2`}
                              ></div>
                              <span className="text-sm text-muted-foreground">待出售</span>
                            </div>
                            {domain.status === "available" && domain.purchaseUrl && (
                              <Button size="sm" className="h-8" asChild>
                                <a href={domain.purchaseUrl} target="_blank" rel="noopener noreferrer">
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  购买
                                </a>
                              </Button>
                            )}
                            {domain.status === "available" && !domain.purchaseUrl && (
                              <Button size="sm" className="h-8">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                购买
                              </Button>
                            )}
                            {domain.status === "active" && (
                              <Button size="sm" variant="outline" className="h-8">
                                管理
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">购买方：</span>
                              <span className="text-sm font-medium">{domain.soldTo}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 mb-12">
            <p className="text-muted-foreground">
              {domainFilter === "all" 
                ? "暂无域名显示" 
                : domainFilter === "available" 
                  ? registrarFilter !== "all" 
                    ? `暂无${registrarFilter}的待售域名` 
                    : "暂无待售域名" 
                  : "暂无已售域名"
              }
            </p>
          </div>
        )}
      </div>

      {/* 只有在查看全部域名或与筛选条件无关时显示友情链接 */}
      {domainFilter === "all" && registrarFilter === "all" && (
        <div className={`transition-all duration-500 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-4 mb-6 mt-12">
            <h2 className="text-2xl font-bold">友情链接</h2>
            <Separator className="flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friendlyLinks.map((link: FriendlyLink) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="block group">
                <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-md hover:border-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{link.name}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{link.description}</p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>

          {friendlyLinks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无友情链接</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


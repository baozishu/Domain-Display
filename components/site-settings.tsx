"use client"

import React from "react"
import { useSite } from "@/contexts/site-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, RefreshCw, Save, Globe, Image } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function SiteSettings() {
  const { 
    settings, 
    updateSiteName, 
    updateLogoType, 
    updateLogoImage, 
    updateLogoText, 
    updateFavicon, 
    resetSettings, 
    loading 
  } = useSite()
  
  // 基本信息状态
  const [siteName, setSiteName] = React.useState(settings.siteName)
  const [favicon, setFavicon] = React.useState(settings.favicon)
  const [basicSettingsChanged, setBasicSettingsChanged] = React.useState(false)
  
  // Logo设置状态
  const [logoType, setLogoType] = React.useState(settings.logoType)
  const [logoImage, setLogoImage] = React.useState(settings.logoImage || "")
  const [logoText, setLogoText] = React.useState(settings.logoText || "")
  const [logoSettingsChanged, setLogoSettingsChanged] = React.useState(false)
  
  // 消息通知状态
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)
  const [activeTab, setActiveTab] = React.useState("basic")

  // 同步设置
  React.useEffect(() => {
    setSiteName(settings.siteName)
    setLogoType(settings.logoType)
    setLogoImage(settings.logoImage || "")
    setLogoText(settings.logoText || "")
    setFavicon(settings.favicon)
  }, [settings])
  
  // 检测设置变更
  React.useEffect(() => {
    setBasicSettingsChanged(
      siteName !== settings.siteName ||
      favicon !== settings.favicon
    )
  }, [siteName, favicon, settings])
  
  React.useEffect(() => {
    setLogoSettingsChanged(
      logoType !== settings.logoType ||
      logoImage !== (settings.logoImage || "") ||
      logoText !== (settings.logoText || "")
    )
  }, [logoType, logoImage, logoText, settings])

  // 保存基本设置
  const handleSaveBasicSettings = async () => {
    try {
      await updateSiteName(siteName)
      await updateFavicon(favicon)
      
      setBasicSettingsChanged(false)
      showSuccessMessage("基本设置已更新")
    } catch (error) {
      showErrorMessage("保存基本设置失败")
    }
  }
  
  // 保存Logo设置
  const handleSaveLogoSettings = async () => {
    try {
      await updateLogoType(logoType)
      
      if (logoType === "image") {
        await updateLogoImage(logoImage)
      } else {
        await updateLogoText(logoText)
      }
      
      setLogoSettingsChanged(false)
      showSuccessMessage("Logo设置已更新")
    } catch (error) {
      showErrorMessage("保存Logo设置失败")
    }
  }
  
  // 重置所有设置
  const handleResetSettings = async () => {
    if (confirm("确定要重置所有网站设置为默认值吗？此操作不可撤销。")) {
      try {
        await resetSettings()
        showSuccessMessage("所有设置已重置为默认值")
      } catch (error) {
        showErrorMessage("重置设置失败")
      }
    }
  }
  
  // 显示成功消息
  const showSuccessMessage = (text: string) => {
    setMessage({ type: "success", text })
    setTimeout(() => setMessage(null), 3000)
  }
  
  // 显示错误消息
  const showErrorMessage = (text: string) => {
    setMessage({ type: "error", text })
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <div className="space-y-6">
      {/* 消息提示 */}
      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : undefined}
          className={cn(
            "transition-all duration-300 animate-in slide-in-from-top-5 fade-in-50",
            message.type === "success" ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : ""
          )}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 animate-pulse" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 animate-in zoom-in-50" />
          )}
          <AlertDescription className={cn(
            message.type === "success" ? "text-green-600 dark:text-green-400" : "",
            "animate-in fade-in-50 duration-300"
          )}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* 设置选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="w-full grid grid-cols-3 h-11 p-1 rounded-md bg-muted">
          <TabsTrigger 
            value="basic" 
            className="rounded-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Globe className="h-4 w-4 mr-2" />
            基本设置
          </TabsTrigger>
          <TabsTrigger 
            value="logo" 
            className="rounded-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Image className="h-4 w-4 mr-2" />
            Logo设置
          </TabsTrigger>
          <TabsTrigger 
            value="reset" 
            className="rounded-sm flex items-center justify-center data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重置所有
          </TabsTrigger>
        </TabsList>
       
        {/* 基本设置选项卡 */}
        <TabsContent value="basic" className="p-0 border-none animate-in fade-in-50 duration-300">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-primary/30 rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                基本信息设置
              </CardTitle>
              <CardDescription>设置网站的基本信息和外观</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-name" className="text-sm font-medium">网站名称</Label>
                <Input
                  id="site-name"
                  value={siteName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSiteName(e.target.value)}
                  placeholder="输入网站名称"
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <p className="text-xs text-muted-foreground">网站名称将显示在浏览器标签和网站顶部</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="favicon" className="text-sm font-medium">网站图标 URL</Label>
                <Input
                  id="favicon"
                  value={favicon}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFavicon(e.target.value)}
                  placeholder="输入Favicon URL"
                  className="focus:ring-2 focus:ring-ring focus:ring-offset-0"
                />
                <p className="text-xs text-muted-foreground">网站图标将显示在浏览器标签页</p>
              </div>
              
              {favicon && (
                <div className="flex items-center gap-3 mt-3 p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">图标预览:</span>
                  <img 
                    src={favicon} 
                    alt="Favicon" 
                    className="w-6 h-6 rounded border bg-background" 
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/16x16/dc2626/ffffff?text=!";
                    }}
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                onClick={handleSaveBasicSettings}
                disabled={!basicSettingsChanged}
                className="transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Logo设置选项卡 */}
        <TabsContent value="logo" className="p-0 border-none animate-in fade-in-50 duration-300">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-primary/30 rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="h-5 w-5 mr-2 text-primary" />
                Logo设置
              </CardTitle>
              <CardDescription>设置网站Logo的显示方式和内容</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-type" className="text-sm font-medium">Logo 类型</Label>
                <Select value={logoType} onValueChange={setLogoType}>
                  <SelectTrigger id="logo-type" className="focus:ring-2 focus:ring-ring focus:ring-offset-0">
                    <SelectValue placeholder="选择 Logo 类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">文字Logo</SelectItem>
                    <SelectItem value="image">图片Logo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">选择Logo的展示形式</p>
              </div>
              
              {logoType === "image" ? (
                <div className="space-y-2">
                  <Label htmlFor="logo-image" className="text-sm font-medium">Logo 图片 URL</Label>
                  <Input
                    id="logo-image"
                    value={logoImage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoImage(e.target.value)}
                    placeholder="输入 Logo 图片 URL"
                    className="focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  />
                  <p className="text-xs text-muted-foreground">建议使用透明背景的PNG或SVG格式</p>
                  
                  {logoImage && (
                    <div className="flex items-center gap-3 mt-3 p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">Logo预览:</span>
                      <img 
                        src={logoImage} 
                        alt="Logo" 
                        className="h-8 max-w-[180px] object-contain bg-background rounded border p-1" 
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://placehold.co/180x40/dc2626/ffffff?text=加载失败";
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="logo-text" className="text-sm font-medium">Logo 文字</Label>
                  <Input
                    id="logo-text"
                    value={logoText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogoText(e.target.value)}
                    placeholder="输入 Logo 文字"
                    className="focus:ring-2 focus:ring-ring focus:ring-offset-0"
                  />
                  <p className="text-xs text-muted-foreground">文字Logo将使用系统字体显示</p>
                  
                  {logoText && (
                    <div className="flex items-center gap-3 mt-3 p-3 bg-muted rounded-md">
                      <span className="text-sm font-medium">文字预览:</span>
                      <span className="text-xl font-bold">{logoText}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                onClick={handleSaveLogoSettings}
                disabled={!logoSettingsChanged}
                className="transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                保存Logo设置
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* 重置所有设置选项卡 */}
        <TabsContent value="reset" className="p-0 border-none animate-in fade-in-50 duration-300">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-t-2 border-t-destructive/30 rounded-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive/80">
                <AlertCircle className="h-5 w-5 mr-2" />
                重置所有设置
              </CardTitle>
              <CardDescription>将所有网站设置恢复到默认值</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/5 p-4 rounded-md border border-destructive/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
                <p className="text-sm font-medium text-destructive flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  警告
                </p>
                <p className="text-sm text-muted-foreground">
                  此操作将会重置所有网站设置为默认值，包括网站名称、图标、Logo等所有配置。重置后的设置将<span className="font-semibold text-destructive">无法恢复</span>。
                </p>
              </div>
              
              <div className="pt-2 flex justify-end">
                <Button 
                  variant="destructive"
                  onClick={handleResetSettings}
                  className="transition-all duration-300 hover:bg-destructive/90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重置为默认设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


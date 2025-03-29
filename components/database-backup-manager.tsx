"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, FileText, Database, RefreshCw, AlertTriangle, Shield, Clock, Trash2, FileJson, ChevronRight } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import axios from "axios"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useDatabase } from "@/contexts/database-context"

interface Backup {
  id: string;
  fileName: string;
  size: number;
  format: "sqlite" | "db";
  createdAt: number;
}

export default function DatabaseBackupManager() {
  const { toast } = useToast()
  const { exportDatabase, importDatabase, resetDatabase } = useDatabase()
  const [backups, setBackups] = React.useState<Backup[]>([])
  const [isExporting, setIsExporting] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState("backups")
  const [isLoading, setIsLoading] = React.useState(true)
  const [lastBackupDate, setLastBackupDate] = React.useState<string | null>(null)
  const [showBackupDialog, setShowBackupDialog] = React.useState(false)
  const [backupName, setBackupName] = React.useState("")
  const [backupFormat, setBackupFormat] = React.useState<"sqlite" | "db">("sqlite")
  
  // 加载备份列表
  const fetchBackups = async () => {
    try {
      setIsLoading(true)
      
      // 调用API获取备份列表
      const response = await axios.get('/api/database/backups')
      
      if (response.data && Array.isArray(response.data.backups)) {
        setBackups(response.data.backups)
        
        // 更新最后备份时间
        const latestBackup = response.data.backups.sort((a: Backup, b: Backup) => b.createdAt - a.createdAt)[0]
        if (latestBackup) {
          setLastBackupDate(new Date(latestBackup.createdAt).toLocaleString('zh-CN'))
          localStorage.setItem('lastBackupDate', new Date(latestBackup.createdAt).toISOString())
        }
      } else {
        // 如果API不可用，使用模拟数据（开发阶段）
        const mockBackups: Backup[] = [
          {
            id: "1",
            fileName: "backup-2025-03-29.sqlite",
            size: 25600,
            format: "sqlite",
            createdAt: Date.now() - 3600000 * 24 * 2
          },
          {
            id: "2",
            fileName: "backup-2025-03-28.db",
            size: 18400,
            format: "db",
            createdAt: Date.now() - 3600000 * 24 * 3
          },
          {
            id: "3",
            fileName: "weekly-backup.sqlite",
            size: 24200,
            format: "sqlite",
            createdAt: Date.now() - 3600000 * 24 * 7
          }
        ]
        
        setBackups(mockBackups)
        
        // 更新最后备份时间
        const latestBackup = mockBackups.sort((a, b) => b.createdAt - a.createdAt)[0]
        if (latestBackup) {
          setLastBackupDate(new Date(latestBackup.createdAt).toLocaleString('zh-CN'))
          localStorage.setItem('lastBackupDate', new Date(latestBackup.createdAt).toISOString())
        }
      }
    } catch (error) {
      console.error('获取备份列表失败:', error)
      toast({
        title: "加载失败",
        description: "无法获取备份列表，请稍后再试",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // 创建备份
  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      toast({
        title: "名称不能为空",
        description: "请输入备份名称",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsExporting(true)
      setProgress(0)
      
      // 模拟处理进度
      const progressInterval = setInterval(() => {
        setProgress((prev: number) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 100)
      
      // 创建一个英文的备份文件名以避免中文编码问题
      const safeBackupName = backupName
        .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
        .replace(/[^\w-]/g, '-') // 替换非字母数字字符为连字符
        .replace(/--+/g, '-') // 替换多个连字符为单个
        .replace(/^-|-$/g, '') // 移除开头和结尾的连字符
        || `backup-${Date.now()}` // 如果为空，使用时间戳
      
      // 创建备份 - 实际API调用
      const response = await axios.post('/api/database/backup', {
        name: safeBackupName,
        format: backupFormat
      })
      
      // 完成备份
      clearInterval(progressInterval)
      setProgress(100)
      
      // 关闭对话框并重置状态
      setTimeout(() => {
        setIsExporting(false)
        setProgress(0)
        setShowBackupDialog(false)
        setBackupName("")
        
        // 更新备份列表
        fetchBackups()
        
        toast({
          title: "备份完成",
          description: `已成功创建${backupFormat === "sqlite" ? "SQLite" : "DB"}格式的备份"${backupName}"`,
        })
      }, 500)
    } catch (error) {
      console.error('创建备份失败:', error)
      toast({
        title: "备份失败",
        description: "创建备份时发生错误，请稍后再试",
        variant: "destructive"
      })
      setIsExporting(false)
      setProgress(0)
    }
  }
  
  // 恢复备份
  const handleRestoreBackup = async (id: string, fileName: string) => {
    if (!confirm(`确定要恢复备份"${fileName}"吗？这将覆盖当前的数据。`)) {
      return
    }
    
    try {
      setIsImporting(true)
      setProgress(0)
      
      // 模拟处理进度
      const progressInterval = setInterval(() => {
        setProgress((prev: number) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 100)
      
      // 实际API调用 - 恢复备份
      await axios.post('/api/database/restore', { id })
      
      // 完成恢复
      clearInterval(progressInterval)
      setProgress(100)
      
      // 重置状态
      setTimeout(() => {
        setIsImporting(false)
        setProgress(0)
        
        toast({
          title: "恢复完成",
          description: `已成功从备份"${fileName}"恢复数据`,
        })
      }, 500)
    } catch (error) {
      console.error('恢复备份失败:', error)
      toast({
        title: "恢复失败",
        description: "恢复备份时发生错误，请稍后再试",
        variant: "destructive"
      })
      setIsImporting(false)
      setProgress(0)
    }
  }
  
  // 删除备份
  const handleDeleteBackup = async (id: string, fileName: string) => {
    if (!confirm(`确定要删除备份"${fileName}"吗？此操作不可撤销。`)) {
      return
    }
    
    try {
      // 实际API调用 - 删除备份
      await axios.delete(`/api/database/backup/${id}`)
      
      // 更新本地状态
      setBackups((prev: Backup[]) => prev.filter((backup: Backup) => backup.id !== id))
      
      toast({
        title: "删除成功",
        description: `已成功删除备份"${fileName}"`,
      })
    } catch (error) {
      console.error('删除备份失败:', error)
      toast({
        title: "删除失败",
        description: "删除备份时发生错误，请稍后再试",
        variant: "destructive"
      })
    }
  }
  
  // 下载备份
  const handleDownloadBackup = async (id: string, fileName: string) => {
    try {
      toast({
        title: "开始下载",
        description: `正在准备下载备份"${fileName}"`,
      })
      
      // 实际下载实现 - 使用文件下载API
      const response = await axios.get(`/api/database/download/${id}`, {
        responseType: 'blob' // 重要：设置响应类型为blob
      })
      
      // 创建下载链接
      const downloadUrl = URL.createObjectURL(new Blob([response.data]))
      const downloadLink = document.createElement('a')
      downloadLink.href = downloadUrl
      downloadLink.download = fileName
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
      URL.revokeObjectURL(downloadUrl)
      
      toast({
        title: "下载成功",
        description: `备份"${fileName}"已下载完成`,
      })
    } catch (error) {
      console.error('下载备份失败:', error)
      toast({
        title: "下载失败",
        description: "下载备份时发生错误，请稍后再试",
        variant: "destructive"
      })
    }
  }
  
  // 导入备份文件
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // 检查文件类型
    const isSqlite = file.name.endsWith('.sqlite')
    const isDb = file.name.endsWith('.db')
    
    if (!isSqlite && !isDb) {
      toast({
        title: "文件类型错误",
        description: "请选择.sqlite或.db格式的备份文件",
        variant: "destructive"
      })
      event.target.value = ""
      return
    }
    
    try {
      setIsImporting(true)
      setProgress(0)
      
      // 模拟处理进度
      const progressInterval = setInterval(() => {
        setProgress((prev: number) => {
          if (prev >= 95) {
            clearInterval(progressInterval)
            return 95
          }
          return prev + 5
        })
      }, 100)
      
      // 创建表单数据
      const formData = new FormData()
      formData.append('file', file)
      
      // 实际API调用 - 上传备份文件
      await axios.post('/api/database/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      // 完成导入
      clearInterval(progressInterval)
      setProgress(100)
      
      // 重置状态
      setTimeout(() => {
        setIsImporting(false)
        setProgress(0)
        event.target.value = ""
        
        // 更新备份列表
        fetchBackups()
        
        toast({
          title: "导入成功",
          description: `已成功导入${isDb ? "DB" : "SQLite"}格式的备份文件`,
        })
      }, 500)
    } catch (error) {
      console.error('导入备份失败:', error)
      toast({
        title: "导入失败",
        description: "导入备份文件时发生错误，请稍后再试",
        variant: "destructive"
      })
      setIsImporting(false)
      setProgress(0)
      event.target.value = ""
    }
  }
  
  // 重置数据库
  const handleResetDatabase = async () => {
    if (!confirm("确定要重置数据库吗？这将删除所有数据，此操作不可撤销。")) {
      return
    }
    
    if (!confirm("再次确认：重置将清空所有数据且不可恢复，是否继续？")) {
      return
    }
    
    try {
      setIsResetting(true)
      
      // 显示进度提示
      toast({
        title: "开始重置数据库",
        description: "重置过程可能需要几秒钟，请耐心等待...",
      })
      
      // 实际API调用 - 重置数据库
      await resetDatabase().catch(error => {
        console.error("重置数据库时发生错误:", error);
        let errorMessage = "未知错误";
        
        if (error?.response?.data?.details) {
          errorMessage = error.response.data.details;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "重置失败",
          description: `重置数据库时发生错误: ${errorMessage}`,
          variant: "destructive"
        });
        throw error; // 重新抛出错误以便外层catch捕获
      });
      
      toast({
        title: "重置成功",
        description: "数据库已成功重置为初始状态",
      })
      
      // 重新加载备份列表
      fetchBackups()
    } catch (error) {
      // 此处不再重复显示toast，因为内部catch已经处理
      console.error('重置数据库失败:', error)
    } finally {
      setIsResetting(false)
    }
  }
  
  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }
  
  // 页面加载时获取备份列表
  React.useEffect(() => {
    fetchBackups()
    
    // 从本地存储加载最后备份时间
    const storedDate = localStorage.getItem('lastBackupDate')
    if (storedDate) {
      setLastBackupDate(new Date(storedDate).toLocaleString('zh-CN'))
    }
  }, [])

  return (
    <div className="grid gap-6">
      {lastBackupDate ? (
        <Alert className="bg-muted/50 border-blue-200 dark:border-blue-800">
          <Clock className="h-4 w-4 text-blue-500" />
          <AlertTitle>最近备份时间</AlertTitle>
          <AlertDescription>
            您上次备份数据库的时间是: {lastBackupDate}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive" className="bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>未找到备份</AlertTitle>
          <AlertDescription>
            您还没有进行过数据备份，建议创建备份以防数据丢失
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="overflow-hidden border-muted-foreground/20">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-background pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl tracking-tight">数据库备份管理</CardTitle>
              <CardDescription>管理数据库备份和恢复操作</CardDescription>
            </div>
            <Database className="h-8 w-8 text-primary/60" />
          </div>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 bg-muted/30 mt-2">
            <TabsTrigger value="backups" className="rounded-none">
              <Database className="h-4 w-4 mr-2" />
              备份列表
            </TabsTrigger>
            <TabsTrigger value="create" className="rounded-none">
              <Download className="h-4 w-4 mr-2" />
              创建备份
            </TabsTrigger>
            <TabsTrigger value="import" className="rounded-none">
              <Upload className="h-4 w-4 mr-2" />
              导入备份
            </TabsTrigger>
          </TabsList>
          
          {/* 备份列表选项卡 */}
          <TabsContent value="backups" className="mt-6 mb-2 px-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  数据库备份
                  <Badge variant="outline" className="ml-2 font-normal text-xs">
                    {backups.length} 个备份
                  </Badge>
                </h3>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={fetchBackups}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                  刷新
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8">
                  <div className="mb-4 flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">加载备份列表...</span>
                  </div>
                  <Progress value={40} className="h-1.5 w-48" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-12 border rounded-md border-dashed border-muted-foreground/20">
                  <Database className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">暂无备份</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    您还没有创建任何数据库备份
                  </p>
                  <Button 
                    variant="default" 
                    onClick={() => setActiveTab("create")}
                  >
                    创建第一个备份
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {backups.map((backup: Backup) => (
                    <Card key={backup.id} className="overflow-hidden bg-background border-muted-foreground/10 hover:border-primary/20 transition-colors">
                      <div className="flex items-start p-4">
                        <div className="p-2 rounded-md bg-primary/10 mr-4">
                          {backup.format === "sqlite" ? (
                            <Database className="h-8 w-8 text-primary/80" />
                          ) : (
                            <Database className="h-8 w-8 text-blue-500/80" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-base truncate">{backup.fileName}</h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                <Badge variant="outline" className="font-normal">
                                  {backup.format === "sqlite" ? "SQLite" : "DB"}
                                </Badge>
                                <span>{formatFileSize(backup.size)}</span>
                                <span>
                                  {formatDistanceToNow(new Date(backup.createdAt), {
                                    addSuffix: true,
                                    locale: zhCN
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-1.5">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-blue-500"
                                onClick={() => handleDownloadBackup(backup.id, backup.fileName)}
                                title="下载"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-green-500"
                                onClick={() => handleRestoreBackup(backup.id, backup.fileName)}
                                title="恢复"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDeleteBackup(backup.id, backup.fileName)}
                                title="删除"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isImporting && (
                        <div className="px-4 pb-4">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium">恢复进度</span>
                            <span className="text-xs">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* 创建备份选项卡 */}
          <TabsContent value="create" className="mt-6 mb-2 px-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  创建新备份
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  创建数据库的完整备份，可以选择SQLite或DB格式。
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card 
                    className="border border-muted-foreground/20 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      setBackupFormat("sqlite")
                      setBackupName(`SQLite-Backup-${new Date().toISOString().split('T')[0]}`)
                      setShowBackupDialog(true)
                    }}
                  >
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">SQLite 格式</CardTitle>
                        <Database className="h-5 w-5 text-primary" />
                      </div>
                      <CardDescription>
                        原生数据库格式，适合系统迁移
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-4 flex items-center justify-between">
                      <Badge variant="outline">推荐</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardFooter>
                  </Card>
                  
                  <Card 
                    className="border border-muted-foreground/20 hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => {
                      setBackupFormat("db")
                      setBackupName(`DB-Backup-${new Date().toISOString().split('T')[0]}`)
                      setShowBackupDialog(true)
                    }}
                  >
                    <CardHeader className="py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">DB 格式</CardTitle>
                        <Database className="h-5 w-5 text-blue-500" />
                      </div>
                      <CardDescription>
                        标准数据库格式，兼容性好
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 pb-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">标准格式</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardFooter>
                  </Card>
                </div>
                
                {/* 创建备份对话框 */}
                <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>创建{backupFormat === "sqlite" ? "SQLite" : "DB"}备份</DialogTitle>
                      <DialogDescription>
                        为数据库创建一个新的{backupFormat === "sqlite" ? "SQLite" : "DB"}格式备份
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-2">
                      <div className="space-y-2">
                        <Label htmlFor="backup-name">备份名称</Label>
                        <Input
                          id="backup-name"
                          placeholder={`backup-${new Date().toISOString().split('T')[0]}`}
                          value={backupName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBackupName(e.target.value)}
                        />
                      </div>
                      
                      {isExporting && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">备份进度</span>
                            <span className="text-sm">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <DialogFooter className="flex space-x-2 sm:space-x-0">
                      <Button
                        variant="outline"
                        onClick={() => setShowBackupDialog(false)}
                        disabled={isExporting}
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        onClick={handleCreateBackup}
                        disabled={isExporting}
                      >
                        {isExporting ? '备份中...' : '创建备份'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TabsContent>
          
          {/* 导入备份选项卡 */}
          <TabsContent value="import" className="mt-6 mb-2 px-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  导入备份文件
                  <Badge variant="outline" className="ml-2 font-normal text-xs">支持两种格式</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  从备份文件中恢复数据。系统支持导入SQLite和DB格式的备份文件。
                </p>
                
                {isImporting && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">导入进度</span>
                      <span className="text-sm">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
                
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg border-muted-foreground/20 hover:border-primary/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-6 text-center">
                    点击下方按钮选择备份文件，或将文件拖放到此区域
                  </p>
                  <Button
                    variant="default"
                    className="relative flex items-center"
                    disabled={isImporting}
                  >
                    <input
                      type="file"
                      accept=".db,.sqlite"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImportFile}
                      disabled={isImporting}
                    />
                    <Upload className="h-4 w-4 mr-2" />
                    {isImporting ? "导入中..." : "选择文件导入"}
                  </Button>
                </div>
                
                <div className="mt-8">
                  <Separator className="mb-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium mb-1">重置数据库</h4>
                      <p className="text-sm text-muted-foreground">
                        将数据库重置为初始状态，此操作不可撤销
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                          重置中...
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-3.5 w-3.5 mr-2" />
                          重置数据库
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
} 
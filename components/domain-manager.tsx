"use client"

import React from "react"
import { useState } from "react"
import { useDatabase } from '@/contexts/database-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, RefreshCw, Plus, Trash2, Edit, ExternalLink, Globe, Calendar, ShoppingCart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RegistrarIcon } from "@/components/registrar-icon"
import { useSite } from "@/contexts/site-context"

// 域名类型定义
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
  price?: number
  description?: string
  addedAt?: number
  updatedAt?: number
}

// 友情链接类型定义
interface FriendlyLink {
  id: string
  name: string
  url: string
  description: string
  createdAt?: number
}

export default function DomainManager() {
  const {
    domains,
    soldDomains,
    friendlyLinks,
    loading,
    addDomain,
    updateDomain,
    deleteDomain,
    markAsSold,
    addFriendlyLink,
    updateFriendlyLink,
    deleteFriendlyLink
  } = useDatabase()

  const { settings, addRegistrarIcon, updateRegistrarIcon, removeRegistrarIcon } = useSite()

  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  // 域名编辑状态
  const [editingDomain, setEditingDomain] = React.useState<Domain | null>(null)
  const [isAddingDomain, setIsAddingDomain] = React.useState(false)

  // 已售域名编辑状态
  const [editingSoldDomain, setEditingSoldDomain] = React.useState<Domain | null>(null)
  const [isAddingSoldDomain, setIsAddingSoldDomain] = React.useState(false)

  // 友情链接编辑状态
  const [editingLink, setEditingLink] = React.useState<FriendlyLink | null>(null)
  const [isAddingLink, setIsAddingLink] = React.useState(false)

  // 注册商图标编辑状态
  const [newIconName, setNewIconName] = React.useState("")
  const [newIconSvg, setNewIconSvg] = React.useState("")
  const [editIconName, setEditIconName] = React.useState("")
  const [editIconSvg, setEditIconSvg] = React.useState("")
  const [isAddIconDialogOpen, setIsAddIconDialogOpen] = React.useState(false)
  const [isEditIconDialogOpen, setIsEditIconDialogOpen] = React.useState(false)

  // 更新已售域名选择功能
  const [selectedDomainId, setSelectedDomainId] = React.useState<string>("")

  // 显示成功消息
  const showSuccessMessage = (text: string) => {
    setMessage({ type: "success", text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 显示错误消息
  const showErrorMessage = (text: string) => {
    setMessage({ type: "error", text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 重置所有数据
  const handleReset = () => {
    if (confirm("确定要重置所有数据到默认值吗？")) {
      try {
        const { resetDatabase } = useDatabase();
        if (resetDatabase) {
          resetDatabase().then(() => {
            showSuccessMessage("所有数据已重置为默认值");
          }).catch(error => {
            console.error("重置数据失败:", error);
            showErrorMessage(`重置数据失败: ${error.message || '未知错误'}`);
          });
        } else {
          showErrorMessage("无法找到重置数据库功能");
        }
      } catch (error) {
        console.error("重置操作失败:", error);
        showErrorMessage(`重置操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
  }

  // 生成唯一ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toISOString().split("T")[0]
  }

  // 添加新域名
  const handleAddDomain = async (newDomain: Domain) => {
    try {
      await addDomain(newDomain)
      setMessage({ type: "success", text: "域名添加成功" })
    } catch (error) {
      setMessage({ type: "error", text: "添加域名失败: " + (error instanceof Error ? error.message : String(error)) })
    }
  }

  // 更新域名
  const handleUpdateDomain = async (id: string, updatedDomain: Domain) => {
    try {
      await updateDomain(id, updatedDomain)
      setMessage({ type: "success", text: "域名更新成功" })
    } catch (error) {
      setMessage({ type: "error", text: "更新域名失败: " + (error instanceof Error ? error.message : String(error)) })
    }
  }

  // 删除域名
  const handleDeleteDomain = async (id: string) => {
    try {
      await deleteDomain(id)
      setMessage({ type: "success", text: "域名删除成功" })
    } catch (error: any) {
      console.error("删除域名失败:", error);
      // 如果是404错误（域名不存在），不显示错误消息，因为这意味着域名已经被删除
      if (error.response && error.response.status === 404) {
        setMessage({ type: "success", text: "域名已删除" })
      } else {
        setMessage({ type: "error", text: "删除域名失败: " + (error.message || "未知错误") })
      }
    }
  }

  // 处理选择待售域名
  const handleSelectDomainForSale = (domainId: string) => {
    setSelectedDomainId(domainId);
    if (domainId === "manual") {
      // 清空选择
      setEditingSoldDomain({
        id: "",
        name: "",
        extension: "",
        status: "sold",
        soldDate: new Date().toISOString().split("T")[0],
      });
      return;
    }

    // 查找选择的域名
    const selectedDomain = domains.find(d => d.id === domainId);
    if (selectedDomain) {
      setEditingSoldDomain({
        ...selectedDomain,
        id: "", // 创建新记录ID
        status: "sold",
        soldDate: new Date().toISOString().split("T")[0],
      });
    }
  };

  // 添加已售域名
  const handleAddSoldDomain = () => {
    if (!editingSoldDomain) return;

    const newDomain: Domain = {
      id: generateId(),
      name: editingSoldDomain.name || "",
      extension: editingSoldDomain.extension || "",
      status: "sold",
      soldTo: editingSoldDomain.soldTo || "",
      soldDate: editingSoldDomain.soldDate || new Date().toISOString().split("T")[0],
      registrar: editingSoldDomain.registrar,
      registrarIcon: editingSoldDomain.registrarIcon,
      price: editingSoldDomain.price || 0,
      description: editingSoldDomain.description,
    };

    if (!newDomain.name || !newDomain.extension) {
      showErrorMessage("域名和后缀不能为空");
      return;
    }

    // 标记域名为已售
    const markAsSoldAndCleanup = async () => {
      try {
        // 先添加已售域名记录
        await markAsSold(newDomain, newDomain.price || 0);
        
        // 如果是从待售域名转为已售，且不是"manual"选项，则删除原待售域名
        if (selectedDomainId && selectedDomainId !== "manual") {
          try {
            await deleteDomain(selectedDomainId);
          } catch (error: any) {
            // 如果是404错误（域名不存在），这是正常情况，不处理
            if (!(error.response && error.response.status === 404)) {
              console.error("删除原域名失败:", error);
              // 但继续流程，不阻止操作完成
            }
          }
        }
        
        showSuccessMessage("已售域名已添加");
      } catch (error: any) {
        console.error("标记域名为已售失败:", error);
        showErrorMessage(`标记域名为已售失败: ${error.message || '未知错误'}`);
      } finally {
        setIsAddingSoldDomain(false);
        setEditingSoldDomain(null);
        setSelectedDomainId("");
      }
    };
    
    markAsSoldAndCleanup();
  };

  // 更新已售域名
  const handleUpdateSoldDomain = () => {
    if (!editingSoldDomain) return;

    if (!editingSoldDomain.name || !editingSoldDomain.extension) {
      showErrorMessage("域名和后缀不能为空");
      return;
    }

    // 调用markAsSold函数，价格参数设为0（或者使用域名的价格）
    markAsSold(editingSoldDomain, editingSoldDomain.price || 0)
      .then(() => {
        setEditingSoldDomain(null);
        showSuccessMessage("已售域名已更新");
      })
      .catch((error: any) => {
        console.error("更新已售域名失败:", error);
        showErrorMessage(`更新已售域名失败: ${error.message || '未知错误'}`);
      });
  };

  // 删除已售域名
  const handleDeleteSoldDomain = (id: string) => {
    if (confirm("确定要删除这个已售域名吗？")) {
      deleteDomain(id).then(() => {
        showSuccessMessage("已售域名已删除");
      }).catch(error => {
        console.error("删除已售域名失败:", error);
        showErrorMessage(`删除失败: ${error.message || '未知错误'}`);
      });
    }
  }

  // 添加友情链接
  const handleAddLink = () => {
    const newLink: FriendlyLink = {
      id: generateId(),
      name: editingLink?.name || "",
      url: editingLink?.url || "",
      description: editingLink?.description || "",
    }

    if (!newLink.name || !newLink.url) {
      showErrorMessage("名称和URL不能为空")
      return
    }

    addFriendlyLink(newLink)
    setIsAddingLink(false)
    setEditingLink(null)
    showSuccessMessage("友情链接已添加")
  }

  // 更新友情链接
  const handleUpdateLink = () => {
    if (!editingLink) return;

    if (!editingLink.name || !editingLink.url) {
      showErrorMessage("名称和URL不能为空");
      return;
    }

    updateFriendlyLink(editingLink.id, editingLink).catch(error => {
      console.error("更新友情链接失败:", error);
      showErrorMessage("更新友情链接失败");
    });
    
    setEditingLink(null);
    showSuccessMessage("友情链接已更新");
  };

  // 删除友情链接
  const handleDeleteLink = (id: string) => {
    if (confirm("确定要删除这个友情链接吗？")) {
      deleteFriendlyLink(id).catch(error => {
        console.error("删除友情链接失败:", error);
        showErrorMessage("删除友情链接失败");
      });
      showSuccessMessage("友情链接已删除");
    }
  };

  // 获取可用的注册商图标列表
  const getRegistrarIcons = () => {
    return Object.keys(settings.registrarIcons || {})
  }

  // 添加注册商图标
  const handleAddRegistrarIcon = () => {
    if (!newIconName.trim()) {
      showErrorMessage("请输入注册商名称")
      return
    }

    if (!newIconSvg.trim()) {
      showErrorMessage("请输入SVG代码")
      return
    }

    try {
      addRegistrarIcon(newIconName.trim(), newIconSvg.trim())
      setNewIconName("")
      setNewIconSvg("")
      setIsAddIconDialogOpen(false)
      showSuccessMessage("注册商图标已添加")
    } catch (error) {
      console.error("添加注册商图标失败:", error)
      showErrorMessage("添加注册商图标失败，请重试")
    }
  }

  // 打开编辑图标对话框
  const openEditIconDialog = (name: string) => {
    try {
      setEditIconName(name)
      setEditIconSvg(settings.registrarIcons[name] || "")
      setIsEditIconDialogOpen(true)
    } catch (error) {
      console.error("打开编辑对话框失败:", error)
      showErrorMessage("操作失败，请重试")
    }
  }

  // 更新注册商图标
  const handleUpdateRegistrarIcon = () => {
    if (!editIconSvg.trim()) {
      showErrorMessage("请输入SVG代码")
      return
    }

    try {
      updateRegistrarIcon(editIconName, editIconSvg.trim())
      setIsEditIconDialogOpen(false)
      showSuccessMessage("注册商图标已更新")
    } catch (error) {
      console.error("更新注册商图标失败:", error)
      showErrorMessage("更新注册商图标失败，请重试")
    }
  }

  // 删除注册商图标
  const handleRemoveRegistrarIcon = (name: string) => {
    if (confirm(`确定要删除 ${name} 的图标吗？`)) {
      try {
        removeRegistrarIcon(name)
        showSuccessMessage("注册商图标已删除")
      } catch (error) {
        console.error("删除注册商图标失败:", error)
        showErrorMessage("删除注册商图标失败，请重试")
      }
    }
  }

  // 更新域名添加处理函数
  const handleAddDomainClick = () => {
    const newDomain = {
      id: generateId(),
      name: editingDomain?.name || "",
      extension: editingDomain?.extension || "",
      registrarIcon: editingDomain?.registrarIcon || "",
      price: parseFloat(editingDomain?.price?.toString() || "0"),
      description: editingDomain?.description || "",
      status: editingDomain?.status || "active",
      addedAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!newDomain.name || !newDomain.extension) {
      showErrorMessage("域名和后缀不能为空");
      return;
    }

    handleAddDomain(newDomain);
    setIsAddingDomain(false);
    setEditingDomain(null);
  };

  // 更新域名更新处理函数
  const handleUpdateDomainClick = () => {
    if (!editingDomain) return;

    if (!editingDomain.name || !editingDomain.extension) {
      showErrorMessage("域名和后缀不能为空");
      return;
    }

    // 确保更新时间字段存在
    const updatedDomain = {
      ...editingDomain,
      updatedAt: Date.now()
    };

    handleUpdateDomain(editingDomain.id, updatedDomain);
    setEditingDomain(null);
  };

  // 更新友情链接处理函数
  const handleAddLinkClick = () => {
    if (!editingLink) return;

    if (!editingLink.name || !editingLink.url) {
      showErrorMessage("链接名称和URL不能为空");
      return;
    }

    const newLink = {
      ...editingLink,
      id: generateId(),
      createdAt: Date.now()
    };

    addFriendlyLink(newLink);
    setIsAddingLink(false);
    setEditingLink(null);
    showSuccessMessage("友情链接已添加");
  };

  const handleUpdateLinkClick = () => {
    if (!editingLink) return;

    if (!editingLink.name || !editingLink.url) {
      showErrorMessage("链接名称和URL不能为空");
      return;
    }

    updateFriendlyLink(editingLink.id, editingLink);
    setEditingLink(null);
    showSuccessMessage("友情链接已更新");
  };

  // 处理域名属性变更
  const handleDomainPropertyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const fieldName = id.replace(/(sold-domain-|edit-sold-domain-|domain-|edit-domain-)/, '').replace(/-/g, '');
    
    if (editingSoldDomain) {
      setEditingSoldDomain((prev: Domain | null) => prev ? { ...prev, [fieldName]: value } : null);
    } else if (editingDomain) {
      setEditingDomain((prev: Domain | null) => prev ? { ...prev, [fieldName]: value } : null);
    }
  };

  // 修复隐式any类型的参数
  const handleLinkPropertyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditingLink((prev: FriendlyLink | null) => prev ? ({ ...prev, [name]: value }) : null);
  };

  // 修复Select onValueChange的类型
  const handleRegistrarSelect = (value: string) => {
    const iconName = value;
    const registrarName = value; // 可以根据需要映射到更友好的显示名称
    setEditingDomain((prev: Domain | null) => 
      prev ? { ...prev, registrar: registrarName, registrarIcon: iconName } : null
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">域名数据管理</h2>
        <Button variant="outline" onClick={handleReset}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重置为默认值
        </Button>
      </div>

      {message && (
        <Alert
          variant={message.type === "error" ? "destructive" : undefined}
          className={message.type === "success" ? "bg-green-50 border-green-200" : undefined}
        >
          {message.type === "error" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-600" : undefined}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="registrar">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="registrar">注册商</TabsTrigger>
          <TabsTrigger value="active">待售域名</TabsTrigger>
          <TabsTrigger value="sold">已售域名</TabsTrigger>
          <TabsTrigger value="links">友情链接</TabsTrigger>
        </TabsList>

        {/* 注册商管理 */}
        <TabsContent value="registrar">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>注册商管理</CardTitle>
                  <CardDescription>管理域名注册商的SVG图标</CardDescription>
                </div>
                <Dialog open={isAddIconDialogOpen} onOpenChange={setIsAddIconDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加注册商
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加注册商</DialogTitle>
                      <DialogDescription>
                        添加新的域名注册商SVG图标。请确保SVG代码中的class属性已替换为className。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-icon-name">注册商名称</Label>
                        <Input
                          id="new-icon-name"
                          value={newIconName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewIconName(e.target.value)}
                          placeholder="例如：aliyun"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-icon-svg">SVG代码</Label>
                        <Textarea
                          id="new-icon-svg"
                          value={newIconSvg}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewIconSvg(e.target.value)}
                          placeholder="粘贴SVG代码"
                          className="font-mono h-40"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddIconDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddRegistrarIcon}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(settings.registrarIcons || {}).map(([name, svg]) => (
                  <Card key={name} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">{name}</h3>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditIconDialog(name)}>
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRemoveRegistrarIcon(name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
                        <div dangerouslySetInnerHTML={{ __html: svg }} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {(!settings.registrarIcons || Object.keys(settings.registrarIcons).length === 0) && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">暂无注册商图标</p>
                </div>
              )}

              <Dialog open={isEditIconDialogOpen} onOpenChange={setIsEditIconDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑注册商</DialogTitle>
                    <DialogDescription>
                      编辑 {editIconName} 的SVG图标。请确保SVG代码中的class属性已替换为className。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-icon-svg">SVG代码</Label>
                      <Textarea
                        id="edit-icon-svg"
                        value={editIconSvg}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditIconSvg(e.target.value)}
                        placeholder="粘贴SVG代码"
                        className="font-mono h-40"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsEditIconDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleUpdateRegistrarIcon}>保存</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 待售域名管理 */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>待售域名管理</CardTitle>
                  <CardDescription>管理您的待售域名列表</CardDescription>
                </div>
                <Dialog open={isAddingDomain} onOpenChange={setIsAddingDomain}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() =>
                        setEditingDomain({
                          id: "",
                          name: "",
                          extension: "",
                          status: "available",
                          registrationTime: new Date().toISOString().split("T")[0],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加域名
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加新域名</DialogTitle>
                      <DialogDescription>添加一个新的待售域名到您的列表中</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="domain-name">域名</Label>
                          <Input
                            id="domain-name"
                            value={editingDomain?.name || ""}
                            onChange={handleDomainPropertyChange}
                            placeholder="example"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="domain-extension">后缀</Label>
                          <Input
                            id="domain-extension"
                            value={editingDomain?.extension || ""}
                            onChange={handleDomainPropertyChange}
                            placeholder=".com"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain-registrar">注册商</Label>
                        <Select
                          value={editingDomain?.registrarIcon || ""}
                          onValueChange={handleRegistrarSelect}
                        >
                          <SelectTrigger id="domain-registrar">
                            <SelectValue placeholder="选择注册商" />
                          </SelectTrigger>
                          <SelectContent>
                            {getRegistrarIcons().map((icon) => (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center">
                                  <RegistrarIcon iconName={icon} className="h-4 w-4 mr-2" />
                                  <span>{icon}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="domain-registration-time">注册时间</Label>
                          <Input
                            id="domain-registration-time"
                            type="date"
                            value={editingDomain?.registrationTime ? formatDate(editingDomain.registrationTime) : ""}
                            onChange={handleDomainPropertyChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="domain-expiration-time">到期时间</Label>
                          <Input
                            id="domain-expiration-time"
                            type="date"
                            value={editingDomain?.expirationTime ? formatDate(editingDomain.expirationTime) : ""}
                            onChange={handleDomainPropertyChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="domain-purchase-url">购买链接</Label>
                        <Input
                          id="domain-purchase-url"
                          value={editingDomain?.purchaseUrl || ""}
                          onChange={handleDomainPropertyChange}
                          placeholder="https://example.com/buy"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingDomain(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddDomainClick}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map((domain) => (
                  <Card key={domain.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center">
                          <RegistrarIcon
                            iconName={domain.registrarIcon}
                            className="h-5 w-5 text-muted-foreground mr-2"
                          />
                          <span className="text-sm font-medium">{domain.registrar || "未知商家"}</span>
                        </div>
                        {domain.registrationTime && (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(domain.registrationTime)}
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-1">
                          <span className="text-foreground">{domain.name}</span>
                          <span className="text-muted-foreground">{domain.extension}</span>
                        </h2>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center">
                            <div
                              className={`h-2 w-2 rounded-full ${domain.status === "active" ? "bg-green-500" : "bg-amber-500"} mr-2`}
                            ></div>
                            <span className="text-sm text-muted-foreground">待出售</span>
                          </div>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setEditingDomain({ ...domain })}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>编辑域名</DialogTitle>
                                  <DialogDescription>修改域名信息</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-domain-name">域名</Label>
                                      <Input
                                        id="edit-domain-name"
                                        value={editingDomain?.name || ""}
                                        onChange={handleDomainPropertyChange}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-domain-extension">后缀</Label>
                                      <Input
                                        id="edit-domain-extension"
                                        value={editingDomain?.extension || ""}
                                        onChange={handleDomainPropertyChange}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-domain-registrar">注册商</Label>
                                    <Select
                                      value={editingDomain?.registrarIcon || ""}
                                      onValueChange={handleRegistrarSelect}
                                    >
                                      <SelectTrigger id="edit-domain-registrar">
                                        <SelectValue placeholder="选择注册商" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getRegistrarIcons().map((icon) => (
                                          <SelectItem key={icon} value={icon}>
                                            <div className="flex items-center">
                                              <RegistrarIcon iconName={icon} className="h-4 w-4 mr-2" />
                                              <span>{icon}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-domain-registration-time">注册时间</Label>
                                      <Input
                                        id="edit-domain-registration-time"
                                        type="date"
                                        value={
                                          editingDomain?.registrationTime
                                            ? formatDate(editingDomain.registrationTime)
                                            : ""
                                        }
                                        onChange={handleDomainPropertyChange}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-domain-expiration-time">到期时间</Label>
                                      <Input
                                        id="edit-domain-expiration-time"
                                        type="date"
                                        value={
                                          editingDomain?.expirationTime ? formatDate(editingDomain.expirationTime) : ""
                                        }
                                        onChange={handleDomainPropertyChange}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-domain-purchase-url">购买链接</Label>
                                    <Input
                                      id="edit-domain-purchase-url"
                                      value={editingDomain?.purchaseUrl || ""}
                                      onChange={handleDomainPropertyChange}
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingDomain(null)}>
                                    取消
                                  </Button>
                                  <Button onClick={handleUpdateDomainClick}>保存</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDomain(domain.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        {domain.purchaseUrl && (
                          <div className="mt-4">
                            <Button size="sm" variant="outline" className="w-full" asChild>
                              <a href={domain.purchaseUrl} target="_blank" rel="noopener noreferrer">
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                购买链接
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {domains.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">暂无域名，点击"添加域名"按钮添加</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 已售域名管理 */}
        <TabsContent value="sold">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>已售域名管理</CardTitle>
                  <CardDescription>管理您的已售域名列表</CardDescription>
                </div>
                <Dialog open={isAddingSoldDomain} onOpenChange={setIsAddingSoldDomain}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() =>
                        setEditingSoldDomain({
                          id: "",
                          name: "",
                          extension: "",
                          status: "sold",
                          soldDate: new Date().toISOString().split("T")[0],
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加已售域名
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加已售域名</DialogTitle>
                      <DialogDescription>添加一个已售出的域名到您的列表中</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="select-domain">从待售域名中选择 (可选)</Label>
                        <Select value={selectedDomainId} onValueChange={handleSelectDomainForSale}>
                          <SelectTrigger>
                            <SelectValue placeholder="选择一个待售域名" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">手动输入</SelectItem>
                            {domains.filter(d => d.status !== "sold").map((domain) => (
                              <SelectItem key={domain.id} value={domain.id}>
                                {domain.name}{domain.extension} {domain.registrar ? `(${domain.registrar})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">选择待售域名后将自动填充信息</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sold-domain-name">域名</Label>
                          <Input
                            id="sold-domain-name"
                            value={editingSoldDomain?.name || ""}
                            onChange={handleDomainPropertyChange}
                            placeholder="example"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sold-domain-extension">后缀</Label>
                          <Input
                            id="sold-domain-extension"
                            value={editingSoldDomain?.extension || ""}
                            onChange={handleDomainPropertyChange}
                            placeholder=".com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="sold-domain-sold-to">购买方</Label>
                          <Input
                            id="sold-domain-sold-to"
                            value={editingSoldDomain?.soldTo || ""}
                            onChange={handleDomainPropertyChange}
                            placeholder="公司名称"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sold-domain-sold-date">售出日期</Label>
                          <Input
                            id="sold-domain-sold-date"
                            type="date"
                            value={editingSoldDomain?.soldDate ? formatDate(editingSoldDomain.soldDate) : ""}
                            onChange={handleDomainPropertyChange}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingSoldDomain(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddSoldDomain}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {soldDomains.map((domain) => (
                  <Card key={domain.id} className="overflow-hidden bg-muted/30">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm font-medium">已售出</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {domain.soldDate && formatDate(domain.soldDate)}
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-bold mb-1">
                          <span className="text-foreground">{domain.name}</span>
                          <span className="text-muted-foreground">{domain.extension}</span>
                        </h2>
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">购买方：</span>
                            <span className="text-sm font-medium">{domain.soldTo}</span>
                          </div>
                        </div>
                        <div className="flex justify-end mt-4 space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingSoldDomain({ ...domain })}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>编辑已售域名</DialogTitle>
                                <DialogDescription>修改已售域名信息</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-sold-domain-name">域名</Label>
                                    <Input
                                      id="edit-sold-domain-name"
                                      value={editingSoldDomain?.name || ""}
                                      onChange={handleDomainPropertyChange}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-sold-domain-extension">后缀</Label>
                                    <Input
                                      id="edit-sold-domain-extension"
                                      value={editingSoldDomain?.extension || ""}
                                      onChange={handleDomainPropertyChange}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-sold-domain-sold-to">购买方</Label>
                                    <Input
                                      id="edit-sold-domain-sold-to"
                                      value={editingSoldDomain?.soldTo || ""}
                                      onChange={handleDomainPropertyChange}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-sold-domain-sold-date">售出日期</Label>
                                    <Input
                                      id="edit-sold-domain-sold-date"
                                      type="date"
                                      value={editingSoldDomain?.soldDate ? formatDate(editingSoldDomain.soldDate) : ""}
                                      onChange={handleDomainPropertyChange}
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingSoldDomain(null)}>
                                  取消
                                </Button>
                                <Button onClick={handleUpdateSoldDomain}>保存</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteSoldDomain(domain.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {soldDomains.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">暂无已售域名，点击"添加已售域名"按钮添加</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 友情链接管理 */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>友情链接管理</CardTitle>
                  <CardDescription>管理您的友情链接列表</CardDescription>
                </div>
                <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() =>
                        setEditingLink({
                          id: "",
                          name: "",
                          url: "",
                          description: "",
                        })
                      }
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加友情链接
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加友情链接</DialogTitle>
                      <DialogDescription>添加一个新的友情链接到您的列表中</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-name">名称</Label>
                        <Input
                          id="link-name"
                          value={editingLink?.name || ""}
                          onChange={handleLinkPropertyChange}
                          placeholder="网站名称"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                          id="link-url"
                          value={editingLink?.url || ""}
                          onChange={handleLinkPropertyChange}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-description">描述</Label>
                        <Input
                          id="link-description"
                          value={editingLink?.description || ""}
                          onChange={handleLinkPropertyChange}
                          placeholder="网站描述"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddingLink(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddLinkClick}>添加</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friendlyLinks.map((link) => (
                  <Card key={link.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                          {link.name}
                        </h3>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setEditingLink({ ...link })}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>编辑友情链接</DialogTitle>
                                <DialogDescription>修改友情链接信息</DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-link-name">名称</Label>
                                  <Input
                                    id="edit-link-name"
                                    value={editingLink?.name || ""}
                                    onChange={handleLinkPropertyChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-link-url">URL</Label>
                                  <Input
                                    id="edit-link-url"
                                    value={editingLink?.url || ""}
                                    onChange={handleLinkPropertyChange}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-link-description">描述</Label>
                                  <Input
                                    id="edit-link-description"
                                    value={editingLink?.description || ""}
                                    onChange={handleLinkPropertyChange}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingLink(null)}>
                                  取消
                                </Button>
                                <Button onClick={handleUpdateLinkClick}>保存</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteLink(link.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                      <div className="mt-4 text-xs text-muted-foreground truncate">{link.url}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {friendlyLinks.length === 0 && (
                <div className="text-center py-12">
                  <ExternalLink className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">暂无友情链接，点击"添加友情链接"按钮添加</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


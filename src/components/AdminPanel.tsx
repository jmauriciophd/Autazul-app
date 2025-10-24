import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Settings, Image, Code, Loader2, BarChart3, Users as UsersIcon, Trash2, Plus, ChevronLeft, ChevronRight, UserCog } from 'lucide-react'
import { AdminManagement } from './AdminManagement'

interface Banner {
  id: string
  imageUrl: string
  link?: string
  title?: string
  order: number
}

interface UserStats {
  name: string
  email: string
  userType: string
  registrationCount: number
  joinedAt: string
}

interface SystemStats {
  totalUsers: number
  totalParents: number
  totalProfessionals: number
  totalChildren: number
  totalEvents: number
}

export function AdminPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Configurações
  const [googleAdsCode, setGoogleAdsCode] = useState('')
  const [googleAdsSegmentation, setGoogleAdsSegmentation] = useState('')
  const [error, setError] = useState('')
  
  // Banners
  const [banners, setBanners] = useState<Banner[]>([])
  const [newBannerUrl, setNewBannerUrl] = useState('')
  const [newBannerLink, setNewBannerLink] = useState('')
  const [newBannerTitle, setNewBannerTitle] = useState('')
  const [addingBanner, setAddingBanner] = useState(false)
  
  // Estatísticas
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [statsLoading, setStatsLoading] = useState(false)

  useEffect(() => {
    loadSettings()
    if (activeTab === 'dashboard') {
      loadStats()
    }
  }, [activeTab])

  async function loadSettings() {
    try {
      setLoading(true)
      const { settings } = await api.getAdminSettings()
      setGoogleAdsCode(settings.googleAdsCode || '')
      setGoogleAdsSegmentation(settings.googleAdsSegmentation || '')
      setBanners(settings.banners || [])
    } catch (error: any) {
      console.error('Error loading admin settings:', error)
      setError('Erro ao carregar configurações. Você tem permissão de administrador?')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    try {
      setStatsLoading(true)
      const stats = await api.getAdminStats()
      setSystemStats(stats.systemStats)
      setUserStats(stats.userStats)
    } catch (error: any) {
      console.error('Error loading stats:', error)
      notify.error('Erro', 'Não foi possível carregar as estatísticas')
    } finally {
      setStatsLoading(false)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      await api.updateAdminSettings({
        googleAdsCode,
        googleAdsSegmentation,
        banners
      })
      notify.success('Configurações salvas', 'As configurações foram atualizadas com sucesso')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      setError('Erro ao salvar configurações: ' + (error.message || 'Tente novamente'))
      notify.error('Erro ao salvar', 'Não foi possível salvar as configurações')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddBanner() {
    if (!newBannerUrl.trim()) {
      notify.error('Erro', 'URL da imagem é obrigatória')
      return
    }

    setAddingBanner(true)
    try {
      const newBanner: Banner = {
        id: crypto.randomUUID(),
        imageUrl: newBannerUrl,
        link: newBannerLink || undefined,
        title: newBannerTitle || undefined,
        order: banners.length
      }

      const updatedBanners = [...banners, newBanner]
      setBanners(updatedBanners)

      await api.updateAdminSettings({ banners: updatedBanners })
      
      setNewBannerUrl('')
      setNewBannerLink('')
      setNewBannerTitle('')
      notify.success('Banner adicionado', 'O banner foi cadastrado com sucesso')
    } catch (error: any) {
      console.error('Error adding banner:', error)
      notify.error('Erro', 'Não foi possível adicionar o banner')
    } finally {
      setAddingBanner(false)
    }
  }

  async function handleDeleteBanner(id: string) {
    try {
      const updatedBanners = banners.filter(b => b.id !== id)
      setBanners(updatedBanners)
      await api.updateAdminSettings({ banners: updatedBanners })
      notify.success('Banner removido', 'O banner foi excluído com sucesso')
    } catch (error: any) {
      console.error('Error deleting banner:', error)
      notify.error('Erro', 'Não foi possível remover o banner')
    }
  }

  async function handleReorderBanner(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= banners.length) return

    const updatedBanners = [...banners]
    const [movedBanner] = updatedBanners.splice(index, 1)
    updatedBanners.splice(newIndex, 0, movedBanner)
    
    // Update order property
    updatedBanners.forEach((banner, idx) => {
      banner.order = idx
    })

    setBanners(updatedBanners)
    
    try {
      await api.updateAdminSettings({ banners: updatedBanners })
      notify.success('Ordem atualizada', 'A ordem dos banners foi alterada')
    } catch (error: any) {
      console.error('Error reordering banners:', error)
      notify.error('Erro', 'Não foi possível atualizar a ordem')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <Card className="w-full max-w-md">
          <CardContent className="py-16 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !googleAdsCode && banners.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Apenas administradores podem acessar esta página</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            Painel de Administração
          </h1>
          <p className="text-muted-foreground">
            Gerencie configurações, estatísticas e conteúdo do sistema
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Code className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <Image className="w-4 h-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="adminManagement" className="gap-2">
              <UserCog className="w-4 h-4" />
              Gerenciamento de Admins
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {statsLoading ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Carregando estatísticas...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* System Stats */}
                {systemStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total de Usuários</CardDescription>
                        <CardTitle className="text-3xl">{systemStats.totalUsers}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Pais Cadastrados</CardDescription>
                        <CardTitle className="text-3xl text-blue-600">{systemStats.totalParents}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Profissionais</CardDescription>
                        <CardTitle className="text-3xl text-green-600">{systemStats.totalProfessionals}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Crianças Cadastradas</CardDescription>
                        <CardTitle className="text-3xl text-purple-600">{systemStats.totalChildren}</CardTitle>
                      </CardHeader>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardDescription>Total de Eventos</CardDescription>
                        <CardTitle className="text-3xl text-orange-600">{systemStats.totalEvents}</CardTitle>
                      </CardHeader>
                    </Card>
                  </div>
                )}

                {/* User Stats Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UsersIcon className="w-5 h-5" />
                      Usuários Cadastrados
                    </CardTitle>
                    <CardDescription>
                      Lista completa de usuários e suas atividades no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Cadastros</TableHead>
                            <TableHead>Data de Entrada</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userStats.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground">
                                Nenhum usuário cadastrado ainda
                              </TableCell>
                            </TableRow>
                          ) : (
                            userStats.map((user, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant={user.userType === 'parent' ? 'default' : 'secondary'}>
                                    {user.userType === 'parent' ? 'Pai/Mãe' : 'Profissional'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">{user.registrationCount}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(user.joinedAt).toLocaleDateString('pt-BR')}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Google Ads
                  </CardTitle>
                  <CardDescription>
                    Configure códigos de rastreamento e parâmetros de segmentação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="googleAdsCode">Código de Rastreamento</Label>
                    <Textarea
                      id="googleAdsCode"
                      value={googleAdsCode}
                      onChange={(e) => setGoogleAdsCode(e.target.value)}
                      placeholder="<!-- Google Ads Code -->"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole o código JavaScript fornecido pelo Google Ads
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="googleAdsSegmentation">Parâmetros de Segmentação</Label>
                    <Textarea
                      id="googleAdsSegmentation"
                      value={googleAdsSegmentation}
                      onChange={(e) => setGoogleAdsSegmentation(e.target.value)}
                      placeholder="Palavras-chave, público-alvo, localização..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Defina palavras-chave, público-alvo e outros parâmetros de segmentação
                    </p>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Configurações'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-6">
            {/* Add Banner Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Adicionar Novo Banner
                </CardTitle>
                <CardDescription>
                  Cadastre banners para exibição em carrossel no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bannerTitle">Título (opcional)</Label>
                    <Input
                      id="bannerTitle"
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="Nome do banner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bannerUrl">URL da Imagem *</Label>
                    <Input
                      id="bannerUrl"
                      type="url"
                      value={newBannerUrl}
                      onChange={(e) => setNewBannerUrl(e.target.value)}
                      placeholder="https://exemplo.com/banner.png"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerLink">Link de Destino (opcional)</Label>
                  <Input
                    id="bannerLink"
                    type="url"
                    value={newBannerLink}
                    onChange={(e) => setNewBannerLink(e.target.value)}
                    placeholder="https://exemplo.com/contato"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL para onde o usuário será redirecionado ao clicar no banner
                  </p>
                </div>

                {newBannerUrl && (
                  <div className="p-4 bg-muted rounded-lg">
                    <Label className="mb-2 block">Pré-visualização:</Label>
                    <img
                      src={newBannerUrl}
                      alt="Preview"
                      className="w-full max-w-2xl rounded-lg border shadow-sm"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="100"%3E%3Crect fill="%23ddd" width="400" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImagem não encontrada%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddBanner}
                  disabled={addingBanner || !newBannerUrl.trim()}
                  className="w-full"
                >
                  {addingBanner ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Banner
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Banners List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Banners Cadastrados ({banners.length})
                </CardTitle>
                <CardDescription>
                  {banners.length > 0
                    ? 'Gerencie a ordem e visualize os banners cadastrados'
                    : 'Nenhum banner cadastrado. Adicione banners para criar um carrossel dinâmico.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {banners.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Nenhum banner cadastrado ainda</p>
                    <p className="text-sm mt-2">
                      Adicione banners acima para criar um carrossel dinâmico
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner, index) => (
                      <div
                        key={banner.id}
                        className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                      >
                        <img
                          src={banner.imageUrl}
                          alt={banner.title || `Banner ${index + 1}`}
                          className="w-32 h-20 object-cover rounded border"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="80"%3E%3Crect fill="%23ddd" width="128" height="80"/%3E%3C/svg%3E'
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {banner.title || `Banner ${index + 1}`}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {banner.link || 'Sem link'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorderBanner(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorderBanner(index, 'down')}
                            disabled={index === banners.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Management Tab */}
          <TabsContent value="adminManagement" className="space-y-6">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
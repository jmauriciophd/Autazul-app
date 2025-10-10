import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { notify, messages } from '../utils/notifications'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Settings, Image, Code, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from './ui/alert'

export function AdminPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [googleAdsCode, setGoogleAdsCode] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [bannerLink, setBannerLink] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const { settings } = await api.getAdminSettings()
      setGoogleAdsCode(settings.googleAdsCode || '')
      setBannerUrl(settings.bannerUrl || '')
      setBannerLink(settings.bannerLink || '')
    } catch (error: any) {
      console.error('Error loading admin settings:', error)
      setError('Erro ao carregar configurações. Você tem permissão de administrador?')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    
    try {
      await api.updateAdminSettings({
        googleAdsCode,
        bannerUrl,
        bannerLink
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

  if (error && !googleAdsCode && !bannerUrl) {
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 mb-2">
            <Settings className="w-8 h-8 text-purple-600" />
            Painel de Administração
          </h1>
          <p className="text-muted-foreground">
            Configure anúncios e banners para exibição no sistema
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Google Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Google Ads
              </CardTitle>
              <CardDescription>
                Cole o código do Google Ads para exibir anúncios no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleAdsCode">Código Google Ads</Label>
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
            </CardContent>
          </Card>

          {/* Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Banner Publicitário
              </CardTitle>
              <CardDescription>
                Configure um banner para profissionais divulgarem seus serviços
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bannerUrl">URL da Imagem do Banner</Label>
                <Input
                  id="bannerUrl"
                  type="url"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://exemplo.com/banner.png"
                />
                <p className="text-xs text-muted-foreground">
                  Imagem em formato PNG ou JPG
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bannerLink">Link do Banner (opcional)</Label>
                <Input
                  id="bannerLink"
                  type="url"
                  value={bannerLink}
                  onChange={(e) => setBannerLink(e.target.value)}
                  placeholder="https://exemplo.com/contato"
                />
                <p className="text-xs text-muted-foreground">
                  Link para onde o usuário será redirecionado ao clicar no banner
                </p>
              </div>

              {bannerUrl && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <Label className="mb-2 block">Pré-visualização:</Label>
                  <img
                    src={bannerUrl}
                    alt="Banner preview"
                    className="w-full max-w-2xl rounded-lg border shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="100"%3E%3Crect fill="%23ddd" width="400" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImagem não encontrada%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

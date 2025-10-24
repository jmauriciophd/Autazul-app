import { useState } from 'react'
import { api } from '../utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { ScrollArea } from './ui/scroll-area'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Shield, Download, Trash2, XCircle, FileText, Eye, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Alert, AlertDescription } from './ui/alert'

export function LGPDPanel() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState('')
  const [termsContent, setTermsContent] = useState('')
  const [showDeletionDialog, setShowDeletionDialog] = useState(false)
  const [showOppositionDialog, setShowOppositionDialog] = useState(false)
  const [deletionReason, setDeletionReason] = useState('')
  const [oppositionDataType, setOppositionDataType] = useState('')
  const [oppositionReason, setOppositionReason] = useState('')

  async function handleExportData() {
    setLoading(true)
    try {
      const response = await api.exportUserData()
      
      // Create a downloadable JSON file
      const dataStr = JSON.stringify(response.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `autazul-meus-dados-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Dados exportados com sucesso!')
    } catch (error: any) {
      console.error('Error exporting data:', error)
      toast.error(error.message || 'Erro ao exportar dados')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestDeletion() {
    if (!deletionReason.trim()) {
      toast.error('Por favor, informe o motivo da solicitação')
      return
    }
    
    setLoading(true)
    try {
      const response = await api.requestAccountDeletion(deletionReason)
      toast.success(response.message || 'Solicitação enviada com sucesso')
      setShowDeletionDialog(false)
      setDeletionReason('')
    } catch (error: any) {
      console.error('Error requesting deletion:', error)
      toast.error(error.message || 'Erro ao solicitar exclusão')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestOpposition() {
    if (!oppositionDataType || !oppositionReason.trim()) {
      toast.error('Por favor, preencha todos os campos')
      return
    }
    
    setLoading(true)
    try {
      const response = await api.requestDataOpposition(oppositionDataType, oppositionReason)
      toast.success(response.message || 'Solicitação enviada com sucesso')
      setShowOppositionDialog(false)
      setOppositionDataType('')
      setOppositionReason('')
    } catch (error: any) {
      console.error('Error requesting opposition:', error)
      toast.error(error.message || 'Erro ao solicitar oposição')
    } finally {
      setLoading(false)
    }
  }

  async function handleViewPrivacyPolicy() {
    setLoading(true)
    try {
      const response = await api.getPrivacyPolicy()
      setPrivacyPolicyContent(response.privacyPolicy)
      setShowPrivacyPolicy(true)
    } catch (error: any) {
      console.error('Error fetching privacy policy:', error)
      toast.error('Erro ao carregar política de privacidade')
    } finally {
      setLoading(false)
    }
  }

  async function handleViewTerms() {
    setLoading(true)
    try {
      const response = await api.getTerms()
      setTermsContent(response.terms)
      setShowTerms(true)
    } catch (error: any) {
      console.error('Error fetching terms:', error)
      toast.error('Erro ao carregar termos de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8" style={{ color: '#15C3D6' }} />
        <div>
          <h2 className="text-2xl" style={{ color: '#373737' }}>Privacidade e Dados</h2>
          <p className="text-sm" style={{ color: '#5C8599' }}>
            Gerencie seus dados pessoais e direitos LGPD
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="rights">Meus Direitos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seus Direitos LGPD</CardTitle>
              <CardDescription>
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                  <Eye className="w-5 h-5 mt-0.5" style={{ color: '#15C3D6' }} />
                  <div>
                    <h4 className="font-semibold" style={{ color: '#373737' }}>Confirmação e Acesso</h4>
                    <p className="text-sm" style={{ color: '#5C8599' }}>
                      Confirmar a existência de tratamento e acessar seus dados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                  <Download className="w-5 h-5 mt-0.5" style={{ color: '#15C3D6' }} />
                  <div>
                    <h4 className="font-semibold" style={{ color: '#373737' }}>Portabilidade</h4>
                    <p className="text-sm" style={{ color: '#5C8599' }}>
                      Exportar seus dados em formato legível
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                  <Trash2 className="w-5 h-5 mt-0.5" style={{ color: '#15C3D6' }} />
                  <div>
                    <h4 className="font-semibold" style={{ color: '#373737' }}>Eliminação</h4>
                    <p className="text-sm" style={{ color: '#5C8599' }}>
                      Solicitar a exclusão de seus dados
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                  <XCircle className="w-5 h-5 mt-0.5" style={{ color: '#15C3D6' }} />
                  <div>
                    <h4 className="font-semibold" style={{ color: '#373737' }}>Oposição</h4>
                    <p className="text-sm" style={{ color: '#5C8599' }}>
                      Opor-se ao tratamento de dados em situações específicas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              Seus dados estão protegidos por criptografia e controles de acesso rigorosos. 
              Apenas você e as pessoas que você autorizar podem acessar informações sobre seus filhos.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="rights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Meus Dados</CardTitle>
              <CardDescription>
                Baixe uma cópia de todos os seus dados em formato JSON
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExportData} 
                disabled={loading}
                className="text-white"
                style={{ backgroundColor: '#15C3D6' }}
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Exportando...' : 'Exportar Dados'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitar Exclusão de Conta</CardTitle>
              <CardDescription>
                Solicite a exclusão permanente de sua conta e todos os dados associados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Esta ação é irreversível. Todos os seus dados, incluindo informações sobre seus filhos e eventos registrados, serão permanentemente excluídos.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => setShowDeletionDialog(true)}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Solicitar Exclusão
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oposição ao Tratamento</CardTitle>
              <CardDescription>
                Solicite a interrupção do tratamento de tipos específicos de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowOppositionDialog(true)}
                variant="outline"
                style={{ borderColor: '#15C3D6', color: '#15C3D6' }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Solicitar Oposição
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Política de Privacidade</CardTitle>
              <CardDescription>
                Leia nossa política completa de privacidade e proteção de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleViewPrivacyPolicy}
                disabled={loading}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Política de Privacidade
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termos de Serviço</CardTitle>
              <CardDescription>
                Leia os termos e condições de uso da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleViewTerms}
                disabled={loading}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Ver Termos de Serviço
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deletion Request Dialog */}
      <Dialog open={showDeletionDialog} onOpenChange={setShowDeletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Exclusão de Conta</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da solicitação. Esta solicitação será analisada por nossa equipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">Motivo da Exclusão</Label>
              <Textarea
                id="deletion-reason"
                placeholder="Explique por que deseja excluir sua conta..."
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeletionDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleRequestDeletion}
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Opposition Request Dialog */}
      <Dialog open={showOppositionDialog} onOpenChange={setShowOppositionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar Oposição ao Tratamento</DialogTitle>
            <DialogDescription>
              Informe qual tipo de dado você deseja que pare de ser tratado e o motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="data-type">Tipo de Dado</Label>
              <Select value={oppositionDataType} onValueChange={setOppositionDataType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de dado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Eventos e Registros</SelectItem>
                  <SelectItem value="photos">Fotos</SelectItem>
                  <SelectItem value="sharing">Compartilhamentos</SelectItem>
                  <SelectItem value="communications">Comunicações</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opposition-reason">Motivo da Oposição</Label>
              <Textarea
                id="opposition-reason"
                placeholder="Explique por que deseja opor-se ao tratamento deste tipo de dado..."
                value={oppositionReason}
                onChange={(e) => setOppositionReason(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowOppositionDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleRequestOpposition}
                disabled={loading}
                style={{ backgroundColor: '#15C3D6', color: 'white' }}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Política de Privacidade</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: '#373737' }}>
                {privacyPolicyContent}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Terms Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Termos de Serviço</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: '#373737' }}>
                {termsContent}
              </pre>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

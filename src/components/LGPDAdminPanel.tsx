import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Shield, FileText, AlertTriangle, Download, Activity, Database, Eye, UserCog, Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'

export function LGPDAdminPanel() {
  const [activeTab, setActiveTab] = useState('requests')
  const [loading, setLoading] = useState(false)
  const [deletionRequests, setDeletionRequests] = useState<any[]>([])
  const [oppositionRequests, setOppositionRequests] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [privacyPolicy, setPrivacyPolicy] = useState('')
  const [terms, setTerms] = useState('')
  const [editingPolicy, setEditingPolicy] = useState(false)
  const [editingTerms, setEditingTerms] = useState(false)
  const [showLogsDialog, setShowLogsDialog] = useState(false)

  useEffect(() => {
    if (activeTab === 'requests') {
      loadRequests()
    } else if (activeTab === 'documents') {
      loadDocuments()
    } else if (activeTab === 'monitoring') {
      loadMonitoring()
    } else if (activeTab === 'audit') {
      loadAuditLogs()
    }
  }, [activeTab])

  async function loadRequests() {
    setLoading(true)
    try {
      const [deletionRes, oppositionRes] = await Promise.all([
        api.getDeletionRequests(),
        api.getOppositionRequests()
      ])
      setDeletionRequests(deletionRes.requests || [])
      setOppositionRequests(oppositionRes.requests || [])
    } catch (error: any) {
      console.error('Error loading requests:', error)
      toast.error('Erro ao carregar solicitações')
    } finally {
      setLoading(false)
    }
  }

  async function loadDocuments() {
    setLoading(true)
    try {
      const [policyRes, termsRes] = await Promise.all([
        api.getPrivacyPolicy(),
        api.getTerms()
      ])
      setPrivacyPolicy(policyRes.privacyPolicy || '')
      setTerms(termsRes.terms || '')
    } catch (error: any) {
      console.error('Error loading documents:', error)
      toast.error('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  async function loadMonitoring() {
    setLoading(true)
    try {
      const healthRes = await api.getSystemHealth()
      setSystemHealth(healthRes)
    } catch (error: any) {
      console.error('Error loading system health:', error)
      toast.error('Erro ao carregar monitoramento')
    } finally {
      setLoading(false)
    }
  }

  async function loadAuditLogs() {
    setLoading(true)
    try {
      const logsRes = await api.getAuditLogs()
      setAuditLogs(logsRes.logs || [])
    } catch (error: any) {
      console.error('Error loading audit logs:', error)
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproveDeletion(requestId: string) {
    if (!confirm('Tem certeza que deseja aprovar esta exclusão? Esta ação é irreversível.')) {
      return
    }

    setLoading(true)
    try {
      await api.approveDeletionRequest(requestId)
      toast.success('Conta excluída com sucesso')
      loadRequests()
    } catch (error: any) {
      console.error('Error approving deletion:', error)
      toast.error(error.message || 'Erro ao aprovar exclusão')
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePrivacyPolicy() {
    setLoading(true)
    try {
      await api.updatePrivacyPolicy(privacyPolicy)
      toast.success('Política de privacidade atualizada')
      setEditingPolicy(false)
    } catch (error: any) {
      console.error('Error updating privacy policy:', error)
      toast.error('Erro ao atualizar política')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveTerms() {
    setLoading(true)
    try {
      await api.updateTerms(terms)
      toast.success('Termos de serviço atualizados')
      setEditingTerms(false)
    } catch (error: any) {
      console.error('Error updating terms:', error)
      toast.error('Erro ao atualizar termos')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadBackup() {
    setLoading(true)
    try {
      const response = await api.getSystemBackup()
      
      const dataStr = JSON.stringify(response.backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `autazul-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Backup baixado com sucesso')
    } catch (error: any) {
      console.error('Error downloading backup:', error)
      toast.error('Erro ao baixar backup')
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8" style={{ color: '#15C3D6' }} />
        <div>
          <h2 className="text-2xl" style={{ color: '#373737' }}>LGPD e Conformidade</h2>
          <p className="text-sm" style={{ color: '#5C8599' }}>
            Gestão de privacidade, solicitações e auditoria
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Solicitações</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Solicitações de Exclusão</span>
                <Badge variant="secondary">{deletionRequests.length}</Badge>
              </CardTitle>
              <CardDescription>
                Solicitações pendentes de exclusão de conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>Carregando...</p>
              ) : deletionRequests.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>
                  Nenhuma solicitação pendente
                </p>
              ) : (
                <div className="space-y-4">
                  {deletionRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border rounded-lg p-4 space-y-2"
                      style={{ borderColor: '#BDBCBC' }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold" style={{ color: '#373737' }}>
                            {request.userName || request.userEmail}
                          </h4>
                          <p className="text-sm" style={{ color: '#5C8599' }}>
                            {request.userEmail}
                          </p>
                        </div>
                        <Badge 
                          variant={request.status === 'pending' ? 'default' : 'secondary'}
                          style={request.status === 'pending' ? { backgroundColor: '#FFA500' } : {}}
                        >
                          {request.status === 'pending' ? 'Pendente' : request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm" style={{ color: '#373737' }}>
                          <strong>Motivo:</strong> {request.reason || 'Não informado'}
                        </p>
                        <p className="text-sm" style={{ color: '#5C8599' }}>
                          Solicitado em: {formatDate(request.createdAt)}
                        </p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleApproveDeletion(request.id)}
                            disabled={loading}
                            variant="destructive"
                            size="sm"
                          >
                            Aprovar Exclusão
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Solicitações de Oposição</span>
                <Badge variant="secondary">{oppositionRequests.length}</Badge>
              </CardTitle>
              <CardDescription>
                Solicitações de oposição ao tratamento de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>Carregando...</p>
              ) : oppositionRequests.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>
                  Nenhuma solicitação pendente
                </p>
              ) : (
                <div className="space-y-4">
                  {oppositionRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="border rounded-lg p-4 space-y-2"
                      style={{ borderColor: '#BDBCBC' }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold" style={{ color: '#373737' }}>
                            {request.userName || request.userEmail}
                          </h4>
                          <p className="text-sm" style={{ color: '#5C8599' }}>
                            {request.userEmail}
                          </p>
                        </div>
                        <Badge 
                          variant={request.status === 'pending' ? 'default' : 'secondary'}
                          style={request.status === 'pending' ? { backgroundColor: '#FFA500' } : {}}
                        >
                          {request.status === 'pending' ? 'Pendente' : request.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm" style={{ color: '#373737' }}>
                          <strong>Tipo de Dado:</strong> {request.dataType}
                        </p>
                        <p className="text-sm" style={{ color: '#373737' }}>
                          <strong>Motivo:</strong> {request.reason || 'Não informado'}
                        </p>
                        <p className="text-sm" style={{ color: '#5C8599' }}>
                          Solicitado em: {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Política de Privacidade</span>
                <Button
                  onClick={() => setEditingPolicy(!editingPolicy)}
                  variant="outline"
                  size="sm"
                >
                  {editingPolicy ? 'Cancelar' : 'Editar'}
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie a política de privacidade exibida aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingPolicy ? (
                <>
                  <Textarea
                    value={privacyPolicy}
                    onChange={(e) => setPrivacyPolicy(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleSavePrivacyPolicy}
                    disabled={loading}
                    className="text-white"
                    style={{ backgroundColor: '#15C3D6' }}
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </>
              ) : (
                <ScrollArea className="h-[400px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: '#373737' }}>
                    {privacyPolicy}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Termos de Serviço</span>
                <Button
                  onClick={() => setEditingTerms(!editingTerms)}
                  variant="outline"
                  size="sm"
                >
                  {editingTerms ? 'Cancelar' : 'Editar'}
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie os termos de serviço exibidos aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingTerms ? (
                <>
                  <Textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleSaveTerms}
                    disabled={loading}
                    className="text-white"
                    style={{ backgroundColor: '#15C3D6' }}
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </>
              ) : (
                <ScrollArea className="h-[400px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: '#373737' }}>
                    {terms}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Logs de Auditoria</span>
                <Button
                  onClick={() => setShowLogsDialog(true)}
                  variant="outline"
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalhes
                </Button>
              </CardTitle>
              <CardDescription>
                Histórico de ações administrativas e eventos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>Carregando...</p>
              ) : auditLogs.length === 0 ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>
                  Nenhum log de auditoria disponível
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm" style={{ color: '#5C8599' }}>
                    Total de logs: <strong>{auditLogs.length}</strong>
                  </p>
                  <div className="space-y-2">
                    {auditLogs.slice(0, 10).map((log, index) => (
                      <div 
                        key={index}
                        className="text-sm p-2 rounded"
                        style={{ backgroundColor: '#F5F8FA', color: '#373737' }}
                      >
                        <span className="font-mono text-xs" style={{ color: '#5C8599' }}>
                          {formatDate(log.timestamp)}
                        </span>
                        {' - '}
                        <span className="font-semibold">{log.action}</span>
                        {log.details && (
                          <span style={{ color: '#5C8599' }}>
                            {' '}({typeof log.details === 'string' ? log.details : JSON.stringify(log.details)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {auditLogs.length > 10 && (
                    <p className="text-sm text-center pt-2" style={{ color: '#5C8599' }}>
                      Exibindo 10 de {auditLogs.length} logs
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saúde do Sistema</CardTitle>
              <CardDescription>
                Status e métricas do sistema em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>Carregando...</p>
              ) : systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" style={{ color: '#15C3D6' }} />
                    <div>
                      <p className="text-sm" style={{ color: '#5C8599' }}>Status do Sistema</p>
                      <Badge 
                        style={{ 
                          backgroundColor: systemHealth.status === 'healthy' ? '#10b981' : '#ef4444',
                          color: 'white'
                        }}
                      >
                        {systemHealth.status === 'healthy' ? 'Saudável' : 'Com Problemas'}
                      </Badge>
                    </div>
                  </div>

                  {systemHealth.database && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                        <p className="text-sm" style={{ color: '#5C8599' }}>Usuários</p>
                        <p className="text-2xl" style={{ color: '#373737' }}>
                          {systemHealth.database.counts?.users || 0}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                        <p className="text-sm" style={{ color: '#5C8599' }}>Crianças</p>
                        <p className="text-2xl" style={{ color: '#373737' }}>
                          {systemHealth.database.counts?.children || 0}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                        <p className="text-sm" style={{ color: '#5C8599' }}>Eventos</p>
                        <p className="text-2xl" style={{ color: '#373737' }}>
                          {systemHealth.database.counts?.events || 0}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#F5F8FA' }}>
                        <p className="text-sm" style={{ color: '#5C8599' }}>Notificações</p>
                        <p className="text-2xl" style={{ color: '#373737' }}>
                          {systemHealth.database.counts?.notifications || 0}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center py-8" style={{ color: '#5C8599' }}>
                  Dados não disponíveis
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup do Sistema</CardTitle>
              <CardDescription>
                Gerar e baixar backup completo do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8" style={{ color: '#15C3D6' }} />
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#373737' }}>
                    Faça backup regular de todos os dados do sistema para garantir a segurança e conformidade.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownloadBackup}
                disabled={loading}
                className="mt-4 text-white"
                style={{ backgroundColor: '#15C3D6' }}
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Gerando...' : 'Baixar Backup'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs de Auditoria Completos</DialogTitle>
            <DialogDescription>
              Visualize todos os logs de auditoria do sistema
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {auditLogs.map((log, index) => (
                <div 
                  key={index}
                  className="text-sm p-3 rounded border"
                  style={{ borderColor: '#BDBCBC', backgroundColor: '#F5F8FA' }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-mono text-xs" style={{ color: '#5C8599' }}>
                      {formatDate(log.timestamp)}
                    </span>
                    <Badge variant="outline">{log.action}</Badge>
                  </div>
                  {log.details && (
                    <pre className="text-xs mt-2 whitespace-pre-wrap" style={{ color: '#373737' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
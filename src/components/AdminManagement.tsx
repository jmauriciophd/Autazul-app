import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { UserCog, Mail, Trash2, Plus, Send } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { Alert, AlertDescription } from './ui/alert'

export function AdminManagement() {
  const [loading, setLoading] = useState(false)
  const [admins, setAdmins] = useState<string[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  
  // System Update Notification
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState('feature')
  
  useEffect(() => {
    loadAdmins()
  }, [])
  
  async function loadAdmins() {
    setLoading(true)
    try {
      const response = await api.getAdminList()
      setAdmins(response.admins || [])
    } catch (error: any) {
      console.error('Error loading admins:', error)
      toast.error('Erro ao carregar lista de administradores')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleAddAdmin() {
    if (!newAdminEmail.trim()) {
      toast.error('Por favor, informe um email válido')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Por favor, informe um email válido')
      return
    }
    
    setLoading(true)
    try {
      const response = await api.addAdmin(newAdminEmail.toLowerCase().trim())
      toast.success(response.message || 'Administrador adicionado com sucesso')
      setNewAdminEmail('')
      loadAdmins()
    } catch (error: any) {
      console.error('Error adding admin:', error)
      toast.error(error.message || 'Erro ao adicionar administrador')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleRemoveAdmin(email: string) {
    if (!confirm(`Tem certeza que deseja remover ${email} como administrador?`)) {
      return
    }
    
    setLoading(true)
    try {
      const response = await api.removeAdmin(email)
      toast.success(response.message || 'Administrador removido com sucesso')
      loadAdmins()
    } catch (error: any) {
      console.error('Error removing admin:', error)
      toast.error(error.message || 'Erro ao remover administrador')
    } finally {
      setLoading(false)
    }
  }
  
  async function handleSendNotification() {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Por favor, preencha o título e a mensagem')
      return
    }
    
    setLoading(true)
    try {
      const response = await api.sendSystemUpdateNotification(
        notificationTitle,
        notificationMessage,
        notificationType
      )
      toast.success(response.message || 'Notificação enviada para todos os usuários!')
      setNotificationTitle('')
      setNotificationMessage('')
      setNotificationType('feature')
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast.error(error.message || 'Erro ao enviar notificação')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Admin Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-6 h-6" style={{ color: '#15C3D6' }} />
            Gerenciamento de Administradores
          </CardTitle>
          <CardDescription>
            Adicione ou remova usuários com privilégios administrativos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Admins List */}
          <div className="space-y-3">
            <Label>Administradores Atuais</Label>
            {loading ? (
              <p className="text-sm" style={{ color: '#5C8599' }}>Carregando...</p>
            ) : admins.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nenhum administrador adicional configurado. Apenas os administradores padrão do sistema têm acesso.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {admins.map((email) => (
                  <div 
                    key={email}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    style={{ borderColor: '#BDBCBC', backgroundColor: '#F5F8FA' }}
                  >
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: '#15C3D6', color: 'white' }}>
                        Admin
                      </Badge>
                      <span className="text-sm" style={{ color: '#373737' }}>{email}</span>
                    </div>
                    <Button
                      onClick={() => handleRemoveAdmin(email)}
                      disabled={loading}
                      variant="ghost"
                      size="sm"
                      style={{ color: '#EF4444' }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add New Admin */}
          <div className="space-y-3">
            <Label htmlFor="admin-email">Adicionar Novo Administrador</Label>
            <div className="flex gap-2">
              <Input
                id="admin-email"
                type="email"
                placeholder="email@exemplo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAdmin()}
              />
              <Button
                onClick={handleAddAdmin}
                disabled={loading}
                className="text-white"
                style={{ backgroundColor: '#15C3D6' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs" style={{ color: '#5C8599' }}>
              O usuário precisa estar cadastrado no sistema para se tornar administrador
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* System Update Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-6 h-6" style={{ color: '#15C3D6' }} />
            Notificações de Atualização do Sistema
          </CardTitle>
          <CardDescription>
            Envie notificações por email para todos os usuários sobre atualizações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Esta funcionalidade enviará um email para todos os usuários cadastrados no sistema informando sobre alterações e novidades.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="notification-type">Tipo de Atualização</Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">Nova Funcionalidade</SelectItem>
                <SelectItem value="improvement">Melhoria</SelectItem>
                <SelectItem value="bugfix">Correção de Bugs</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
                <SelectItem value="policy">Política/Termos</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-title">Título da Notificação</Label>
            <Input
              id="notification-title"
              placeholder="Ex: Nova funcionalidade de relatórios"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-message">Mensagem</Label>
            <Textarea
              id="notification-message"
              placeholder="Descreva as mudanças realizadas no sistema..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              rows={6}
            />
          </div>
          
          <Button
            onClick={handleSendNotification}
            disabled={loading || !notificationTitle.trim() || !notificationMessage.trim()}
            className="w-full text-white"
            style={{ backgroundColor: '#15C3D6' }}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar Notificação para Todos os Usuários'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

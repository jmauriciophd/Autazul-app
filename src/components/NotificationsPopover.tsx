import { useState, useEffect } from 'react'
import { api } from '../utils/api'
import { notify } from '../utils/notifications'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Bell, Check, CheckCheck, UserPlus, X } from 'lucide-react'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'

interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  relatedId?: string
  read: boolean
  createdAt: string
  readAt?: string
}

interface Invitation {
  id: string
  type: 'professional_invite' | 'coparent_invite' | 'child_share_invite'
  fromUserId: string
  fromUserName: string
  toUserId: string
  childId: string
  childName: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    console.log('🚀 NotificationsPopover montado - iniciando carregamento')
    loadNotifications()
    loadInvitations()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Atualizando notificações (auto-refresh 30s)')
      loadNotifications()
      loadInvitations()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    const pending = invitations.filter(i => i.status === 'pending').length
    setUnreadCount(unread + pending)
  }, [notifications, invitations])

  async function loadNotifications() {
    try {
      console.log('🔔 Carregando notificações...')
      const { notifications: data } = await api.getNotifications()
      console.log('✅ Notificações carregadas:', data?.length || 0)
      setNotifications(data || [])
    } catch (error) {
      console.error('❌ Error loading notifications:', error)
    }
  }

  async function loadInvitations() {
    try {
      console.log('📬 Carregando convites...')
      const { invitations: data } = await api.getPendingInvitations()
      console.log('✅ Convites carregados:', data?.length || 0)
      console.log('Convites:', data)
      setInvitations(data || [])
    } catch (error) {
      console.error('❌ Error loading invitations:', error)
    }
  }

  async function handleAcceptInvitation(invitationId: string, invitationType: string) {
    setProcessingInvite(invitationId)
    try {
      if (invitationType === 'child_share_invite') {
        await api.acceptChildShare(invitationId)
      } else {
        await api.acceptInvitation(invitationId)
      }
      notify.success('Convite aceito!', 'Você agora tem acesso às informações')
      await loadInvitations()
      // Reload page to show new child
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      notify.error('Erro ao aceitar convite', error?.error || 'Tente novamente')
    } finally {
      setProcessingInvite(null)
    }
  }

  async function handleRejectInvitation(invitationId: string, invitationType: string) {
    setProcessingInvite(invitationId)
    try {
      if (invitationType === 'child_share_invite') {
        await api.rejectChildShare(invitationId)
      } else {
        await api.rejectInvitation(invitationId)
      }
      notify.success('Convite recusado')
      await loadInvitations()
    } catch (error: any) {
      console.error('Error rejecting invitation:', error)
      notify.error('Erro ao recusar convite', error?.error || 'Tente novamente')
    } finally {
      setProcessingInvite(null)
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await api.markNotificationAsRead(notificationId)
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      await api.markAllNotificationsAsRead()
      setNotifications(notifications.map(n => ({ 
        ...n, 
        read: true, 
        readAt: new Date().toISOString() 
      })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" style={{ color: '#5C8599' }} />
          {unreadCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-white text-xs"
              style={{ backgroundColor: '#15C3D6' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[440px] sm:max-w-[440px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b flex-row items-center justify-between space-y-0">
          <SheetTitle style={{ color: '#5C8599' }}>
            Notificações
          </SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </SheetHeader>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 && invitations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {/* Pending Invitations */}
              {invitations.filter(i => i.status === 'pending').map((invitation) => (
                <div
                  key={invitation.id}
                  className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-l-4 border-blue-500"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <UserPlus className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm" style={{ color: '#5C8599' }}>
                          {invitation.type === 'professional_invite' 
                            ? '💼 Novo Convite Profissional' 
                            : invitation.type === 'coparent_invite'
                            ? '👨‍👩‍👧 Convite de Co-Responsável'
                            : '👶 Filho Compartilhado'}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>{invitation.fromUserName}</strong> 
                        {invitation.type === 'child_share_invite'
                          ? ` compartilhou `
                          : ` convidou você para acompanhar `}
                        <strong>{invitation.childName}</strong>
                        {invitation.type === 'child_share_invite' && (
                          <span className="block text-xs mt-1 text-muted-foreground">
                            (Acesso de visualização apenas)
                          </span>
                        )}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptInvitation(invitation.id, invitation.type)}
                          disabled={processingInvite === invitation.id}
                          className="flex-1"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {processingInvite === invitation.id ? 'Aceitando...' : 'Aceitar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectInvitation(invitation.id, invitation.type)}
                          disabled={processingInvite === invitation.id}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Recusar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Notifications */}
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm truncate" style={{ color: '#5C8599' }}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#15C3D6' }} />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </p>
                        {notification.read && notification.readAt && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            Lida
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
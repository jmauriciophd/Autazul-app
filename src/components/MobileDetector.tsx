import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { 
  detectDevice, 
  shouldShowPrompt, 
  markPromptAsShown, 
  hasUserDeniedPermissions,
  markPermissionDenied,
  supportsNotifications 
} from '../utils/deviceDetection'
import { 
  requestNotificationPermission, 
  registerServiceWorker,
  sendTestNotification,
  areNotificationsEnabled 
} from '../utils/pushNotifications'
import { 
  Smartphone, 
  Bell, 
  Download, 
  CheckCircle, 
  XCircle, 
  Info,
  Share,
  Plus
} from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function MobileDetector() {
  const [deviceInfo, setDeviceInfo] = useState(detectDevice())
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [installStatus, setInstallStatus] = useState<'pending' | 'installed' | 'dismissed'>('pending')

  useEffect(() => {
    const info = detectDevice()
    setDeviceInfo(info)

    // Registra o service worker de forma condicional
    if ('serviceWorker' in navigator && info.isMobile) {
      registerServiceWorker().catch(err => {
        console.warn('Falha ao registrar Service Worker (continuando sem cache offline):', err)
      })
    }

    // Se não for mobile, não faz nada
    if (!info.isMobile) {
      return
    }

    // Se já está instalado, não mostra prompts de instalação
    if (info.isStandalone) {
      setInstallStatus('installed')
      // Mas ainda pode mostrar notificações
      checkNotificationPrompt()
      return
    }

    // Detecta o evento de instalação (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const installEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(installEvent)
      
      // Mostra o prompt de instalação se não foi mostrado antes
      if (shouldShowPrompt('install') && !hasUserDeniedPermissions('install')) {
        // Aguarda 3 segundos após carregar a página
        setTimeout(() => {
          setShowInstallPrompt(true)
        }, 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Para iOS Safari, mostra instruções manuais
    if (info.isIOS && !info.isStandalone) {
      if (shouldShowPrompt('install') && !hasUserDeniedPermissions('install')) {
        setTimeout(() => {
          setShowIOSInstructions(true)
        }, 3000)
      }
    }

    // Detecta quando o app foi instalado
    window.addEventListener('appinstalled', () => {
      console.log('PWA instalado com sucesso!')
      setInstallStatus('installed')
      setShowInstallPrompt(false)
      setShowIOSInstructions(false)
      // Agora pode mostrar o prompt de notificações
      checkNotificationPrompt()
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const checkNotificationPrompt = () => {
    if (!supportsNotifications()) {
      return
    }

    // Se já tem permissão, não mostra
    if (areNotificationsEnabled()) {
      setNotificationStatus('granted')
      return
    }

    // Se deve mostrar o prompt
    if (shouldShowPrompt('notifications') && !hasUserDeniedPermissions('notifications')) {
      // Aguarda 5 segundos para não ser intrusivo
      setTimeout(() => {
        setShowNotificationPrompt(true)
      }, 5000)
    }
  }

  const handleNotificationRequest = async () => {
    try {
      const permission = await requestNotificationPermission()
      
      if (permission === 'granted') {
        setNotificationStatus('granted')
        setShowNotificationPrompt(false)
        markPromptAsShown('notifications')
        
        // Envia notificação de boas-vindas
        setTimeout(() => {
          sendTestNotification(
            'Notificações ativadas! 🎉',
            'Você receberá alertas sobre eventos importantes dos autistas vinculados.'
          )
        }, 1000)
      } else {
        setNotificationStatus('denied')
        setShowNotificationPrompt(false)
        markPermissionDenied('notifications')
        markPromptAsShown('notifications')
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      setNotificationStatus('denied')
      setShowNotificationPrompt(false)
    }
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    try {
      // Mostra o prompt nativo
      await deferredPrompt.prompt()
      
      // Aguarda a escolha do usuário
      const choiceResult = await deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar')
        setInstallStatus('installed')
        markPromptAsShown('install')
      } else {
        console.log('Usuário recusou instalar')
        setInstallStatus('dismissed')
        markPermissionDenied('install')
        markPromptAsShown('install')
      }
      
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Erro ao instalar:', error)
    }
  }

  const handleDismissNotification = () => {
    setShowNotificationPrompt(false)
    markPromptAsShown('notifications')
  }

  const handleDismissInstall = () => {
    setShowInstallPrompt(false)
    markPromptAsShown('install')
  }

  const handleDismissIOSInstructions = () => {
    setShowIOSInstructions(false)
    markPromptAsShown('install')
  }

  // Não renderiza nada se não for mobile
  if (!deviceInfo.isMobile) {
    return null
  }

  return (
    <>
      {/* Notification Permission Dialog */}
      <Dialog open={showNotificationPrompt} onOpenChange={setShowNotificationPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Receber Notificações
            </DialogTitle>
            <DialogDescription>
              Fique atualizado sobre eventos importantes dos autistas vinculados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <strong>Por que ativar notificações?</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>Alertas sobre novos eventos registrados</li>
                  <li>Convites de profissionais e co-responsáveis</li>
                  <li>Lembretes de atendimentos agendados</li>
                  <li>Atualizações importantes do sistema</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>🔒 Sua privacidade está protegida:</strong> Você pode desativar as notificações a qualquer momento nas configurações do navegador.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismissNotification}
              className="flex-1"
            >
              Agora Não
            </Button>
            <Button
              onClick={handleNotificationRequest}
              className="flex-1"
            >
              <Bell className="w-4 h-4 mr-2" />
              Ativar Notificações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Install PWA Dialog (Android/Chrome) */}
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Adicionar à Tela Inicial
            </DialogTitle>
            <DialogDescription>
              Acesse o Autazul mais rapidamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Download className="w-4 h-4 text-blue-600" />
              <AlertDescription>
                <strong>Vantagens de instalar:</strong>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>Abra como um aplicativo nativo</li>
                  <li>Acesso mais rápido e direto</li>
                  <li>Funciona offline (recursos limitados)</li>
                  <li>Notificações push</li>
                  <li>Sem ocupar espaço significativo</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-primary rounded-2xl flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm">Autazul</p>
                <p className="text-xs text-muted-foreground">App Instalado</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDismissInstall}
              className="flex-1"
            >
              Não, Obrigado
            </Button>
            <Button
              onClick={handleInstallClick}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Instalar Agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* iOS Installation Instructions */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Adicionar à Tela Inicial
            </DialogTitle>
            <DialogDescription>
              Instruções para iOS Safari
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="w-4 h-4 text-blue-600" />
              <AlertDescription>
                Para adicionar o Autazul à sua tela inicial no iOS:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-muted rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Toque no botão <strong>Compartilhar</strong> 
                    <Share className="w-4 h-4 inline mx-1" />
                    na barra inferior do Safari
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-muted rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                    <Plus className="w-4 h-4 inline mx-1" />
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start p-3 bg-muted rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Confirme tocando em <strong>"Adicionar"</strong> no canto superior direito
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-sm text-green-900">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                <strong>Pronto!</strong> O ícone do Autazul aparecerá na sua tela inicial.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleDismissIOSInstructions}
              className="w-full"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Indicators (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && deviceInfo.isMobile && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs space-y-1 z-50">
          <p>📱 Mobile: {deviceInfo.isMobile ? '✅' : '❌'}</p>
          <p>🍎 iOS: {deviceInfo.isIOS ? '✅' : '❌'}</p>
          <p>🤖 Android: {deviceInfo.isAndroid ? '✅' : '❌'}</p>
          <p>📲 Standalone: {deviceInfo.isStandalone ? '✅' : '❌'}</p>
          <p>🔔 Notifications: {notificationStatus}</p>
          <p>💾 Install: {installStatus}</p>
        </div>
      )}
    </>
  )
}
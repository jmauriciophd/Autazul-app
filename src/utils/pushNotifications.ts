/**
 * Gerenciamento de notificações push
 */

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações')
    return 'denied'
  }

  // Se já tem permissão, retorna o status atual
  if (Notification.permission !== 'default') {
    return Notification.permission
  }

  // Solicita permissão
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificação:', error)
    return 'denied'
  }
}

/**
 * Registra o service worker para notificações
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado')
    return null
  }

  try {
    // Verifica se o arquivo existe antes de tentar registrar
    const swPath = '/service-worker.js'
    
    // Tenta fazer fetch do arquivo para verificar se existe
    try {
      const response = await fetch(swPath, { method: 'HEAD' })
      if (!response.ok) {
        console.warn('Service Worker não encontrado no servidor. PWA funcionará sem cache offline.')
        return null
      }
    } catch (fetchError) {
      console.warn('Não foi possível verificar Service Worker:', fetchError)
      return null
    }

    const registration = await navigator.serviceWorker.register(swPath)
    console.log('Service Worker registrado com sucesso:', registration)
    return registration
  } catch (error) {
    console.warn('Service Worker não pôde ser registrado (normal em desenvolvimento):', error)
    return null
  }
}

/**
 * Envia uma notificação de teste
 */
export async function sendTestNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') {
    console.warn('Permissão de notificação não concedida')
    return
  }

  try {
    // Verifica se há service worker registrado
    const registration = await navigator.serviceWorker.ready.catch(() => null)
    
    if (!registration) {
      // Fallback: usar Notification API diretamente
      new Notification(title, {
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-96x96.png'
      })
      return
    }

    await registration.showNotification(title, {
      body,
      icon: icon || '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      tag: 'autazul-notification',
      requireInteraction: false,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    })
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    
    // Fallback final: Notification API simples
    try {
      new Notification(title, { body })
    } catch (fallbackError) {
      console.error('Erro no fallback de notificação:', fallbackError)
    }
  }
}

/**
 * Obtém o status das permissões de notificação
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

/**
 * Verifica se as notificações estão habilitadas
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

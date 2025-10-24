/**
 * Service Worker do Autazul
 * Gerencia notificações push e cache offline
 */

const CACHE_NAME = 'autazul-v1'
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/globals.css'
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('[Service Worker] Erro ao abrir cache:', error)
      })
  )
})

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deletando cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna a resposta do cache
        if (response) {
          return response
        }
        // Faz a requisição na rede
        return fetch(event.request)
      })
      .catch((error) => {
        console.error('[Service Worker] Erro no fetch:', error)
      })
  )
})

// Recebimento de notificações push
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event)
  
  let notificationData = {
    title: 'Autazul',
    body: 'Você tem uma nova notificação',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png'
  }

  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (e) {
      notificationData.body = event.data.text()
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: 'autazul-notification',
      requireInteraction: false
    }
  )

  event.waitUntil(promiseChain)
})

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event)
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Mensagem recebida:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

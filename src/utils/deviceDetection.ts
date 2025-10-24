/**
 * Utilitários para detecção de dispositivo e plataforma
 */

export interface DeviceInfo {
  isMobile: boolean
  isIOS: boolean
  isAndroid: boolean
  isStandalone: boolean
  canInstall: boolean
  browser: string
}

/**
 * Detecta o tipo de dispositivo e plataforma
 */
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera

  // Detecta se é mobile
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  )

  // Detecta iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream

  // Detecta Android
  const isAndroid = /android/i.test(userAgent)

  // Detecta se já está instalado (standalone mode)
  const isStandalone = 
    (window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')

  // Detecta browser
  let browser = 'unknown'
  if (userAgent.indexOf('Chrome') > -1) browser = 'chrome'
  else if (userAgent.indexOf('Safari') > -1) browser = 'safari'
  else if (userAgent.indexOf('Firefox') > -1) browser = 'firefox'
  else if (userAgent.indexOf('Edge') > -1) browser = 'edge'

  // Pode instalar se for mobile e não estiver em standalone
  const canInstall = isMobile && !isStandalone

  return {
    isMobile,
    isIOS,
    isAndroid,
    isStandalone,
    canInstall,
    browser
  }
}

/**
 * Verifica se o navegador suporta notificações
 */
export function supportsNotifications(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Verifica se o navegador suporta PWA
 */
export function supportsPWA(): boolean {
  return 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window
}

/**
 * Salva que o usuário já viu os prompts
 */
export function markPromptAsShown(type: 'install' | 'notifications') {
  const key = `autazul_${type}_prompt_shown`
  const count = parseInt(localStorage.getItem(key) || '0')
  localStorage.setItem(key, String(count + 1))
  localStorage.setItem(`${key}_date`, new Date().toISOString())
}

/**
 * Verifica se deve mostrar o prompt novamente
 */
export function shouldShowPrompt(type: 'install' | 'notifications'): boolean {
  const key = `autazul_${type}_prompt_shown`
  const count = parseInt(localStorage.getItem(key) || '0')
  const dateKey = `${key}_date`
  const lastShownDate = localStorage.getItem(dateKey)

  // Se nunca mostrou, pode mostrar
  if (count === 0) return true

  // Se já mostrou 3+ vezes, não mostra mais
  if (count >= 3) return false

  // Se mostrou há menos de 7 dias, não mostra novamente
  if (lastShownDate) {
    const daysSinceLastShown = (Date.now() - new Date(lastShownDate).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastShown < 7) return false
  }

  return true
}

/**
 * Verifica se o usuário negou permanentemente as permissões
 */
export function hasUserDeniedPermissions(type: 'install' | 'notifications'): boolean {
  const key = `autazul_${type}_denied`
  return localStorage.getItem(key) === 'true'
}

/**
 * Marca que o usuário negou as permissões
 */
export function markPermissionDenied(type: 'install' | 'notifications') {
  localStorage.setItem(`autazul_${type}_denied`, 'true')
}

/**
 * Limpa a marcação de negação (para quando o usuário muda de ideia)
 */
export function clearPermissionDenied(type: 'install' | 'notifications') {
  localStorage.removeItem(`autazul_${type}_denied`)
}

# 📱 Documentação PWA e Mobile - Autazul

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Detecção de Dispositivo](#detecção-de-dispositivo)
4. [Notificações Push](#notificações-push)
5. [Instalação na Tela Inicial](#instalação-na-tela-inicial)
6. [Estratégias de UX](#estratégias-de-ux)
7. [Testes e Validação](#testes-e-validação)
8. [Configuração de Ícones](#configuração-de-ícones)

---

## 🎯 Visão Geral

O Autazul agora é um **Progressive Web App (PWA)** completo, oferecendo experiência nativa em dispositivos móveis com:
- ✅ Detecção automática de dispositivo (iOS/Android)
- ✅ Notificações push inteligentes
- ✅ Instalação na tela inicial (Add to Home Screen)
- ✅ Funcionamento offline (recursos limitados)
- ✅ UX não intrusiva e educativa

---

## ✨ Funcionalidades Implementadas

### 1. **Detecção Automática de Dispositivo**
**Arquivo:** `/utils/deviceDetection.ts`

```typescript
const deviceInfo = detectDevice()
// Retorna:
{
  isMobile: boolean       // Detecta se é celular/tablet
  isIOS: boolean          // iPhone/iPad
  isAndroid: boolean      // Android
  isStandalone: boolean   // Já instalado como PWA
  canInstall: boolean     // Pode instalar
  browser: string         // chrome, safari, firefox, edge
}
```

**Características:**
- Detecção precisa via User Agent
- Identifica modo standalone (já instalado)
- Suporta todos os principais navegadores
- Detecta se é possível instalar

### 2. **Sistema de Notificações Push**
**Arquivo:** `/utils/pushNotifications.ts`

**Funções principais:**
```typescript
// Solicitar permissão
const permission = await requestNotificationPermission()

// Registrar service worker
const registration = await registerServiceWorker()

// Enviar notificação de teste
await sendTestNotification('Título', 'Mensagem', 'icon-url')

// Verificar status
const enabled = areNotificationsEnabled()
```

**Service Worker:** `/public/service-worker.js`
- Gerencia notificações em background
- Cache para funcionamento offline
- Intercepta requisições para melhor performance

### 3. **Add to Home Screen (A2HS)**
**Componente:** `/components/MobileDetector.tsx`

#### **Android/Chrome:**
- Captura evento `beforeinstallprompt`
- Mostra diálogo personalizado
- Permite instalação com um clique
- Feedback visual imediato

#### **iOS Safari:**
- Instruções passo a passo
- Ícones visuais do processo
- Orientação clara para usuários iOS
- Design educativo e amigável

---

## 🔍 Detecção de Dispositivo

### Como Funciona

**1. Detecção do Tipo de Dispositivo:**
```javascript
const userAgent = navigator.userAgent.toLowerCase()
const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
```

**2. Plataforma Específica:**
```javascript
const isIOS = /iPad|iPhone|iPod/.test(userAgent)
const isAndroid = /android/i.test(userAgent)
```

**3. Modo Standalone:**
```javascript
const isStandalone = 
  window.matchMedia('(display-mode: standalone)').matches ||
  navigator.standalone === true ||
  document.referrer.includes('android-app://')
```

### Fluxo de Decisão

```
Usuário acessa → Detecta mobile? 
                 ↓ Não → Nada acontece
                 ↓ Sim
                 ↓
         Já está instalado?
                 ↓ Sim → Mostra apenas notificações
                 ↓ Não
                 ↓
         É Android → Mostra diálogo PWA
         É iOS → Mostra instruções manuais
```

---

## 🔔 Notificações Push

### Requisitos do Navegador
- ✅ Chrome/Edge (Android/Desktop)
- ✅ Firefox (Android/Desktop)
- ✅ Safari (macOS/iOS 16.4+)
- ❌ iOS Safari < 16.4 (limitado)

### Fluxo de Solicitação

**1. Timing Inteligente:**
```typescript
// Aguarda 5 segundos após login para não ser intrusivo
setTimeout(() => {
  if (shouldShowPrompt('notifications')) {
    setShowNotificationPrompt(true)
  }
}, 5000)
```

**2. Verificações:**
- Verifica suporte do navegador
- Checa se já tem permissão
- Respeita negações anteriores
- Limite de 3 solicitações

**3. Resposta do Usuário:**
```typescript
// Permissão concedida
if (permission === 'granted') {
  // Registra service worker
  // Envia notificação de boas-vindas
  // Salva preferência
}

// Permissão negada
if (permission === 'denied') {
  // Marca como negado permanentemente
  // Não pergunta novamente
}
```

### Notificação de Boas-Vindas
Após conceder permissão, usuário recebe:
```javascript
{
  title: 'Notificações ativadas! 🎉',
  body: 'Você receberá alertas sobre eventos importantes...',
  icon: '/icon-192x192.png',
  badge: '/icon-96x96.png',
  vibrate: [200, 100, 200]
}
```

---

## 📲 Instalação na Tela Inicial

### Android (Chrome, Edge, Samsung Internet)

**Evento beforeinstallprompt:**
```javascript
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  // Armazena evento para uso posterior
  setDeferredPrompt(e)
  
  // Mostra diálogo customizado após 3 segundos
  setTimeout(() => showInstallDialog(), 3000)
})
```

**Instalação:**
```javascript
const handleInstall = async () => {
  await deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  
  if (choice.outcome === 'accepted') {
    // Usuário instalou!
    markAsInstalled()
  }
}
```

### iOS (Safari)

**Instruções Visuais:**
```
1. Toque em [Compartilhar 📤] na barra inferior
2. Role e toque em "Adicionar à Tela de Início ➕"
3. Confirme tocando em "Adicionar"
```

**Por que manual no iOS?**
- iOS não expõe API `beforeinstallprompt`
- Apple requer ação manual do usuário
- Focamos em educar com instruções claras

---

## 🎨 Estratégias de UX

### 1. **Não Intrusivo**
```typescript
// Aguarda tempo adequado
const INSTALL_DELAY = 3000    // 3 segundos após carregar
const NOTIFICATION_DELAY = 5000  // 5 segundos após login
```

### 2. **Educativo**
Cada diálogo explica:
- ✅ **Por que ativar**: Benefícios claros
- ✅ **O que acontece**: Transparência total
- ✅ **Como funciona**: Instruções passo a passo
- ✅ **Privacidade**: Garantias de segurança

### 3. **Respeita Decisões**
```typescript
// Limite de tentativas
const MAX_PROMPTS = 3

// Intervalo entre prompts
const MIN_DAYS_BETWEEN = 7

// Respeita negação permanente
if (hasUserDeniedPermissions('install')) {
  return // Não mostra mais
}
```

### 4. **Feedback Visual**

**Durante instalação:**
```jsx
<div className="flex items-center justify-center">
  <div className="w-16 h-16 bg-primary rounded-2xl">
    <Smartphone className="w-8 h-8 text-white" />
  </div>
  <p>Autazul - App Instalado</p>
</div>
```

**Status de permissões:**
```jsx
{/* Apenas em desenvolvimento */}
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 left-4">
    <p>📱 Mobile: ✅</p>
    <p>🔔 Notifications: {status}</p>
    <p>💾 Install: {installStatus}</p>
  </div>
)}
```

### 5. **Casos de Negação**

**Estratégias implementadas:**

| Cenário | Ação do Sistema |
|---------|----------------|
| Usuário nega notificações | Marca como negado, não pergunta novamente |
| Usuário fecha diálogo sem responder | Conta como 1 tentativa, pode perguntar depois (limite 3x) |
| Usuário nega instalação | Aguarda 7 dias para perguntar novamente |
| Usuário já instalou | Pula prompt de instalação, foca em notificações |
| Navegador não suporta | Não mostra prompts, evita erros |

---

## 🧪 Testes e Validação

### Testar em Desenvolvimento

**1. Chrome DevTools (Mobile Emulation):**
```
F12 → Toggle Device Toolbar → Selecione dispositivo
```

**2. Testar Instalação:**
```
Application → Manifest → "Add to home screen"
```

**3. Testar Service Worker:**
```
Application → Service Workers → Verificar status
```

**4. Testar Notificações:**
```
Application → Notifications → Request permission
```

### Testar em Produção

**Android:**
1. Abra no Chrome/Edge
2. Aguarde 3 segundos
3. Verifique diálogo de instalação
4. Instale e teste notificações

**iOS:**
1. Abra no Safari
2. Aguarde 3 segundos
3. Verifique instruções de instalação
4. Siga passos manualmente
5. Teste notificações (iOS 16.4+)

---

## 🖼️ Configuração de Ícones

### Ícones Necessários

**Crie estes arquivos em `/public/`:**

```
icon-72x72.png     (72x72px)
icon-96x96.png     (96x96px)
icon-128x128.png   (128x128px)
icon-144x144.png   (144x144px)
icon-152x152.png   (152x152px)
icon-192x192.png   (192x192px)  ← Principal
icon-384x384.png   (384x384px)
icon-512x512.png   (512x512px)  ← Splash screen
```

### Especificações

**Design dos Ícones:**
- Fundo: `#46B0FD` (azul Autazul)
- Logo: Branco centralizado
- Formato: PNG com transparência
- Cantos: Não arredonde (SO faz automaticamente)

**Ferramentas Recomendadas:**
- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Figma](https://www.figma.com/) - Design manual

### Manifest.json

**Já configurado em `/public/manifest.json`:**
```json
{
  "name": "Autazul - Acompanhamento de Autistas",
  "short_name": "Autazul",
  "theme_color": "#46B0FD",
  "background_color": "#EBF2F5",
  "display": "standalone",
  "icons": [...] // Array com todos os tamanhos
}
```

---

## 📊 Monitoramento e Analytics

### Métricas a Acompanhar

**1. Taxa de Instalação:**
```javascript
// Evento quando usuário instala
window.addEventListener('appinstalled', () => {
  console.log('PWA instalado!')
  // Enviar para analytics
})
```

**2. Permissões de Notificação:**
```javascript
// Acompanhar aceitação/negação
const permission = await requestNotificationPermission()
// Log: granted/denied/default
```

**3. Dispositivos:**
```javascript
const { isMobile, isIOS, isAndroid } = detectDevice()
// Enviar para analytics
```

---

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Offline First:**
   - Cache de dados locais
   - Sincronização em background
   - Queue de ações offline

2. **Notificações Avançadas:**
   - Push notifications do servidor
   - Notificações agendadas
   - Ações inline (responder direto)

3. **App Shortcuts:**
   - Adicionar ao manifest
   - Atalhos rápidos (criar evento, etc)

4. **Share Target API:**
   - Compartilhar fotos direto no Autazul
   - Integração com galeria

5. **Geolocalização:**
   - Registrar local dos eventos
   - Mapas de profissionais próximos

---

## 🔧 Troubleshooting

### Problemas Comuns

**1. Service Worker não registra:**
```javascript
// Verifique se está em HTTPS (ou localhost)
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  console.warn('Service Worker requer HTTPS')
}
```

**2. Notificações não funcionam:**
```javascript
// Verifique permissões
if (Notification.permission === 'denied') {
  // Usuário precisa habilitar manualmente nas configurações
}
```

**3. iOS não mostra instalação:**
```javascript
// iOS requer Safari e ação manual
// Certifique-se de estar no Safari (não Chrome iOS)
```

**4. Ícones não aparecem:**
```bash
# Verifique se os arquivos existem
ls public/icon-*.png

# Valide o manifest
# Application → Manifest (Chrome DevTools)
```

---

## 📞 Suporte

**Dúvidas ou problemas?**
- 📧 Email: webservicesbsb@gmail.com
- 📚 Documentação: Este arquivo
- 🐛 Bugs: Reporte com detalhes do dispositivo/navegador

---

## ✅ Checklist de Implementação

- [x] Detecção de dispositivo móvel
- [x] Sistema de notificações push
- [x] Service Worker configurado
- [x] Manifest.json criado
- [x] Prompts não intrusivos
- [x] Instruções para iOS
- [x] Respeito a negações
- [x] Feedback visual
- [x] Testes em desenvolvimento
- [ ] Ícones PWA criados (pendente)
- [ ] Testes em produção (pendente)
- [ ] Analytics configurado (futuro)

---

**Versão:** 1.0.0  
**Data:** 24 de Outubro de 2025  
**Autor:** Sistema Autazul

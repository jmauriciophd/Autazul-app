# 📝 Meta Tags para PWA - Autazul

## Instruções de Implementação

### ⚠️ IMPORTANTE
Adicione as seguintes meta tags no arquivo `index.html` do seu projeto, dentro da tag `<head>`.

---

## 📋 Meta Tags Completas

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  
  <!-- SEO Básico -->
  <title>Autazul - Acompanhamento de Autistas</title>
  <meta name="description" content="Plataforma completa para pais acompanharem eventos relacionados aos seus filhos autistas com a colaboração de profissionais de saúde e educação.">
  <meta name="keywords" content="autismo, autista, acompanhamento, TEA, pais, profissionais, saúde, educação">
  <meta name="author" content="Autazul">
  
  <!-- PWA - Manifest -->
  <link rel="manifest" href="/manifest.json">
  
  <!-- Theme Color (barra de endereço mobile) -->
  <meta name="theme-color" content="#46B0FD">
  <meta name="theme-color" media="(prefers-color-scheme: light)" content="#46B0FD">
  <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e3a8a">
  
  <!-- iOS Safari -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="Autazul">
  
  <!-- iOS Icons -->
  <link rel="apple-touch-icon" href="/icon-192x192.png">
  <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png">
  <link rel="apple-touch-icon" sizes="167x167" href="/icon-192x192.png">
  
  <!-- iOS Splash Screens -->
  <link rel="apple-touch-startup-image" href="/icon-512x512.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/icon-96x96.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/icon-72x72.png">
  
  <!-- Android -->
  <meta name="mobile-web-app-capable" content="yes">
  
  <!-- Microsoft -->
  <meta name="msapplication-TileColor" content="#46B0FD">
  <meta name="msapplication-TileImage" content="/icon-144x144.png">
  <meta name="msapplication-config" content="/browserconfig.xml">
  
  <!-- Open Graph (Facebook, WhatsApp) -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://autazul.com/">
  <meta property="og:title" content="Autazul - Acompanhamento de Autistas">
  <meta property="og:description" content="Plataforma completa para pais acompanharem eventos relacionados aos seus filhos autistas.">
  <meta property="og:image" content="/icon-512x512.png">
  <meta property="og:image:width" content="512">
  <meta property="og:image:height" content="512">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Autazul">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="https://autazul.com/">
  <meta name="twitter:title" content="Autazul - Acompanhamento de Autistas">
  <meta name="twitter:description" content="Plataforma completa para pais acompanharem eventos relacionados aos seus filhos autistas.">
  <meta name="twitter:image" content="/icon-512x512.png">
  
  <!-- Security -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
  
  <!-- Preconnect (Performance) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- CSS Global -->
  <link rel="stylesheet" href="/styles/globals.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('✅ Service Worker registrado:', registration.scope);
          })
          .catch(error => {
            console.error('❌ Erro ao registrar Service Worker:', error);
          });
      });
    }
  </script>
  
  <!-- App Bundle -->
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## 📱 browserconfig.xml (Opcional - Windows)

Crie o arquivo `/public/browserconfig.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="/icon-72x72.png"/>
      <square150x150logo src="/icon-152x152.png"/>
      <square310x310logo src="/icon-384x384.png"/>
      <TileColor>#46B0FD</TileColor>
    </tile>
  </msapplication>
</browserconfig>
```

---

## 🎨 Personalização por Plataforma

### iOS Safari (Light Mode)
```html
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<!-- Opções: default, black, black-translucent -->
```

### Android Chrome (Theme Color)
```html
<meta name="theme-color" content="#46B0FD">
<!-- Muda a cor da barra de endereço -->
```

### Dark Mode Support
```html
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e3a8a">
<!-- Cor diferente para dark mode -->
```

---

## ✅ Validação

### Testar se está funcionando:

**1. Chrome DevTools:**
```
F12 → Application → Manifest
- Verificar se o manifest carrega
- Ver todos os ícones
- Testar "Add to home screen"
```

**2. Lighthouse:**
```
F12 → Lighthouse → Progressive Web App
- Rodar auditoria
- Objetivo: 100 pontos
```

**3. Mobile:**
```
- Abrir no celular
- Verificar cor da barra de endereço
- Testar instalação
```

---

## 🚨 Checklist de Implementação

- [ ] Copiar meta tags para index.html
- [ ] Criar ícones em todos os tamanhos
- [ ] Verificar manifest.json
- [ ] Testar service worker
- [ ] Validar com Lighthouse
- [ ] Testar em Android
- [ ] Testar em iOS
- [ ] Compartilhar no WhatsApp (testar Open Graph)

---

## 📞 Suporte

Dúvidas? Entre em contato: webservicesbsb@gmail.com

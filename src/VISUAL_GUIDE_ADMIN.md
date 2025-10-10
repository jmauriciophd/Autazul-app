# 🎨 Guia Visual - Sistema de Acesso Administrativo

## 📱 Interface do Usuário

### Tela de Login
```
┌────────────────────────────────────────────────┐
│                                                │
│          🧩 AUTAZUL                           │
│                                                │
│  ┌──────────────────────────────────────┐    │
│  │                                       │    │
│  │  Email: ___________________          │    │
│  │                                       │    │
│  │  Senha: ___________________          │    │
│  │                                       │    │
│  │         [ Entrar ]                    │    │
│  │                                       │    │
│  └──────────────────────────────────────┘    │
│                                                │
└────────────────────────────────────────────────┘
```

---

### Dashboard Parent/Professional (Usuário Normal)
```
┌───────────────────────────────────────────────────────────────┐
│  🧩 Autazul          Olá, João                [🔔] [🛡️] [🚪]  │
│                                                                │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  [Dashboard content...]                                        │
│                                                                │
└───────────────────────────────────────────────────────────────┘

Legenda:
🔔 = Notificações
🛡️ = Segurança
🚪 = Sair
```

---

### Dashboard Admin (Usuário Administrador)
```
┌───────────────────────────────────────────────────────────────────┐
│  🧩 Autazul          Olá, Admin           [🔔] [🛡️] [👑] [🚪]    │
│                                                      ↑             │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [Dashboard content...]                                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘

Legenda:
🔔 = Notificações
🛡️ = Segurança
👑 = Painel Admin (APENAS PARA ADMINS)
🚪 = Sair
```

---

### AdminPanel (Após Clicar na Coroa)
```
┌───────────────────────────────────────────────────────────────────┐
│  🧩 Autazul - Admin                             [◀ Voltar]        │
│     Painel Administrativo                                         │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 💻 Google Ads                                               │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │                                                             │ │
│  │ Código Google Ads:                                          │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ <!-- Google Ads Code -->                              │ │ │
│  │ │                                                        │ │ │
│  │ │                                                        │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🖼️ Banner Publicitário                                      │ │
│  │ ─────────────────────────────────────────────────────────── │ │
│  │                                                             │ │
│  │ URL da Imagem:                                              │ │
│  │ [https://exemplo.com/banner.png________________]           │ │
│  │                                                             │ │
│  │ Link do Banner:                                             │ │
│  │ [https://exemplo.com/contato___________________]           │ │
│  │                                                             │ │
│  │ Pré-visualização:                                           │ │
│  │ ┌───────────────────────────────────────────────────────┐ │ │
│  │ │ [        Imagem do banner aparece aqui          ]    │ │ │
│  │ └───────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│                    [ Salvar Configurações ]                        │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Paleta de Cores

### Cores Principais
```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│  Azul Autazul:     #46B0FD  ████████████                 │
│  Azul Claro:       #15C3D6  ████████████                 │
│  Título:           #5C8599  ████████████                 │
│  Texto:            #373737  ████████████                 │
│  Amarelo Admin:    #eab308  ████████████  ← Cor da Coroa │
│  Background:       #f5f5f5  ████████████                 │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Estados dos Botões
```
Normal:     [ Botão ]     #15C3D6 com texto branco
Hover:      [ Botão ]     #15C3D6 mais escuro
Disabled:   [ Botão ]     Cinza opaco
Active:     [ Botão ]     #15C3D6 mais escuro + sombra
```

---

## 🔄 Fluxo Visual de Navegação

### Cenário 1: Admin Acessa o Painel

```
     LOGIN
       ↓
┌─────────────┐
│  Dashboard  │  ← Email verificado
│             │  ← isAdmin = true
│  [🔔][🛡️][👑][🚪] │  ← Coroa aparece
└──────┬──────┘
       │
       │ Clique na 👑
       ↓
┌─────────────┐
│ AdminPanel  │  ← Tela muda completamente
│             │
│ [◀ Voltar]  │  ← Novo header
└──────┬──────┘
       │
       │ Edita configs
       │ Clica [Salvar]
       ↓
    Sucesso! ✅
       │
       │ Clica [Voltar]
       ↓
┌─────────────┐
│  Dashboard  │  ← Retorna ao dashboard
│             │
│  [🔔][🛡️][👑][🚪] │
└─────────────┘
```

### Cenário 2: Usuário Normal Tenta Acessar

```
     LOGIN
       ↓
┌─────────────┐
│  Dashboard  │  ← Email verificado
│             │  ← isAdmin = false
│  [🔔][🛡️][🚪]    │  ← SEM coroa
└─────────────┘
       │
       │ Não vê opção de admin
       │ Usa sistema normalmente
       ↓
    Sem acesso ❌
```

---

## 🎯 Indicadores Visuais de Status

### Ícone de Notificações
```
Sem notificações:           Novas notificações:
    🔔                          🔔
                                ●  ← Badge vermelho com número
```

### Ícone de Admin (Coroa)
```
Visível apenas para admins:
    👑  ← Cor dourada (#eab308)
```

### Estados de Loading
```
Carregando:
    ⏳  "Carregando configurações..."

Salvando:
    ⏳  "Salvando..."
```

### Mensagens de Feedback
```
Sucesso:
    ✅  "Configurações salvas com sucesso"

Erro:
    ❌  "Erro ao salvar configurações"

Aviso:
    ⚠️  "Acesso Negado"
```

---

## 📐 Layout e Espaçamento

### Grid do Dashboard
```
┌─────────────────────────────────────────────────────┐
│                    Header (fixo)                     │
├──────────────┬──────────────────────────────────────┤
│              │                                       │
│   Sidebar    │        Conteúdo Principal            │
│   (se há)    │                                       │
│              │                                       │
│              │                                       │
└──────────────┴──────────────────────────────────────┘

Container: max-width: 1200px, centralizado
Padding: 16px (mobile), 32px (desktop)
Gap entre cards: 24px
```

### AdminPanel Layout
```
┌─────────────────────────────────────────────────────┐
│              Header Admin (azul #46B0FD)            │
├─────────────────────────────────────────────────────┤
│                                                      │
│     ┌────────────────────────────────────┐         │
│     │                                    │         │
│     │         Card Google Ads            │         │
│     │                                    │         │
│     └────────────────────────────────────┘         │
│                                                      │
│     ┌────────────────────────────────────┐         │
│     │                                    │         │
│     │         Card Banner                │         │
│     │                                    │         │
│     └────────────────────────────────────┘         │
│                                                      │
│            [ Salvar Configurações ]                 │
│                                                      │
└─────────────────────────────────────────────────────┘

Max-width: 800px, centralizado
Cards: border-radius: 12px, padding: 24px
```

---

## 🖱️ Interações do Usuário

### Hover States

#### Botão Admin (Coroa)
```
Normal:                    Hover:
  👑                        👑
(cor: #eab308)          (brilho aumentado)
                        + tooltip "Painel Administrativo"
```

#### Botão Salvar
```
Normal:                    Hover:
[ Salvar ]                [ Salvar ]
(#15C3D6)                 (#15C3D6 mais escuro)
                          + cursor: pointer
```

### Click States

#### Admin Icon Click
```
Before:                   After:
Dashboard                 AdminPanel
[🔔][🛡️][👑][🚪]  →        [◀ Voltar]
                          Transição suave (fade)
```

### Focus States

#### Input de Texto
```
Normal:                   Focus:
┌─────────────┐          ┌─────────────┐
│             │          │ |           │  ← Cursor piscando
└─────────────┘          └─────────────┘
(border: cinza)          (border: #15C3D6)
```

---

## 📱 Responsividade

### Desktop (> 1024px)
```
┌────────────────────────────────────────────┐
│  Logo + Nome     [Ícones]                 │
├────────────┬──────────────────────────────┤
│            │                               │
│  Sidebar   │     Conteúdo Principal       │
│  200px     │         Flex 1               │
│            │                               │
└────────────┴──────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌────────────────────────────────────────────┐
│  Logo + Nome     [Ícones]                 │
├────────────────────────────────────────────┤
│                                            │
│         Conteúdo Principal                 │
│         (sidebar collapse)                 │
│                                            │
└────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌──────────────────┐
│  ☰  Logo  [...]  │  ← Menu hamburger
├──────────────────┤
│                  │
│    Conteúdo      │
│     Stack        │
│   Vertical       │
│                  │
└──────────────────┘
```

---

## 🎭 Animações e Transições

### Transition do AdminPanel
```
Dashboard                    AdminPanel
  [fade out]      →        [fade in]
  0.3s                      0.3s
```

### Loading Spinner
```
    ⏳
    ↻ Rotate 360deg
    Animation: 1s linear infinite
```

### Toast Notifications
```
              ┌────────────────┐
              │  ✅ Sucesso!  │  ← Slide in from top
              └────────────────┘
                      ↓
              [permanece 3s]
                      ↓
              ┌────────────────┐
              │  ✅ Sucesso!  │  ← Fade out
              └────────────────┘
```

---

## 🔍 Estados de Erro

### Acesso Negado (Não-Admin tenta acessar)
```
┌────────────────────────────────────────┐
│                                        │
│          ⛔ Acesso Negado              │
│                                        │
│  Apenas administradores podem acessar │
│  esta página.                          │
│                                        │
│           [ Voltar ]                   │
│                                        │
└────────────────────────────────────────┘
```

### Erro ao Salvar
```
┌────────────────────────────────────────┐
│  ❌ Erro                               │
│  Não foi possível salvar as            │
│  configurações. Tente novamente.       │
└────────────────────────────────────────┘
```

### Código Inválido
```
┌────────────────────────────────────────┐
│  ⚠️ Atenção                            │
│  Verifique o código inserido.          │
└────────────────────────────────────────┘
```

---

## 🎨 Tipografia

### Fontes Utilizadas

```
Títulos/Logo:       Roboto Condensed
Textos:            Nunito Bold / ExtraBold
Código:            Courier New (monospace)
```

### Hierarquia de Texto

```
H1 - Logo:              32px, Roboto Condensed
H2 - Títulos de Card:   24px, Nunito Bold
H3 - Subtítulos:        18px, Nunito Bold
Body:                   16px, Nunito
Small:                  14px, Nunito
Tiny:                   12px, Nunito
```

---

## 🖼️ Componentes Visuais

### Card
```
┌──────────────────────────────────────┐
│  Título                              │ ← 24px, Bold
│  ────────────────────────────────    │
│                                      │
│  Conteúdo do card                    │
│  • Item 1                            │
│  • Item 2                            │
│                                      │
└──────────────────────────────────────┘

Border: 1px solid #e0e0e0
Border-radius: 12px
Padding: 24px
Box-shadow: 0 2px 4px rgba(0,0,0,0.1)
```

### Badge
```
┌────┐
│ 99 │  ← Número de notificações
└────┘

Background: #15C3D6
Color: white
Border-radius: 50%
Size: 20px x 20px
```

### Tooltip
```
    👑
    ↓
┌────────────────────┐
│ Painel             │  ← Aparece no hover
│ Administrativo     │
└────────────────────┘

Background: #373737
Color: white
Padding: 8px 12px
Border-radius: 4px
```

---

## 🎯 Casos de Uso Visuais

### Caso 1: Admin Salva Banner

```
Estado 1: Editando
┌──────────────────┐
│ Banner URL:      │
│ [https://....__]│  ← Input ativo
│                  │
│ [Salvar]         │
└──────────────────┘

Estado 2: Salvando
┌──────────────────┐
│ Banner URL:      │
│ [https://...____]│
│                  │
│ [⏳ Salvando...] │  ← Loading
└──────────────────┘

Estado 3: Sucesso
┌──────────────────┐
│ ✅ Salvo!        │  ← Toast notification
└──────────────────┘
┌──────────────────┐
│ Banner URL:      │
│ [https://...____]│
│                  │
│ [Salvar]         │
└──────────────────┘
```

### Caso 2: Usuário Vê Banner Configurado

```
Dashboard do Usuário
┌────────────────────────────────────┐
│                                    │
│  [Conteúdo normal do dashboard]    │
│                                    │
├────────────────────────────────────┤
│                                    │
│  ┌──────────────────────────────┐ │
│  │  [Banner Publicitário]       │ │  ← Banner configurado pelo admin
│  └──────────────────────────────┘ │
│                                    │
└────────────────────────────────────┘
```

---

## 🎨 Conclusão Visual

Este guia fornece uma visão completa de todos os elementos visuais do sistema de acesso administrativo. Para implementação técnica detalhada, consulte:

- **[ADMIN_ACCESS_DOCUMENTATION.md](./ADMIN_ACCESS_DOCUMENTATION.md)** - Implementação técnica
- **[ADMIN_ARCHITECTURE.md](./ADMIN_ARCHITECTURE.md)** - Arquitetura do sistema
- **[ADMIN_QUICK_REFERENCE.md](./ADMIN_QUICK_REFERENCE.md)** - Referência rápida

---

**Versão**: 1.0  
**Data**: 10/01/2025  
**Design System**: Autazul

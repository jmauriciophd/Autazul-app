# 🏗️ Arquitetura do Sistema de Acesso Administrativo

## 📐 Diagrama de Fluxo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOGIN DO USUÁRIO                          │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ AuthScreen   │  →  Email + Senha                            │
│  └──────────────┘                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AUTENTICAÇÃO SUPABASE                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ supabase.auth.signInWithPassword()                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHCONTEXT.TSX                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ async function signIn(email, password)                   │  │
│  │                                                          │  │
│  │  1. Login no Supabase                                   │  │
│  │  2. Obter userData da API                               │  │
│  │  3. Verificar se email está em adminEmails[]           │  │
│  │  4. Adicionar isAdmin: true/false                       │  │
│  │  5. Salvar no state e localStorage                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ↓                 ↓
      ┌─────────────────┐   ┌─────────────────┐
      │  isAdmin: true  │   │ isAdmin: false  │
      └────────┬────────┘   └────────┬────────┘
               │                     │
               ↓                     ↓
┌──────────────────────────────────────────────────────────────────┐
│                    DASHBOARD RENDERING                            │
│                                                                   │
│  Admin User:                    Non-Admin User:                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │ Parent/Professional  │      │ Parent/Professional  │        │
│  │ Dashboard            │      │ Dashboard            │        │
│  │                      │      │                      │        │
│  │ Header Icons:        │      │ Header Icons:        │        │
│  │ [🔔] [🛡️] [👑] [🚪] │      │ [🔔] [🛡️] [🚪]     │        │
│  │          ↑           │      │     (sem coroa)      │        │
│  │     Admin Button     │      │                      │        │
│  └──────────┬───────────┘      └──────────────────────┘        │
└─────────────┼──────────────────────────────────────────────────┘
              │
              │ Click on 👑
              ↓
┌──────────────────────────────────────────────────────────────────┐
│                    CONDITIONAL RENDERING                          │
│                                                                   │
│  if (showAdminPanel && user?.isAdmin) {                          │
│    return <AdminPanel />                                         │
│  }                                                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                        ADMINPANEL.TSX                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Component Mount                                            │ │
│  │  ↓                                                         │ │
│  │ useEffect(() => loadSettings())                           │ │
│  │  ↓                                                         │ │
│  │ api.getAdminSettings()                                    │ │
│  │  ↓                                                         │ │
│  │ Backend checks if user is admin                           │ │
│  │  ↓                                                         │ │
│  │ Returns settings OR error 403                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ User Edits Settings                                        │ │
│  │  - Google Ads Code                                        │ │
│  │  - Banner URL                                             │ │
│  │  - Banner Link                                            │ │
│  │  ↓                                                         │ │
│  │ handleSave()                                               │ │
│  │  ↓                                                         │ │
│  │ api.updateAdminSettings()                                 │ │
│  │  ↓                                                         │ │
│  │ Backend validates & saves to KV store                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 🔐 Camadas de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
│                                                                  │
│  Layer 1: FRONTEND UI                                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Conditional rendering: {user?.isAdmin && ...}           │ │
│  │ • Visual elements only shown to admins                    │ │
│  │ • No direct access to AdminPanel without flag             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Layer 2: FRONTEND STATE                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Email verification in AuthContext                       │ │
│  │ • isAdmin flag in User object                             │ │
│  │ • localStorage protection                                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Layer 3: API AUTHENTICATION                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • JWT token required in all requests                     │ │
│  │ • Authorization header validation                         │ │
│  │ • Supabase Auth token verification                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Layer 4: BACKEND AUTHORIZATION                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • isAdmin(email) function validation                      │ │
│  │ • ADMIN_EMAILS whitelist check                            │ │
│  │ • Return 403 for unauthorized users                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↓                                      │
│  Layer 5: DATA PROTECTION                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • KV store access controlled                              │ │
│  │ • Admin settings separated from public settings           │ │
│  │ • Read-only public endpoint for non-admins                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 🗂️ Estrutura de Arquivos

```
autazul/
│
├── utils/
│   └── AuthContext.tsx
│       ├── Interface: User { ..., isAdmin?: boolean }
│       ├── adminEmails = [...]
│       ├── checkUser() → verifica isAdmin
│       └── signIn() → adiciona isAdmin
│
├── components/
│   ├── ParentDashboard.tsx
│   │   ├── Import: AdminPanel, Crown icon
│   │   ├── State: showAdminPanel
│   │   │   └── Botão 👑 (condicional: user?.isAdmin)
│   │   └── Render: if (showAdminPanel) { <AdminPanel /> }
│   │
│   ├── ProfessionalDashboard.tsx
│   │   ├── Import: AdminPanel, Crown icon
│   │   ├── State: showAdminPanel
│   │   ├── Botão 👑 (condicional: user?.isAdmin)
│   │   └── Render: if (showAdminPanel) { <AdminPanel /> }
│   │
│   └── AdminPanel.tsx
│       ├── loadSettings() → api.getAdminSettings()
│       ├── handleSave() → api.updateAdminSettings()
│       └── UI: Google Ads + Banner config
│
└── supabase/functions/server/
    └── index.tsx
        ├── ADMIN_EMAILS = [...]
        ├── isAdmin(email): boolean
        ├── GET /admin/settings → verificação isAdmin
        ├── PUT /admin/settings → verificação isAdmin
        └── GET /admin/public-settings → sem verificação
```

## 🔄 Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATA FLOW DIAGRAM                             │
└──────────────────────────────────────────────────────────────────┘

USER LOGIN
    ↓
[Email: admin@email.com]
    ↓
AUTHENTICATION
    ↓
┌─────────────────────────────┐
│ AuthContext.signIn()        │
│                             │
│ const adminEmails = [...]   │
│ const isAdmin =             │
│   adminEmails.includes(     │
│     email.toLowerCase()     │
│   )                         │
│                             │
│ userWithAdmin = {           │
│   ...userData,              │
│   isAdmin: true             │
│ }                           │
└─────────────┬───────────────┘
              │
              ├─→ setUser(userWithAdmin)
              │
              └─→ localStorage.setItem('user', JSON.stringify(userWithAdmin))

RENDER DASHBOARD
    ↓
┌─────────────────────────────┐
│ ParentDashboard             │
│                             │
│ const { user } = useAuth()  │
│                             │
│ {user?.isAdmin && (         │
│   <Button                   │
│     onClick={() =>          │
│       setShowAdminPanel()   │
│     }                       │
│   >                         │
│     <Crown />               │
│   </Button>                 │
│ )}                          │
└─────────────┬───────────────┘
              │
    USER CLICKS 👑
              ↓
┌─────────────────────────────┐
│ showAdminPanel = true       │
│                             │
│ if (showAdminPanel &&       │
│     user?.isAdmin) {        │
│   return <AdminPanel />     │
│ }                           │
└─────────────┬───────────────┘
              │
              ↓
LOAD ADMIN SETTINGS
    ↓
┌──────────────────────────────────────────┐
│ Frontend: api.getAdminSettings()         │
│     ↓                                    │
│ Request:                                 │
│ GET /admin/settings                      │
│ Headers: { Authorization: Bearer TOKEN } │
└─────────────┬────────────────────────────┘
              │
              ↓
┌──────────────────────────────────────────┐
│ Backend: /admin/settings route           │
│     ↓                                    │
│ 1. Extract token from header             │
│ 2. supabase.auth.getUser(token)          │
│ 3. if (!user) return 401                 │
│ 4. if (!isAdmin(user.email)) return 403  │
│ 5. settings = kv.get('admin:settings')   │
│ 6. return { settings }                   │
└─────────────┬────────────────────────────┘
              │
              ↓
┌──────────────────────────────────────────┐
│ AdminPanel displays settings             │
│                                          │
│ [Google Ads Code]                        │
│ [Banner URL]                             │
│ [Banner Link]                            │
│ [Save Button]                            │
└──────────────────────────────────────────┘

USER SAVES
    ↓
┌──────────────────────────────────────────┐
│ Frontend: api.updateAdminSettings()      │
│     ↓                                    │
│ Request:                                 │
│ PUT /admin/settings                      │
│ Body: { googleAdsCode, bannerUrl, ... }  │
│ Headers: { Authorization: Bearer TOKEN } │
└─────────────┬────────────────────────────┘
              │
              ↓
┌──────────────────────────────────────────┐
│ Backend: PUT /admin/settings             │
│     ↓                                    │
│ 1. Verify authentication                 │
│ 2. Verify isAdmin(user.email)            │
│ 3. kv.set('admin:settings', data)        │
│ 4. return { success: true }              │
└──────────────────────────────────────────┘
```

## 🎯 Pontos de Decisão

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION POINTS                               │
└─────────────────────────────────────────────────────────────────┘

1. LOGIN
   Email in adminEmails?
   ├─ YES → isAdmin = true
   └─ NO  → isAdmin = false/undefined

2. RENDER DASHBOARD
   user?.isAdmin === true?
   ├─ YES → Show Crown icon 👑
   └─ NO  → Hide Crown icon

3. CLICK CROWN
   showAdminPanel = true
   user?.isAdmin === true?
   ├─ YES → Render <AdminPanel />
   └─ NO  → Render normal dashboard (safety check)

4. LOAD SETTINGS
   Backend: isAdmin(user.email)?
   ├─ YES → Return settings
   └─ NO  → Return error 403

5. SAVE SETTINGS
   Backend: isAdmin(user.email)?
   ├─ YES → Save to KV store
   └─ NO  → Return error 403
```

## 📊 Estado da Aplicação

```typescript
// Global State (AuthContext)
{
  user: {
    id: "uuid",
    email: "admin@email.com",
    name: "Admin User",
    role: "parent" | "professional",
    isAdmin: true  // ← Key field
  },
  loading: false
}

// Component State (Dashboard)
{
  showAdminPanel: false,  // Toggles admin view
  // ... other dashboard states
}

// Component State (AdminPanel)
{
  loading: true,
  saving: false,
  googleAdsCode: "",
  bannerUrl: "",
  bannerLink: "",
  error: ""
}

// LocalStorage
{
  "auth_token": "jwt-token...",
  "user": "{\"id\":\"...\",\"isAdmin\":true}"
}
```

## 🔍 Validações em Cascata

```
User Action → Frontend Check → API Check → Backend Check → Database
                 ↓                ↓            ↓              ↓
              isAdmin?      Token valid?  isAdmin()?    Permissions?
                 ↓                ↓            ↓              ↓
              Show UI       Send request  Authorize     Read/Write
                              ↓                ↓              ↓
                         If invalid → 401  If not admin → 403
```

## 🛡️ Proteções Implementadas

| Tipo | Localização | Descrição |
|------|-------------|-----------|
| **Visual** | UI Components | Elementos admin só renderizam se `user?.isAdmin` |
| **State** | AuthContext | Email verificado contra lista hardcoded |
| **Route** | API Client | Token JWT em todas requisições |
| **Server** | Backend | Função `isAdmin()` valida email |
| **Data** | KV Store | Settings separados (admin vs public) |
| **Error** | Responses | 401 (não autenticado) e 403 (não autorizado) |

---

**Versão**: 1.0  
**Data**: 10/01/2025  
**Complexidade**: Média  
**Manutenibilidade**: Alta

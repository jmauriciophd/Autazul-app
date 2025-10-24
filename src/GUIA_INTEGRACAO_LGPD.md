# 🚀 Guia Rápido de Integração - Painéis LGPD

## 📋 Resumo

Este guia mostra como integrar os painéis LGPD criados no sistema Autazul.

---

## ✅ O que foi implementado

### 1. Funções da API (`/utils/api.ts`)
- ✅ `exportUserData()` - Exporta dados do usuário
- ✅ `requestAccountDeletion(reason)` - Solicita exclusão
- ✅ `requestDataOpposition(dataType, reason)` - Solicita oposição
- ✅ `updateConsent(consent)` - Atualiza consentimento
- ✅ `getPrivacyPolicy()` - Busca política de privacidade
- ✅ `getTerms()` - Busca termos de serviço
- ✅ `getDeletionRequests()` - Lista solicitações de exclusão (admin)
- ✅ `getOppositionRequests()` - Lista solicitações de oposição (admin)
- ✅ `approveDeletionRequest(id)` - Aprova exclusão (admin)
- ✅ `getAuditLogs()` - Busca logs de auditoria (admin)
- ✅ `getSystemBackup()` - Gera backup (admin)
- ✅ `getSystemHealth()` - Monitora saúde (admin)
- ✅ `updatePrivacyPolicy(content)` - Atualiza política (admin)
- ✅ `updateTerms(content)` - Atualiza termos (admin)

### 2. Rotas do Servidor (`/supabase/functions/server/index.tsx`)
- ✅ `GET /lgpd/privacy-policy` - Retorna política pública
- ✅ `GET /lgpd/terms` - Retorna termos públicos
- ✅ `POST /user/export-data` - Exporta dados do usuário
- ✅ `POST /user/request-deletion` - Solicita exclusão
- ✅ `POST /user/request-opposition` - Solicita oposição
- ✅ `PUT /user/update-consent` - Atualiza consentimento
- ✅ `GET /admin/deletion-requests` - Lista solicitações
- ✅ `GET /admin/opposition-requests` - Lista oposições
- ✅ `POST /admin/deletion-requests/:id/approve` - Aprova exclusão
- ✅ `GET /admin/audit-logs` - Logs de auditoria
- ✅ `GET /admin/backup` - Backup do sistema
- ✅ `GET /admin/system-health` - Saúde do sistema
- ✅ `PUT /admin/privacy-policy` - Atualiza política
- ✅ `PUT /admin/terms` - Atualiza termos

### 3. Componentes
- ✅ `/components/LGPDPanel.tsx` - Painel para usuários
- ✅ `/components/LGPDAdminPanel.tsx` - Painel para administradores

---

## 🎯 Como Integrar no ParentDashboard

### Opção 1: Adicionar ao Menu de Configurações

```tsx
// No ParentDashboard.tsx, adicionar import:
import { LGPDPanel } from './LGPDPanel'

// Adicionar estado para controlar visualização:
const [showLGPD, setShowLGPD] = useState(false)

// Adicionar botão no menu (perto de SecuritySettings):
<Button
  variant="ghost"
  className="w-full justify-start"
  onClick={() => setShowLGPD(true)}
>
  <Shield className="w-4 h-4 mr-2" />
  Privacidade e Dados
</Button>

// Adicionar Dialog para mostrar o painel:
<Dialog open={showLGPD} onOpenChange={setShowLGPD}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
    <LGPDPanel />
  </DialogContent>
</Dialog>
```

### Opção 2: Adicionar como Seção Principal

```tsx
// No ParentDashboard.tsx, adicionar import:
import { LGPDPanel } from './LGPDPanel'

// Adicionar ao layout principal:
{selectedChild && (
  <div className="space-y-4">
    {/* Calendário e eventos */}
    
    {/* Nova seção LGPD */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacidade e Proteção de Dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <LGPDPanel />
      </CardContent>
    </Card>
  </div>
)}
```

### Opção 3: Adicionar como Aba (mais recomendado)

Se o ParentDashboard usar Tabs:

```tsx
import { LGPDPanel } from './LGPDPanel'

// Dentro das Tabs:
<TabsList>
  <TabsTrigger value="calendar">Calendário</TabsTrigger>
  <TabsTrigger value="events">Eventos</TabsTrigger>
  <TabsTrigger value="professionals">Profissionais</TabsTrigger>
  <TabsTrigger value="lgpd">Privacidade</TabsTrigger> {/* Nova aba */}
</TabsList>

<TabsContent value="lgpd">
  <LGPDPanel />
</TabsContent>
```

---

## 🎯 Como Integrar no AdminPanel

### Adicionar Aba LGPD

```tsx
// No AdminPanel.tsx, adicionar import:
import { LGPDAdminPanel } from './LGPDAdminPanel'

// Adicionar aba nas TabsList:
<TabsList className="grid w-full grid-cols-4"> {/* Ajustar cols se necessário */}
  <TabsTrigger value="stats">Estatísticas</TabsTrigger>
  <TabsTrigger value="settings">Configurações</TabsTrigger>
  <TabsTrigger value="admins">Administradores</TabsTrigger>
  <TabsTrigger value="lgpd">LGPD</TabsTrigger> {/* Nova aba */}
</TabsList>

// Adicionar conteúdo da aba:
<TabsContent value="lgpd">
  <LGPDAdminPanel />
</TabsContent>
```

---

## 🎨 Exemplo Completo de Integração

### ParentDashboard com LGPD

```tsx
import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent } from './ui/dialog'
import { LGPDPanel } from './LGPDPanel'

export function ParentDashboard() {
  const [showLGPD, setShowLGPD] = useState(false)
  
  // ... resto do código
  
  return (
    <div className="min-h-screen">
      {/* Header com menu */}
      <header>
        {/* ... outros botões ... */}
        
        <Button
          variant="ghost"
          onClick={() => setShowLGPD(true)}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Privacidade
        </Button>
      </header>
      
      {/* Conteúdo principal */}
      <main>
        {/* ... calendário, eventos, etc ... */}
      </main>
      
      {/* Dialog LGPD */}
      <Dialog open={showLGPD} onOpenChange={setShowLGPD}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <LGPDPanel />
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

### AdminPanel com LGPD

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { LGPDAdminPanel } from './LGPDAdminPanel'

export function AdminPanel() {
  return (
    <div className="space-y-6">
      <h2>Painel Administrativo</h2>
      
      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="admins">Administradores</TabsTrigger>
          <TabsTrigger value="lgpd">LGPD & Conformidade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          {/* Estatísticas */}
        </TabsContent>
        
        <TabsContent value="settings">
          {/* Configurações */}
        </TabsContent>
        
        <TabsContent value="admins">
          {/* Administradores */}
        </TabsContent>
        
        <TabsContent value="lgpd">
          <LGPDAdminPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 📝 Políticas Estáticas vs. Dinâmicas

### Problema Atual
A tela de cadastro (`AuthScreen.tsx`) usa políticas **estáticas** embutidas no código:

```tsx
// AuthScreen.tsx - linhas 277-294
<p className=\"text-sm leading-5\">
  A Autazul é comprometida em proteger a privacidade...
</p>
```

### Solução (Opcional)
Carregar políticas do banco ao invés de usar versões estáticas:

```tsx
// AuthScreen.tsx
import { useState, useEffect } from 'react'
import { api } from '../utils/api'

export function AuthScreen() {
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState('')
  const [termsContent, setTermsContent] = useState('')
  
  // Carregar políticas ao montar componente
  useEffect(() => {
    loadPolicies()
  }, [])
  
  async function loadPolicies() {
    try {
      // Usar API pública (sem autenticação)
      const [policyRes, termsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a07d0a8e/lgpd/privacy-policy`).then(r => r.json()),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a07d0a8e/lgpd/terms`).then(r => r.json())
      ])
      
      setPrivacyPolicyContent(policyRes.privacyPolicy || FALLBACK_POLICY)
      setTermsContent(termsRes.terms || FALLBACK_TERMS)
    } catch (error) {
      console.error('Erro ao carregar políticas:', error)
      // Usar políticas estáticas como fallback
      setPrivacyPolicyContent(FALLBACK_POLICY)
      setTermsContent(FALLBACK_TERMS)
    }
  }
  
  // ... resto do componente
}

const FALLBACK_POLICY = `A Autazul é comprometida em proteger...`
const FALLBACK_TERMS = `Bem-vindo(a) aos Termos de Serviço...`
```

**Vantagens:**
- Admins podem atualizar políticas sem mexer no código
- Versão única da verdade (DRY - Don't Repeat Yourself)
- Políticas sempre sincronizadas

**Desvantagens:**
- Requer chamada à API ao carregar tela
- Precisa de fallback caso API falhe

**Recomendação:** Implementar quando o sistema estiver estável em produção.

---

## ✅ Checklist de Integração

### Backend (✅ Completo)
- [x] Rotas da API implementadas
- [x] Funções de auditoria
- [x] Políticas padrão definidas
- [x] Validações de segurança

### Frontend - Componentes (✅ Completo)
- [x] LGPDPanel criado
- [x] LGPDAdminPanel criado
- [x] Funções da API adicionadas

### Frontend - Integração (⏳ Pendente)
- [ ] Integrar LGPDPanel no ParentDashboard
- [ ] Integrar LGPDAdminPanel no AdminPanel
- [ ] Testar fluxos de solicitação
- [ ] Testar aprovação de exclusão
- [ ] Testar exportação de dados
- [ ] Testar edição de políticas

### Testes (⏳ Recomendado)
- [ ] Testar exportação de dados (download JSON)
- [ ] Testar solicitação de exclusão
- [ ] Testar solicitação de oposição
- [ ] Testar aprovação admin de exclusão
- [ ] Testar edição de política de privacidade
- [ ] Testar edição de termos de serviço
- [ ] Testar logs de auditoria
- [ ] Testar backup do sistema

---

## 🔍 Onde Adicionar os Painéis

### Para Usuários (LGPDPanel)
**Localização recomendada:** ParentDashboard
- **Opção 1:** Menu lateral (mais discreto)
- **Opção 2:** Aba dedicada (mais visível)
- **Opção 3:** Dialog a partir de botão (mais flexível) ⭐ **Recomendado**

### Para Admins (LGPDAdminPanel)
**Localização recomendada:** AdminPanel
- **Opção 1:** Nova aba "LGPD" ⭐ **Recomendado**
- **Opção 2:** Seção no final do painel
- **Opção 3:** Painel separado (mais complexo)

---

## 📞 Suporte

Para dúvidas sobre a integração:
- Documentação completa: `/LGPD_IMPLEMENTACAO_COMPLETA.md`
- Documentação de segurança: `/SEGURANCA_PRIVACIDADE_LGPD.md`

---

**Status:** ✅ Backend Completo / ⏳ Integração Frontend Pendente  
**Próximo Passo:** Integrar componentes no ParentDashboard e AdminPanel  
**Tempo Estimado:** 15-30 minutos

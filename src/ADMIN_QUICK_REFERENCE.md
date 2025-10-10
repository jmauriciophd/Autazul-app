# 🚀 Referência Rápida - Acesso Administrativo

## 👥 Usuários Admin Autorizados

```
jmauriciophd@gmail.com
webservicesbsb@gmail.com
```

## 🔑 Como Adicionar Novo Admin

### 1. Frontend - `/utils/AuthContext.tsx`
```typescript
const adminEmails = [
  'jmauriciophd@gmail.com', 
  'webservicesbsb@gmail.com',
  'NOVO_EMAIL@AQUI.COM'  // ← Adicionar
]
```

### 2. Backend - `/supabase/functions/server/index.tsx`
```typescript
const ADMIN_EMAILS = [
  'jmauriciophd@gmail.com', 
  'webservicesbsb@gmail.com',
  'NOVO_EMAIL@AQUI.COM'  // ← Adicionar
]
```

⚠️ **IMPORTANTE**: Adicionar em AMBOS os lugares!

## 🎯 Fluxo de Acesso

```mermaid
Login → Email verificado → isAdmin=true → Ícone 👑 aparece → Click → AdminPanel
```

## 🛠️ Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `/utils/AuthContext.tsx` | Adicionado campo `isAdmin` + verificação de email |
| `/components/ParentDashboard.tsx` | Botão admin + renderização condicional |
| `/components/ProfessionalDashboard.tsx` | Botão admin + renderização condicional |
| `/components/AdminPanel.tsx` | Sem alterações (já existia) |

## 📍 Localização do Botão Admin

**Header do Dashboard** (canto superior direito):
```
[Logo] [Nome] [🔔 Notificações] [🛡️ Segurança] [👑 Admin] [🚪 Sair]
                                                    ↑
                                            Apenas para admins
```

## 🔐 Verificações de Segurança

### Frontend
- ✅ Renderização condicional: `{user?.isAdmin && <AdminButton />}`
- ✅ Verificação de email (case-insensitive)
- ✅ Armazenamento em localStorage

### Backend
- ✅ Função `isAdmin(email)` verifica autorização
- ✅ Rotas protegidas retornam 403 para não-admins
- ✅ Token JWT requerido em todas requisições

## 🧪 Teste Rápido

```bash
# 1. Login
Email: jmauriciophd@gmail.com
Senha: [sua senha]

# 2. Verificar no Console
JSON.parse(localStorage.getItem('user')).isAdmin
# Deve retornar: true

# 3. Procurar ícone 👑 no header

# 4. Clicar e acessar AdminPanel
```

## 🎨 Identificação Visual

- **Ícone**: 👑 Crown (coroa)
- **Cor**: Amarelo/Dourado (`#eab308`)
- **Localização**: Header, à direita das notificações
- **Tooltip**: "Painel Administrativo"

## 📊 Estrutura de Dados

```typescript
// User Object
{
  id: string
  email: string
  name: string
  role: 'parent' | 'professional'
  isAdmin: boolean  // ← Novo campo
}
```

## 🔄 Estados do Dashboard

```typescript
// Normal
<ParentDashboard /> ou <ProfessionalDashboard />

// Admin Mode (quando showAdminPanel = true)
<AdminHeader />
<AdminPanel />
```

## 📞 Comandos de Debug

```javascript
// Console do navegador

// Ver dados do usuário
JSON.parse(localStorage.getItem('user'))

// Verificar token
localStorage.getItem('auth_token')

// Forçar reload de admin
localStorage.setItem('user', JSON.stringify({
  ...JSON.parse(localStorage.getItem('user')),
  isAdmin: true
}))
window.location.reload()
```

## ⚡ Atalhos

| Ação | Método |
|------|--------|
| Acessar Admin | Clique no ícone 👑 |
| Voltar | Botão "Voltar ao Dashboard" |
| Logout do Admin | Mesmo botão de logout normal |

## 🎭 Perfis de Teste

```javascript
// Admin Parent
Email: jmauriciophd@gmail.com
Role: parent
isAdmin: true

// Admin Professional  
Email: webservicesbsb@gmail.com
Role: professional
isAdmin: true

// Usuário Normal
Email: qualquer@outro.com
Role: parent/professional
isAdmin: false
```

## 🚨 Solução de Problemas

| Problema | Solução |
|----------|---------|
| Ícone não aparece | Logout + Login novamente |
| Erro 403 | Verificar email nas listas |
| Não salva config | Verificar token válido |
| Admin desapareceu | Limpar localStorage e logar |

## 📈 Métricas de Sucesso

- ✅ Admins conseguem acessar painel
- ✅ Não-admins NÃO conseguem acessar
- ✅ Navegação fluida entre dashboard e admin
- ✅ Configurações salvam corretamente
- ✅ Sem vulnerabilidades de acesso

## 🔗 Links Relacionados

- [Documentação Completa](./ADMIN_ACCESS_DOCUMENTATION.md)
- [Guia de Testes](./TESTE_ACESSO_ADMIN.md)
- [AdminPanel Component](./components/AdminPanel.tsx)

---

**Versão**: 1.0  
**Atualizado**: 10/01/2025

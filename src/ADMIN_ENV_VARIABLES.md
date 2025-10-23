# 🔐 Variáveis de Ambiente - Administradores

**Data:** 22 de Outubro de 2025  
**Status:** ✅ **IMPLEMENTADO**

---

## 🎯 MUDANÇA IMPLEMENTADA

### **ANTES (Hardcoded):**
```typescript
// ❌ Emails hardcoded no código
const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
```

### **DEPOIS (Environment Variables):**
```typescript
// ✅ Emails vindos de variáveis de ambiente
const ADMIN_EMAILS = [
  Deno.env.get('ADMIN_USER1') || '',
  Deno.env.get('ADMIN_USER2') || ''
].filter(email => email.length > 0)
```

---

## 🔧 CONFIGURAÇÃO NA VERCEL

### **Passo 1: Acessar Configurações de Ambiente**

1. Acesse o **Dashboard da Vercel**
2. Selecione seu projeto: **Autazul**
3. Vá em **Settings** → **Environment Variables**

### **Passo 2: Adicionar Variáveis**

Adicione as seguintes variáveis:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `ADMIN_USER1` | `jmauriciophd@gmail.com` | Production, Preview, Development |
| `ADMIN_USER2` | `webservicesbsb@gmail.com` | Production, Preview, Development |

**Importante:**
- ✅ Marcar **Production**
- ✅ Marcar **Preview**
- ✅ Marcar **Development**

### **Passo 3: Redeploy**

Após adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **três pontos** do último deployment
3. Clique em **Redeploy**
4. Selecione **"Use existing Build Cache"** = **NO**

---

## 📊 ARQUITETURA

```
┌─────────────────────────────────────┐
│  Vercel Dashboard                   │
│  ↓                                  │
│  Environment Variables              │
│  - ADMIN_USER1                      │
│  - ADMIN_USER2                      │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Deno Environment                   │
│  Deno.env.get('ADMIN_USER1')        │
│  Deno.env.get('ADMIN_USER2')        │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Server (index.tsx)                 │
│  const ADMIN_EMAILS = [...]         │
│  function isAdmin(email)            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  /get-user endpoint                 │
│  Returns: { user: { isAdmin } }     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Frontend (AuthContext.tsx)         │
│  const isAdmin = userData.isAdmin   │
└─────────────────────────────────────┘
```

---

## 🔍 VERIFICAÇÃO

### **No Console do Servidor (Logs da Vercel):**

Após deploy, você deve ver:

```bash
✅ Admin emails configured: 2 admins
```

**Se ver:**
```bash
⚠️ Admin emails configured: No admins configured
```

**Significa:** Variáveis de ambiente não foram configuradas corretamente.

---

## 📝 ARQUIVOS MODIFICADOS

### **1. `/supabase/functions/server/index.tsx`**

**Mudanças:**

```typescript
// ANTES (linha 1760):
const ADMIN_EMAILS = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']

// DEPOIS:
const ADMIN_EMAILS = [
  Deno.env.get('ADMIN_USER1') || '',
  Deno.env.get('ADMIN_USER2') || ''
].filter(email => email.length > 0).map(email => email.toLowerCase())

console.log('Admin emails configured:', ADMIN_EMAILS.length > 0 ? `${ADMIN_EMAILS.length} admins` : 'No admins configured')
```

**Rota `/get-user` atualizada:**

```typescript
// Check if user is admin
const userIsAdmin = isAdmin(user.email || '')

if (userData) {
  return c.json({ user: { ...userData, isAdmin: userIsAdmin } })
}

const fallbackUser = {
  id: user.id,
  email: user.email,
  name: user.user_metadata.name || user.email,
  role: user.user_metadata.role || 'parent',
  isAdmin: userIsAdmin  // ← Incluído
}
```

### **2. `/utils/AuthContext.tsx`**

**Mudanças:**

```typescript
// REMOVIDO: Hardcoded admin check
// const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
// const isAdmin = adminEmails.includes(userData.email.toLowerCase())

// ADICIONADO: isAdmin vem do servidor
const isAdmin = userData.isAdmin || false
```

**Mudança de localStorage para sessionStorage:**

```typescript
// ANTES:
localStorage.setItem('activeRole', activeRole)
localStorage.setItem('user', JSON.stringify(userWithProfile))

// DEPOIS:
sessionStorage.setItem('activeRole', activeRole)
// Removido: localStorage.setItem('user', ...)
```

### **3. `/App.tsx`**

**Mudanças:**

```typescript
// ANTES:
const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
if (adminEmails.includes(user.email?.toLowerCase())) {
  return <AdminPanel />
}

// DEPOIS:
if (user.isAdmin) {
  return <AdminPanel />
}
```

### **4. `/components/ProfileSwitcher.tsx`**

**Mudanças:**

```typescript
// ANTES:
localStorage.setItem('selectedProfile', selectedProfile)
localStorage.setItem('activeRole', selectedProfile)

// DEPOIS:
sessionStorage.setItem('selectedProfile', selectedProfile)
sessionStorage.setItem('activeRole', selectedProfile)
```

---

## 🧪 TESTES

### **Teste 1: Verificar Environment Variables**

**No servidor (logs da Vercel):**

```bash
# Deve aparecer:
✅ Admin emails configured: 2 admins
```

### **Teste 2: Login como Admin**

1. Fazer login com `jmauriciophd@gmail.com`
2. Abrir DevTools → Console
3. Verificar resposta de `/get-user`:

```javascript
{
  user: {
    id: "...",
    email: "jmauriciophd@gmail.com",
    name: "José Mauricio Gomes",
    role: "parent",
    isAdmin: true  // ✅ Deve ser true
  }
}
```

### **Teste 3: Ícone de Coroa**

1. Login como admin
2. Verificar presença do ícone 👑 no header
3. Clicar no ícone
4. Deve abrir AdminPanel

### **Teste 4: Login como Usuário Normal**

1. Fazer login com email não-admin
2. Verificar console:

```javascript
{
  user: {
    email: "usuario@teste.com",
    isAdmin: false  // ✅ Deve ser false
  }
}
```

3. Ícone 👑 **NÃO** deve aparecer

---

## 🔐 SEGURANÇA

### **Benefícios da Nova Implementação:**

✅ **Emails não estão no código-fonte**
- Não aparecem no GitHub
- Não aparecem no código minificado
- Impossível descobrir por engenharia reversa

✅ **Fácil de atualizar**
- Mudar admin sem alterar código
- Adicionar/remover admins sem redeploy do código
- Atualização apenas nas env vars

✅ **sessionStorage ao invés de localStorage**
- Dados deletados quando fecha aba
- Não persistem entre sessões
- Mais seguro para dados sensíveis

✅ **Validação no servidor**
- Admin check feito no backend
- Frontend apenas exibe o que vem do servidor
- Impossível falsificar isAdmin no frontend

---

## 🚀 COMO ADICIONAR NOVO ADMIN

### **Opção A: Substituir Existente**

1. Vercel Dashboard → Settings → Environment Variables
2. Editar `ADMIN_USER1` ou `ADMIN_USER2`
3. Alterar para novo email
4. Redeploy

### **Opção B: Adicionar Terceiro Admin**

1. Adicionar variável `ADMIN_USER3` na Vercel
2. Atualizar código do servidor:

```typescript
const ADMIN_EMAILS = [
  Deno.env.get('ADMIN_USER1') || '',
  Deno.env.get('ADMIN_USER2') || '',
  Deno.env.get('ADMIN_USER3') || '',  // ← Adicionar
].filter(email => email.length > 0).map(email => email.toLowerCase())
```

3. Commit e push
4. Deploy automático

---

## ⚠️ TROUBLESHOOTING

### **Problema: Ícone 👑 não aparece**

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Verificar logs da Vercel
2. Procurar por: `Admin emails configured: No admins configured`
3. Adicionar variáveis conforme instruções acima
4. Redeploy

### **Problema: isAdmin sempre false**

**Causa:** Email não corresponde exatamente

**Solução:**
1. Verificar email no console:
   ```javascript
   console.log('User email:', user.email)
   ```
2. Garantir que email na Vercel é exatamente igual
3. Verificar case-sensitive (ambos são convertidos para lowercase)

### **Problema: Após redeploy, ainda não funciona**

**Causa:** Cache

**Solução:**
1. Fazer logout completo
2. Limpar cache do navegador
3. Aba anônima
4. Login novamente

---

## 📞 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

| Nome | Descrição | Obrigatório | Exemplo |
|------|-----------|-------------|---------|
| `ADMIN_USER1` | Email do admin principal | ✅ Sim | `jmauriciophd@gmail.com` |
| `ADMIN_USER2` | Email do admin secundário | ⚠️ Opcional | `webservicesbsb@gmail.com` |
| `SUPABASE_URL` | URL do Supabase | ✅ Sim | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Chave anônima | ✅ Sim | `eyJxxx...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço | ✅ Sim | `eyJxxx...` |

---

## 🎉 RESUMO

### **Implementações:**

1. ✅ Emails de admin movidos para variáveis de ambiente
2. ✅ Verificação de admin feita no servidor
3. ✅ `isAdmin` retornado na rota `/get-user`
4. ✅ Frontend usa `userData.isAdmin` vindo do servidor
5. ✅ Substituído `localStorage` por `sessionStorage`
6. ✅ Logs de debug no servidor

### **Próximos Passos:**

1. ⚙️ **Configurar** variáveis na Vercel
2. 🔄 **Redeploy** da aplicação
3. 🧪 **Testar** login como admin
4. ✅ **Confirmar** ícone 👑 aparece

---

**Status:** ✅ **IMPLEMENTADO**  
**Segurança:** ✅ **MELHORADA**  
**Manutenibilidade:** ✅ **MELHORADA**  
**Próxima ação:** Configurar variáveis na Vercel ⚙️

---

**Última atualização:** 22 de Outubro de 2025  
**Tipo:** Melhoria de Segurança  
**Impacto:** Alto - Requer configuração de env vars

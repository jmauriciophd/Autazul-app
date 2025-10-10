# Documentação de Acesso Administrativo - Sistema Autazul

## Visão Geral

Este documento descreve as implementações realizadas para permitir que usuários administradores acessem o painel de gestão (AdminPanel) do sistema Autazul.

## 🔐 Controle de Acesso

### Usuários Administradores

Os seguintes emails têm privilégios de administrador no sistema:
- `jmauriciophd@gmail.com`
- `webservicesbsb@gmail.com`

### Como Funciona

1. **Identificação de Administradores**: Durante o login ou verificação de sessão, o sistema verifica se o email do usuário está na lista de administradores.

2. **Marcação de Usuário**: Se o email corresponder, o usuário recebe a propriedade `isAdmin: true` em seu objeto de dados.

3. **Persistência**: A informação de administrador é armazenada no localStorage junto com os dados do usuário.

## 🛠️ Tecnologias Utilizadas

- **React**: Framework principal para componentes
- **TypeScript**: Tipagem estática
- **Supabase**: Autenticação e backend
- **Lucide React**: Ícones (Crown icon para admin)
- **Tailwind CSS**: Estilização

## 📝 Alterações Implementadas

### 1. AuthContext.tsx (`/utils/AuthContext.tsx`)

**Modificações:**
- Adicionado campo `isAdmin?: boolean` à interface `User`
- Implementada verificação de email em `checkUser()` e `signIn()`
- Lista de emails de administradores definida localmente

```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'parent' | 'professional'
  isAdmin?: boolean  // ← Novo campo
}

// Verificação de admin
const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
const isAdmin = adminEmails.includes(userData.email.toLowerCase())
```

### 2. ParentDashboard.tsx (`/components/ParentDashboard.tsx`)

**Modificações:**
- Importado componente `AdminPanel` e ícone `Crown`
- Adicionado estado `showAdminPanel`
- Botão de acesso ao painel admin no header (visível apenas para admins)
- Renderização condicional do AdminPanel

**Funcionalidades:**
- Ícone de coroa dourada no header (apenas para admins)
- Ao clicar, exibe o painel administrativo em tela cheia
- Botão "Voltar ao Dashboard" para retornar

### 3. ProfessionalDashboard.tsx (`/components/ProfessionalDashboard.tsx`)

**Modificações:**
- Mesmas alterações do ParentDashboard
- Garantia de acesso administrativo para profissionais que sejam admins

### 4. AdminPanel.tsx (`/components/AdminPanel.tsx`)

**Estado Atual:**
- Componente já existente, sem modificações necessárias
- Já possui verificações de permissão no backend
- Interface para gestão de Google Ads e banners publicitários

## 🔒 Segurança Implementada

### Frontend

1. **Renderização Condicional**: Componentes admin só aparecem se `user?.isAdmin === true`
2. **Validação de Email**: Verificação case-insensitive dos emails
3. **Armazenamento Seguro**: Dados salvos no localStorage após autenticação

### Backend

1. **Verificação de Email**: O servidor verifica se o email está na lista de admins (`ADMIN_EMAILS`)
2. **Rotas Protegidas**: Endpoints admin retornam erro 403 para não-admins
3. **Autorização por Token**: Todas as requisições requerem token válido

```typescript
// No servidor (index.tsx)
const ADMIN_EMAILS = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']

function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
```

## 🧪 Testes e Validação

### Teste 1: Acesso de Usuário Admin

**Passos:**
1. Fazer login com `jmauriciophd@gmail.com` ou `webservicesbsb@gmail.com`
2. Verificar presença do ícone de coroa dourada no header
3. Clicar no ícone de coroa
4. Confirmar exibição do AdminPanel
5. Verificar possibilidade de editar configurações
6. Clicar em "Voltar ao Dashboard"
7. Confirmar retorno ao dashboard principal

**Resultado Esperado:** ✅ Acesso completo ao painel administrativo

### Teste 2: Acesso de Usuário Não-Admin

**Passos:**
1. Fazer login com qualquer outro email
2. Verificar AUSÊNCIA do ícone de coroa no header
3. Tentar acessar diretamente endpoints admin via API

**Resultado Esperado:** ✅ Sem acesso ao painel, erro 403 em requisições

### Teste 3: Segurança de Dados

**Passos:**
1. Login como admin
2. Modificar configurações de Google Ads e banner
3. Salvar alterações
4. Fazer logout
5. Login como usuário normal
6. Verificar que configurações públicas são visíveis
7. Confirmar que não é possível editar

**Resultado Esperado:** ✅ Configurações salvas e protegidas

### Teste 4: Persistência de Sessão

**Passos:**
1. Login como admin
2. Recarregar página
3. Verificar manutenção do status de admin
4. Verificar presença do ícone de coroa

**Resultado Esperado:** ✅ Status de admin mantido após reload

## 📊 Estrutura de Dados

### Objeto User (Frontend)
```typescript
{
  id: "uuid-do-usuario",
  email: "jmauriciophd@gmail.com",
  name: "Nome do Usuário",
  role: "parent" | "professional",
  isAdmin: true  // Apenas para admins
}
```

### LocalStorage
```json
{
  "auth_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": "{\"id\":\"...\",\"email\":\"...\",\"isAdmin\":true}"
}
```

## 🚀 Instruções de Uso

### Para Administradores

1. **Login**: Use um dos emails autorizados
2. **Acesso ao Painel**: Clique no ícone de coroa dourada (👑) no canto superior direito
3. **Gestão de Anúncios**:
   - Seção "Google Ads": Cole o código JavaScript do Google Ads
   - Seção "Banner": Adicione URL da imagem e link de destino
4. **Salvar**: Clique em "Salvar Configurações"
5. **Retornar**: Use "Voltar ao Dashboard" para sair do painel admin

### Para Desenvolvedores

#### Adicionar Novo Administrador

**1. Frontend (`/utils/AuthContext.tsx`):**
```typescript
const adminEmails = [
  'jmauriciophd@gmail.com', 
  'webservicesbsb@gmail.com',
  'novo-admin@email.com'  // ← Adicionar aqui
]
```

**2. Backend (`/supabase/functions/server/index.tsx`):**
```typescript
const ADMIN_EMAILS = [
  'jmauriciophd@gmail.com', 
  'webservicesbsb@gmail.com',
  'novo-admin@email.com'  // ← Adicionar aqui
]
```

**IMPORTANTE**: Sempre adicione em ambos os lugares!

## 🔍 Debugging

### Verificar Status de Admin

No console do navegador:
```javascript
// Verificar dados do usuário
const user = JSON.parse(localStorage.getItem('user'))
console.log('Is Admin:', user?.isAdmin)

// Verificar email
console.log('Email:', user?.email)
```

### Logs do Sistema

O sistema registra as seguintes informações:
- Login de usuários
- Verificação de sessão
- Tentativas de acesso a rotas admin
- Erros de autorização

## ⚠️ Considerações de Segurança

1. **Não Exponha a Lista de Admins**: A lista está hardcoded mas não é exposta publicamente
2. **Use HTTPS**: Todas as comunicações devem ser via HTTPS
3. **Validação Dupla**: Frontend E backend validam permissões
4. **Tokens Seguros**: Tokens de sessão gerenciados pelo Supabase
5. **Case Insensitive**: Emails comparados em lowercase para evitar bypass

## 🐛 Problemas Conhecidos e Soluções

### Problema: Ícone não aparece após login
**Solução**: Recarregue a página ou faça logout/login novamente

### Problema: Erro 403 ao acessar painel
**Solução**: Verifique se o email está corretamente cadastrado nas duas listas (frontend e backend)

### Problema: Configurações não salvam
**Solução**: Verifique logs do servidor e token de autenticação

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs do console do navegador
2. Verifique os logs do servidor Supabase
3. Confirme que o email está na lista de administradores
4. Entre em contato com o time de desenvolvimento

## 📅 Histórico de Versões

- **v1.0** (2025-01-10): Implementação inicial do sistema de acesso administrativo
  - Verificação de emails administradores
  - Interface de acesso ao AdminPanel
  - Documentação completa
  - Testes de segurança

---

**Última Atualização**: 10 de Janeiro de 2025
**Mantido por**: Equipe Autazul

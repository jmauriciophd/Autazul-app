# 📋 Documentação: Sistema de Perfis e Status de Convites

## ⚠️ ATENÇÃO: DOCUMENTO DESATUALIZADO

**Este documento foi substituído por**: [SISTEMA_PERFIS_DOC.md](./SISTEMA_PERFIS_DOC.md)

O sistema de perfis foi atualizado com as seguintes mudanças:
- ✅ Perfil base é sempre "Pai/Responsável"
- ✅ Seleção de perfil apenas no **login** (não no cadastro)
- ✅ Perfil persiste entre sessões
- ✅ Troca de perfil disponível dentro do sistema

Consulte a nova documentação para informações atualizadas.

---

## 🎯 Objetivo (VERSÃO ANTIGA)

~~Implementar um sistema que permite aos usuários escolherem entre perfis de "Pai/Responsável" ou "Profissional" durante o cadastro~~, e exibir status detalhados de convites de profissionais na interface dos pais.

---

## ✨ Funcionalidades Implementadas

### 1. **Seleção de Perfil no Cadastro** ✅

Quando um usuário se cadastra, ele pode escolher entre dois tipos de perfil:

#### Opções Disponíveis:
- **👨‍👩‍👧 Pai/Responsável**: Para pais, mães ou responsáveis por crianças autistas
- **🩺 Profissional**: Para psicólogos, médicos, terapeutas e outros profissionais da saúde

#### Como Funciona:
1. Na tela de cadastro, o usuário vê duas opções lado a lado
2. Cada opção tem um ícone distintivo e descrição
3. A opção selecionada fica destacada com borda azul (#15C3D6)
4. Texto explicativo abaixo das opções guia o usuário
5. Padrão: "Pai/Responsável" (caso o usuário não selecione)

#### Visual:
```
┌─────────────────────────────────────────────┐
│  Tipo de Perfil                             │
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ 👨‍👩‍👧            │  │ 🩺            │       │
│  │ Pai/         │  │ Profissional │       │
│  │ Responsável  │  │              │       │
│  └──────────────┘  └──────────────┘       │
│                                             │
│  Escolha esta opção se você é pai, mãe    │
│  ou responsável por uma criança autista    │
└─────────────────────────────────────────────┘
```

---

### 2. **Status de Convites de Profissionais** ✅

Na tela de pais, a seção "Profissionais" agora exibe status detalhados:

#### Status Implementados:

##### 🟢 **Ativo** (Verde #22c55e)
- Profissional aceitou o convite
- Está vinculado ao filho
- Pode acessar e registrar eventos

```
┌─────────────────────────────────────────┐
│ Dr. João Silva          [🟢 Ativo]     │
│ Psicólogo                               │
│ joao.silva@email.com                    │
└─────────────────────────────────────────┘
```

##### 🟡 **Convite Pendente** (Amarelo #eab308)
- Convite foi enviado
- Profissional ainda não aceitou
- Aguardando resposta

```
┌─────────────────────────────────────────┐
│ Dra. Maria Santos  [🟡 Convite Pendente]│
│ Terapeuta Ocupacional                    │
│ maria.santos@email.com                   │
│ ℹ️ Aguardando aceitação do profissional  │
└─────────────────────────────────────────┘
```

##### 🔴 **Recusado** (Vermelho)
- Profissional recusou o convite
- Não tem acesso ao sistema

```
┌─────────────────────────────────────────┐
│ Dr. Pedro Costa      [🔴 Recusado]     │
│ Fonoaudiólogo                           │
│ pedro.costa@email.com                   │
└─────────────────────────────────────────┘
```

#### Mensagem quando não há profissionais:
```
┌─────────────────────────────────────────┐
│                                         │
│    Nenhum profissional cadastrado      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔧 Alterações Técnicas

### Frontend

#### 1. **AuthScreen.tsx**
```typescript
// Adicionado
- Campo profileType (state)
- Componente RadioGroup para seleção
- Ícones: Users e Stethoscope (lucide-react)
- Texto explicativo dinâmico
- Passa profileType para signUp()
```

#### 2. **AuthContext.tsx**
```typescript
// Modificado
interface AuthContextType {
  signUp: (
    email: string, 
    password: string, 
    name: string, 
    role?: 'parent' | 'professional'  // ← Novo parâmetro
  ) => Promise<void>
}

async function signUp(..., role: 'parent' | 'professional' = 'parent') {
  await api.signup(email, password, name, role)  // ← Passa role
}
```

#### 3. **api.ts**
```typescript
// Modificado
async signup(
  email: string, 
  password: string, 
  name: string, 
  role: 'parent' | 'professional' = 'parent'  // ← Novo
) {
  return this.request<{ success: boolean; userId: string }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  })
}
```

#### 4. **ParentDashboard.tsx**
```typescript
// Modificado
interface Professional {
  id: string
  name: string
  email: string
  type: string
  linkedAt: string
  status?: 'pending' | 'accepted' | 'rejected'  // ← Novo
  inviteToken?: string  // ← Novo
}

// Adicionado renderização de badges de status
const getStatusBadge = (status?: string) => {
  if (!status || status === 'accepted') {
    return <Badge variant="default">Ativo</Badge>
  }
  if (status === 'pending') {
    return <Badge variant="secondary">Convite Pendente</Badge>
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Recusado</Badge>
  }
}
```

### Backend

#### 1. **index.tsx - Rota /signup**
```typescript
// Modificado
app.post('/make-server-a07d0a8e/signup', async (c) => {
  const { 
    email, 
    password, 
    name, 
    role = 'parent'  // ← Novo, com default
  } = await c.req.json()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name, role },  // ← Armazena role
    email_confirm: true
  })

  await kv.set(`user:${userId}`, {
    id: userId,
    email,
    name,
    role  // ← Salva role no KV store
  })
})
```

#### 2. **index.tsx - Rota /children/:childId/professionals**
```typescript
// Modificado
app.get('/make-server-a07d0a8e/children/:childId/professionals', async (c) => {
  // ... auth checks ...
  
  const professionals = []
  
  // Get accepted professionals
  for (const profId of professionalIds) {
    professionals.push({
      // ... existing fields ...
      status: 'accepted'  // ← Novo campo
    })
  }

  // Get pending invites
  const allInvites = await kv.getByPrefix('invite:')
  for (const inviteData of allInvites) {
    const invite = inviteData.value
    if (invite && invite.childId === childId && !invite.acceptedAt) {
      professionals.push({
        id: `invite-${invite.token}`,
        name: invite.professionalName,
        email: invite.professionalEmail,
        type: invite.professionalType,
        linkedAt: invite.createdAt,
        status: 'pending',  // ← Status de pendente
        inviteToken: invite.token
      })
    }
  }

  return c.json({ professionals })
})
```

---

## 🎨 Design System

### Cores dos Status

| Status | Cor | Código |
|--------|-----|--------|
| Ativo | Verde | `#22c55e` |
| Convite Pendente | Amarelo | `#eab308` |
| Recusado | Vermelho | `#dc2626` |

### Componentes UI

- **RadioGroup**: Seleção de perfil
- **Badge**: Exibição de status
- **Icons**: `Users` (pai), `Stethoscope` (profissional)

---

## 🔄 Fluxo de Uso

### Fluxo 1: Cadastro de Novo Usuário

```
1. Usuário acessa tela de cadastro
   ↓
2. Seleciona tipo de perfil:
   - Pai/Responsável (padrão)
   - Profissional
   ↓
3. Preenche dados (nome, email, senha)
   ↓
4. Clica "Criar Conta"
   ↓
5. Backend cria usuário com role selecionado
   ↓
6. Usuário é redirecionado para dashboard correspondente
```

### Fluxo 2: Convite de Profissional

```
1. Pai cria convite para profissional
   ↓
2. Sistema gera link único
   ↓
3. Convite aparece com status "Convite Pendente"
   ↓
4a. Profissional aceita
    → Status muda para "Ativo"
    → Profissional tem acesso ao sistema
    ↓
4b. Profissional recusa (futuro)
    → Status muda para "Recusado"
    → Profissional não tem acesso
```

---

## 📊 Estrutura de Dados

### User Object (KV Store)
```json
{
  "id": "uuid-do-usuario",
  "email": "usuario@email.com",
  "name": "Nome do Usuário",
  "role": "parent" | "professional"
}
```

### Professional Object (Resposta da API)
```json
{
  "id": "uuid-do-profissional",
  "name": "Dr. João Silva",
  "email": "joao@email.com",
  "type": "Psicólogo",
  "linkedAt": "2025-01-10T12:00:00.000Z",
  "status": "accepted" | "pending" | "rejected",
  "inviteToken": "token-uuid" // Apenas se status = pending
}
```

### Invite Object (KV Store)
```json
{
  "token": "unique-token",
  "childId": "uuid-da-crianca",
  "parentId": "uuid-do-pai",
  "professionalName": "Dr. João Silva",
  "professionalEmail": "joao@email.com",
  "professionalType": "Psicólogo",
  "createdAt": "2025-01-10T12:00:00.000Z",
  "acceptedAt": null // null se pendente
}
```

---

## 🧪 Testes

### Teste 1: Cadastro como Pai
1. Acessar tela de cadastro
2. Selecionar "Pai/Responsável"
3. Preencher dados
4. Verificar redirecionamento para ParentDashboard
5. Verificar role = 'parent' no localStorage

**Resultado Esperado**: ✅ Usuário criado como pai

### Teste 2: Cadastro como Profissional
1. Acessar tela de cadastro
2. Selecionar "Profissional"
3. Preencher dados
4. Verificar redirecionamento para ProfessionalDashboard
5. Verificar role = 'professional' no localStorage

**Resultado Esperado**: ✅ Usuário criado como profissional

### Teste 3: Visualização de Status
1. Login como pai
2. Criar convite para profissional
3. Verificar badge "Convite Pendente" aparece
4. Profissional aceita convite
5. Atualizar lista
6. Verificar badge muda para "Ativo"

**Resultado Esperado**: ✅ Status atualizados corretamente

### Teste 4: Sem Profissionais
1. Login como pai
2. Selecionar filho sem profissionais
3. Verificar mensagem "Nenhum profissional cadastrado"

**Resultado Esperado**: ✅ Mensagem exibida corretamente

---

## 🔒 Segurança

### Validações Implementadas

1. **Backend valida role**:
   - Aceita apenas 'parent' ou 'professional'
   - Default para 'parent' se não fornecido

2. **Frontend valida seleção**:
   - Sempre envia um role válido
   - Não permite valores inválidos

3. **Status são server-side**:
   - Frontend não pode manipular status
   - Status calculados pelo backend

---

## 📝 Observações

### Funcionalidades Futuras (Não Implementadas)

1. **Rejeição de Convites**:
   - Atualmente não há botão para profissional rejeitar
   - Status "rejected" está preparado para implementação futura

2. **Notificações**:
   - Notificar pai quando profissional aceita/rejeita
   - Notificar profissional quando recebe convite

3. **Reenvio de Convites**:
   - Permitir reenviar convite pendente
   - Cancelar convite pendente

4. **Perfil do Profissional**:
   - Quando status = "Ativo", permitir visualizar perfil
   - Exibir mais informações sobre o profissional

---

## ✅ Checklist de Implementação

- [x] Seleção de perfil na tela de cadastro
- [x] Backend processa role no signup
- [x] Exibição de status "Ativo" para profissionais aceitos
- [x] Exibição de status "Convite Pendente" para convites não aceitos
- [x] Estrutura preparada para status "Recusado"
- [x] Mensagem "Nenhum profissional cadastrado"
- [x] Cores do design system aplicadas
- [x] Documentação completa

---

## 🚀 Como Usar

### Para Pais

1. **Cadastro**:
   - Na tela de cadastro, selecione "Pai/Responsável"
   - Complete o formulário
   - Você será redirecionado para o dashboard de pais

2. **Visualizar Profissionais**:
   - No dashboard, selecione um filho
   - Veja a seção "Profissionais"
   - Observe os badges de status:
     - Verde = Profissional ativo
     - Amarelo = Aguardando aceitação
     - Vermelho = Convite recusado

### Para Profissionais

1. **Cadastro Direto**:
   - Na tela de cadastro, selecione "Profissional"
   - Complete o formulário
   - Você será redirecionado para o dashboard de profissionais

2. **Cadastro via Convite**:
   - Clique no link de convite enviado pelo pai
   - Seu perfil será automaticamente "Profissional"
   - Complete o cadastro

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este documento
2. Consulte logs do console
3. Entre em contato com o time de desenvolvimento

---

**Versão**: 1.0  
**Data**: 10/01/2025  
**Mantido por**: Equipe Autazul

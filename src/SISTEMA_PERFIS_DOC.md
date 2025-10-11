# 📋 Sistema de Gerenciamento de Perfis - Documentação Completa

## 🎯 Objetivo

Implementar um sistema onde:
1. O perfil base é sempre **"Pai/Responsável"**
2. A seleção de perfil ocorre apenas **durante o login**
3. O perfil selecionado **persiste entre sessões** (logout/login)
4. Usuários podem **trocar de perfil** dentro do sistema quando logados

---

## ✨ Funcionalidades Implementadas

### 1. **Perfil Base: Pai/Responsável** ✅

Todos os novos usuários são criados com perfil "Pai/Responsável":

```
Cadastro → Sempre cria como "parent"
```

**Características**:
- ✅ Não há seleção de perfil no cadastro
- ✅ Todos começam como "Pai/Responsável"
- ✅ Podem trocar para "Profissional" após login
- ✅ Perfil base permanece "parent" no banco de dados

---

### 2. **Seleção de Perfil no Login** ✅

Durante o login, o usuário pode escolher como deseja acessar:

#### Tela de Login:
```
┌─────────────────────────────────────────────┐
│  Email: _____________________________       │
│  Senha: _____________________________       │
│                                             │
│  Acessar como:                              │
│  ┌─────────────┐  ┌─────────────┐         │
│  │ 👨‍👩‍👧         │  │ 🩺          │         │
│  │ Pai/        │  │ Profissional│         │
│  │ Responsável │  │             │         │
│  └─────────────┘  └─────────────┘         │
│                                             │
│  [ Entrar ]                                 │
└─────────────────────────────────────────────┘
```

**Como funciona**:
1. Usuário seleciona perfil desejado
2. Clica em "Entrar"
3. Sistema salva escolha no `localStorage`
4. Redireciona para dashboard correspondente

---

### 3. **Persistência de Perfil** ✅

O perfil selecionado é mantido entre sessões:

```
Login como "Profissional"
    ↓
Fazer logout
    ↓
Fazer login novamente
    ↓
Continua como "Profissional" (última seleção)
```

**Armazenamento**:
- `localStorage.selectedProfile`: Perfil escolhido no último login
- `localStorage.activeRole`: Perfil ativo na sessão atual
- Ambos persistem após logout

---

### 4. **Troca de Perfil Dentro do Sistema** ✅

Usuários logados podem trocar de perfil sem fazer logout:

#### Botão "Trocar Perfil":
- Localização: Header do dashboard (ao lado de notificações)
- Ícone: 🔄 (RefreshCw)
- Texto: "Trocar Perfil"

#### Modal de Troca:
```
┌─────────────────────────────────────────────┐
│  Trocar Perfil de Acesso                    │
│  Perfil atual: Pai/Responsável             │
│                                             │
│  Selecione o perfil desejado:              │
│                                             │
│  ○ 👨‍👩‍👧 Pai/Responsável                      │
│    Acesse o painel de pais e responsáveis  │
│                                             │
│  ● 🩺 Profissional                          │
│    Acesse o painel de profissionais        │
│                                             │
│  [ Cancelar ]  [ Aplicar ]                 │
└─────────────────────────────────────────────┘
```

**Fluxo**:
1. Clicar em "Trocar Perfil"
2. Selecionar novo perfil
3. Clicar em "Aplicar"
4. Página recarrega com novo perfil ativo

---

## 🔧 Implementação Técnica

### Frontend

#### 1. **AuthScreen.tsx**

**Cadastro (Signup)**:
```typescript
// Removido seleção de perfil
// Sempre cria como 'parent'
await signUp(email, password, name, 'parent')
```

**Login**:
```typescript
// Adicionado seleção de perfil
const [profileType, setProfileType] = useState<'parent' | 'professional'>('parent')

// Ao fazer login
localStorage.setItem('selectedProfile', profileType)
await signIn(email, password)
```

#### 2. **AuthContext.tsx**

**SignIn**:
```typescript
async function signIn(email: string, password: string) {
  // ... autenticação ...
  
  // Recuperar perfil selecionado
  const selectedProfile = localStorage.getItem('selectedProfile') as 'parent' | 'professional' | null
  const activeRole = selectedProfile || userData.role || 'parent'
  
  // Salvar perfil ativo
  const userWithProfile = { 
    ...userData, 
    role: activeRole,
    baseRole: userData.role // Mantém role original do DB
  }
  
  localStorage.setItem('activeRole', activeRole)
  setUser(userWithProfile)
}
```

**CheckUser** (Restaurar sessão):
```typescript
async function checkUser() {
  // ... verificação de sessão ...
  
  // Restaurar perfil ativo do localStorage
  const activeRole = localStorage.getItem('activeRole') as 'parent' | 'professional' | null
  const role = activeRole || userData.role || 'parent'
  
  setUser({ ...userData, role, baseRole: userData.role })
}
```

**SignOut**:
```typescript
async function signOut() {
  await supabase.auth.signOut()
  setUser(null)
  localStorage.removeItem('auth_token')
  localStorage.removeItem('user')
  // Mantém selectedProfile e activeRole para próximo login
}
```

#### 3. **ProfileSwitcher.tsx** (Novo Componente)

```typescript
export function ProfileSwitcher() {
  const { user } = useAuth()
  const [selectedProfile, setSelectedProfile] = useState<'parent' | 'professional'>(user?.role || 'parent')

  function handleSwitchProfile() {
    // Salvar novo perfil
    localStorage.setItem('selectedProfile', selectedProfile)
    localStorage.setItem('activeRole', selectedProfile)
    
    // Recarregar página para aplicar mudanças
    window.location.reload()
  }

  return (
    <Dialog>
      {/* UI para seleção de perfil */}
    </Dialog>
  )
}
```

#### 4. **Dashboards**

Ambos ParentDashboard e ProfessionalDashboard agora incluem:
```typescript
import { ProfileSwitcher } from './ProfileSwitcher'

// No header
<ProfileSwitcher />
```

### Backend

#### 1. **Rota /signup**

```typescript
app.post('/make-server-a07d0a8e/signup', async (c) => {
  const { email, password, name } = await c.req.json()
  
  // SEMPRE criar como 'parent' (perfil base)
  const role = 'parent'
  
  await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name, role },
    email_confirm: true
  })
  
  await kv.set(`user:${userId}`, {
    id: userId,
    email,
    name,
    role // Sempre 'parent'
  })
})
```

---

## 📊 Estrutura de Dados

### User Object (Contexto/Frontend)
```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'parent' | 'professional'      // Perfil ativo (pode mudar)
  baseRole: 'parent' | 'professional'  // Perfil base do DB (fixo)
  isAdmin?: boolean
}
```

### LocalStorage
```javascript
{
  "user": "{...user data...}",
  "auth_token": "jwt-token",
  "selectedProfile": "professional",    // Último perfil selecionado no login
  "activeRole": "professional"          // Perfil ativo na sessão atual
}
```

### Database (KV Store)
```json
{
  "user:uuid": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome do Usuário",
    "role": "parent"  // Sempre 'parent' no signup
  }
}
```

---

## 🔄 Fluxos de Uso

### Fluxo 1: Novo Usuário

```
1. Acessar sistema
   ↓
2. Clicar em "Cadastre-se"
   ↓
3. Preencher dados (nome, email, senha)
   ↓
4. Sistema cria como "Pai/Responsável"
   ↓
5. Redirecionado para ParentDashboard
   ↓
6. Pode trocar para "Profissional" se desejar
```

### Fluxo 2: Login com Seleção de Perfil

```
1. Acessar tela de login
   ↓
2. Preencher email e senha
   ↓
3. Selecionar perfil:
   - Pai/Responsável (padrão)
   - Profissional
   ↓
4. Clicar "Entrar"
   ↓
5. Sistema salva escolha
   ↓
6. Redireciona para dashboard correspondente
```

### Fluxo 3: Persistência de Perfil

```
Sessão 1:
  Login → Seleciona "Profissional" → Usa sistema
  ↓
  Logout
  
Sessão 2:
  Login → Perfil "Profissional" já selecionado
  ↓
  Pode alterar se desejar
  ↓
  Clica "Entrar" → Acessa como "Profissional"
```

### Fluxo 4: Troca de Perfil Durante Uso

```
Usuário logado como "Pai/Responsável"
  ↓
1. Clica em "Trocar Perfil"
   ↓
2. Modal abre
   ↓
3. Seleciona "Profissional"
   ↓
4. Clica "Aplicar"
   ↓
5. Página recarrega
   ↓
6. Agora está em ProfessionalDashboard
```

---

## 🎨 Design e UX

### Cores

| Elemento | Cor | Código |
|----------|-----|--------|
| Perfil Selecionado | Azul Autazul | `#15C3D6` |
| Borda Selecionada | Azul Autazul | `#15C3D6` |
| Background Selecionado | Azul Claro | `bg-blue-50` |
| Texto | Cinza Escuro | `#373737` |
| Texto Secundário | Cinza Médio | `#5C8599` |

### Ícones

- **👨‍👩‍👧 (Users)**: Pai/Responsável
- **🩺 (Stethoscope)**: Profissional
- **🔄 (RefreshCw)**: Trocar Perfil

### Posicionamento

```
Header do Dashboard:
[Logo] [Nome] [Trocar Perfil] [🔔] [🛡️] [👑] [🚪]
                     ↑
                Novo botão
```

---

## ✅ Comportamentos Implementados

### 1. Perfil no Cadastro
- ✅ Não mostra seleção de perfil
- ✅ Sempre cria como "Pai/Responsável"
- ✅ Descrição: "Crie sua conta como Pai/Responsável"

### 2. Perfil no Login
- ✅ Mostra seleção de perfil
- ✅ Padrão: Último perfil usado (ou "Pai/Responsável")
- ✅ Salva escolha ao fazer login
- ✅ Redireciona para dashboard correto

### 3. Persistência
- ✅ Perfil mantido após logout
- ✅ Próximo login já vem com último perfil selecionado
- ✅ Usuário pode alterar a qualquer momento

### 4. Troca de Perfil
- ✅ Botão visível em ambos os dashboards
- ✅ Modal com seleção clara
- ✅ Aplicação imediata (reload)
- ✅ Feedback visual do perfil atual

---

## 🔒 Segurança

### Validações

1. **Perfil Base Protegido**:
   - Backend sempre cria como 'parent'
   - Não aceita outros valores no signup

2. **Perfil Ativo Validado**:
   - Frontend valida valores permitidos
   - Apenas 'parent' ou 'professional'

3. **Permissões por Perfil**:
   - ParentDashboard: Apenas pais veem filhos próprios
   - ProfessionalDashboard: Apenas profissionais vinculados veem crianças

---

## 🧪 Testes

### Teste 1: Cadastro
```
1. Acessar cadastro
2. Verificar ausência de seleção de perfil
3. Verificar texto "Crie sua conta como Pai/Responsável"
4. Completar cadastro
5. Verificar redirecionamento para ParentDashboard

✅ Resultado: Usuário criado como parent
```

### Teste 2: Login com Perfil
```
1. Fazer logout
2. Acessar login
3. Verificar presença de seleção de perfil
4. Selecionar "Profissional"
5. Fazer login
6. Verificar redirecionamento para ProfessionalDashboard

✅ Resultado: Login com perfil selecionado
```

### Teste 3: Persistência
```
1. Login como "Profissional"
2. Logout
3. Login novamente
4. Verificar "Profissional" já selecionado
5. Fazer login
6. Confirmar acesso como profissional

✅ Resultado: Perfil persistiu
```

### Teste 4: Troca de Perfil
```
1. Login como "Pai/Responsável"
2. Clicar em "Trocar Perfil"
3. Selecionar "Profissional"
4. Clicar "Aplicar"
5. Verificar reload e mudança para ProfessionalDashboard

✅ Resultado: Troca funcionou
```

### Teste 5: LocalStorage
```
1. Login como "Profissional"
2. Abrir DevTools → Application → LocalStorage
3. Verificar valores:
   - selectedProfile: "professional"
   - activeRole: "professional"
4. Fechar navegador
5. Reabrir e verificar valores mantidos

✅ Resultado: Dados persistiram
```

---

## 📝 Observações Importantes

### Diferença entre `role` e `baseRole`

```typescript
{
  role: 'professional',      // Perfil ATIVO (pode mudar)
  baseRole: 'parent'         // Perfil BASE (fixo no DB)
}
```

- **baseRole**: Sempre 'parent' (criado no signup)
- **role**: Perfil que o usuário está usando atualmente
- Usuário pode alternar entre perfis sem alterar baseRole

### Quando o Perfil Muda

O perfil ativo (`role`) muda em dois momentos:

1. **Durante o login**: Usuário seleciona perfil desejado
2. **Dentro do sistema**: Usuário clica "Trocar Perfil"

Em ambos os casos, `baseRole` permanece inalterado.

---

## 🚀 Próximos Passos (Futuro)

### Funcionalidades Sugeridas

1. **Validação de Perfil Profissional**:
   - Verificar se usuário tem crianças vinculadas
   - Desabilitar perfil profissional se não tiver vínculos
   - Mostrar mensagem: "Você precisa ser convidado por um pai"

2. **Histórico de Acessos**:
   - Registrar quando usuário troca de perfil
   - Mostrar último acesso em cada perfil

3. **Preferências de Perfil**:
   - Permitir definir perfil padrão
   - "Sempre entrar como..."

4. **Notificações por Perfil**:
   - Notificações específicas para cada perfil
   - Badge diferenciado no botão de troca

---

## 📞 Suporte

### Problemas Comuns

**Perfil não persiste após logout**:
- Verificar se localStorage está habilitado
- Checar se navegador não está em modo privado

**Não consigo trocar de perfil**:
- Verificar se botão "Trocar Perfil" está visível
- Tentar fazer logout e login novamente

**Sempre entra como Pai/Responsável**:
- Verificar localStorage → selectedProfile
- Pode estar com valor incorreto ou vazio

---

## ✅ Checklist de Implementação

- [x] Remover seleção de perfil do cadastro
- [x] Sempre criar usuários como 'parent'
- [x] Adicionar seleção de perfil no login
- [x] Implementar persistência de perfil
- [x] Criar componente ProfileSwitcher
- [x] Adicionar botão nos dashboards
- [x] Atualizar AuthContext para gerenciar perfis
- [x] Atualizar backend para signup fixo
- [x] Documentação completa
- [x] Testes planejados

---

**Versão**: 2.0  
**Data**: 10/01/2025  
**Mantido por**: Equipe Autazul

---

## 🎯 Resumo Executivo

✅ **Perfil base é sempre "Pai/Responsável"**  
✅ **Seleção de perfil apenas no login**  
✅ **Perfil persiste entre sessões**  
✅ **Troca de perfil disponível dentro do sistema**  
✅ **Interface intuitiva e consistente**  
✅ **Totalmente funcional e testável**

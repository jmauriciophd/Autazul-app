# 🔧 Troubleshooting - Sistema de Notificações

## ❌ Problemas Reportados

1. ✅ **CORRIGIDO**: Ícone de notificações não abre
2. ✅ **CORRIGIDO**: Convites não aparecem
3. ⚠️ **PARCIAL**: Emails não chegam (modo desenvolvimento)

---

## 🔍 Diagnóstico

### Problema 1: Ícone de Notificações Não Abre

**Causa**: Faltavam as rotas de API no frontend e backend.

**Solução Aplicada**:
1. ✅ Adicionadas funções na API (`/utils/api.ts`):
   - `getPendingInvitations()`
   - `acceptInvitation()`
   - `rejectInvitation()`

2. ✅ Adicionadas rotas no servidor (`/supabase/functions/server/index.tsx`):
   - `GET /invitations/pending`
   - `POST /invitations/:id/accept`
   - `POST /invitations/:id/reject`

3. ✅ Adicionados logs de debug no `NotificationsPopover.tsx`

**Como Testar**:
```bash
1. Abrir console do navegador (F12)
2. Fazer login
3. Clicar no ícone de sino (🔔)
4. Verificar logs:
   - "🔔 Carregando notificações..."
   - "📬 Carregando convites..."
   - "✅ Notificações carregadas: X"
   - "✅ Convites carregados: X"
```

---

### Problema 2: Convites Não Aparecem

**Causa**: Sistema não estava buscando convites pendentes.

**Solução Aplicada**:
1. ✅ Rota `GET /invitations/pending` implementada
2. ✅ Busca todas as invitations com `status: 'pending'`
3. ✅ Filtra por `toUserId === user.id`
4. ✅ Ordena por data (mais recentes primeiro)

**Estrutura de Convite**:
```typescript
{
  id: string
  type: 'professional_invite' | 'coparent_invite' | 'child_share_invite'
  fromUserId: string
  fromUserName: string
  toUserId: string
  childId: string
  childName: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}
```

**Como Criar um Convite para Teste**:

**Opção A: Via Interface (Profissional)**
```
1. Login como Pai
2. Dashboard > Adicionar Profissional
3. Aba "Convite por Email"
4. Digite email de profissional já cadastrado
5. Enviar
```

**Opção B: Via Interface (Co-Responsável)**
```
1. Login como Pai
2. Editar Perfil do filho
3. Aba "Co-Responsáveis"
4. Aba "Convite por Email"
5. Digite email de responsável já cadastrado
6. Enviar
```

**Opção C: Via Interface (Compartilhamento)**
```
1. Login como Pai
2. Editar Perfil do filho
3. Aba "Compartilhar"
4. Digite email de responsável já cadastrado
5. Compartilhar Filho
```

**Opção D: Manualmente no KV Store (Dev)**
```typescript
// Criar convite manualmente para teste
await kv.set('invitation:test123', {
  id: 'test123',
  type: 'professional_invite',
  fromUserId: 'userId-do-pai',
  fromUserName: 'João Silva',
  toUserId: 'userId-do-profissional', // Seu ID quando logar
  childId: 'childId-existente',
  childName: 'Maria',
  status: 'pending',
  createdAt: new Date().toISOString()
})
```

---

### Problema 3: Emails Não Chegam

**Causa**: Sistema está em modo desenvolvimento (apenas log).

**Situação Atual**:
- ⚠️ Emails são preparados mas NÃO enviados
- ✅ Conteúdo é logado no console do servidor
- ℹ️ Convites funcionam sem email (via notificação in-app)

**Opções para Envio Real**:

#### Opção 1: SendGrid (Recomendado) ⭐

**Passos**:
1. Criar conta em https://sendgrid.com
2. Gerar API key
3. Adicionar como variável de ambiente:
   ```bash
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
   ```
4. Descomentar código no servidor:
   ```typescript
   // Em /supabase/functions/server/index.tsx
   // Linha ~35, descomentar bloco SendGrid
   ```

**Custo**: Grátis até 100 emails/dia

---

#### Opção 2: Resend (Simples) ⭐

**Passos**:
1. Criar conta em https://resend.com
2. Gerar API key
3. Adicionar como variável de ambiente:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
4. Descomentar código no servidor:
   ```typescript
   // Em /supabase/functions/server/index.tsx
   // Linha ~50, descomentar bloco Resend
   ```

**Custo**: Grátis até 100 emails/dia

---

#### Opção 3: Gmail SMTP (Complexo)

**Passos**:
1. Ir para https://myaccount.google.com/apppasswords
2. Gerar senha de aplicativo
3. Substituir em `SMTP_CONFIG`:
   ```typescript
   const SMTP_CONFIG = {
     user: 'webservicesbsb@gmail.com',
     pass: 'SENHA-APP-AQUI', // Substituir Akmcbhtj1
     host: 'smtp.gmail.com',
     port: 587,
     secure: false,
   }
   ```
4. Implementar envio SMTP real (requer biblioteca)

**Custo**: Grátis
**Problema**: Gmail tem limites estritos (500 emails/dia)

---

## ✅ Verificações Pós-Correção

### Checklist de Testes

#### 1. Ícone de Notificações
- [ ] Ícone aparece no dashboard
- [ ] Ícone mostra contador quando há pendentes
- [ ] Clicar abre o popover
- [ ] Popover exibe corretamente

#### 2. Carregamento de Dados
- [ ] Notificações carregam (ver console)
- [ ] Convites carregam (ver console)
- [ ] Não há erros 404 ou 401
- [ ] Contadores estão corretos

#### 3. Convites
- [ ] Convites aparecem no topo
- [ ] Badge correto para cada tipo
- [ ] Botões Aceitar/Recusar aparecem
- [ ] Mensagens explicativas corretas

#### 4. Ações
- [ ] Aceitar convite funciona
- [ ] Página recarrega após aceitar
- [ ] Novo vínculo aparece
- [ ] Recusar convite funciona
- [ ] Convite some da lista

#### 5. Notificações Regulares
- [ ] Aparecem abaixo dos convites
- [ ] Marcar como lida funciona
- [ ] Marcar todas como lidas funciona
- [ ] Badge "Lida" aparece

---

## 🐛 Problemas Comuns e Soluções

### "Não vejo o ícone de sino"

**Possíveis Causas**:
1. Usuário não está logado
2. Dashboard não carregou
3. Componente não foi importado

**Solução**:
```bash
# Verificar se está logado
1. Abrir console (F12)
2. Procurar por "user:" nos logs
3. Se não encontrar, fazer logout e login

# Verificar importação
1. Abrir ParentDashboard.tsx ou ProfessionalDashboard.tsx
2. Verificar: import { NotificationsPopover } from './NotificationsPopover'
3. Verificar: <NotificationsPopover /> no JSX
```

---

### "Ícone aparece mas não abre"

**Possíveis Causas**:
1. Erro nas rotas de API
2. Token inválido
3. Erro no servidor

**Solução**:
```bash
# Verificar console do navegador
1. F12 > Console
2. Procurar erros vermelhos
3. Verificar se há erro 401 (Unauthorized)

# Verificar token
1. localStorage.getItem('auth_token')
2. Se null, fazer logout e login novamente

# Verificar servidor
1. Ver logs do Supabase Functions
2. Procurar por erros nas rotas /invitations
```

---

### "Convite não aparece"

**Possíveis Causas**:
1. Convite foi criado mas não está no KV store
2. Status não é 'pending'
3. toUserId está errado

**Solução**:
```bash
# Verificar convite no KV
1. Abrir console do servidor
2. Ver logs da criação do convite
3. Verificar se 'invitation:ID' foi criado

# Verificar IDs
1. Ver logs: "📬 Carregando convites..."
2. Ver dados retornados
3. Confirmar toUserId === user.id logado
```

---

### "Aceitar convite não funciona"

**Possíveis Causas**:
1. Rota de accept não implementada
2. Erro de permissões
3. Convite já aceito

**Solução**:
```bash
# Verificar rota
1. Console do navegador
2. Ver request POST /invitations/:id/accept
3. Ver resposta (200 = ok, 4xx = erro)

# Verificar logs
1. Console servidor
2. Procurar por "Error accepting invitation"
3. Ver detalhes do erro

# Verificar status
1. Convite pode ter status 'accepted' já
2. Recarregar página e verificar se some
```

---

## 📊 Logs Úteis

### Console do Navegador (F12)

**Ao carregar notificações**:
```
🔔 Carregando notificações...
✅ Notificações carregadas: 0
📬 Carregando convites...
✅ Convites carregados: 1
Convites: [{...}]
```

**Ao aceitar convite**:
```
Processing invitation accept...
✅ Convite aceito!
Reloading page...
```

**Erros comuns**:
```
❌ Error loading notifications: 401 Unauthorized
❌ Error accepting invitation: 404 Not Found
❌ Error loading invitations: 500 Internal Server Error
```

---

### Console do Servidor (Supabase Functions)

**Ao criar convite**:
```
Creating invitation for user: xxx
Invitation created: invitation:yyy
📧 Preparando envio de email...
⚠️ MODO DE DESENVOLVIMENTO - Email não será enviado
```

**Ao buscar convites**:
```
Fetching pending invitations for user: xxx
Found 1 pending invitation(s)
```

**Ao aceitar convite**:
```
Accepting invitation: xxx
Adding professional to child: yyy
✅ Invitation accepted successfully
```

---

## 🚀 Próximos Passos

### Para Produção

1. **Configurar Envio de Email**
   - [ ] Escolher provedor (SendGrid/Resend)
   - [ ] Gerar API key
   - [ ] Adicionar variável de ambiente
   - [ ] Descomentar código
   - [ ] Testar envio

2. **Monitoramento**
   - [ ] Configurar alertas de erros
   - [ ] Monitorar taxa de aceite de convites
   - [ ] Acompanhar tempo de resposta

3. **Melhorias**
   - [ ] Push notifications (WebSocket)
   - [ ] Email templates profissionais
   - [ ] Retry automático de envios falhados
   - [ ] Dashboard de métricas de convites

---

## 📞 Suporte

Se os problemas persistirem:

1. **Verificar Versão**
   - Sistema deve estar na v2.0.0
   - Verificar se todos os arquivos foram atualizados

2. **Logs Completos**
   - Exportar console do navegador
   - Exportar logs do servidor
   - Compartilhar para análise

3. **Contato**
   - Email: suporte@autazul.com
   - Issues: GitHub repository

---

**Última atualização**: 12/10/2025
**Status**: ✅ Problemas principais corrigidos
**Emails**: ⚠️ Modo desenvolvimento (configuração necessária)

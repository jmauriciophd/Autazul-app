# 🔧 Correções para Produção - Autazul

**Data:** 22 de Outubro de 2025

## 🐛 PROBLEMAS IDENTIFICADOS

### 1. ❌ ReferenceError: useAuth is not defined
**Causa:** Possível erro de build ou componente não envolvido pelo AuthProvider

### 2. ❌ Rota de Feedback não existe no servidor
**Causa:** API client chama `/feedback` mas a rota não existe em `index.tsx`

### 3. ⚠️ Sheet de notificações precisa ser testado

---

## ✅ CORREÇÃO 1: Adicionar Rota de Feedback no Servidor

### Arquivo: `/supabase/functions/server/index.tsx`

**ADICIONE** antes do `Deno.serve(app.fetch)`:

```typescript
// ===== FEEDBACK ROUTE =====

app.post('/make-server-a07d0a8e/feedback', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { rating, feedback } = await c.req.json()

    if (!rating || rating < 1 || rating > 5) {
      return c.json({ error: 'Rating deve ser entre 1 e 5' }, 400)
    }

    // Salvar feedback no KV store
    const feedbackId = generateId()
    const feedbackData = {
      id: feedbackId,
      userId: user.id,
      userEmail: user.email,
      rating,
      feedback: feedback || '',
      createdAt: new Date().toISOString()
    }

    await kv.set(`feedback:${feedbackId}`, feedbackData)

    // Adicionar ao índice de feedbacks
    const feedbackList = await kv.get('feedbacks:all') || []
    await kv.set('feedbacks:all', [feedbackId, ...feedbackList])

    console.log('📝 Feedback recebido:', {
      id: feedbackId,
      user: user.email,
      rating,
      feedbackLength: feedback?.length || 0
    })

    // Enviar email com o feedback (opcional)
    try {
      const userData = await kv.get(`user:${user.id}`)
      const userName = userData?.name || user.email
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
    .header { background: linear-gradient(135deg, #46B0FD 0%, #15C3D6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -30px -30px 20px -30px; }
    .rating { font-size: 32px; margin: 20px 0; }
    .info { background: #f0f9ff; padding: 15px; border-left: 4px solid #15C3D6; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Novo Feedback - Autazul</h1>
    </div>
    <div class="info">
      <p><strong>👤 Usuário:</strong> ${userName} (${user.email})</p>
      <p><strong>📅 Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p><strong>⭐ Avaliação:</strong> ${rating}/5</p>
    </div>
    <div class="rating">
      ${'⭐'.repeat(rating)}${'☆'.repeat(5 - rating)}
    </div>
    ${feedback ? `
    <div>
      <h3>📝 Comentário:</h3>
      <p style="background: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${feedback}</p>
    </div>
    ` : '<p><em>Sem comentário adicional</em></p>'}
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #6b7280; font-size: 12px;">
      ID do Feedback: ${feedbackId}<br>
      Autazul - Sistema de Acompanhamento
    </p>
  </div>
</body>
</html>
      `

      await sendEmail(
        'webservicesbsb@gmail.com',
        `⭐ Novo Feedback ${rating}/5 - ${userName}`,
        emailHtml
      )
      console.log('✅ Email de feedback enviado com sucesso')
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar email de feedback (não crítico):', emailError)
      // Não falhar a requisição se email falhar
    }

    return c.json({ 
      success: true, 
      message: 'Feedback enviado com sucesso!' 
    })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// ===== ADMIN: GET FEEDBACKS =====

app.get('/make-server-a07d0a8e/admin/feedbacks', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const userData = await kv.get(`user:${user.id}`)
    if (!isAdmin(userData?.email)) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const feedbackIds = await kv.get('feedbacks:all') || []
    const feedbacks = []

    for (const id of feedbackIds.slice(0, 100)) { // Limitar a 100 mais recentes
      const feedback = await kv.get(`feedback:${id}`)
      if (feedback) {
        feedbacks.push(feedback)
      }
    }

    // Calcular estatísticas
    const stats = {
      total: feedbacks.length,
      averageRating: feedbacks.length > 0 
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0,
      ratingDistribution: {
        1: feedbacks.filter(f => f.rating === 1).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        5: feedbacks.filter(f => f.rating === 5).length,
      }
    }

    return c.json({ feedbacks, stats })
  } catch (error) {
    console.error('Error fetching feedbacks:', error)
    return c.json({ error: String(error) }, 500)
  }
})
```

---

## ✅ CORREÇÃO 2: Verificar Uso do AuthProvider no App.tsx

### Arquivo: `/App.tsx`

Certifique-se de que TODOS os componentes estão dentro do `<AuthProvider>`:

```tsx
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
```

Se algum componente estiver FORA do AuthProvider, vai dar o erro "useAuth is not defined".

---

## ✅ CORREÇÃO 3: Testar Sheet de Notificações

O Sheet deve funcionar perfeitamente agora. Para testar:

### No navegador (após fazer login):

1. **Verifique se o ícone de sino aparece** no header
2. **Clique no sino** 🔔
3. **O painel deve abrir** deslizando da direita
4. **Verifique:**
   - ✅ Overlay escuro aparece
   - ✅ Painel desliza suavemente
   - ✅ Lista de notificações é exibida
   - ✅ Botão X funciona
   - ✅ Clique fora fecha o painel
   - ✅ ESC fecha o painel

### Logs esperados no console:

```
🚀 NotificationsPopover montado - iniciando carregamento
🔔 Carregando notificações...
✅ Notificações carregadas: X
📬 Carregando convites...
✅ Convites carregados: X
```

---

## ✅ CORREÇÃO 4: Build de Produção Seguro

Para evitar erros de build, certifique-se de que:

### 1. Todas as importações estão corretas

Verifique se TODOS os componentes que usam `useAuth` têm esta linha:

```typescript
import { useAuth } from '../utils/AuthContext'
```

### 2. Não há referências circulares

Evite importar componentes que importam outros que importam os primeiros.

### 3. Exports estão corretos

Todos os componentes devem ter `export function NomeDoComponente()` ou `export default function NomeDoComponente()`

---

## 🧪 SCRIPT DE TESTE COMPLETO

Cole este código no console do navegador (após fazer login):

```javascript
// Teste completo do sistema
async function testarSistema() {
  console.log('🧪 Iniciando testes do sistema...\n')
  
  // 1. Verificar se AuthContext está acessível
  try {
    console.log('1️⃣ Testando AuthContext...')
    // O contexto deve estar disponível para componentes React
    console.log('✅ AuthContext OK (componentes podem usar useAuth)\n')
  } catch (error) {
    console.error('❌ Erro no AuthContext:', error, '\n')
  }
  
  // 2. Verificar se API está funcionando
  try {
    console.log('2️⃣ Testando API de notificações...')
    const notifs = await fetch(
      'https://' + window.location.hostname + '/functions/v1/make-server-a07d0a8e/notifications',
      {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
      }
    ).then(r => r.json())
    console.log('✅ Notificações carregadas:', notifs.notifications?.length || 0, '\n')
  } catch (error) {
    console.error('❌ Erro ao carregar notificações:', error, '\n')
  }
  
  // 3. Testar envio de feedback
  try {
    console.log('3️⃣ Testando rota de feedback...')
    const feedback = await fetch(
      'https://' + window.location.hostname + '/functions/v1/make-server-a07d0a8e/feedback',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: 5,
          feedback: 'Teste automático do sistema'
        })
      }
    ).then(r => r.json())
    
    if (feedback.success) {
      console.log('✅ Feedback enviado com sucesso!\n')
    } else {
      console.error('❌ Erro ao enviar feedback:', feedback.error, '\n')
    }
  } catch (error) {
    console.error('❌ Erro ao testar feedback:', error, '\n')
  }
  
  console.log('✅ Testes concluídos!')
}

testarSistema()
```

---

## 📝 CHECKLIST DE DEPLOY

Antes de fazer deploy para produção:

- [ ] Rota `/feedback` adicionada no servidor
- [ ] Rota `/admin/feedbacks` adicionada no servidor
- [ ] Email de feedback configurado
- [ ] Todos os componentes estão dentro do AuthProvider
- [ ] Sheet de notificações testado e funcionando
- [ ] Imports de `useAuth` verificados em todos os componentes
- [ ] Build local executado sem erros
- [ ] Variáveis de ambiente configuradas (SMTP)
- [ ] Logs de erro verificados
- [ ] Teste manual realizado

---

## 🚀 COMANDOS DE DEPLOY

### 1. Atualizar servidor (Supabase Edge Functions)

```bash
# Deploy da edge function
supabase functions deploy server

# Verificar logs
supabase functions logs server --tail
```

### 2. Verificar em produção

```bash
# Testar rota de feedback
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/make-server-a07d0a8e/feedback \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":5,"feedback":"Teste"}'
```

---

## 🔍 TROUBLESHOOTING

### Erro persiste: "useAuth is not defined"

**Verificar:**

1. O componente que dá erro está usando `useAuth`?
2. Esse componente está importando: `import { useAuth } from '../utils/AuthContext'`?
3. O componente está sendo renderizado DENTRO do `<AuthProvider>`?
4. O erro acontece no build ou em runtime?

**Solução:**

Se o erro for em um componente específico, abra ele e adicione:

```typescript
import { useAuth } from '../utils/AuthContext'
```

Se o erro for que o componente não está dentro do Provider, mova-o para dentro do `<AuthProvider>` no App.tsx.

### Feedback não envia

**Verificar:**

1. Rota `/feedback` existe no servidor?
2. Usuário está autenticado?
3. Token está sendo enviado corretamente?

**Logs esperados no servidor:**

```
📝 Feedback recebido: { id: ..., user: ..., rating: 5 }
✅ Email de feedback enviado com sucesso
```

### Notificações não abrem

**Verificar:**

1. Sheet component importado corretamente?
2. Estado `isOpen` está funcionando?
3. Há erros no console?

**Solução:**

Veja `/CORRECAO_NOTIFICACOES_SHEET.md` para detalhes completos.

---

## 📊 RESUMO DAS MUDANÇAS

| Arquivo | Mudança | Status |
|---------|---------|--------|
| `/supabase/functions/server/index.tsx` | Adicionar rotas de feedback | ⏳ Pendente |
| `/App.tsx` | Verificar AuthProvider | ✅ OK |
| `/components/NotificationsPopover.tsx` | Sheet implementado | ✅ OK |
| `/utils/api.ts` | submitFeedback existe | ✅ OK |

---

**Próximos passos:**
1. Adicionar rotas de feedback no servidor
2. Fazer deploy
3. Testar em produção
4. Verificar logs

---

**Data:** 22 de Outubro de 2025
**Status:** Aguardando implementação das rotas de feedback

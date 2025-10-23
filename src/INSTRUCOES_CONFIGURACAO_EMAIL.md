# 📧 Configuração de Email no Autazul - Produção

**Data:** 22 de Outubro de 2025

## ⚠️ PROBLEMA IDENTIFICADO

O código em produção contém **credenciais hardcoded** (escritas diretamente no código), o que é:
1. ❌ **Inseguro** - qualquer pessoa com acesso ao código vê as credenciais
2. ❌ **Inflexível** - difícil mudar credenciais sem redeployar
3. ❌ **Incorreto** - a senha parece ser a senha normal, não senha de app

## ✅ SOLUÇÃO: Configurar Variáveis de Ambiente no Supabase

### Passo 1: Gerar Senha de App do Gmail

#### Por que preciso de uma Senha de App?
O Gmail não aceita mais senhas normais para SMTP. Você precisa criar uma "Senha de App" específica.

#### Como criar:

1. **Acesse sua Conta Google:**
   - Vá para: https://myaccount.google.com/
   - Faça login com `webservicesbsb@gmail.com`

2. **Habilite a Verificação em Duas Etapas:**
   - Clique em "Segurança" (menu lateral esquerdo)
   - Role até "Verificação em duas etapas"
   - Clique em "Começar" e siga as instruções
   - **IMPORTANTE:** Sem 2FA ativado, você não pode criar senhas de app!

3. **Crie uma Senha de App:**
   - Ainda em "Segurança", role até encontrar "Senhas de app"
   - Clique em "Senhas de app"
   - Selecione:
     - **App:** "Email"
     - **Dispositivo:** "Outro (nome personalizado)"
     - Digite: "Autazul Produção"
   - Clique em "Gerar"
   - **COPIE A SENHA GERADA** (16 caracteres sem espaços)
   - Exemplo: `abcd efgh ijkl mnop` → use como `abcdefghijklmnop`

### Passo 2: Configurar Variáveis de Ambiente no Supabase

1. **Acesse o Supabase Dashboard:**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto Autazul

2. **Navegue até Edge Functions:**
   - Menu lateral: "Edge Functions"
   - Clique na função "server" (ou "make-server-a07d0a8e")

3. **Configure as Variáveis de Ambiente:**
   - Clique em "Settings" ou "Secrets"
   - Adicione as seguintes variáveis:

   ```
   SMTP_USER=webservicesbsb@gmail.com
   SMTP_PASS=sua_senha_de_app_aqui (16 caracteres sem espaços)
   ```

4. **Salve e Redeploy:**
   - Clique em "Save"
   - Faça redeploy da função se necessário

### Passo 3: Atualizar o Código (IMPORTANTE!)

⚠️ **REMOVA AS CREDENCIAIS HARDCODED** do arquivo `/supabase/functions/server/index.tsx`

**ANTES (INSEGURO - NÃO USE):**
```typescript
const SMTP_CONFIG = {
  user: 'webservicesbsb@gmail.com',  // ❌ NÃO FAÇA ISSO
  pass: 'Akmcbhtj1',                 // ❌ NÃO FAÇA ISSO
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
}
```

**DEPOIS (SEGURO - USE ISSO):**
```typescript
const SMTP_CONFIG = {
  user: Deno.env.get('SMTP_USER'),     // ✅ Lê das variáveis de ambiente
  pass: Deno.env.get('SMTP_PASS'),     // ✅ Lê das variáveis de ambiente
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
};

// Verificar se as credenciais estão configuradas
if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
  console.error('⚠️ ATENÇÃO: Credenciais SMTP não configuradas!')
  console.error('Configure SMTP_USER e SMTP_PASS nas variáveis de ambiente')
} else {
  console.log('✅ Credenciais SMTP configuradas para:', SMTP_CONFIG.user)
}
```

### Passo 4: Melhorar a Função sendEmail

Adicione logs detalhados e tratamento de erros:

```typescript
async function sendEmail(to: string, subject: string, html: string) {
  // Verificar credenciais
  if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
    const error = 'SMTP não configurado: SMTP_USER e SMTP_PASS são obrigatórios'
    console.error('❌', error)
    throw new Error(error)
  }

  const client = new SmtpClient();
  
  try {
    console.log('📧 Enviando email...')
    console.log('  De:', SMTP_CONFIG.user)
    console.log('  Para:', to)
    console.log('  Assunto:', subject)
    
    await client.connect({
      hostname: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.user,
      password: SMTP_CONFIG.pass,
    });

    await client.send({
      from: SMTP_CONFIG.user,
      to,
      subject,
      content: html,
      html: html,
    });

    console.log('✅ Email enviado com sucesso!')
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message)
    
    // Dicas de troubleshooting
    if (error.message?.includes('auth')) {
      console.error('  💡 Dica: Verifique se está usando senha de app (não senha normal)')
    } else if (error.message?.includes('connect')) {
      console.error('  💡 Dica: Verifique conexão de internet e firewall')
    }
    
    throw error;
    
  } finally {
    await client.close();
  }
}
```

### Passo 5: Adicionar Rota de Teste (Opcional mas Recomendado)

Adicione antes do `Deno.serve(app.fetch)`:

```typescript
// ===== ROTA DE TESTE DE EMAIL (SOMENTE ADMIN) =====

app.post('/make-server-a07d0a8e/test-email', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Verificar se é admin
    const userData = await kv.get(`user:${user.id}`)
    if (!isAdmin(userData?.email)) {
      return c.json({ error: 'Forbidden - Admin only' }, 403)
    }

    const { email } = await c.req.json()
    const testEmail = email || userData.email

    // Enviar email de teste
    const html = `
      <h1>🧪 Teste de Email - Autazul</h1>
      <p>Se você está lendo isso, o sistema de email está funcionando!</p>
      <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
      <p>Configuração SMTP:</p>
      <ul>
        <li>Host: ${SMTP_CONFIG.host}</li>
        <li>Port: ${SMTP_CONFIG.port}</li>
        <li>User: ${SMTP_CONFIG.user}</li>
      </ul>
    `

    await sendEmail(testEmail, '🧪 Teste de Email - Autazul', html)

    return c.json({ 
      success: true, 
      message: 'Email de teste enviado com sucesso!',
      sentTo: testEmail
    })
    
  } catch (error) {
    console.error('Error in test-email:', error)
    return c.json({ 
      error: error.message || String(error),
      details: 'Verifique os logs do servidor para mais informações'
    }, 500)
  }
})
```

## 🧪 Como Testar

### Opção 1: Via Interface Admin (Recomendado)

Adicione um botão no AdminPanel:

```typescript
<Button
  onClick={async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a07d0a8e/test-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: 'seu-email@gmail.com' })
        }
      )
      const data = await response.json()
      if (data.success) {
        alert('Email de teste enviado! Verifique sua caixa de entrada.')
      } else {
        alert('Erro: ' + data.error)
      }
    } catch (error) {
      alert('Erro: ' + error.message)
    }
  }}
>
  🧪 Testar Envio de Email
</Button>
```

### Opção 2: Via cURL

```bash
curl -X POST \
  https://SEU_PROJETO_ID.supabase.co/functions/v1/make-server-a07d0a8e/test-email \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@gmail.com"}'
```

### Opção 3: Via Logs do Supabase

1. Acesse: Dashboard → Edge Functions → server → Logs
2. Procure por mensagens começando com `📧` ou `❌`
3. Veja detalhes dos erros

## 🔍 Troubleshooting

### Erro: "Authentication failed"

**Causa:** Senha incorreta ou não é senha de app

**Solução:**
1. Gere uma nova senha de app no Google
2. Use a senha SEM espaços (16 caracteres contínuos)
3. Atualize `SMTP_PASS` no Supabase
4. Redeploy a função

### Erro: "Connection refused" ou "ECONNREFUSED"

**Causa:** Servidor não consegue conectar ao Gmail

**Solução:**
1. Verifique se o Supabase tem acesso à internet
2. Verifique se a porta 587 não está bloqueada
3. Tente usar porta 465 com `secure: true`

### Erro: "SMTP not configured"

**Causa:** Variáveis de ambiente não foram configuradas

**Solução:**
1. Acesse Supabase Dashboard → Edge Functions → Secrets
2. Adicione `SMTP_USER` e `SMTP_PASS`
3. Salve e redeploy

### Email não chega (sem erro)

**Possíveis causas:**
1. Email está na pasta Spam
2. Domínio não verificado (SendGrid/Resend seria melhor)
3. Limite de envio do Gmail atingido (500/dia)

**Solução:**
- Verifique Spam
- Para produção, considere usar SendGrid ou Resend
- Verifique limites da conta Gmail

## 🚀 Alternativas para Produção (Recomendado)

### SendGrid (Profissional)

**Vantagens:**
- ✅ Até 100 emails/dia grátis
- ✅ Melhor entregabilidade
- ✅ Estatísticas detalhadas
- ✅ Domínio próprio

**Setup:**
1. Crie conta em: https://sendgrid.com
2. Gere API Key
3. Configure `SENDGRID_API_KEY` no Supabase
4. Use código:

```typescript
const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personalizations: [{ to: [{ email: to }] }],
    from: { email: 'noreply@autazul.com', name: 'Autazul' },
    subject: subject,
    content: [{ type: 'text/html', value: html }]
  })
})
```

### Resend (Moderno)

**Vantagens:**
- ✅ Até 3.000 emails/mês grátis
- ✅ API simples
- ✅ Bom para desenvolvedores
- ✅ Templates em React

**Setup:**
1. Crie conta em: https://resend.com
2. Gere API Key
3. Configure `RESEND_API_KEY` no Supabase
4. Use código:

```typescript
const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'Autazul <noreply@autazul.com>',
    to: [to],
    subject: subject,
    html: html
  })
})
```

## 📋 Checklist de Implementação

- [ ] Gerar senha de app do Gmail
- [ ] Configurar `SMTP_USER` no Supabase
- [ ] Configurar `SMTP_PASS` no Supabase (senha de app)
- [ ] Remover credenciais hardcoded do código
- [ ] Atualizar função `sendEmail` com logs
- [ ] Adicionar rota de teste (opcional)
- [ ] Fazer redeploy da edge function
- [ ] Testar envio de email
- [ ] Verificar logs em caso de erro
- [ ] (Opcional) Migrar para SendGrid/Resend

## 📊 Limites do Gmail SMTP

- **Limite diário:** 500 emails/dia
- **Limite por hora:** ~100 emails/hora
- **Tamanho máximo:** 25 MB por email
- **Destinatários:** Max 100 por email

Para volumes maiores, **use SendGrid ou Resend**.

## 🔐 Segurança

### ✅ Boas Práticas

1. **NUNCA** coloque credenciais no código
2. **SEMPRE** use variáveis de ambiente
3. **USE** senhas de app (não senha normal)
4. **ROTACIONE** senhas regularmente
5. **MONITORE** logs de erro

### ❌ Não Faça

1. ❌ Não commite credenciais no Git
2. ❌ Não use senha normal do Gmail
3. ❌ Não compartilhe senhas de app
4. ❌ Não deixe logs com senhas

## 📞 Suporte

Se ainda tiver problemas:

1. **Verifique logs** do Supabase Edge Functions
2. **Teste localmente** primeiro (Deno)
3. **Consulte documentação:**
   - Gmail SMTP: https://support.google.com/mail/answer/7126229
   - SendGrid: https://docs.sendgrid.com
   - Resend: https://resend.com/docs

---

**Última atualização:** 22 de Outubro de 2025
**Status:** Aguardando configuração de variáveis de ambiente

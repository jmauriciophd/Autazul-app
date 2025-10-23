# ⚡ Guia Rápido: Corrigir Emails em 5 Minutos

## 🎯 Problema
Emails não estão sendo enviados porque:
1. ❌ Credenciais estão no código (inseguro)
2. ❌ Está usando senha normal (Gmail não aceita)
3. ❌ Variáveis de ambiente não configuradas

## ✅ Solução Rápida

### Passo 1: Criar Senha de App (3 min)

1. **Abra:** https://myaccount.google.com/
2. **Login:** webservicesbsb@gmail.com
3. **Menu:** Segurança
4. **Ative:** Verificação em 2 etapas (se não tiver)
5. **Vá em:** Senhas de app
6. **Selecione:**
   - App: Email
   - Dispositivo: Outro → "Autazul"
7. **Clique:** Gerar
8. **COPIE:** A senha de 16 caracteres (ex: `abcdefghijklmnop`)

### Passo 2: Configurar no Supabase (2 min)

1. **Abra:** https://supabase.com/dashboard
2. **Selecione:** Seu projeto
3. **Vá em:** Settings → Edge Functions
4. **Clique em:** Secrets ou Environment Variables
5. **Adicione:**
   ```
   Nome: SMTP_USER
   Valor: webservicesbsb@gmail.com
   
   Nome: SMTP_PASS
   Valor: [cole a senha de app aqui]
   ```
6. **Salve**

### Passo 3: Atualizar Código (1 min)

Abra `/supabase/functions/server/index.tsx` e **SUBSTITUA:**

```typescript
// ❌ REMOVER ISSO (linhas 20-26):
const SMTP_CONFIG = {
  user: 'webservicesbsb@gmail.com',
  pass: 'Akmcbhtj1',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
}
```

**POR ISSO:**

```typescript
// ✅ USAR ISSO:
const SMTP_CONFIG = {
  user: Deno.env.get('SMTP_USER'),
  pass: Deno.env.get('SMTP_PASS'),
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
};

// Verificar configuração
if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
  console.error('⚠️ SMTP não configurado!')
} else {
  console.log('✅ SMTP configurado:', SMTP_CONFIG.user)
}
```

### Passo 4: Copiar Função Melhorada

**SUBSTITUA** a função `sendEmail` atual **PELA** função em `/EMAIL_CONFIG_SEGURO.tsx` (linha 28-126)

Ela tem:
- ✅ Logs detalhados
- ✅ Diagnóstico de erros
- ✅ Verificação de credenciais

### Passo 5: Adicionar Rota de Teste (Opcional)

**ADICIONE** a rota de teste (de `/EMAIL_CONFIG_SEGURO.tsx`, linha 128-201) **ANTES** da linha:
```typescript
Deno.serve(app.fetch)
```

### Passo 6: Testar

1. **Redeploy** a edge function no Supabase
2. **Acesse** o sistema como admin
3. **Vá no** painel administrativo
4. **Chame** a rota de teste:

```javascript
// No console do navegador:
fetch(`https://SEU_PROJETO.supabase.co/functions/v1/make-server-a07d0a8e/test-email`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email: 'seu-email@gmail.com' })
})
.then(r => r.json())
.then(console.log)
```

Ou adicione este botão no AdminPanel:

```tsx
<Button
  onClick={async () => {
    try {
      const res = await api.request('/test-email', {
        method: 'POST',
        body: JSON.stringify({ email: user?.email })
      })
      alert('✅ Email enviado! Verifique sua caixa de entrada.')
    } catch (error) {
      alert('❌ Erro: ' + error.message)
    }
  }}
>
  🧪 Testar Email
</Button>
```

## 🔍 Como Verificar se Funcionou

### Logs do Supabase

Vá em: **Edge Functions → Logs**

**Se funcionou, verá:**
```
✅ Credenciais SMTP configuradas: webservicesbsb@gmail.com
📧 TENTANDO ENVIAR EMAIL
✅ Conexão SMTP estabelecida com sucesso!
✅✅✅ EMAIL ENVIADO COM SUCESSO! ✅✅✅
```

**Se NÃO funcionou, verá:**
```
❌❌❌ ERRO AO ENVIAR EMAIL ❌❌❌
🔍 DIAGNÓSTICO:
[detalhes do erro e como corrigir]
```

## 🆘 Troubleshooting Rápido

### "SMTP não configurado"
→ Você esqueceu de adicionar variáveis de ambiente no Supabase
→ **Solução:** Passo 2 acima

### "Authentication failed"
→ Senha incorreta ou não é senha de app
→ **Solução:** Passo 1 acima (gere nova senha de app)

### "Connection refused"
→ Firewall ou sem internet
→ **Solução:** Use SendGrid ou Resend (veja `/INSTRUCOES_CONFIGURACAO_EMAIL.md`)

### Email não chega
→ Verificar pasta Spam
→ Gmail tem limite (500 emails/dia)
→ **Solução:** Para produção, use SendGrid

## 📊 Resumo do Que Fazer

```
┌─────────────────────────────────────────┐
│ 1. Gerar senha de app (myaccount.google) │
│    └─→ Copiar 16 caracteres             │
│                                          │
│ 2. Configurar no Supabase                │
│    ├─→ SMTP_USER=webservicesbsb@...     │
│    └─→ SMTP_PASS=senha_de_app           │
│                                          │
│ 3. Atualizar código                      │
│    ├─→ Remover credenciais hardcoded    │
│    ├─→ Usar Deno.env.get()              │
│    └─→ Adicionar logs detalhados        │
│                                          │
│ 4. Redeploy edge function                │
│                                          │
│ 5. Testar envio                          │
│    └─→ Verificar logs                   │
└─────────────────────────────────────────┘
```

## 🎯 Checklist Rápido

- [ ] Senha de app gerada no Google
- [ ] SMTP_USER configurado no Supabase
- [ ] SMTP_PASS configurado no Supabase  
- [ ] Código atualizado (sem credenciais hardcoded)
- [ ] Função sendEmail melhorada (com logs)
- [ ] Edge function redeployada
- [ ] Teste realizado
- [ ] Logs verificados
- [ ] Email recebido ✅

## 📝 Documentação Completa

Para detalhes completos, alternativas (SendGrid/Resend), e troubleshooting avançado:

→ **Leia:** `/INSTRUCOES_CONFIGURACAO_EMAIL.md`

---

**Tempo estimado:** 5-10 minutos
**Dificuldade:** ⭐⭐ Fácil
**Última atualização:** 22/10/2025

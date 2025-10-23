// ===== CONFIGURAÇÃO DE EMAIL SEGURA =====
// Cole este código no início do /supabase/functions/server/index.tsx
// SUBSTITUA a seção de email configuration existente

// SMTP Configuration (usando variáveis de ambiente)
const SMTP_CONFIG = {
  user: Deno.env.get('SMTP_USER'),     // webservicesbsb@gmail.com
  pass: Deno.env.get('SMTP_PASS'),     // Senha de app do Gmail (16 caracteres)
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // TLS
};

import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

// Verificar se as credenciais SMTP estão configuradas
if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
  console.error('⚠️⚠️⚠️ ATENÇÃO: Credenciais SMTP NÃO configuradas! ⚠️⚠️⚠️')
  console.error('📧 Emails NÃO serão enviados até você configurar:')
  console.error('   1. SMTP_USER=webservicesbsb@gmail.com')
  console.error('   2. SMTP_PASS=sua_senha_de_app_do_gmail')
  console.error('   nas variáveis de ambiente do Supabase Edge Functions')
  console.error('   Veja: /INSTRUCOES_CONFIGURACAO_EMAIL.md')
} else {
  console.log('✅ Credenciais SMTP configuradas:')
  console.log('   User:', SMTP_CONFIG.user)
  console.log('   Pass:', '*'.repeat(SMTP_CONFIG.pass.length), '(oculto)')
  console.log('   Host:', SMTP_CONFIG.host)
  console.log('   Port:', SMTP_CONFIG.port)
}

// Email sending function using SMTP with detailed logging
async function sendEmail(to: string, subject: string, html: string) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 TENTANDO ENVIAR EMAIL')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Verificar credenciais antes de tentar enviar
  if (!SMTP_CONFIG.user || !SMTP_CONFIG.pass) {
    const errorMsg = 'SMTP não configurado: Configure SMTP_USER e SMTP_PASS nas variáveis de ambiente'
    console.error('❌ ERRO:', errorMsg)
    console.error('📝 Leia: /INSTRUCOES_CONFIGURACAO_EMAIL.md')
    throw new Error(errorMsg)
  }

  const client = new SmtpClient();
  
  try {
    console.log('📤 Detalhes do Email:')
    console.log('  De........:', SMTP_CONFIG.user)
    console.log('  Para......:', to)
    console.log('  Assunto...:', subject)
    console.log('  Tamanho...:', html.length, 'caracteres')
    
    console.log('\n🔌 Conectando ao servidor SMTP...')
    console.log('  Host......:', SMTP_CONFIG.host)
    console.log('  Port......:', SMTP_CONFIG.port)
    console.log('  User......:', SMTP_CONFIG.user)
    console.log('  Pass......:', SMTP_CONFIG.pass.substring(0, 4) + '*'.repeat(SMTP_CONFIG.pass.length - 4))
    
    await client.connect({
      hostname: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      username: SMTP_CONFIG.user,
      password: SMTP_CONFIG.pass,
    });

    console.log('✅ Conexão SMTP estabelecida com sucesso!')
    console.log('\n📨 Enviando mensagem...')
    
    await client.send({
      from: SMTP_CONFIG.user,
      to: to,
      subject: subject,
      content: html,
      html: html, // Garantir que o HTML seja enviado
    });

    console.log('✅✅✅ EMAIL ENVIADO COM SUCESSO! ✅✅✅')
    console.log('  Para:', to)
    console.log('  Horário:', new Date().toLocaleString('pt-BR'))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    return { success: true };
    
  } catch (error: any) {
    console.error('\n❌❌❌ ERRO AO ENVIAR EMAIL ❌❌❌')
    console.error('Tipo do erro:', error.constructor.name)
    console.error('Mensagem:', error.message)
    
    if (error.stack) {
      console.error('Stack trace:')
      console.error(error.stack)
    }
    
    // Diagnóstico detalhado baseado no tipo de erro
    console.error('\n🔍 DIAGNÓSTICO:')
    
    if (error.message?.toLowerCase().includes('auth')) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('🔐 ERRO DE AUTENTICAÇÃO')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Possíveis causas:')
      console.error('  1. ❌ Senha incorreta')
      console.error('  2. ❌ Usando senha normal em vez de senha de app')
      console.error('  3. ❌ Senha de app expirada ou revogada')
      console.error('\n✅ SOLUÇÃO:')
      console.error('  1. Acesse: https://myaccount.google.com/apppasswords')
      console.error('  2. Gere uma nova senha de app (16 caracteres)')
      console.error('  3. Copie a senha SEM ESPAÇOS')
      console.error('  4. Configure SMTP_PASS no Supabase com essa senha')
      console.error('  5. Redeploy a edge function')
      
    } else if (error.message?.toLowerCase().includes('connect') || 
               error.message?.toLowerCase().includes('econnrefused') ||
               error.message?.toLowerCase().includes('timeout')) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('🌐 ERRO DE CONEXÃO')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Possíveis causas:')
      console.error('  1. ❌ Sem acesso à internet')
      console.error('  2. ❌ Firewall bloqueando porta 587')
      console.error('  3. ❌ DNS não resolve smtp.gmail.com')
      console.error('  4. ❌ Supabase bloqueando conexões SMTP')
      console.error('\n✅ SOLUÇÃO:')
      console.error('  1. Verifique se o servidor tem internet')
      console.error('  2. Tente porta 465 com secure: true')
      console.error('  3. Considere usar SendGrid ou Resend')
      
    } else if (error.message?.toLowerCase().includes('tls') || 
               error.message?.toLowerCase().includes('ssl')) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('🔒 ERRO DE SEGURANÇA TLS/SSL')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('✅ SOLUÇÃO:')
      console.error('  Tente mudar para porta 465 com secure: true')
      
    } else {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❓ ERRO DESCONHECIDO')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Leia a documentação completa em:')
      console.error('  /INSTRUCOES_CONFIGURACAO_EMAIL.md')
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    throw error;
    
  } finally {
    try {
      await client.close();
      console.log('🔌 Conexão SMTP fechada')
    } catch (closeError: any) {
      console.error('⚠️ Aviso: Erro ao fechar conexão SMTP:', closeError.message)
    }
  }
}

// ===== ROTA DE TESTE DE EMAIL (ADMIN ONLY) =====
// Cole esta rota ANTES do Deno.serve(app.fetch)

app.post('/make-server-a07d0a8e/test-email', async (c) => {
  try {
    console.log('🧪 Rota de teste de email chamada')
    
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Verificar se é admin
    const userData = await kv.get(`user:${user.id}`)
    const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
    if (!userData?.email || !adminEmails.includes(userData.email.toLowerCase())) {
      return c.json({ error: 'Forbidden - Admin access required' }, 403)
    }

    const body = await c.req.json()
    const testEmail = body.email || userData.email

    console.log('📧 Enviando email de teste para:', testEmail)

    // HTML do email de teste
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
    h1 { color: #15C3D6; }
    .info { background: #f0f9ff; border-left: 4px solid #15C3D6; padding: 15px; margin: 20px 0; }
    .success { color: #22c55e; font-size: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 Teste de Email - Autazul</h1>
    <p class="success">✅ Sucesso! O sistema de email está funcionando!</p>
    <div class="info">
      <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR', { 
        dateStyle: 'full', 
        timeStyle: 'long',
        timeZone: 'America/Sao_Paulo'
      })}</p>
      <p><strong>Enviado para:</strong> ${testEmail}</p>
      <p><strong>Servidor SMTP:</strong> ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}</p>
      <p><strong>Conta:</strong> ${SMTP_CONFIG.user}</p>
    </div>
    <p>Este é um email de teste automático do sistema Autazul.</p>
    <p>Se você recebeu este email, significa que a configuração SMTP está correta!</p>
    <hr>
    <p style="color: #999; font-size: 12px;">
      Autazul - Sistema de Acompanhamento<br>
      Email automático - Não responda
    </p>
  </div>
</body>
</html>
    `

    // Tentar enviar
    await sendEmail(testEmail, '🧪 Teste de Email - Autazul Sistema', html)

    return c.json({ 
      success: true, 
      message: 'Email de teste enviado com sucesso!',
      sentTo: testEmail,
      sentAt: new Date().toISOString(),
      smtpConfig: {
        host: SMTP_CONFIG.host,
        port: SMTP_CONFIG.port,
        user: SMTP_CONFIG.user
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erro na rota de teste de email:', error)
    return c.json({ 
      success: false,
      error: error.message || String(error),
      details: 'Verifique os logs do servidor para diagnóstico completo',
      troubleshooting: 'Leia /INSTRUCOES_CONFIGURACAO_EMAIL.md'
    }, 500)
  }
})

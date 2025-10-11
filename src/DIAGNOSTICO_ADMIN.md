# 🔍 Script de Diagnóstico - Acesso Admin

## 📋 Como Usar

1. Abrir o console do navegador (**F12**)
2. Ir para a aba **Console**
3. Copiar e colar o script abaixo
4. Pressionar **Enter**
5. Analisar o resultado

---

## 🛠️ Script de Diagnóstico Completo

```javascript
// ========================================
// SCRIPT DE DIAGNÓSTICO - ACESSO ADMIN
// Sistema Autazul
// ========================================

console.clear()
console.log('%c🔍 DIAGNÓSTICO DE ACESSO ADMINISTRATIVO', 'color: #46B0FD; font-size: 20px; font-weight: bold')
console.log('=' .repeat(60))

// 1. Verificar LocalStorage
console.log('\n%c📦 1. VERIFICANDO LOCALSTORAGE', 'color: #15C3D6; font-size: 16px; font-weight: bold')
console.log('-'.repeat(60))

const userStr = localStorage.getItem('user')
const authToken = localStorage.getItem('auth_token')
const activeRole = localStorage.getItem('activeRole')
const selectedProfile = localStorage.getItem('selectedProfile')

if (!userStr) {
  console.log('%c❌ Usuário NÃO encontrado no localStorage', 'color: red; font-weight: bold')
  console.log('→ Você precisa fazer login')
} else {
  console.log('%c✅ Usuário encontrado no localStorage', 'color: green')
  
  try {
    const user = JSON.parse(userStr)
    
    console.log('\n📄 Dados do usuário:')
    console.table({
      'ID': user?.id || 'N/A',
      'Nome': user?.name || 'N/A',
      'Email': user?.email || 'N/A',
      'Role': user?.role || 'N/A',
      'Base Role': user?.baseRole || 'N/A',
      'Is Admin': user?.isAdmin !== undefined ? user.isAdmin : 'UNDEFINED'
    })
    
    // 2. Verificar Status de Admin
    console.log('\n%c👑 2. VERIFICANDO STATUS DE ADMIN', 'color: #15C3D6; font-size: 16px; font-weight: bold')
    console.log('-'.repeat(60))
    
    const adminEmails = ['jmauriciophd@gmail.com', 'webservicesbsb@gmail.com']
    const emailLower = user?.email?.toLowerCase()
    const shouldBeAdmin = adminEmails.includes(emailLower)
    const isAdmin = user?.isAdmin === true
    
    console.log(`📧 Email: ${user?.email}`)
    console.log(`📧 Email (lowercase): ${emailLower}`)
    console.log(`🎯 Deveria ser admin: ${shouldBeAdmin ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`👑 É admin (isAdmin): ${isAdmin ? '✅ SIM' : '❌ NÃO'}`)
    
    if (shouldBeAdmin && !isAdmin) {
      console.log('\n%c⚠️ PROBLEMA DETECTADO!', 'color: orange; font-size: 14px; font-weight: bold')
      console.log('O email está na lista de admins, mas isAdmin = false/undefined')
      console.log('\n💡 SOLUÇÃO:')
      console.log('1. Fazer LOGOUT')
      console.log('2. Fazer LOGIN novamente')
      console.log('3. O campo isAdmin será atualizado automaticamente')
    } else if (shouldBeAdmin && isAdmin) {
      console.log('\n%c✅ TUDO CERTO!', 'color: green; font-size: 14px; font-weight: bold')
      console.log('Você é um administrador e o sistema está reconhecendo corretamente')
    } else if (!shouldBeAdmin) {
      console.log('\n%cℹ️ INFORMAÇÃO', 'color: blue; font-size: 14px')
      console.log('Este email não está na lista de administradores')
      console.log('Admins autorizados:')
      adminEmails.forEach(email => console.log(`  • ${email}`))
    }
    
    // 3. Verificar Tokens
    console.log('\n%c🔐 3. VERIFICANDO TOKENS', 'color: #15C3D6; font-size: 16px; font-weight: bold')
    console.log('-'.repeat(60))
    
    console.table({
      'Auth Token': authToken ? '✅ Presente' : '❌ Ausente',
      'Active Role': activeRole || 'N/A',
      'Selected Profile': selectedProfile || 'N/A'
    })
    
    // 4. Verificar Componente React
    console.log('\n%c⚛️ 4. VERIFICANDO REACT COMPONENTS', 'color: #15C3D6; font-size: 16px; font-weight: bold')
    console.log('-'.repeat(60))
    
    // Verificar se o ícone da coroa existe no DOM
    const crownButton = document.querySelector('[title="Painel Administrativo"]')
    const crownIcon = document.querySelector('.lucide-crown')
    
    if (crownButton || crownIcon) {
      console.log('%c✅ Ícone de coroa ENCONTRADO no DOM', 'color: green')
      if (crownButton) {
        console.log('→ Botão:', crownButton)
        console.log('→ Cor:', window.getComputedStyle(crownButton).color)
      }
      if (crownIcon) {
        console.log('→ Ícone:', crownIcon)
      }
    } else {
      console.log('%c❌ Ícone de coroa NÃO ENCONTRADO no DOM', 'color: red; font-weight: bold')
      
      if (shouldBeAdmin && !isAdmin) {
        console.log('\n💡 Causa provável: isAdmin = false/undefined')
        console.log('💡 Solução: Fazer logout e login novamente')
      } else if (!shouldBeAdmin) {
        console.log('\n💡 Causa: Email não está na lista de admins')
      }
    }
    
    // 5. Diagnóstico Final
    console.log('\n%c📊 5. DIAGNÓSTICO FINAL', 'color: #15C3D6; font-size: 16px; font-weight: bold')
    console.log('-'.repeat(60))
    
    const hasUser = !!user
    const hasToken = !!authToken
    const hasIsAdmin = user?.isAdmin !== undefined
    const isAdminTrue = user?.isAdmin === true
    const hasCrownInDOM = !!(crownButton || crownIcon)
    
    console.table({
      '✓ Usuário no localStorage': hasUser ? '✅' : '❌',
      '✓ Token de autenticação': hasToken ? '✅' : '❌',
      '✓ Campo isAdmin existe': hasIsAdmin ? '✅' : '❌',
      '✓ isAdmin = true': isAdminTrue ? '✅' : '❌',
      '✓ Ícone no DOM': hasCrownInDOM ? '✅' : '❌'
    })
    
    // Conclusão
    console.log('\n%c🎯 CONCLUSÃO', 'color: #46B0FD; font-size: 16px; font-weight: bold')
    console.log('='.repeat(60))
    
    if (hasUser && hasToken && isAdminTrue && hasCrownInDOM) {
      console.log('%c✅ SISTEMA FUNCIONANDO PERFEITAMENTE!', 'color: green; font-size: 14px; font-weight: bold')
      console.log('O ícone de coroa deve estar visível no header')
      console.log('Se não estiver vendo, tente:')
      console.log('1. Recarregar a página (F5)')
      console.log('2. Limpar cache (Ctrl+Shift+R)')
    } else if (hasUser && hasToken && shouldBeAdmin && !isAdminTrue) {
      console.log('%c⚠️ AÇÃO NECESSÁRIA: LOGOUT E LOGIN', 'color: orange; font-size: 14px; font-weight: bold')
      console.log('\nPasso a passo:')
      console.log('1. Clicar no botão "Sair" no header')
      console.log('2. Aguardar redirecionamento para tela de login')
      console.log('3. Fazer login com:', user?.email)
      console.log('4. O campo isAdmin será atualizado automaticamente')
      console.log('5. O ícone de coroa aparecerá no header')
    } else if (!hasUser || !hasToken) {
      console.log('%c⚠️ VOCÊ NÃO ESTÁ LOGADO', 'color: red; font-size: 14px; font-weight: bold')
      console.log('Por favor, faça login no sistema')
    } else if (!shouldBeAdmin) {
      console.log('%cℹ️ VOCÊ NÃO É ADMINISTRADOR', 'color: blue; font-size: 14px; font-weight: bold')
      console.log('Este email não tem privilégios administrativos')
    }
    
  } catch (error) {
    console.error('%c❌ ERRO ao processar dados do usuário', 'color: red; font-weight: bold')
    console.error(error)
  }
}

console.log('\n' + '='.repeat(60))
console.log('%c✅ Diagnóstico concluído!', 'color: #46B0FD; font-size: 16px; font-weight: bold')
console.log('='.repeat(60))
```

---

## 📊 Interpretação dos Resultados

### ✅ Resultado Positivo (Tudo OK)

```
✅ SISTEMA FUNCIONANDO PERFEITAMENTE!
✓ Usuário no localStorage: ✅
✓ Token de autenticação: ✅
✓ Campo isAdmin existe: ✅
✓ isAdmin = true: ✅
✓ Ícone no DOM: ✅
```

**O que fazer**: Nada! O sistema está funcionando corretamente.

---

### ⚠️ Resultado: Requer Logout/Login

```
⚠️ AÇÃO NECESSÁRIA: LOGOUT E LOGIN
✓ Usuário no localStorage: ✅
✓ Token de autenticação: ✅
✓ Campo isAdmin existe: ❌
✓ isAdmin = true: ❌
✓ Ícone no DOM: ❌
```

**O que fazer**:
1. Clicar em "Sair"
2. Fazer login novamente
3. Executar diagnóstico novamente

---

### ❌ Resultado: Não Logado

```
❌ Usuário NÃO encontrado no localStorage
→ Você precisa fazer login
```

**O que fazer**: Fazer login no sistema

---

### ℹ️ Resultado: Não é Admin

```
ℹ️ VOCÊ NÃO É ADMINISTRADOR
Este email não tem privilégios administrativos
```

**O que fazer**: Usar um dos emails autorizados:
- `jmauriciophd@gmail.com`
- `webservicesbsb@gmail.com`

---

## 🔧 Scripts Auxiliares

### Forçar isAdmin = true (Apenas para Testes)

```javascript
// ⚠️ APENAS PARA TESTES - NÃO USAR EM PRODUÇÃO
const user = JSON.parse(localStorage.getItem('user'))
user.isAdmin = true
localStorage.setItem('user', JSON.stringify(user))
console.log('✅ isAdmin forçado para true')
console.log('🔄 Recarregando página...')
location.reload()
```

---

### Limpar Todos os Dados

```javascript
// Limpar LocalStorage completamente
localStorage.clear()
console.log('✅ LocalStorage limpo')
console.log('🔄 Recarregando página...')
location.reload()
```

---

### Verificar Apenas isAdmin

```javascript
// Verificação rápida
const user = JSON.parse(localStorage.getItem('user'))
console.log('Email:', user?.email)
console.log('Is Admin:', user?.isAdmin)
```

---

## 📝 Log de Exemplo

### Usuário Admin (Correto)

```
🔍 DIAGNÓSTICO DE ACESSO ADMINISTRATIVO
============================================================

📦 1. VERIFICANDO LOCALSTORAGE
------------------------------------------------------------
✅ Usuário encontrado no localStorage

📄 Dados do usuário:
┌─────────────┬──────────────────────────────┐
│   (index)   │           Values             │
├─────────────┼──────────────────────────────┤
│     ID      │  abc123xyz                   │
│    Nome     │  João Maurício               │
│    Email    │  jmauriciophd@gmail.com      │
│    Role     │  parent                      │
│  Base Role  │  parent                      │
│  Is Admin   │  true                        │
└─────────────┴──────────────────────────────┘

👑 2. VERIFICANDO STATUS DE ADMIN
------------------------------------------------------------
📧 Email: jmauriciophd@gmail.com
📧 Email (lowercase): jmauriciophd@gmail.com
🎯 Deveria ser admin: ✅ SIM
👑 É admin (isAdmin): ✅ SIM

✅ TUDO CERTO!
Você é um administrador e o sistema está reconhecendo corretamente

🔐 3. VERIFICANDO TOKENS
------------------------------------------------------------
┌───────────────────┬────────────┐
│     (index)       │   Values   │
├───────────────────┼────────────┤
│   Auth Token      │ ✅ Presente │
│   Active Role     │   parent   │
│ Selected Profile  │   parent   │
└───────────────────┴────────────┘

⚛️ 4. VERIFICANDO REACT COMPONENTS
------------------------------------------------------------
✅ Ícone de coroa ENCONTRADO no DOM

📊 5. DIAGNÓSTICO FINAL
------------------------------------------------------------
┌─────────────────────────────┬─────┐
│          (index)            │ Val │
├─────────────────────────────┼─────┤
│ ✓ Usuário no localStorage   │  ✅  │
│ ✓ Token de autenticação     │  ✅  │
│ ✓ Campo isAdmin existe      │  ✅  │
│ ✓ isAdmin = true            │  ✅  │
│ ✓ Ícone no DOM              │  ✅  │
└─────────────────────────────┴─────┘

🎯 CONCLUSÃO
============================================================
✅ SISTEMA FUNCIONANDO PERFEITAMENTE!
```

---

### Usuário Admin (Precisa Logout/Login)

```
🔍 DIAGNÓSTICO DE ACESSO ADMINISTRATIVO
============================================================

📦 1. VERIFICANDO LOCALSTORAGE
------------------------------------------------------------
✅ Usuário encontrado no localStorage

📄 Dados do usuário:
┌─────────────┬──────────────────────────────┐
│   (index)   │           Values             │
├─────────────┼──────────────────────────────┤
│     ID      │  abc123xyz                   │
│    Nome     │  João Maurício               │
│    Email    │  jmauriciophd@gmail.com      │
│    Role     │  parent                      │
│  Base Role  │  parent                      │
│  Is Admin   │  UNDEFINED                   │ ← PROBLEMA
└─────────────┴──────────────────────────────┘

👑 2. VERIFICANDO STATUS DE ADMIN
------------------------------------------------------------
📧 Email: jmauriciophd@gmail.com
📧 Email (lowercase): jmauriciophd@gmail.com
🎯 Deveria ser admin: ✅ SIM
👑 É admin (isAdmin): ❌ NÃO

⚠️ PROBLEMA DETECTADO!
O email está na lista de admins, mas isAdmin = false/undefined

💡 SOLUÇÃO:
1. Fazer LOGOUT
2. Fazer LOGIN novamente
3. O campo isAdmin será atualizado automaticamente

🎯 CONCLUSÃO
============================================================
⚠️ AÇÃO NECESSÁRIA: LOGOUT E LOGIN
```

---

## 📞 Suporte

Se após executar o diagnóstico e seguir as soluções o problema persistir:

1. Copiar toda a saída do console
2. Fazer um print da tela
3. Enviar para o suporte técnico

---

**Última atualização**: 10/01/2025  
**Versão**: 1.0  
**Compatível com**: Sistema Autazul v2.0

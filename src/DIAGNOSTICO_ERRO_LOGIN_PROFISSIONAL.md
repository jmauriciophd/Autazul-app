# 🔍 DIAGNÓSTICO: Erro no Login de Profissional

**Data:** 24 de outubro de 2025
**Status:** CRÍTICO - Sistema abrindo tela errada para profissionais

---

## 📋 RESUMO DO PROBLEMA

Quando um usuário seleciona "Profissional" na tela de login e faz login, o sistema está abrindo incorretamente a tela de **Pai/Responsável** ao invés da tela de **Profissional**.

---

## 🔎 ANÁLISE DO CÓDIGO

### 1️⃣ **Inconsistência de Storage (ERRO PRINCIPAL)**

**Arquivo:** `/components/AuthScreen.tsx` - Linha 37
```typescript
// ❌ PROBLEMA: Salvando em localStorage
localStorage.setItem('selectedProfile', profileType)
await signIn(email, password)
```

**Arquivo:** `/utils/AuthContext.tsx` - Linha 129
```typescript
// ❌ PROBLEMA: Tentando ler de sessionStorage (diferente!)
const selectedProfile = sessionStorage.getItem('selectedProfile')
const activeRole = selectedProfile || userData.role || 'parent'
```

**RESULTADO:** O perfil selecionado nunca é recuperado corretamente porque está sendo salvo em `localStorage` mas lido de `sessionStorage`.

---

### 2️⃣ **Fluxo de Autenticação Atual (COM ERRO)**

```
1. Usuário seleciona "Profissional" na tela de login
2. AuthScreen.tsx salva em localStorage: 'selectedProfile' = 'professional'
3. Chama signIn(email, password)
4. AuthContext.tsx tenta ler de sessionStorage: 'selectedProfile' = null
5. Como não encontra, usa fallback: userData.role || 'parent'
6. Se userData.role for 'parent' (usuário dual), abre tela de pai
7. ❌ TELA ERRADA ABERTA!
```

---

### 3️⃣ **Fallback Problemático**

**Arquivo:** `/utils/AuthContext.tsx` - Linha 130
```typescript
const activeRole = selectedProfile || userData.role || 'parent'
```

- Se `selectedProfile` for `null` (porque está lendo do storage errado)
- E se `userData.role` for `'parent'` (padrão do banco)
- O sistema **SEMPRE** abre a tela de pai, ignorando a seleção do usuário

---

### 4️⃣ **Impacto em Usuários Duais**

Usuários que têm **ambos** os perfis (pai E profissional) são os mais afetados:
- Mesmo selecionando "Profissional" no login
- O sistema ignora a seleção
- Abre sempre a tela de "Pai/Responsável"

---

## 🎯 SOLUÇÃO PROPOSTA

### **Correção 1: Padronizar para sessionStorage**
- Mudar AuthScreen.tsx para usar `sessionStorage` ao invés de `localStorage`
- Mais seguro e apropriado para dados de sessão

### **Correção 2: Validar antes de fazer fallback**
- Garantir que o perfil selecionado seja respeitado
- Só usar fallback se nenhum perfil foi selecionado

### **Correção 3: Limpar storage ao fazer logout**
- Evitar que dados antigos interfiram em novos logins

---

## 🧪 CENÁRIOS DE TESTE NECESSÁRIOS

### Teste 1: Login como Profissional (usuário só profissional)
- ✅ Selecionar "Profissional"
- ✅ Fazer login
- ✅ Deve abrir ProfessionalDashboard

### Teste 2: Login como Pai (usuário só pai)
- ✅ Selecionar "Pai/Responsável"
- ✅ Fazer login
- ✅ Deve abrir ParentDashboard

### Teste 3: Login como Profissional (usuário dual)
- ✅ Selecionar "Profissional"
- ✅ Fazer login
- ✅ Deve abrir ProfessionalDashboard (não ParentDashboard!)

### Teste 4: Login como Pai (usuário dual)
- ✅ Selecionar "Pai/Responsável"
- ✅ Fazer login
- ✅ Deve abrir ParentDashboard

### Teste 5: Troca de perfil após login
- ✅ Fazer login como Profissional
- ✅ Trocar para perfil Pai usando ProfileSwitcher
- ✅ Deve trocar para ParentDashboard
- ✅ Fazer logout e login novamente
- ✅ Deve respeitar a nova seleção

---

## 📝 ARQUIVOS A SEREM MODIFICADOS

1. ✅ `/components/AuthScreen.tsx` - Linha 37
2. ✅ `/utils/AuthContext.tsx` - Linhas 74, 129, 141
3. ✅ `/utils/AuthContext.tsx` - Função signOut (adicionar limpeza)

---

## ⚠️ RISCOS E VALIDAÇÕES

### Riscos:
- ❌ Quebrar login existente de usuários
- ❌ Perder sessão ativa ao trocar de perfil
- ❌ Logout não limpar dados corretamente

### Validações necessárias:
- ✅ Verificar que logout limpa sessionStorage
- ✅ Verificar que signup não quebrou
- ✅ Verificar que ProfileSwitcher ainda funciona
- ✅ Verificar que recarregar página mantém perfil correto

---

## 📊 IMPACTO

- **Gravidade:** ALTA
- **Usuários afetados:** Todos os profissionais e usuários duais
- **Funcionalidade comprometida:** Login com seleção de perfil
- **Urgência:** IMEDIATA - afeta uso básico do sistema

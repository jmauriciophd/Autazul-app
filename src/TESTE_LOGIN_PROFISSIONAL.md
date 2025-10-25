# 🧪 PLANO DE TESTES: Correção de Login de Profissional

**Data:** 24 de outubro de 2025
**Versão:** 1.0
**Responsável:** Sistema Autazul

---

## 📋 RESUMO

Este documento descreve os testes necessários para validar a correção do bug de redirecionamento incorreto quando um profissional faz login.

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **AuthScreen.tsx** - Linha 37
```typescript
// ANTES (ERRADO):
localStorage.setItem('selectedProfile', profileType)

// DEPOIS (CORRETO):
sessionStorage.setItem('selectedProfile', profileType)
```

### 2. **AuthContext.tsx** - Função signIn
```typescript
// Adicionado logging detalhado
console.log('=== LOGIN DEBUG ===')
console.log('User data from server:', userData)
console.log('Selected profile from sessionStorage:', selectedProfile)
console.log('User base role from server:', userData.role)
console.log('Active role determined:', activeRole)
console.log('Final user object:', userWithProfile)
console.log('==================')

// Lógica corrigida para respeitar seleção do usuário
const activeRole = selectedProfile || userData.role || 'parent'
```

### 3. **AuthContext.tsx** - Função signOut
```typescript
// Já estava correto - limpa sessionStorage
sessionStorage.removeItem('activeRole')
sessionStorage.removeItem('selectedProfile')
```

---

## 🧪 CENÁRIOS DE TESTE

### ✅ TESTE 1: Login como Profissional (Usuário Exclusivo Profissional)

**Objetivo:** Verificar que um usuário cadastrado apenas como profissional consegue fazer login e acessar o dashboard correto.

**Pré-requisitos:**
- Usuário cadastrado apenas como profissional no sistema
- Email: `profissional@teste.com`
- Password: `teste123`

**Passos:**
1. Abrir tela de login
2. Selecionar opção "Profissional" (verificar ícone de estetoscópio)
3. Preencher email: `profissional@teste.com`
4. Preencher senha: `teste123`
5. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Sistema abre ProfessionalDashboard
- ✅ Não abre ParentDashboard
- ✅ Console mostra logs:
  ```
  === LOGIN DEBUG ===
  Selected profile from sessionStorage: professional
  User base role from server: professional
  Active role determined: professional
  Final user object: { role: 'professional', ... }
  ==================
  ```

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 2: Login como Pai (Usuário Exclusivo Pai)

**Objetivo:** Verificar que a correção não quebrou o login de pais.

**Pré-requisitos:**
- Usuário cadastrado apenas como pai no sistema
- Email: `pai@teste.com`
- Password: `teste123`

**Passos:**
1. Abrir tela de login
2. Selecionar opção "Pai/Responsável" (verificar ícone de pessoas)
3. Preencher email: `pai@teste.com`
4. Preencher senha: `teste123`
5. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Sistema abre ParentDashboard
- ✅ Não abre ProfessionalDashboard
- ✅ Console mostra logs:
  ```
  === LOGIN DEBUG ===
  Selected profile from sessionStorage: parent
  User base role from server: parent
  Active role determined: parent
  Final user object: { role: 'parent', ... }
  ==================
  ```

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 3: Login como Profissional (Usuário Dual)

**Objetivo:** Verificar que usuário com ambos perfis consegue acessar dashboard de profissional quando seleciona essa opção.

**Pré-requisitos:**
- Usuário cadastrado como PAI no banco (role: 'parent')
- Mas tem acesso a ambos os perfis (pode ser profissional também)
- Email: `dual@teste.com`
- Password: `teste123`

**Passos:**
1. Abrir tela de login
2. Selecionar opção "Profissional"
3. Preencher email: `dual@teste.com`
4. Preencher senha: `teste123`
5. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Sistema abre ProfessionalDashboard (NÃO ParentDashboard!)
- ✅ Console mostra:
  ```
  === LOGIN DEBUG ===
  Selected profile from sessionStorage: professional
  User base role from server: parent
  Active role determined: professional  <-- CRÍTICO
  Final user object: { role: 'professional', baseRole: 'parent', ... }
  ==================
  ```

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 4: Login como Pai (Usuário Dual)

**Objetivo:** Verificar que usuário dual consegue acessar dashboard de pai quando seleciona essa opção.

**Pré-requisitos:**
- Mesmo usuário do TESTE 3
- Email: `dual@teste.com`
- Password: `teste123`

**Passos:**
1. Se estiver logado, fazer logout
2. Abrir tela de login
3. Selecionar opção "Pai/Responsável"
4. Preencher email: `dual@teste.com`
5. Preencher senha: `teste123`
6. Clicar em "Entrar"

**Resultado Esperado:**
- ✅ Sistema abre ParentDashboard
- ✅ Console mostra:
  ```
  === LOGIN DEBUG ===
  Selected profile from sessionStorage: parent
  User base role from server: parent
  Active role determined: parent
  Final user object: { role: 'parent', baseRole: 'parent', ... }
  ==================
  ```

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 5: Troca de Perfil Após Login

**Objetivo:** Verificar que ProfileSwitcher continua funcionando corretamente.

**Pré-requisitos:**
- Usuário dual logado como profissional
- Email: `dual@teste.com`

**Passos:**
1. Estar logado no ProfessionalDashboard
2. Clicar no ProfileSwitcher (ícone no canto superior)
3. Selecionar card "Pai/Responsável"
4. Verificar mudança de dashboard

**Resultado Esperado:**
- ✅ Dashboard muda de Professional para Parent
- ✅ sessionStorage atualizado: `activeRole = 'parent'`
- ✅ Não faz logout
- ✅ Dados da sessão preservados

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 6: Reload de Página Mantém Perfil

**Objetivo:** Verificar que recarregar a página não reseta o perfil selecionado.

**Pré-requisitos:**
- Usuário logado como profissional

**Passos:**
1. Fazer login como profissional
2. Verificar que está no ProfessionalDashboard
3. Pressionar F5 (recarregar página)
4. Aguardar carregamento

**Resultado Esperado:**
- ✅ Continua no ProfessionalDashboard
- ✅ NÃO volta para ParentDashboard
- ✅ sessionStorage preservado

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 7: Logout Limpa Seleção de Perfil

**Objetivo:** Verificar que logout limpa corretamente os dados de sessão.

**Pré-requisitos:**
- Usuário logado

**Passos:**
1. Fazer login como profissional
2. Fazer logout
3. Verificar sessionStorage no console do navegador:
   ```javascript
   sessionStorage.getItem('selectedProfile')
   sessionStorage.getItem('activeRole')
   ```

**Resultado Esperado:**
- ✅ `selectedProfile` = null
- ✅ `activeRole` = null
- ✅ Usuário redirecionado para tela de login
- ✅ Próximo login exige nova seleção de perfil

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 8: Signup Não Quebrou

**Objetivo:** Verificar que a correção não afetou o cadastro de novos usuários.

**Pré-requisitos:**
- Nenhum

**Passos:**
1. Clicar em "Não tem conta? Cadastre-se"
2. Preencher nome: "Novo Usuário Teste"
3. Preencher email: `novo@teste.com`
4. Preencher senha: `teste123`
5. Aceitar termos e política
6. Clicar em "Criar Conta"

**Resultado Esperado:**
- ✅ Conta criada com sucesso
- ✅ Login automático realizado
- ✅ Dashboard de pai/responsável aberto (padrão)
- ✅ Nenhum erro no console

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 9: Múltiplos Logins Sequenciais

**Objetivo:** Verificar que trocar entre perfis em logins sequenciais funciona corretamente.

**Pré-requisitos:**
- Usuário dual: `dual@teste.com`

**Passos:**
1. Login como "Profissional" → Logout
2. Login como "Pai/Responsável" → Logout
3. Login como "Profissional" → Logout
4. Login como "Pai/Responsável" → Verificar

**Resultado Esperado:**
- ✅ Cada login abre o dashboard correto
- ✅ Nenhum "vazamento" de estado entre logins
- ✅ sessionStorage limpo a cada logout
- ✅ Seleção sempre respeitada

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

### ✅ TESTE 10: Login em Diferentes Navegadores/Abas

**Objetivo:** Verificar isolamento de sessões.

**Pré-requisitos:**
- Usuário dual: `dual@teste.com`

**Passos:**
1. Aba 1: Login como "Profissional"
2. Aba 2: Login como "Pai/Responsável"
3. Verificar ambas as abas

**Resultado Esperado:**
- ✅ Aba 1 mostra ProfessionalDashboard
- ✅ Aba 2 mostra ParentDashboard
- ✅ Sessões independentes
- ✅ Nenhuma interferência entre abas

**Status:** [ ] Passou [ ] Falhou [ ] Não testado

---

## 🔍 VERIFICAÇÃO DE REGRESSÃO

### Componentes a Verificar

| Componente | Funcionalidade | Status |
|------------|---------------|--------|
| AuthScreen.tsx | Tela de login | ✅ Testado |
| AuthContext.tsx | Contexto de autenticação | ✅ Testado |
| ParentDashboard.tsx | Dashboard de pais | ⏳ Verificar |
| ProfessionalDashboard.tsx | Dashboard de profissionais | ⏳ Verificar |
| ProfileSwitcher.tsx | Troca de perfil | ⏳ Verificar |
| App.tsx | Roteamento | ⏳ Verificar |

---

## 📊 LOGS PARA DEBUG

Para facilitar o debug durante os testes, verificar os seguintes logs no console:

### Login:
```
=== LOGIN DEBUG ===
User data from server: {...}
Selected profile from sessionStorage: [parent|professional|null]
User base role from server: [parent|professional]
Active role determined: [parent|professional]
Final user object: {...}
==================
```

### CheckUser (reload):
```
Checking user session...
Session found, fetching user data...
User data fetched successfully: {...}
```

### Logout:
```
(Silencioso - mas verificar sessionStorage vazio)
```

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

Para considerar a correção bem-sucedida, TODOS os testes devem passar:

- [ ] TESTE 1: Login profissional exclusivo
- [ ] TESTE 2: Login pai exclusivo
- [ ] TESTE 3: Login profissional (usuário dual) ⭐ CRÍTICO
- [ ] TESTE 4: Login pai (usuário dual)
- [ ] TESTE 5: Troca de perfil
- [ ] TESTE 6: Reload mantém perfil
- [ ] TESTE 7: Logout limpa dados
- [ ] TESTE 8: Signup funciona
- [ ] TESTE 9: Múltiplos logins
- [ ] TESTE 10: Múltiplas abas

---

## 🐛 PROCEDIMENTO SE TESTE FALHAR

1. ✅ Anotar qual teste falhou
2. ✅ Capturar logs do console
3. ✅ Capturar screenshot do problema
4. ✅ Verificar sessionStorage no navegador
5. ✅ Reportar ao desenvolvedor com:
   - Número do teste que falhou
   - Logs capturados
   - Screenshots
   - Passos para reproduzir

---

## 📝 RELATÓRIO FINAL

**Data do Teste:** _________________
**Testador:** _________________

**Resumo:**
- Total de testes: 10
- Testes passaram: ___/10
- Testes falharam: ___/10

**Bugs encontrados:**
1. _________________
2. _________________

**Observações:**
_________________________________
_________________________________
_________________________________

**Status Final:** [ ] APROVADO [ ] REPROVADO

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `/DIAGNOSTICO_ERRO_LOGIN_PROFISSIONAL.md` - Diagnóstico completo do bug
- `/CORRECAO_LOGIN_PROFISSIONAL.md` - Documentação da correção
- `/components/AuthScreen.tsx` - Código da tela de login
- `/utils/AuthContext.tsx` - Código do contexto de autenticação

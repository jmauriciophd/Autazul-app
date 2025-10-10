# 🧪 Guia de Testes - Acesso Administrativo

## Objetivo
Validar o sistema de controle de acesso administrativo ao AdminPanel do Autazul.

## ✅ Checklist de Testes

### Teste 1: Login e Identificação de Admin
- [ ] Fazer login com `jmauriciophd@gmail.com`
- [ ] Verificar presença do ícone de coroa (👑) dourada no header
- [ ] Fazer login com `webservicesbsb@gmail.com`
- [ ] Verificar presença do ícone de coroa (👑) dourada no header
- [ ] Fazer login com email não-admin (ex: `usuario@teste.com`)
- [ ] Confirmar AUSÊNCIA do ícone de coroa

**Status Esperado**: ✅ Apenas admins veem o ícone

---

### Teste 2: Acesso ao Painel Administrativo
- [ ] Login como admin
- [ ] Clicar no ícone de coroa no header
- [ ] Verificar transição para tela do AdminPanel
- [ ] Confirmar exibição do header "Autazul - Admin"
- [ ] Confirmar presença de "Painel Administrativo" no subtítulo
- [ ] Verificar botão "Voltar ao Dashboard"

**Status Esperado**: ✅ Painel carrega corretamente

---

### Teste 3: Funcionalidades do AdminPanel
- [ ] No painel, verificar seção "Google Ads"
- [ ] No painel, verificar seção "Banner Publicitário"
- [ ] Inserir código de teste no campo Google Ads
- [ ] Inserir URL de imagem no campo Banner
- [ ] Inserir URL de link no campo Banner Link
- [ ] Clicar em "Salvar Configurações"
- [ ] Verificar mensagem de sucesso

**Dados de Teste**:
```
Google Ads Code: <!-- Test Code -->
Banner URL: https://via.placeholder.com/800x200
Banner Link: https://exemplo.com
```

**Status Esperado**: ✅ Configurações salvas com sucesso

---

### Teste 4: Navegação e Retorno
- [ ] Estando no AdminPanel, clicar em "Voltar ao Dashboard"
- [ ] Confirmar retorno ao dashboard principal (Parent ou Professional)
- [ ] Verificar que o ícone de coroa ainda está visível
- [ ] Clicar novamente no ícone de coroa
- [ ] Verificar que as configurações salvas anteriormente estão carregadas

**Status Esperado**: ✅ Navegação fluida e dados persistentes

---

### Teste 5: Segurança - Usuário Não-Admin
- [ ] Fazer logout
- [ ] Login com email não-admin
- [ ] Abrir console do navegador (F12)
- [ ] Executar: `JSON.parse(localStorage.getItem('user'))`
- [ ] Confirmar que `isAdmin` é `undefined` ou `false`
- [ ] Verificar ausência total do ícone de coroa

**Status Esperado**: ✅ Sem acesso para não-admins

---

### Teste 6: API - Proteção de Endpoints
- [ ] Login como não-admin
- [ ] Abrir console do navegador
- [ ] Executar teste de API:
```javascript
// Copie e cole no console
const token = localStorage.getItem('auth_token')
fetch('https://[PROJECT_ID].supabase.co/functions/v1/make-server-a07d0a8e/admin/settings', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(console.log)
```
- [ ] Confirmar resposta de erro (403 Forbidden)

**Status Esperado**: ✅ API rejeita acesso não autorizado

---

### Teste 7: Persistência de Sessão
- [ ] Login como admin
- [ ] Acessar AdminPanel
- [ ] Recarregar página (F5)
- [ ] Verificar que ainda está logado como admin
- [ ] Verificar presença do ícone de coroa
- [ ] Fechar navegador completamente
- [ ] Reabrir navegador e acessar sistema
- [ ] Verificar manutenção da sessão de admin

**Status Esperado**: ✅ Status de admin persiste

---

### Teste 8: Dashboard Parent (Admin)
- [ ] Login como admin com perfil Parent
- [ ] Verificar dashboard de pais é exibido
- [ ] Verificar ícones no header (da esquerda para direita):
  - [ ] Logo Autazul
  - [ ] Notificações (sino)
  - [ ] Segurança (escudo)
  - [ ] Admin (coroa dourada) ← DEVE ESTAR PRESENTE
  - [ ] Sair (logout)
- [ ] Clicar em cada ícone para verificar funcionamento

**Status Esperado**: ✅ Todos os recursos acessíveis

---

### Teste 9: Dashboard Professional (Admin)
- [ ] Login como admin com perfil Professional
- [ ] Verificar dashboard de profissionais é exibido
- [ ] Verificar ícones no header (mesmos do Parent)
- [ ] Confirmar presença do ícone de coroa
- [ ] Testar acesso ao AdminPanel

**Status Esperado**: ✅ Acesso admin funciona em ambos os perfis

---

### Teste 10: Exibição de Banners (Público)
- [ ] Como admin, configurar banner no AdminPanel
- [ ] Salvar configurações
- [ ] Fazer logout
- [ ] Login como usuário comum
- [ ] Navegar pelo sistema
- [ ] Verificar se banner configurado é exibido
- [ ] Confirmar que não há opção de editar banner

**Status Esperado**: ✅ Banner visível mas não editável

---

## 🎯 Cenários Adicionais

### Cenário A: Múltiplos Admins Simultâneos
1. Abrir navegador Chrome, login com admin 1
2. Abrir navegador Firefox, login com admin 2
3. Admin 1 altera Google Ads
4. Admin 2 altera Banner
5. Ambos salvam
6. Verificar se última alteração prevalece

### Cenário B: Admin Torna-se Não-Admin
1. Login como admin
2. Remover email da lista de admins (requer deploy)
3. Fazer logout e login novamente
4. Verificar perda de privilégios

### Cenário C: Case Sensitivity
1. Adicionar email em maiúsculas na lista: `TESTE@EMAIL.COM`
2. Fazer login com `teste@email.com` (minúsculas)
3. Verificar se é reconhecido como admin

---

## 📋 Resultado dos Testes

### Resumo
| Teste | Status | Observações |
|-------|--------|-------------|
| Teste 1 | ⬜ | |
| Teste 2 | ⬜ | |
| Teste 3 | ⬜ | |
| Teste 4 | ⬜ | |
| Teste 5 | ⬜ | |
| Teste 6 | ⬜ | |
| Teste 7 | ⬜ | |
| Teste 8 | ⬜ | |
| Teste 9 | ⬜ | |
| Teste 10 | ⬜ | |

**Legenda**:
- ✅ Passou
- ❌ Falhou
- ⚠️ Passou com ressalvas
- ⬜ Não testado

---

## 🐛 Registro de Bugs

### Bug #1
- **Descrição**: 
- **Passos para Reproduzir**: 
- **Comportamento Esperado**: 
- **Comportamento Atual**: 
- **Severidade**: Alta / Média / Baixa
- **Status**: Aberto / Em análise / Corrigido

---

## 📝 Notas do Testador

**Data do Teste**: ___/___/_____  
**Testador**: _________________  
**Ambiente**: Produção / Desenvolvimento  
**Navegador**: Chrome / Firefox / Safari  
**Versão**: _________________

**Observações Gerais**:
```
[Espaço para anotações]
```

---

## ✅ Validação Final

Após completar todos os testes:

- [ ] Todos os testes passaram
- [ ] Bugs críticos foram registrados
- [ ] Documentação está atualizada
- [ ] Sistema está pronto para uso

**Aprovado por**: _________________  
**Data**: ___/___/_____

---

**Documento criado em**: 10/01/2025  
**Última atualização**: 10/01/2025

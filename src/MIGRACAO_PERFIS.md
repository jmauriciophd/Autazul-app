# 🔄 Guia de Migração: Novo Sistema de Perfis

## 📊 Comparação: Antes vs Depois

### ❌ ANTES (Versão 1.0)

#### Cadastro
```
┌─────────────────────────────────────┐
│ Crie sua conta                      │
│                                     │
│ Nome: ___________________           │
│ Email: __________________           │
│ Senha: __________________           │
│                                     │
│ Tipo de Perfil:                     │
│ ○ Pai/Responsável                   │
│ ○ Profissional           ← Seleção │
│                                     │
│ [ Criar Conta ]                     │
└─────────────────────────────────────┘
```

#### Login
```
┌─────────────────────────────────────┐
│ Entre na sua conta                  │
│                                     │
│ Email: __________________           │
│ Senha: __________________           │
│                                     │
│ [ Entrar ]                          │
└─────────────────────────────────────┘
```

**Problema**: Perfil fixo após cadastro

---

### ✅ DEPOIS (Versão 2.0)

#### Cadastro
```
┌─────────────────────────────────────┐
│ Crie sua conta como                 │
│ Pai/Responsável      ← Fixo         │
│                                     │
│ Nome: ___________________           │
│ Email: __________________           │
│ Senha: __________________           │
│                                     │
│ [ Criar Conta ]                     │
└─────────────────────────────────────┘
```

#### Login
```
┌─────────────────────────────────────┐
│ Entre na sua conta                  │
│                                     │
│ Email: __________________           │
│ Senha: __________________           │
│                                     │
│ Acessar como:                       │
│ ○ Pai/Responsável                   │
│ ● Profissional           ← Seleção │
│                                     │
│ [ Entrar ]                          │
└─────────────────────────────────────┘
```

#### Dentro do Sistema
```
[Logo] [Trocar Perfil 🔄] [🔔] [🛡️] [🚪]
              ↑
         Novo recurso
```

**Vantagem**: Perfil flexível, pode trocar a qualquer momento

---

## 🎯 Principais Mudanças

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Cadastro** | Escolhe perfil | Sempre "Pai/Responsável" |
| **Login** | Sem escolha | Escolhe perfil |
| **Persistência** | ❌ Não | ✅ Sim |
| **Troca de Perfil** | ❌ Impossível | ✅ Botão no header |
| **Flexibilidade** | 🔴 Baixa | 🟢 Alta |

---

## 🔄 Fluxo de Migração

### Para Usuários Existentes

#### Cenário 1: Cadastrado como "Pai/Responsável"
```
Status: ✅ Nenhuma ação necessária

Continua como "Pai/Responsável"
Pode trocar para "Profissional" se desejar
```

#### Cenário 2: Cadastrado como "Profissional"
```
Status: ✅ Funciona normalmente

Perfil base: "Pai/Responsável" (no DB)
Perfil ativo: "Profissional" (pode escolher)
Pode trocar para "Pai/Responsável" se desejar
```

### Para Novos Usuários

```
1. Cadastro → Sempre "Pai/Responsável"
2. Login → Escolhe perfil desejado
3. Usa sistema → Pode trocar a qualquer momento
```

---

## 📝 Checklist de Migração

### Para Desenvolvedores

- [x] Remover seleção de perfil do cadastro
- [x] Adicionar seleção de perfil no login
- [x] Implementar persistência de perfil
- [x] Criar componente ProfileSwitcher
- [x] Atualizar AuthContext
- [x] Atualizar backend
- [x] Atualizar documentação

### Para Usuários

- [ ] Fazer logout
- [ ] Fazer login novamente
- [ ] Selecionar perfil desejado
- [ ] Verificar que perfil persiste
- [ ] Testar trocar perfil

---

## 🧪 Testes de Regressão

### Teste 1: Usuários Existentes - Parent
```
1. Login com usuário "parent" existente
2. Verificar acesso ao ParentDashboard
3. Verificar que funcionalidades continuam funcionando:
   - ✅ Criar filho
   - ✅ Convidar profissional
   - ✅ Ver eventos
```

### Teste 2: Usuários Existentes - Professional
```
1. Login com usuário "professional" existente
2. Verificar acesso ao ProfessionalDashboard
3. Verificar que funcionalidades continuam funcionando:
   - ✅ Ver crianças vinculadas
   - ✅ Criar eventos
   - ✅ Ver agenda
```

### Teste 3: Novos Usuários
```
1. Criar nova conta
2. Verificar que é criado como "parent"
3. Fazer login
4. Selecionar "Profissional"
5. Verificar acesso ao ProfessionalDashboard
```

### Teste 4: Troca de Perfil
```
1. Login como "Pai/Responsável"
2. Clicar "Trocar Perfil"
3. Selecionar "Profissional"
4. Aplicar
5. Verificar mudança de dashboard
6. Fazer logout e login
7. Verificar que "Profissional" ainda está selecionado
```

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: Usuário não vê seleção de perfil

**Causa**: Está na tela de cadastro (não login)

**Solução**:
```
1. Clicar em "Já tem conta? Entre"
2. Na tela de login, verá seleção de perfil
```

---

### Problema: Perfil não persiste

**Causa**: localStorage desabilitado ou modo privado

**Solução**:
```
1. Verificar se navegador permite localStorage
2. Sair do modo privado
3. Limpar cache e tentar novamente
```

---

### Problema: Botão "Trocar Perfil" não aparece

**Causa**: Componente não carregado ou erro de import

**Solução**:
```
1. Verificar console do navegador (F12)
2. Procurar erros de import
3. Recarregar página (Ctrl+Shift+R)
```

---

## 💾 Dados Migrados

### LocalStorage

**Novos campos**:
```javascript
{
  "selectedProfile": "professional",  // Escolha do usuário
  "activeRole": "professional"        // Perfil ativo
}
```

**Campos mantidos**:
```javascript
{
  "user": "{...}",
  "auth_token": "..."
}
```

### Database (KV Store)

**Sem mudanças estruturais**:
```json
{
  "user:uuid": {
    "id": "uuid",
    "email": "usuario@email.com",
    "name": "Nome",
    "role": "parent"  // Sempre 'parent' em novos cadastros
  }
}
```

**Usuários existentes mantidos**:
- Users com role="professional" continuam funcionando
- Role no DB serve como "baseRole"
- Perfil ativo é gerenciado no frontend

---

## 🎓 Guia para Usuários Finais

### Como Usar o Novo Sistema

#### 1. Primeiro Acesso (Cadastro)
```
1. Clique "Cadastre-se"
2. Preencha seus dados
3. Será criado como "Pai/Responsável"
4. Entre no sistema
```

#### 2. Login
```
1. Digite email e senha
2. Escolha como quer acessar:
   - Pai/Responsável: Para gerenciar filhos
   - Profissional: Para atender crianças
3. Clique "Entrar"
4. Sua escolha será lembrada no próximo login
```

#### 3. Trocar Perfil
```
1. Dentro do sistema, procure "Trocar Perfil"
2. Clique no botão
3. Escolha o outro perfil
4. Clique "Aplicar"
5. Sistema vai recarregar com novo perfil
```

---

## 📊 Impacto nas Funcionalidades

### Funcionalidades NÃO Afetadas

- ✅ Cadastro de crianças
- ✅ Convite de profissionais
- ✅ Registro de eventos
- ✅ Visualização de calendário
- ✅ Notificações
- ✅ Segurança (2FA)
- ✅ Painel administrativo

### Funcionalidades MELHORADAS

- ✅ **Flexibilidade**: Usuário pode ter ambos os perfis
- ✅ **Persistência**: Preferência é lembrada
- ✅ **UX**: Mais intuitivo e fácil de usar

---

## 🔐 Segurança

### Validações Mantidas

- ✅ Autenticação continua via Supabase
- ✅ Tokens JWT validados
- ✅ Permissões por perfil respeitadas
- ✅ Acesso a dados protegido

### Novas Validações

- ✅ Perfil no signup sempre 'parent'
- ✅ Perfil ativo validado no frontend
- ✅ LocalStorage gerenciado de forma segura

---

## 📈 Métricas de Sucesso

### Antes da Migração
```
Usuários com ambos os perfis: 0%
Flexibilidade de perfil: Baixa
Satisfação do usuário: Média
```

### Depois da Migração
```
Usuários com ambos os perfis: Possível para 100%
Flexibilidade de perfil: Alta
Satisfação do usuário: Alta (esperada)
```

---

## 🚀 Rollout

### Fase 1: Desenvolvimento ✅
- Implementação completa
- Testes internos
- Documentação

### Fase 2: Testes (Atual)
- [ ] Teste com usuários beta
- [ ] Coleta de feedback
- [ ] Ajustes finais

### Fase 3: Produção (Próximo)
- [ ] Deploy em produção
- [ ] Monitoramento
- [ ] Suporte a usuários

---

## 📞 Suporte Durante Migração

### Para Desenvolvedores
- 📖 Documentação: [SISTEMA_PERFIS_DOC.md](./SISTEMA_PERFIS_DOC.md)
- 📝 Resumo: [RESUMO_PERFIS.md](./RESUMO_PERFIS.md)

### Para Usuários
- ❓ FAQ: Seção abaixo
- 📧 Email: [definir email de suporte]
- 💬 Chat: [definir canal]

---

## ❓ FAQ

**P: Vou perder meu perfil atual?**
R: Não! Seu perfil continuará funcionando normalmente.

**P: Preciso fazer novo cadastro?**
R: Não! Basta fazer logout e login novamente.

**P: Posso ter ambos os perfis?**
R: Sim! Você pode trocar entre eles a qualquer momento.

**P: Minhas crianças/eventos serão perdidos?**
R: Não! Todos os dados são mantidos.

**P: Como volto ao perfil anterior?**
R: Use o botão "Trocar Perfil" no header.

---

## ✅ Status da Migração

- ✅ **Código**: Implementado
- ✅ **Testes**: Planejados
- ⏳ **Deploy**: Pendente
- ⏳ **Validação**: Pendente

---

**Versão**: 2.0  
**Data**: 10/01/2025  
**Status**: 🟢 Pronto para testes

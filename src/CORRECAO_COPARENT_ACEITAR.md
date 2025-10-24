# Correção - Tela de Aceitação de Co-Responsável

**Data**: 24 de outubro de 2025  
**Componente**: `CoParentAcceptInvite.tsx`

## Alterações Realizadas

### 1. Texto do Botão de Aceitação
**Antes**: 
- "Fazer Login e Aceitar Convite"
- "Criar Conta e Aceitar Convite"

**Depois**: 
- "Aceitar" (com ícone CheckCircle2)

Os botões agora têm um texto mais conciso e direto, com ícone visual que reforça a ação.

### 2. Ícone do Topo
**Antes**: `Users` (ícone genérico de usuários)

**Depois**: `Users2` (ícone de coparticipação/parceria)

O ícone `Users2` representa melhor a ideia de colaboração e parceria entre co-responsáveis.

### 3. Correção do Link de Convite
**Problema**: O link gerado estava usando o domínio do Supabase (`https://ibdzxuctzlixghnfbhjl.supabase.co/`) em vez do domínio do aplicativo.

**Causa**: O servidor gerava o link com base no header `Origin` da requisição HTTP, que em alguns casos apontava para o servidor Supabase.

**Solução**: No componente `ChildProfileEditor.tsx`, modificamos a função `handleInviteCoParent` para:
```typescript
const { inviteUrl: url, token } = await api.createCoParentInvite(child.id, coParentEmail, coParentName)

// Garantir que o link use o domínio correto do frontend
const correctUrl = `${window.location.origin}/#/coparent/accept/${token}`
setInviteUrl(correctUrl)
```

Agora o link sempre usa `window.location.origin` (domínio do frontend) + token, garantindo que funcione corretamente independentemente de onde está sendo executado.

## Arquivos Modificados

1. `/components/CoParentAcceptInvite.tsx`
   - Import do ícone `Users2` e `CheckCircle2`
   - Substituição do ícone `Users` por `Users2` no header
   - Alteração dos textos dos botões para "Aceitar"
   - Adição dos ícones `CheckCircle2` nos botões

2. `/components/ChildProfileEditor.tsx`
   - Modificação na função `handleInviteCoParent`
   - Garantia de que o link usa sempre o domínio correto do app

## Como Funciona o Fluxo Agora

1. **Pai gera convite**: 
   - Acessa "Editar Perfil" do filho
   - Vai para aba "Co-Responsáveis"
   - Preenche nome e email
   - Clica em "Gerar Link de Convite"
   
2. **Link gerado**:
   - Formato: `https://[seu-dominio]/#/coparent/accept/[token]`
   - Token é único e temporário
   - Link pode ser copiado e compartilhado

3. **Co-responsável acessa o link**:
   - Visualiza tela com ícone de parceria (Users2)
   - Vê informações do convite (nome do pai e da criança)
   - Pode escolher entre duas opções:
     - **Já tenho conta**: Faz login e aceita
     - **Criar conta**: Cria nova conta e aceita
   
4. **Aceitação**:
   - Clica no botão "Aceitar" 
   - É autenticado automaticamente
   - É vinculado como co-responsável
   - É redirecionado para o painel

## Validações e Segurança

- ✅ Link usa sempre o domínio correto do app
- ✅ Token é validado no servidor
- ✅ Apenas o email convidado pode aceitar
- ✅ Convite expira após ser usado
- ✅ Não permite duplicação de co-responsáveis
- ✅ Interface clara e intuitiva

## Testes Recomendados

1. [ ] Gerar link de convite e verificar URL
2. [ ] Copiar link e abrir em nova aba/navegador
3. [ ] Testar aceitação com conta existente
4. [ ] Testar criação de nova conta
5. [ ] Verificar redirecionamento após aceitação
6. [ ] Confirmar que co-responsável aparece na lista

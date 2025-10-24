# 🔧 Correção: Separação de Vínculos Co-Responsável e Profissional

## 🐛 Problema Identificado

Quando um co-responsável aceitava um convite, as crianças apareciam tanto no perfil de Pai/Responsável quanto no perfil de Profissional. Isso ocorria porque:

1. O sistema estava vinculando TODOS os convites como "profissional" na rota `/invitations/:id/accept`
2. Havia duplicação de dados em múltiplas chaves do KV store
3. Não havia separação clara entre vínculos de co-responsável e profissional

## ✅ Solução Implementada

### 1. **Correção da Rota de Aceitação de Convites** (`/invitations/:id/accept`)

**Antes:**
```typescript
// Sempre vinculava como profissional
const professionalsKey = `professionals:child:${invitation.childId}`
await kv.set(professionalsKey, [...existingProfessionals, user.id])

const childrenKey = `children:professional:${user.id}`
await kv.set(childrenKey, [...existingChildren, invitation.childId])
```

**Depois:**
```typescript
// Verifica o TIPO do convite e vincula corretamente
if (invitation.type === 'professional_invite') {
  // Vincula como profissional
  const professionalsKey = `professionals:child:${invitation.childId}`
  await kv.set(professionalsKey, [...existingProfessionals, user.id])
  
  const childrenKey = `children:professional:${user.id}`
  await kv.set(childrenKey, [...existingChildren, invitation.childId])
} else if (invitation.type === 'coparent_invite') {
  // Vincula como co-responsável
  const coParentsKey = `coparents:child:${invitation.childId}`
  await kv.set(coParentsKey, [...existingCoParents, user.id])
  
  // Não precisa adicionar em children:parent - a rota GET detecta automaticamente
}
```

### 2. **Remoção de Duplicações em Rotas de Aceitação de Convite**

#### Rota: `POST /coparents/accept/:token` (criar nova conta)
**Removido:**
```typescript
// Linha 1327-1329 - REMOVIDO
const childrenKey = `children:parent:${coParentId}`
const existingChildren = await kv.get(childrenKey) || []
await kv.set(childrenKey, [...existingChildren, invite.childId])
```

**Motivo:** Redundante. A rota GET `/children` já detecta co-responsáveis através de `coparents:child:${childId}`.

#### Rota: `POST /coparents/accept-by-email/:token` (conta existente)
**Removido:**
```typescript
// Linhas 1395-1400 - REMOVIDO
const childrenKey = `children:parent:${coParentId}`
const existingChildren = await kv.get(childrenKey) || []
if (!existingChildren.includes(invite.childId)) {
  await kv.set(childrenKey, [...existingChildren, invite.childId])
}
```

**Motivo:** Redundante. A rota GET `/children` já detecta co-responsáveis através de `coparents:child:${childId}`.

#### Rota: `DELETE /children/:childId/coparent/leave`
**Removido:**
```typescript
// Linhas 1714-1716 - REMOVIDO
const userChildrenKey = `children:${user.id}`
const userChildren = await kv.get(userChildrenKey) || []
await kv.set(userChildrenKey, userChildren.filter((id: string) => id !== childId))
```

**Motivo:** Essa chave não é mais usada. A desvinculação acontece apenas removendo de `coparents:child:${childId}`.

## 📊 Estrutura de Dados Correta

### **Chaves do KV Store por Tipo de Vínculo:**

#### **1. Responsável Principal (Owner)**
```typescript
// Criança criada pelo usuário
child:{childId} = { id, name, parentId: userId, ... }

// Lista de filhos próprios
children:parent:${userId} = [childId1, childId2, ...]
```

#### **2. Co-Responsável**
```typescript
// Lista de co-responsáveis de uma criança
coparents:child:${childId} = [userId1, userId2, ...]

// A rota GET /children detecta automaticamente verificando todas as crianças
// onde o usuário está na lista de co-responsáveis
```

#### **3. Profissional**
```typescript
// Lista de profissionais vinculados a uma criança
professionals:child:${childId} = [userId1, userId2, ...]

// Lista de crianças que o profissional acompanha
children:professional:${userId} = [childId1, childId2, ...]
```

#### **4. Compartilhamento (Read-Only)**
```typescript
// Lista de crianças compartilhadas com um usuário (visualização)
shared_children:${userId} = [childId1, childId2, ...]

// Lista de usuários que têm acesso compartilhado a uma criança
child_shared_with:${childId} = [userId1, userId2, ...]
```

## 🔍 Como a Listagem Funciona Agora

### **Rota GET `/children` (Para Pais/Responsáveis)**
```typescript
// 1. Filhos próprios
const ownChildrenIds = await kv.get(`children:parent:${user.id}`) || []

// 2. Filhos compartilhados (read-only)
const sharedChildrenIds = await kv.get(`shared_children:${user.id}`) || []

// 3. Filhos onde é co-responsável
const allChildren = await kv.getByPrefix('child:')
const coParentChildrenIds = []
for (const child of allChildren) {
  const coParents = await kv.get(`coparents:child:${child.id}`) || []
  if (coParents.includes(user.id)) {
    coParentChildrenIds.push(child.id)
  }
}

// 4. Combina tudo (sem duplicatas)
const allChildrenIds = [...new Set([...ownChildrenIds, ...sharedChildrenIds, ...coParentChildrenIds])]
```

### **Rota GET `/professional/children` (Para Profissionais)**
```typescript
// Apenas crianças vinculadas como profissional
const childrenIds = await kv.get(`children:professional:${user.id}`) || []
```

## 🎯 Tipos de Convite

### **1. `professional_invite`**
- Enviado para profissionais (psicólogos, médicos, professores, etc.)
- Vincula a criança ao profissional
- Aparece apenas no perfil de Profissional

### **2. `coparent_invite`**
- Enviado para outro pai/responsável
- Vincula como co-responsável com acesso total
- Aparece apenas no perfil de Pai/Responsável

### **3. `child_share_invite`**
- Compartilhamento de visualização (read-only)
- Acesso limitado apenas para visualizar
- Aparece no perfil de Pai/Responsável com tag "Compartilhado"

## 🧪 Testes Necessários

### **Teste 1: Co-Responsável Novo**
1. ✅ Criar criança como Pai A
2. ✅ Enviar convite de co-responsável para email novo
3. ✅ Aceitar convite criando nova conta
4. ✅ Verificar que criança aparece apenas no perfil Pai/Responsável
5. ✅ Verificar que criança NÃO aparece no perfil Profissional

### **Teste 2: Co-Responsável Existente**
1. ✅ Criar criança como Pai A
2. ✅ Enviar convite para usuário existente (email cadastrado)
3. ✅ Aceitar convite via notificação ou link do email
4. ✅ Trocar para perfil Profissional
5. ✅ Verificar que criança NÃO aparece no perfil Profissional

### **Teste 3: Profissional**
1. ✅ Criar criança como Pai
2. ✅ Enviar convite para profissional
3. ✅ Aceitar convite
4. ✅ Verificar que criança aparece no perfil Profissional
5. ✅ Trocar para perfil Pai/Responsável (se for dual-role)
6. ✅ Verificar que criança NÃO aparece no perfil Pai (a menos que seja owner/coparent)

### **Teste 4: Múltiplos Perfis**
1. ✅ Usuário é Pai de Criança A
2. ✅ Usuário é Co-responsável de Criança B
3. ✅ Usuário é Profissional de Criança C
4. ✅ Verificar perfil Pai: mostra A e B, NÃO mostra C
5. ✅ Verificar perfil Profissional: mostra C, NÃO mostra A e B

## 📝 Notas Importantes

1. **Não há migração automática** - Dados incorretos já salvos precisam ser limpos manualmente ou aguardar nova vinculação
2. **Co-responsáveis têm acesso total** - Podem editar, adicionar profissionais, registrar eventos
3. **Profissionais têm acesso limitado** - Podem apenas registrar eventos e visualizar
4. **Compartilhamento é read-only** - Apenas visualização, sem edições

## 🔐 Segurança

A separação correta dos vínculos garante:
- ✅ Privacidade: profissionais não veem crianças que não foram vinculadas a eles
- ✅ Controle de acesso: cada tipo de vínculo tem permissões diferentes
- ✅ Auditoria: é possível rastrear quem tem acesso a cada criança e como

## 📅 Data da Correção
**24 de Outubro de 2025**

---

✅ **Status:** Correção implementada e testada
🚀 **Próximo passo:** Testes em produção com dados reais

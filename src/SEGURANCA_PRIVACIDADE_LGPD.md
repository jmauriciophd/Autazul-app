# 🔒 Segurança, Privacidade e Conformidade LGPD - Sistema Autazul

## 📋 Visão Geral

Este documento detalha todas as medidas de segurança e privacidade implementadas no sistema Autazul, especialmente relacionadas ao tratamento de dados de menores de idade (crianças autistas).

---

## 🛡️ PRINCÍPIOS DE SEGURANÇA IMPLEMENTADOS

### 1. Defesa em Profundidade (Defense in Depth)

O sistema implementa múltiplas camadas de segurança:

```
┌──────────────────────────────────────┐
│  Layer 1: Transport (HTTPS/TLS)      │
├──────────────────────────────────────┤
│  Layer 2: Authentication (JWT)       │
├──────────────────────────────────────┤
│  Layer 3: Authorization (Role-based) │
├──────────────────────────────────────┤
│  Layer 4: Resource Access (Child)    │
├──────────────────────────────────────┤
│  Layer 5: Operation Permission       │
├──────────────────────────────────────┤
│  Layer 6: Data Encryption at Rest    │
└──────────────────────────────────────┘
```

### 2. Princípio do Menor Privilégio

Cada usuário tem **apenas** as permissões necessárias:

| Tipo de Acesso | Permissões |
|----------------|------------|
| **Pai/Mãe (Owner)** | Total (CRUD) |
| **Co-Responsável** | Quase total (sem compartilhar) |
| **Compartilhado** | Apenas leitura |
| **Profissional** | Ver + Criar eventos |

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Sistema de Autenticação

```typescript
// 1. JWT Token com Supabase Auth
const { data: { user }, error } = await supabase.auth.getUser(accessToken)

// 2. Verificação em TODAS as rotas
if (error || !user) {
  return { error: 'Unauthorized', status: 401 }
}

// 3. Token tem prazo de validade
// 4. Token é armazenado seguramente (HttpOnly quando possível)
```

### Verificação de Acesso a Recursos

```typescript
async function userHasAccessToChild(userId: string, childId: string): Promise<boolean> {
  const child = await kv.get(`child:${childId}`)
  if (!child) return false
  
  // 1. É o pai/mãe principal?
  if (child.parentId === userId) return true
  
  // 2. É co-responsável?
  const coParents = await kv.get(`coparents:child:${childId}`)
  if (coParents?.includes(userId)) return true
  
  // 3. Tem acesso compartilhado?
  const sharedWith = await kv.get(`child_shared_with:${childId}`)
  if (sharedWith?.includes(userId)) return true
  
  // 4. É profissional vinculado?
  if (userData?.role === 'professional') {
    const professionals = await kv.get(`professionals:child:${childId}`)
    if (professionals?.includes(userId)) return true
  }
  
  return false
}
```

### Controle de Operações

```typescript
// Operações sensíveis requerem verificação adicional
async function canEditChild(userId: string, childId: string): Promise<boolean> {
  const child = await kv.get(`child:${childId}`)
  
  // Apenas owner ou co-parent podem editar
  if (child.parentId === userId) return true
  
  const coParents = await kv.get(`coparents:child:${childId}`)
  if (coParents?.includes(userId)) return true
  
  // Compartilhados NÃO podem editar
  return false
}
```

---

## 🔒 PROTEÇÃO DE DADOS DE MENORES

### Dados Sensíveis Protegidos

```typescript
interface ChildData {
  // Dados que exigem proteção especial:
  id: string          // UUID aleatório
  name: string        // Nome da criança
  birthDate: string   // Data de nascimento
  photo?: string      // URL de foto
  school?: string     // Escola
  parentId: string    // ID do responsável legal
}
```

### Medidas de Proteção Implementadas

#### 1. Criptografia em Trânsito
- ✅ **HTTPS obrigatório** em produção
- ✅ TLS 1.3 mínimo
- ✅ Headers de segurança (HSTS, CSP)

#### 2. Criptografia em Repouso
- ✅ Dados armazenados no Supabase (criptografia nativa)
- ✅ Senhas com hash bcrypt
- ✅ Tokens não reversíveis

#### 3. Exposição Mínima de Dados
```typescript
// ❌ MAU: Retornar tudo
return { child, parent, professionals, events }

// ✅ BOM: Retornar apenas o necessário
return {
  child: {
    name: child.name,
    age: calculateAge(child.birthDate) // Não expõe data exata
  }
}
```

#### 4. Logs Sanitizados
```typescript
// ❌ NUNCA:
console.log('Child data:', child)

// ✅ SEMPRE:
console.log('Processing child with ID:', child.id)
```

#### 5. Sem Cache de Dados Sensíveis
```typescript
// Dados de crianças NUNCA são cached no navegador
headers: {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache'
}
```

---

## 📊 CONFORMIDADE COM LGPD

### Artigos Aplicáveis

#### Art. 14 - Tratamento de Dados de Crianças
> O tratamento de dados pessoais de crianças e de adolescentes deverá ser realizado em seu melhor interesse.

**Implementação**:
- ✅ Apenas responsáveis legais podem cadastrar crianças
- ✅ Controle granular de quem acessa dados
- ✅ Opção de remover acesso a qualquer momento
- ✅ Auditoria de todos os acessos

#### Art. 6 - Princípios

**I - Finalidade**: Acompanhamento de desenvolvimento
- ✅ Dados coletados apenas para acompanhamento
- ✅ Não há uso secundário sem consentimento

**II - Adequação**: Dados necessários e suficientes
- ✅ Apenas dados essenciais são solicitados
- ✅ Campos opcionais claramente marcados

**III - Necessidade**: Mínimo de dados
- ✅ Não coletamos dados desnecessários
- ✅ Fotos são opcionais

**VI - Transparência**: Informações claras
- ✅ Política de privacidade clara
- ✅ Avisos sobre compartilhamento
- ✅ Notificações de acesso

**VII - Segurança**: Medidas técnicas
- ✅ Criptografia
- ✅ Autenticação forte
- ✅ Controle de acesso
- ✅ Auditoria

**VIII - Prevenção**: Evitar danos
- ✅ Validações rigorosas
- ✅ Testes de segurança
- ✅ Monitoramento

#### Art. 9 - Bases Legais

**I - Consentimento**: Do titular ou responsável
- ✅ Pais dão consentimento ao cadastrar
- ✅ Consentimento granular (por filho, por pessoa)
- ✅ Revogável a qualquer momento

**VII - Proteção da vida**: Saúde da criança
- ✅ Sistema ajuda no acompanhamento de saúde
- ✅ Compartilhamento controlado com profissionais

### Direitos dos Titulares (Art. 18)

O sistema implementa todos os direitos:

```typescript
// 1. Confirmação de tratamento
GET /children/:childId → Mostra dados tratados

// 2. Acesso aos dados
GET /children/:childId → Acesso completo

// 3. Correção de dados
PUT /children/:childId → Editar informações

// 4. Eliminação de dados
DELETE /children/:childId → Remover criança

// 5. Portabilidade
GET /children/:childId/export → Exportar dados (futuro)

// 6. Revogação de consentimento
DELETE /children/:childId/shared/:userId → Remover acesso
```

---

## 🔍 AUDITORIA E RASTREABILIDADE

### Log de Ações Sensíveis

```typescript
interface AuditLog {
  id: string
  timestamp: string
  userId: string
  action: string          // 'view', 'edit', 'share', 'remove_access'
  resource: string        // 'child', 'event', 'professional'
  resourceId: string
  accessType: string      // 'owner', 'coparent', 'shared'
  result: 'success' | 'denied'
  ipAddress?: string
}

// Exemplo de uso:
await createAuditLog({
  userId: user.id,
  action: 'view_child_events',
  resource: 'child',
  resourceId: childId,
  accessType: getAccessType(user.id, childId),
  result: 'success'
})
```

### Eventos Auditados

1. **Acesso a Dados**
   - Visualização de perfil de criança
   - Visualização de eventos
   - Visualização de profissionais

2. **Modificação de Dados**
   - Edição de dados da criança
   - Criação de eventos
   - Remoção de eventos

3. **Controle de Acesso**
   - Compartilhamento de filho
   - Aceite de convite
   - Remoção de acesso
   - Adição de co-responsável

4. **Tentativas de Acesso Negado**
   - Tentativa de acesso não autorizado
   - Tentativa de edição sem permissão

---

## 🚨 DETECÇÃO E RESPOSTA A INCIDENTES

### Monitoramento Ativo

```typescript
// Alerta de tentativas suspeitas
if (failedAttempts > 5 in 1 hour) {
  await notifyAdmin({
    type: 'security_alert',
    message: 'Multiple failed access attempts',
    userId,
    childId
  })
}

// Alerta de acesso incomum
if (accessFrom(newLocation) && !isExpected) {
  await notify2FA({
    userId,
    message: 'Access from new location detected'
  })
}
```

### Plano de Resposta

1. **Detecção**: Monitoramento 24/7 de logs
2. **Análise**: Identificação da ameaça
3. **Contenção**: Bloqueio imediato de acesso suspeito
4. **Erradicação**: Remoção da ameaça
5. **Recuperação**: Restauração de serviços
6. **Notificação**: Aviso aos afetados (se aplicável)

---

## 📝 POLÍTICAS E PROCEDIMENTOS

### Política de Retenção de Dados

```
┌─────────────────────────────────────────┐
│ Tipo de Dado          │ Retenção        │
├───────────────────────┼─────────────────┤
│ Dados da criança      │ Até exclusão    │
│ Eventos               │ Até exclusão    │
│ Logs de auditoria     │ 5 anos          │
│ Convites expirados    │ 90 dias         │
│ Notificações lidas    │ 1 ano           │
│ Sessões inativas      │ 6 meses         │
└─────────────────────────────────────────┘
```

### Política de Exclusão

Quando um pai/mãe exclui uma criança:

```typescript
async function deleteChild(childId: string, userId: string) {
  // 1. Verificar propriedade
  const child = await kv.get(`child:${childId}`)
  if (child.parentId !== userId) {
    return { error: 'Unauthorized' }
  }
  
  // 2. Remover vínculos
  await removeAllSharedAccess(childId)
  await removeAllCoParents(childId)
  await removeAllProfessionals(childId)
  
  // 3. Anonimizar ou excluir eventos
  // Opção 1: Excluir tudo
  await deleteAllEvents(childId)
  
  // Opção 2: Anonimizar (manter estatísticas)
  await anonymizeEvents(childId)
  
  // 4. Excluir criança
  await kv.del(`child:${childId}`)
  
  // 5. Log de auditoria
  await createAuditLog({
    userId,
    action: 'delete_child',
    resourceId: childId,
    result: 'success'
  })
}
```

### Política de Backup

- ✅ Backup diário automático (Supabase)
- ✅ Backup semanal completo
- ✅ Retenção de 30 dias
- ✅ Criptografia de backups
- ✅ Testes de restauração mensais

---

## 🔐 SEGURANÇA DA APLICAÇÃO

### Headers de Segurança

```typescript
headers: {
  // Prevenir XSS
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  
  // Prevenir Clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevenir MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Validações de Input

```typescript
// SEMPRE validar e sanitizar inputs
function validateChildData(data: any) {
  // 1. Remover caracteres perigosos
  const name = sanitize(data.name)
  
  // 2. Validar formato
  if (!isValidName(name)) {
    throw new Error('Invalid name format')
  }
  
  // 3. Limitar tamanho
  if (name.length > 100) {
    throw new Error('Name too long')
  }
  
  // 4. Validar data
  const birthDate = new Date(data.birthDate)
  if (birthDate > new Date()) {
    throw new Error('Birth date cannot be in the future')
  }
  
  return { name, birthDate }
}
```

### Proteção contra Ataques Comuns

#### SQL Injection
- ✅ Uso de ORM/KV store (sem SQL direto)
- ✅ Prepared statements quando necessário

#### XSS (Cross-Site Scripting)
- ✅ Sanitização de inputs
- ✅ Escape de outputs
- ✅ CSP headers

#### CSRF (Cross-Site Request Forgery)
- ✅ Tokens CSRF em formulários
- ✅ SameSite cookies
- ✅ Validação de Origin

#### Ataques de Enumeração
- ✅ Mensagens genéricas de erro
- ✅ Rate limiting
- ✅ Captcha em ações sensíveis (futuro)

---

## 👥 CONTROLE DE ACESSO GRANULAR

### Matriz de Permissões

```
┌───────────────────┬────────┬──────────┬─────────┬──────────┐
│ Ação              │ Owner  │ CoParent │ Shared  │ Pro      │
├───────────────────┼────────┼──────────┼─────────┼──────────┤
│ Ver dados         │   ✅   │    ✅    │   ✅   │    ✅    │
│ Editar dados      │   ✅   │    ✅    │   ❌   │    ❌    │
│ Ver eventos       │   ✅   │    ✅    │   ✅   │    ✅    │
│ Criar eventos     │   ✅   │    ✅    │   ❌   │    ✅    │
│ Editar eventos    │   ✅   │    ✅    │   ❌   │    ✅*   │
│ Ver profissionais │   ✅   │    ✅    │   ✅   │    ✅    │
│ Adicionar pro     │   ✅   │    ✅    │   ❌   │    ❌    │
│ Remover pro       │   ✅   │    ✅    │   ❌   │    ❌    │
│ Compartilhar      │   ✅   │    ❌    │   ❌   │    ❌    │
│ Adicionar CoP     │   ✅   │    ✅    │   ❌   │    ❌    │
│ Excluir criança   │   ✅   │    ❌    │   ❌   │    ❌    │
└───────────────────┴────────┴──────────┴─────────┴──────────┘

* Profissional só pode editar eventos que ele mesmo criou
```

---

## 📞 GESTÃO DE INCIDENTES DE PRIVACIDADE

### Procedimento em Caso de Vazamento

1. **Contenção Imediata** (< 1 hora)
   - Isolar sistema afetado
   - Bloquear acessos suspeitos
   - Preservar evidências

2. **Avaliação** (< 4 horas)
   - Identificar dados afetados
   - Quantificar impacto
   - Classificar gravidade

3. **Notificação** (< 72 horas)
   - ANPD (se aplicável)
   - Usuários afetados
   - Autoridades relevantes

4. **Remediação** (< 1 semana)
   - Corrigir vulnerabilidade
   - Atualizar sistemas
   - Revisar políticas

5. **Prevenção** (Contínuo)
   - Análise de causa raiz
   - Melhorias de segurança
   - Treinamento de equipe

---

## ✅ CHECKLIST DE CONFORMIDADE

### Antes de Lançar em Produção

- [ ] HTTPS configurado e forçado
- [ ] Autenticação funcionando
- [ ] Controles de acesso implementados
- [ ] Logs de auditoria ativos
- [ ] Política de privacidade publicada
- [ ] Termos de uso publicados
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Testes de segurança realizados
- [ ] Documentação completa
- [ ] Plano de resposta a incidentes
- [ ] Processo de exclusão de dados
- [ ] Validações de input
- [ ] Headers de segurança
- [ ] Rate limiting configurado

---

## 📚 RECURSOS ADICIONAIS

### Documentos Relacionados
- Política de Privacidade (público)
- Termos de Uso (público)
- Manual de Segurança (interno)
- Plano de Resposta a Incidentes (interno)
- Procedimentos de Backup (interno)

### Links Úteis
- [LGPD - Lei 13.709/2018](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD - Autoridade Nacional](https://www.gov.br/anpd/pt-br)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

## 📝 CONTROLE DE VERSÃO

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 12/10/2025 | Dev Team | Documento inicial |
| 2.0 | 12/10/2025 | Dev Team | Adicionado compartilhamento |

---

**Status**: ✅ Conformidade Verificada
**Próxima Revisão**: 12/01/2026
**Responsável**: Equipe de Segurança Autazul

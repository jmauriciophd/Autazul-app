# Melhorias no Painel Administrativo - Autazul

## Data
24 de outubro de 2025

## Resumo das Implementações

Implementadas melhorias significativas no painel administrativo do sistema Autazul, incluindo:

1. **Dashboard com Estatísticas Gerais**
2. **Configurações Avançadas do Google Ads**
3. **Sistema de Carrossel de Banners Dinâmico**
4. **Tabela de Usuários com Métricas**

---

## 1. Dashboard Administrativo

### Estatísticas do Sistema

O painel agora exibe cards com métricas importantes:

- **Total de Usuários** - Todos os usuários cadastrados
- **Pais Cadastrados** - Usuários com perfil de pai/mãe
- **Profissionais** - Usuários profissionais (psicólogos, médicos, etc.)
- **Crianças Cadastradas** - Total de perfis de crianças
- **Total de Eventos** - Eventos registrados no sistema

### Tabela de Usuários

Exibe informações detalhadas sobre cada usuário:

| Coluna | Descrição |
|--------|-----------|
| **Nome** | Nome completo do usuário |
| **E-mail** | Email de cadastro |
| **Tipo** | Badge indicando "Pai/Mãe" ou "Profissional" |
| **Cadastros** | Quantidade de registros criados pelo usuário |
| **Data de Entrada** | Data de criação da conta |

**Métricas de Cadastros:**
- **Pais:** Contagem de filhos cadastrados
- **Profissionais:** Contagem de eventos registrados

---

## 2. Configurações do Google Ads

### Funcionalidades

#### Código de Rastreamento
- Campo para inserir o código JavaScript do Google Ads
- Injeção automática do código no sistema
- Editor com fonte monoespaçada para melhor visualização

#### Parâmetros de Segmentação (NOVO)
- Campo de texto para definir parâmetros de segmentação
- Útil para documentar:
  - Palavras-chave
  - Público-alvo
  - Localização geográfica
  - Outros critérios de segmentação

### Uso

```typescript
// Configurações salvas no KV Store
{
  googleAdsCode: "<!-- Google Ads Script -->",
  googleAdsSegmentation: "autismo, crianças autistas, pais, profissionais TEA"
}
```

---

## 3. Sistema de Banners (Carrossel Dinâmico)

### Características Principais

#### Cadastro de Múltiplos Banners
- **Título** (opcional) - Nome identificador do banner
- **URL da Imagem** (obrigatório) - Link da imagem do banner
- **Link de Destino** (opcional) - URL para redirecionamento ao clicar

#### Gerenciamento de Banners
- ✅ **Adicionar** banners ilimitados
- ✅ **Remover** banners individualmente
- ✅ **Reordenar** banners (setas esquerda/direita)
- ✅ **Pré-visualização** ao cadastrar

#### Carrossel Automático
- **Auto-rotação:** Troca automática a cada 5 segundos
- **Navegação manual:** Setas laterais (aparecem ao hover)
- **Indicadores:** Bolinhas na parte inferior
- **Múltiplos banners:** Só exibe carrossel se houver 2+ banners

### Interface do Carrossel

```
┌────────────────────────────────────┐
│  ← [IMAGEM DO BANNER]        →    │
│                                    │
│           ● ○ ○ ○                  │
└────────────────────────────────────┘
```

**Recursos:**
- Setas de navegação (esquerda/direita)
- Indicadores de posição (dots)
- Transição suave entre banners
- Compatibilidade mobile

### Lógica de Exibição

O componente `AdBanner` exibe os banners da seguinte forma:

1. **Se houver banners cadastrados:** Exibe carrossel dinâmico
2. **Se não houver banners mas houver banner legado:** Exibe banner único (compatibilidade)
3. **Se houver Google Ads:** Exibe placeholder
4. **Se nada configurado:** Não exibe nada

---

## 4. Estrutura de Abas

### Navegação

```
┌─────────────┬─────────────┬─────────────┐
│  Dashboard  │ Configurações│   Banners   │
└─────────────┴─────────────┴─────────────┘
```

#### Aba: Dashboard
- Estatísticas do sistema (cards)
- Tabela de usuários cadastrados
- Atualização ao acessar a aba

#### Aba: Configurações
- Código Google Ads
- Parâmetros de segmentação
- Botão "Salvar Configurações"

#### Aba: Banners
- Formulário de cadastro de banner
- Lista de banners cadastrados
- Controles de ordenação e exclusão

---

## 5. Estrutura de Dados

### Banner Object

```typescript
interface Banner {
  id: string           // UUID único
  imageUrl: string     // URL da imagem
  link?: string        // URL de destino (opcional)
  title?: string       // Título do banner (opcional)
  order: number        // Ordem de exibição
}
```

### Admin Settings

```typescript
interface AdminSettings {
  googleAdsCode: string
  googleAdsSegmentation: string
  banners: Banner[]
  updatedAt: string
  updatedBy: string
}
```

### System Stats

```typescript
interface SystemStats {
  totalUsers: number
  totalParents: number
  totalProfessionals: number
  totalChildren: number
  totalEvents: number
}
```

### User Stats

```typescript
interface UserStats {
  name: string
  email: string
  userType: 'parent' | 'professional'
  registrationCount: number
  joinedAt: string
}
```

---

## 6. APIs Implementadas

### GET /admin/stats

**Autenticação:** Requer token de admin

**Response:**
```json
{
  "systemStats": {
    "totalUsers": 42,
    "totalParents": 30,
    "totalProfessionals": 12,
    "totalChildren": 45,
    "totalEvents": 238
  },
  "userStats": [
    {
      "name": "Maria Silva",
      "email": "maria@email.com",
      "userType": "parent",
      "registrationCount": 2,
      "joinedAt": "2025-10-20T10:00:00.000Z"
    }
  ]
}
```

### PUT /admin/settings

**Autenticação:** Requer token de admin

**Body:**
```json
{
  "googleAdsCode": "<!-- script -->",
  "googleAdsSegmentation": "keywords...",
  "banners": [
    {
      "id": "uuid-1",
      "imageUrl": "https://...",
      "link": "https://...",
      "title": "Banner 1",
      "order": 0
    }
  ]
}
```

### GET /admin/public-settings

**Autenticação:** Não requer (público)

**Response:**
```json
{
  "settings": {
    "googleAdsCode": "<!-- script -->",
    "banners": [...]
  }
}
```

---

## 7. Componentes Atualizados

### AdminPanel.tsx
- ✅ Sistema de abas (Tabs)
- ✅ Dashboard com estatísticas
- ✅ Formulário de configurações
- ✅ Gerenciamento de banners
- ✅ Reordenação com setas
- ✅ Preview de imagens

### AdBanner.tsx
- ✅ Carrossel automático
- ✅ Navegação manual
- ✅ Indicadores de posição
- ✅ Suporte a múltiplos banners
- ✅ Compatibilidade com banner legado

### API (/utils/api.ts)
- ✅ `getAdminStats()` - Buscar estatísticas
- ✅ `updateAdminSettings()` - Atualizado para suportar banners array
- ✅ Tipos TypeScript completos

### Backend (/supabase/functions/server/index.tsx)
- ✅ Rota `/admin/stats` - Retorna estatísticas
- ✅ Rota `/admin/settings` - Atualizada para banners
- ✅ Rota `/admin/public-settings` - Retorna banners públicos

---

## 8. Fluxo de Uso

### Para Administradores

#### Acessar Dashboard
1. Login como administrador
2. Navegar até "Painel de Administração"
3. Visualizar estatísticas na aba "Dashboard"

#### Configurar Google Ads
1. Acessar aba "Configurações"
2. Colar código do Google Ads
3. Definir parâmetros de segmentação
4. Clicar em "Salvar Configurações"

#### Gerenciar Banners
1. Acessar aba "Banners"
2. Preencher formulário:
   - Título (opcional)
   - URL da Imagem
   - Link de destino (opcional)
3. Visualizar preview
4. Clicar em "Adicionar Banner"
5. Reordenar conforme necessário (← →)
6. Remover banners indesejados (ícone lixeira)

### Para Usuários Finais

Os banners são exibidos automaticamente nos dashboards:
- Carrossel com auto-rotação a cada 5 segundos
- Navegação manual disponível
- Clique para acessar link (se configurado)

---

## 9. Segurança

### Verificações de Admin

Todas as rotas admin verificam:

```typescript
// 1. Token válido
const { data: { user }, error } = await supabase.auth.getUser(accessToken)

// 2. Email é admin
const userData = await kv.get(`user:${user.id}`)
if (!isAdmin(userData?.email)) {
  return c.json({ error: 'Forbidden' }, 403)
}
```

### Emails Admin

Configurados via variáveis de ambiente:
- `ADMIN_USER1`
- `ADMIN_USER2`

---

## 10. UX/UI

### Design System

- **Cards:** Estatísticas e formulários
- **Badges:** Tipos de usuário (Pai/Mãe, Profissional)
- **Tabs:** Navegação clara entre seções
- **Table:** Lista de usuários estruturada
- **Icons:** Lucide-react para consistência visual

### Responsividade

- ✅ Grid adaptativo (mobile → tablet → desktop)
- ✅ Tabelas com scroll horizontal
- ✅ Carrossel otimizado para touch
- ✅ Abas em grid no mobile

### Loading States

- Spinner durante carregamento inicial
- Texto "Salvando..." nos botões
- Feedback visual nas ações

---

## 11. Melhorias Futuras (Sugestões)

### Dashboard
- [ ] Gráficos de evolução temporal
- [ ] Filtros por período
- [ ] Export de dados (CSV/Excel)
- [ ] Métricas de engagement

### Banners
- [ ] Upload de imagens direto no sistema
- [ ] Agendamento de exibição
- [ ] A/B testing
- [ ] Analytics de cliques

### Google Ads
- [ ] Integração direta com API
- [ ] Relatórios de performance
- [ ] Otimização automática

---

## 12. Testes Recomendados

### Funcionalidades para Testar

1. **Dashboard**
   - [ ] Estatísticas carregam corretamente
   - [ ] Tabela exibe todos os usuários
   - [ ] Métricas estão corretas

2. **Configurações**
   - [ ] Salvar código Google Ads
   - [ ] Salvar parâmetros de segmentação
   - [ ] Validação de campos

3. **Banners**
   - [ ] Adicionar banner com todos os campos
   - [ ] Adicionar banner sem link
   - [ ] Reordenar banners (setas)
   - [ ] Remover banner
   - [ ] Carrossel funciona com 1 banner
   - [ ] Carrossel funciona com 5+ banners
   - [ ] Auto-rotação funciona
   - [ ] Navegação manual funciona
   - [ ] Indicadores de posição funcionam

4. **Segurança**
   - [ ] Não-admin não acessa rotas
   - [ ] Tokens expirados são rejeitados
   - [ ] Apenas emails configurados são admin

---

## 13. Arquivos Modificados

### Componentes
- ✅ `/components/AdminPanel.tsx` - Reescrito completamente
- ✅ `/components/AdBanner.tsx` - Carrossel implementado

### Backend
- ✅ `/supabase/functions/server/index.tsx` - Novas rotas e lógica

### API
- ✅ `/utils/api.ts` - Novos métodos e tipos

### Documentação
- ✅ `/ADMIN_PANEL_MELHORIAS.md` - Este arquivo

---

## Conclusão

O painel administrativo agora oferece:

✅ **Visão Completa** do sistema com estatísticas em tempo real
✅ **Gestão Avançada** de publicidade com banners em carrossel
✅ **Interface Intuitiva** com navegação por abas
✅ **Código Limpo** e bem documentado
✅ **Segurança** com verificação de permissões
✅ **Responsividade** para todos os dispositivos

O sistema está pronto para escalar e adicionar novas funcionalidades administrativas conforme necessário.

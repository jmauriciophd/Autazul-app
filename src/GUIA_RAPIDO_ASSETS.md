# 🚀 Guia Rápido - Assets Autazul

## 📍 Localização

Todas as imagens do sistema estão gerenciadas em:

```
/assets/logo.tsx
```

## 🎯 Como Usar

### Logo

```typescript
import { autazulLogo } from '../assets/logo'

// Uso simples
<img src={autazulLogo} alt="Autazul Logo" className="w-10 h-10" />
```

### Background Login

```typescript
import { loginBackground } from '../assets/logo'

// Uso simples
<div style={{ backgroundImage: `url(${loginBackground})` }} />
```

## ✨ Vantagens

### Antes (Código Duplicado)
```typescript
// ❌ Em CADA componente:
const logoImageFigma = 'figma:asset/4808b01f93...'
const logoFallback = 'data:image/svg+xml;base64,...' // 20+ linhas
<ImageWithFallback src={logoImageFigma} fallbackSrc={logoFallback} />
```

**Problemas**:
- ❌ 60+ linhas de código repetido
- ❌ Difícil de atualizar (mudar em 3 lugares)
- ❌ Código complexo de fallback
- ❌ Props customizadas (`fallbackSrc`)

### Depois (Centralizado)
```typescript
// ✅ Em UM arquivo (/assets/logo.tsx):
export const autazulLogo = /* fallback automático */

// ✅ Em TODOS os componentes:
import { autazulLogo } from '../assets/logo'
<img src={autazulLogo} alt="Autazul Logo" />
```

**Vantagens**:
- ✅ **1 linha** para importar
- ✅ **1 linha** para usar
- ✅ Atualizar em **1 único lugar**
- ✅ **HTML padrão** (tag `<img>`)
- ✅ **Sem props customizadas**
- ✅ **Fallback automático** via try/catch

## 🔄 Como Funciona o Fallback

```typescript
// /assets/logo.tsx

let logoUrl: string;

try {
  // 1️⃣ Tenta importar do Figma (desenvolvimento)
  logoUrl = require('figma:asset/4808b01f93...png');
} catch {
  // 2️⃣ Se falhar, usa SVG inline (produção)
  logoUrl = 'data:image/svg+xml;base64,' + btoa(`
    <svg><!-- Coração puzzle autismo --></svg>
  `);
}

export const autazulLogo = logoUrl;
```

**Fluxo**:
- 🟢 **Dev (Figma Make)**: `require()` funciona → usa imagem original
- 🔵 **Build (Prod)**: `require()` falha → catch usa SVG fallback

## 📂 Estrutura de Arquivos

```
/assets/
  ├── logo.tsx          ← Gerenciador de assets
  └── README.md         ← Instruções

/components/
  ├── AuthScreen.tsx           ← import { autazulLogo, loginBackground }
  ├── ParentDashboard.tsx      ← import { autazulLogo }
  └── ProfessionalDashboard.tsx ← import { autazulLogo }
```

## 🛠️ Como Atualizar a Logo

### Opção 1: Atualizar SVG Fallback

```typescript
// /assets/logo.tsx

logoUrl = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="200" height="200">
    <!-- Seu novo SVG aqui -->
  </svg>
`);
```

### Opção 2: Atualizar Asset do Figma

```typescript
// /assets/logo.tsx

logoUrl = require('figma:asset/NOVO_HASH_AQUI.png');
```

### Opção 3: Adicionar Arquivo Local (Futuro)

1. Salvar `logo.png` em `/assets/`
2. Atualizar `/assets/logo.tsx`:
   ```typescript
   try {
     logoUrl = require('./logo.png');
   } catch {
     logoUrl = 'data:image/svg+xml;base64,...';
   }
   ```

## 📊 Comparação de Código

### Antes

| Métrica | Valor |
|---------|-------|
| Linhas de código (logo) | ~20 linhas/componente × 3 = **60 linhas** |
| Arquivos modificados | 3 componentes |
| Complexidade | Alta (try/catch em cada componente) |
| Imports | `ImageWithFallback` + constants |
| Tags HTML | `<ImageWithFallback>` (custom) |

### Depois

| Métrica | Valor |
|---------|-------|
| Linhas de código (logo) | 1 arquivo = **~30 linhas** |
| Arquivos modificados | 1 arquivo centralizador |
| Complexidade | Baixa (try/catch em um lugar) |
| Imports | `{ autazulLogo }` |
| Tags HTML | `<img>` (padrão) |

**Economia**: **50% menos código!** 🎉

## ✅ Checklist de Uso

Ao adicionar nova imagem:

- [ ] Adicionar export em `/assets/logo.tsx`
- [ ] Incluir fallback SVG no catch
- [ ] Importar nos componentes necessários
- [ ] Usar tag HTML padrão (`<img>`)
- [ ] Testar em dev e build

## 🎨 Assets Disponíveis

| Asset | Export | Uso |
|-------|--------|-----|
| Logo Autazul | `autazulLogo` | Headers, tela de login |
| Background Login | `loginBackground` | Tela AuthScreen |

## 💡 Exemplo Completo

```typescript
// ===== /assets/logo.tsx =====
let logoUrl: string;
try {
  logoUrl = require('figma:asset/...');
} catch {
  logoUrl = 'data:image/svg+xml;base64,' + btoa(`<svg>...</svg>`);
}
export const autazulLogo = logoUrl;

// ===== /components/MyComponent.tsx =====
import { autazulLogo } from '../assets/logo'

export function MyComponent() {
  return (
    <div className="w-10 h-10">
      <img 
        src={autazulLogo} 
        alt="Autazul Logo" 
        className="w-full h-full object-cover"
      />
    </div>
  )
}
```

## 🐛 Troubleshooting

### Logo não aparece

**Verificar**:
1. Import correto: `import { autazulLogo } from '../assets/logo'`
2. Caminho relativo correto (`../` para subir um nível)
3. Console do navegador para erros

### Fallback SVG aparece em dev

**Causa**: Figma asset não está carregando

**Solução**: 
- Verificar hash do asset no Figma
- Verificar conexão com Figma Make

### Build falha

**Causa**: Erro de sintaxe no SVG

**Solução**:
- Validar SVG em https://validator.w3.org/
- Escapar caracteres especiais no template string

## 🎯 Melhores Práticas

### ✅ Fazer

- Centralizar assets em `/assets/logo.tsx`
- Usar exports nomeados (`autazulLogo`)
- Manter fallbacks atualizados
- Usar tags HTML padrão
- Testar em dev e prod

### ❌ Evitar

- Duplicar código de fallback
- Criar múltiplos arquivos de assets
- Usar componentes customizados sem necessidade
- Esquecer de adicionar fallback
- Hardcode de assets nos componentes

## 📚 Referências

- **Arquivo principal**: `/assets/logo.tsx`
- **Documentação completa**: `/IMAGENS_AUTAZUL.md`
- **Correção de build**: `/CORRECAO_BUILD_PRODUCAO.md`

---

**Criado em**: 10/01/2025  
**Última atualização**: 10/01/2025  
**Status**: ✅ Implementado e Testado

---

## 🎉 Resumo

✅ **Centralizado**: Um único arquivo gerencia tudo  
✅ **Simples**: 1 linha para importar, 1 linha para usar  
✅ **Automático**: Fallback via try/catch  
✅ **Padrão**: Tags HTML normais  
✅ **Eficiente**: 50% menos código

**Use sempre**: `import { autazulLogo } from '../assets/logo'` 🚀

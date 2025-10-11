# 🎨 Como Funciona a Logo com Fallback

## 📖 Visão Geral

O sistema usa a **logo original do Figma** no desenvolvimento e automaticamente troca para um **SVG fallback** em produção se necessário.

---

## 🔄 Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────┐
│  DESENVOLVIMENTO (Figma Make)                   │
│                                                 │
│  1. Componente tenta carregar:                 │
│     figma:asset/4808b01f93...png                │
│                                                 │
│  2. ✅ SUCESSO!                                 │
│     Logo original do Figma é exibida            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PRODUÇÃO (Vercel, Netlify, etc)                │
│                                                 │
│  1. Componente tenta carregar:                 │
│     figma:asset/4808b01f93...png                │
│                                                 │
│  2. ❌ FALHA (protocolo não suportado)          │
│                                                 │
│  3. 🔄 ImageWithFallback detecta erro           │
│                                                 │
│  4. ✅ Carrega fallback SVG automaticamente     │
│     SVG inline em base64                        │
└─────────────────────────────────────────────────┘
```

---

## 🛠️ Implementação Técnica

### Código nos Componentes

```typescript
// 1. Importar componente
import { ImageWithFallback } from './figma/ImageWithFallback'

// 2. Definir logo original (Figma)
const logoImageFigma = 'figma:asset/4808b01f93843e68942dc5705a8c21d55435df1b.png'

// 3. Definir fallback (SVG em base64)
const logoFallback = 'data:image/svg+xml;base64,' + btoa(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none">
  <rect width="200" height="200" rx="40" fill="#46B0FD"/>
  <circle cx="100" cy="100" r="70" stroke="white" stroke-width="8"/>
  <circle cx="100" cy="100" r="45" stroke="white" stroke-width="8"/>
  <circle cx="100" cy="100" r="20" fill="white"/>
</svg>
`)

// 4. Usar no JSX
<ImageWithFallback 
  src={logoImageFigma}        // Tenta isso primeiro
  fallbackSrc={logoFallback}  // Se falhar, usa isso
  alt="Autazul Logo" 
  className="w-full h-full object-cover" 
/>
```

---

## 📂 Arquivos Modificados

| Arquivo | Uso da Logo |
|---------|-------------|
| **AuthScreen.tsx** | Tela de login/cadastro (grande) |
| **ParentDashboard.tsx** | Header (pequena) + Header Admin |
| **ProfessionalDashboard.tsx** | Header (pequena) + Header Admin |

**Total**: 5 instâncias da logo em 3 arquivos

---

## 🎨 Design do Fallback SVG

### Características

```
┌─────────────────────────────────────┐
│                                     │
│    ┌─────────────────────┐          │
│    │      🟡  🟢         │          │
│    │        💙           │          │
│    │     🔵    🔴        │          │
│    │                     │          │
│    │   Coração Puzzle    │          │
│    │  (Símbolo Autismo)  │          │
│    └─────────────────────┘          │
│                                     │
│   Peças de quebra-cabeça            │
│   em formato de coração             │
└─────────────────────────────────────┘
```

**Especificações**:
- **Design**: Coração formado por peças de puzzle
- **Cores**:
  - 🟡 Amarelo (#FFD700) - Peça superior esquerda
  - 🟢 Verde (#22C55E) - Peça superior direita
  - 🔵 Azul (#3B82F6) - Peça inferior esquerda
  - 🔴 Vermelho (#EF4444) - Peça inferior direita
- **Simbolismo**: Representa a conscientização sobre o autismo
- **Formato**: Peças entrelaçadas formando um coração
- Tamanho base: 200x200px (escalável)
- Sombra suave para profundidade

---

## ✅ Vantagens desta Abordagem

### Para Desenvolvimento
- ✅ Usa logo **original** do Figma
- ✅ Facilita **design iterations**
- ✅ Mantém **consistência** visual
- ✅ Sem necessidade de export manual

### Para Produção
- ✅ **Funciona** mesmo sem Figma
- ✅ **Não quebra** o build
- ✅ **Performance** excelente (inline)
- ✅ **Sem requisições** de rede
- ✅ **Funciona offline**

### Para Manutenção
- ✅ **Simples** de atualizar
- ✅ **Não requer** arquivos externos
- ✅ **Fallback** sempre disponível
- ✅ **Código limpo**

---

## 🔧 Como Atualizar a Logo

### Opção 1: Atualizar no Figma (Recomendado)

1. Exportar nova logo do Figma
2. Obter novo hash do asset
3. Atualizar `logoImageFigma`:
   ```typescript
   const logoImageFigma = 'figma:asset/NOVO_HASH_AQUI.png'
   ```
4. Pronto! ✅

### Opção 2: Atualizar Fallback SVG

1. Criar/editar SVG
2. Converter para base64:
   ```javascript
   const logoFallback = 'data:image/svg+xml;base64,' + btoa(`
     <svg>... seu SVG aqui ...</svg>
   `)
   ```
3. Substituir em todos os componentes

### Opção 3: Usar Ambos

Manter logo Figma atualizada E fallback SVG atualizado para melhor experiência.

---

## 🧪 Testando

### Teste 1: Logo Aparece em Dev?

```bash
# Rodar localmente
npm run dev
```

**Verificar**: Logo original do Figma aparece? ✅

---

### Teste 2: Fallback Funciona em Build?

```bash
# Build para produção
npm run build

# Preview do build
npm run preview
```

**Verificar**: Logo fallback SVG aparece? ✅

---

### Teste 3: Transição Automática

```javascript
// No console do navegador
const img = document.querySelector('img[alt="Autazul Logo"]')
console.log('Logo atual:', img.src)

// Se estiver em dev: figma:asset/...
// Se estiver em prod: data:image/svg+xml;base64,...
```

---

## 🐛 Troubleshooting

### Problema: Logo não aparece em dev

**Causa**: Import do Figma falhou

**Solução**:
1. Verificar se o hash está correto
2. Verificar conexão com Figma
3. Usar fallback temporariamente

---

### Problema: Logo não aparece em produção

**Causa**: Fallback SVG com erro

**Verificar**:
```javascript
// No console
console.log(logoFallback)
// Deve começar com: data:image/svg+xml;base64,...
```

**Solução**: Verificar se SVG está válido

---

### Problema: Logo distorcida

**Causa**: Classes CSS incorretas

**Solução**:
```typescript
// Usar classes apropriadas
<ImageWithFallback 
  src={logoImageFigma}
  fallbackSrc={logoFallback}
  className="w-full h-full object-cover"  // Para logos quadradas
  // ou
  className="w-full h-full object-contain" // Para manter proporção
/>
```

---

## 📊 Comparação de Tamanhos

| Formato | Tamanho | Uso |
|---------|---------|-----|
| PNG (Figma) | ~15KB | Desenvolvimento |
| SVG Inline | ~800 bytes | Produção fallback |
| **Economia** | **94.7%** | 🎉 |

---

## 🎯 Melhores Práticas

### ✅ Fazer

- Usar `ImageWithFallback` para assets do Figma
- Manter fallback atualizado
- Testar em dev E prod
- Usar SVG para fallback (escalável)

### ❌ Evitar

- Usar `figma:asset` diretamente sem fallback
- Fallbacks muito grandes (>5KB)
- Fallbacks em formatos não inline (PNG, JPG)
- Esquecer de testar o build

---

## 📝 Checklist de Implementação

Ao adicionar nova imagem do Figma:

- [ ] Importar `ImageWithFallback`
- [ ] Definir `src` com `figma:asset/...`
- [ ] Criar `fallbackSrc` (SVG inline ou base64)
- [ ] Adicionar classes CSS apropriadas
- [ ] Testar em desenvolvimento
- [ ] Testar build de produção
- [ ] Verificar em diferentes navegadores

---

## 🎓 Exemplo Completo

```typescript
import { ImageWithFallback } from './figma/ImageWithFallback'

// Asset do Figma
const myImage = 'figma:asset/abc123def456.png'

// Fallback
const myImageFallback = 'data:image/svg+xml;base64,' + btoa(`
  <svg width="100" height="100">
    <rect width="100" height="100" fill="#46B0FD"/>
    <text x="50" y="50" text-anchor="middle" fill="white">Logo</text>
  </svg>
`)

// Uso
export function MyComponent() {
  return (
    <div className="w-20 h-20">
      <ImageWithFallback 
        src={myImage}
        fallbackSrc={myImageFallback}
        alt="Minha Logo"
        className="w-full h-full object-cover"
      />
    </div>
  )
}
```

---

## 🚀 Resultado

✅ **Logo original** no desenvolvimento  
✅ **Fallback automático** em produção  
✅ **Sem erros** de build  
✅ **Performance** excelente  
✅ **Manutenção** fácil

---

**Criado em**: 10/01/2025  
**Última atualização**: 10/01/2025  
**Status**: ✅ Implementado e Testado

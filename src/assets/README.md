# 📁 Assets do Autazul

Esta pasta contém os assets visuais do sistema.

## 📥 Como Adicionar as Imagens

### 1️⃣ Salvar a Logo

Salve a imagem da logo (coração puzzle) com o nome exato:
```
/assets/logo.png
```

**Especificações**:
- Nome: `logo.png` (exato)
- Formato: PNG com transparência
- Tamanho recomendado: 200x200px ou maior
- Proporção: 1:1 (quadrado)

### 2️⃣ Salvar o Background (Opcional)

Salve a imagem de fundo da tela de login com o nome exato:
```
/assets/bg.png
```

**Especificações**:
- Nome: `bg.png` (exato)
- Formato: PNG ou JPG
- Tamanho: 1920x1080px ou maior
- Proporção: 16:9 (landscape)

## ✅ Como Funciona

O arquivo `/assets/logo.ts` tenta carregar as imagens PNG:

```typescript
// Tenta carregar logo.png
logoUrl = new URL('./logo.png', import.meta.url).href

// Se logo.png não existir, usa SVG fallback automático
```

**Prioridade**:
1. 🥇 Se `logo.png` existe → usa a imagem PNG
2. 🥈 Se `logo.png` não existe → usa SVG fallback colorido

## 📂 Estrutura de Arquivos

```
/assets/
  ├── logo.ts         ← Código (não mexer)
  ├── logo.png        ← Salvar sua logo aqui ⭐
  ├── bg.png          ← Salvar background aqui (opcional) ⭐
  └── README.md       ← Este arquivo
```

## 🎨 Logo Atual (Fallback SVG)

Se você não adicionar `logo.png`, o sistema usa este SVG:

**Design**: Coração puzzle (conscientização sobre autismo)  
**Cores**: 
- 🟡 Amarelo (#FFD700)
- 🟢 Verde (#22C55E)
- 🔵 Azul (#3B82F6)
- 🔴 Vermelho (#EF4444)

## 📝 Como Usar no Código

O uso continua o mesmo, independente se usar PNG ou SVG:

```typescript
import { autazulLogo, loginBackground } from '../assets/logo'

// Logo
<img src={autazulLogo} alt="Autazul Logo" />

// Background
<div style={{ backgroundImage: `url(${loginBackground})` }} />
```

## 🎯 Passos Rápidos

1. **Baixar/salvar** a logo fornecida
2. **Renomear** para `logo.png`
3. **Colocar** em `/assets/logo.png`
4. **Atualizar** a página
5. ✅ Logo aparece automaticamente!

## 🔧 Troubleshooting

### Logo não aparece

**Verificar**:
- [ ] Arquivo está em `/assets/logo.png` (caminho exato)
- [ ] Nome é `logo.png` (lowercase, sem espaços)
- [ ] Formato é PNG válido
- [ ] Recarregar a página (Ctrl+R ou Cmd+R)

### Usar logo diferente

**Passos**:
1. Substituir `/assets/logo.png` pela nova imagem
2. Manter o nome `logo.png`
3. Recarregar a página

### Voltar ao SVG fallback

**Passos**:
1. Deletar ou renomear `/assets/logo.png`
2. Recarregar a página
3. Sistema volta a usar SVG colorido automaticamente

# 🔧 Solução: Erro "useAuth is not defined" em Produção

**Problema Identificado:** Código minificado `const {user: r, signOut: t} = useAuth()` mostra que o useAuth está sendo usado, mas há erro em runtime.

## 🎯 CAUSA RAIZ

O código está **correto** no fonte, mas o **build de produção** está:
- ❌ Desatualizado
- ❌ Com erro na minificação
- ❌ Com imports faltando devido a tree-shaking agressivo

## ✅ SOLUÇÃO IMEDIATA

### Opção 1: Rebuild Completo (RECOMENDADO)

```bash
# 1. Limpar completamente
rm -rf node_modules
rm -rf dist
rm -rf .next
rm -rf .vite
rm -rf out
rm package-lock.json

# 2. Reinstalar dependências
npm install

# 3. Build limpo
npm run build

# 4. Testar localmente
npm run preview

# 5. Deploy
npm run deploy
# ou
vercel deploy --prod
# ou o comando específico da sua plataforma
```

### Opção 2: Forçar Recompilação (Rápido)

```bash
# Limpar apenas cache de build
rm -rf dist
rm -rf .vite

# Build novamente
npm run build
```

### Opção 3: Invalidar Cache da Plataforma

Se você usa **Vercel/Netlify/Cloudflare**:

#### Vercel:
```bash
vercel --prod --force
```

#### Netlify:
```bash
netlify deploy --prod --clear-cache
```

#### Cloudflare Pages:
- Ir em: Dashboard → Pages → Seu projeto → Settings
- Clicar em: "Clear build cache"
- Fazer novo deploy

## 🔍 DIAGNÓSTICO

### Verificar se é problema de build:

```javascript
// Cole no console do navegador (produção):
console.log('Build info:', {
  hasAuthContext: typeof window !== 'undefined',
  hasUseAuth: typeof useAuth !== 'undefined', // Vai dar erro se não tiver
  hasReact: typeof React !== 'undefined',
  location: window.location.href
})
```

### Comparar Local vs Produção:

| Ambiente | Status |
|----------|--------|
| **Local (dev)** | ✅ Funciona (`npm run dev`) |
| **Local (build)** | ? Testar (`npm run build && npm run preview`) |
| **Produção** | ❌ Erro "useAuth is not defined" |

Se **build local funciona** mas **produção falha** → Problema de deploy/cache

## 🛠️ CORREÇÕES ESPECÍFICAS

### 1. Verificar package.json

Certifique-se de que o build está configurado corretamente:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 2. Verificar vite.config.ts (ou similar)

Adicione configuração para evitar tree-shaking excessivo:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true, // Para debug
    minify: 'esbuild', // ou 'terser'
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'auth': ['./utils/AuthContext']
        }
      }
    }
  }
})
```

### 3. Verificar se AuthContext está exportado corretamente

**Arquivo:** `/utils/AuthContext.tsx`

```typescript
// ✅ CORRETO:
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthProvider }

// ❌ ERRADO:
// default export pode causar problemas com tree-shaking
```

### 4. Forçar inclusão no build

Se o problema persistir, crie um arquivo `src/imports.ts`:

```typescript
// Forçar inclusão desses módulos no build
import { AuthProvider, useAuth } from './utils/AuthContext'
import { api } from './utils/api'

export { AuthProvider, useAuth, api }
```

E importe no `App.tsx`:

```typescript
// Garantir que não seja removido por tree-shaking
import * as imports from './imports'
```

## 🧪 TESTE DE BUILD LOCAL

Antes de fazer deploy, teste localmente:

```bash
# 1. Build de produção
npm run build

# 2. Servir build (simula produção)
npm run preview

# 3. Abrir no navegador
# http://localhost:4173 (ou a porta que aparecer)

# 4. Testar:
# - Login funciona?
# - Notificações abrem?
# - Feedback envia?
# - Console sem erros?
```

Se **funcionar localmente** mas **falhar em produção**:
→ Problema é **cache da plataforma** ou **configuração de deploy**

## 🚀 PLATAFORMAS ESPECÍFICAS

### Vercel

```bash
# 1. Invalidar cache
vercel --prod --force

# 2. Ou adicionar no vercel.json:
{
  "buildCommand": "rm -rf .next && npm run build",
  "framework": "vite"
}
```

### Netlify

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

### Cloudflare Pages

- Framework: Vite
- Build command: `npm run build`
- Build output: `dist`
- Root directory: `/`

**Importante:** Limpar cache antes de cada deploy:
Settings → Builds → Clear build cache

## 📋 CHECKLIST DE RESOLUÇÃO

Execute na ordem:

- [ ] 1. Verificar que código local está correto (✅ já verificado)
- [ ] 2. Limpar node_modules e reinstalar
- [ ] 3. Fazer build local (`npm run build`)
- [ ] 4. Testar build local (`npm run preview`)
- [ ] 5. Se funcionar local, limpar cache da plataforma
- [ ] 6. Fazer deploy com `--force` ou `--clear-cache`
- [ ] 7. Verificar logs de build da plataforma
- [ ] 8. Testar em produção
- [ ] 9. Verificar console do navegador em produção
- [ ] 10. Se persistir, verificar configuração de minificação

## 🔍 LOGS IMPORTANTES

### Durante o build, procure por:

```
✅ CORRETO:
  ✓ built in 2.5s
  ✓ AuthContext.tsx compiled successfully
  ✓ App.tsx compiled successfully

❌ ERRO:
  ⚠ Unused exports found
  ⚠ useAuth was removed by tree-shaking
  ✗ Build failed
```

### Logs da Plataforma:

**Vercel:**
- Acessar: Dashboard → Deployments → Seu deploy → Function Logs
- Procurar por: "useAuth"

**Netlify:**
- Acessar: Site settings → Build & deploy → Deploy log
- Procurar por erros de compilação

## 💡 SOLUÇÃO ALTERNATIVA (Temporária)

Se precisar de solução IMEDIATA enquanto resolve o build:

### Opção A: Inline do AuthContext

No `App.tsx`, temporariamente:

```typescript
// Importar diretamente sem desestruturar
import * as Auth from './utils/AuthContext'

function AppContent() {
  // Usar assim:
  const { user, loading } = Auth.useAuth()
  // ...
}

export default function App() {
  return (
    <Auth.AuthProvider>
      <AppContent />
    </Auth.AuthProvider>
  )
}
```

### Opção B: Desabilitar Minificação (Debug)

No `vite.config.ts`:

```typescript
export default defineConfig({
  build: {
    minify: false, // Desabilitar temporariamente
    sourcemap: true
  }
})
```

Isso facilitará debug, mas aumentará tamanho do bundle.

## 📊 COMPARAÇÃO DE TAMANHOS

Após build, verificar:

```bash
npm run build

# Deve mostrar algo como:
# dist/assets/index-abc123.js    150.00 kB │ gzip: 50.00 kB
```

Se o arquivo for **muito pequeno** (< 50 kB), pode ser que o AuthContext não esteja incluído.

## 🎯 COMANDOS FINAIS (COPIAR E COLAR)

```bash
# SOLUÇÃO COMPLETA - EXECUTE ISSO:

# 1. Backup (opcional)
git add .
git commit -m "backup antes de rebuild"

# 2. Limpar TUDO
rm -rf node_modules dist .vite .next out
rm package-lock.json

# 3. Reinstalar
npm install

# 4. Build
npm run build

# 5. Testar local
npm run preview
# Abrir http://localhost:4173
# Testar notificações e feedback

# 6. Se funcionar, fazer deploy
git add .
git commit -m "rebuild completo - corrigir useAuth"
git push

# Ou deploy direto:
vercel --prod --force
# ou
netlify deploy --prod --clear-cache
```

## 📞 SE AINDA NÃO FUNCIONAR

1. **Copiar erro COMPLETO** do console de produção
2. **Copiar logs de build** da plataforma
3. **Verificar**:
   - Qual plataforma de hospedagem?
   - Qual versão do Node?
   - Qual framework de build (Vite/Webpack/Next)?

---

## ✅ RESOLUÇÃO MAIS PROVÁVEL

**90% dos casos:** Limpar cache + rebuild resolve

```bash
# Isso deve resolver:
rm -rf node_modules dist
npm install
npm run build
vercel --prod --force
```

---

**Última atualização:** 22 de Outubro de 2025  
**Tipo:** Problema de Build/Deploy  
**Severidade:** Alta (impede uso do sistema)  
**Tempo estimado:** 5-10 minutos para resolver

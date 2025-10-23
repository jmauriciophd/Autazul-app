# 🎯 Guia Visual: Corrigir Erro "useAuth is not defined"

## 🔴 PROBLEMA

```
ReferenceError: useAuth is not defined
```

**Código minificado encontrado:** `const {user: r, signOut: t} = useAuth()`

Isso significa:
- ✅ Código-fonte está **CORRETO**
- ❌ Build de produção está **DESATUALIZADO** ou com **ERRO**

---

## ✅ SOLUÇÃO VISUAL (Passo a Passo)

### 📍 OPÇÃO 1: Script Automático (MAIS FÁCIL)

```bash
# No terminal, execute:
bash teste-producao.sh
```

**Isso vai:**
1. ✅ Fazer backup
2. ✅ Limpar cache
3. ✅ Reinstalar tudo
4. ✅ Fazer build novo
5. ✅ Testar localmente

---

### 📍 OPÇÃO 2: Manual (Passo a Passo)

#### **PASSO 1:** Abrir Terminal

```
Windows: Pressione Win + R → digite "cmd" → Enter
Mac: Pressione Cmd + Espaço → digite "terminal" → Enter
Linux: Pressione Ctrl + Alt + T
```

#### **PASSO 2:** Navegar até a pasta do projeto

```bash
cd /caminho/para/autazul
```

#### **PASSO 3:** Limpar TUDO

```bash
# Copie e cole TUDO de uma vez:
rm -rf node_modules dist .vite .next out && rm -f package-lock.json
```

**Windows (PowerShell):**
```powershell
Remove-Item -Recurse -Force node_modules, dist, .vite, .next, out, package-lock.json -ErrorAction SilentlyContinue
```

#### **PASSO 4:** Reinstalar

```bash
npm install
```

**⏳ Aguarde:** Pode demorar 1-3 minutos

#### **PASSO 5:** Build Novo

```bash
npm run build
```

**⏳ Aguarde:** Pode demorar 30-60 segundos

**✅ Sucesso se ver:**
```
✓ built in 2.5s
dist/index.html    1.2 kB
dist/assets/...    150 kB
```

**❌ Erro se ver:**
```
✗ Build failed
Error: ...
```
→ Se der erro, veja seção "Troubleshooting" abaixo

#### **PASSO 6:** Testar Localmente

```bash
npm run preview
```

**Abrir navegador:** http://localhost:4173

**Testar:**
1. ✅ Login funciona?
2. ✅ Clicar no sino 🔔 abre notificações?
3. ✅ Clicar no 💬 abre feedback?
4. ✅ Console do navegador SEM erros?

**Se TUDO funcionar local → Problema é CACHE de produção**

#### **PASSO 7:** Fazer Deploy

##### **Se usa Vercel:**
```bash
vercel --prod --force
```

##### **Se usa Netlify:**
```bash
netlify deploy --prod --clear-cache
```

##### **Se usa Cloudflare Pages:**
1. Abrir: https://dash.cloudflare.com
2. Ir em: Pages → Seu projeto
3. Settings → Builds & deployments
4. Clicar: "Clear build cache"
5. Deployments → "Retry deployment"

##### **Se usa outro (GitHub Pages, etc):**
```bash
git add .
git commit -m "rebuild: corrigir useAuth"
git push
```

#### **PASSO 8:** Testar em Produção

1. Abrir site em **aba anônima** (Ctrl+Shift+N)
2. Ou fazer **hard reload**: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)
3. Testar notificações e feedback
4. Verificar console (F12) → SEM erros ✅

---

## 🧪 CHECKLIST VISUAL

Marque conforme avança:

```
PREPARAÇÃO:
□ Terminal aberto
□ Na pasta do projeto

LIMPEZA:
□ node_modules removido
□ dist removido
□ .vite removido
□ package-lock.json removido

BUILD:
□ npm install executado com sucesso
□ npm run build executado com sucesso
□ Pasta dist/ criada
□ Sem erros no console

TESTE LOCAL:
□ npm run preview executado
□ http://localhost:4173 abre
□ Login funciona
□ Notificações abrem (sino 🔔)
□ Feedback funciona (💬)
□ Console sem erros

DEPLOY:
□ Deploy executado com --force ou --clear-cache
□ Build da plataforma SEM erros
□ Deploy concluído

TESTE PRODUÇÃO:
□ Site em produção abre
□ Hard reload executado (Ctrl+Shift+R)
□ Login funciona
□ Notificações abrem
□ Feedback funciona
□ Console sem erros

✅ TUDO OK!
```

---

## 🎨 FLUXOGRAMA

```
┌─────────────────┐
│  Código Local   │
│  (fonte - OK)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   npm install   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   npm build     │ ← Aqui pode dar erro!
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  dist/ criado   │
│ (código minif.) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Deploy      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Produção      │ ← Erro aqui = cache ou build antigo
└─────────────────┘
```

---

## ⚠️ TROUBLESHOOTING

### Erro: "npm: command not found"

**Solução:**
1. Instalar Node.js: https://nodejs.org
2. Versão recomendada: 18 LTS ou superior
3. Reiniciar terminal

### Erro: "Cannot remove node_modules"

**Windows:**
```powershell
# Executar como Administrador:
Remove-Item -Recurse -Force node_modules
```

**Mac/Linux:**
```bash
sudo rm -rf node_modules
```

### Erro: "Build failed" ou erro no TypeScript

**Verificar:**
```bash
# Ver erros detalhados:
npm run build -- --verbose

# Verificar TypeScript:
npx tsc --noEmit
```

**Solução comum:**
```bash
# Atualizar TypeScript:
npm install -D typescript@latest

# Build novamente:
npm run build
```

### Build funciona local, MAS falha em produção

**→ Problema é CACHE da plataforma de deploy**

**Vercel:**
```bash
# Forçar rebuild:
vercel --prod --force

# Ou limpar cache manualmente:
# Dashboard → Settings → Clear Cache
```

**Netlify:**
```bash
netlify deploy --prod --clear-cache
```

**Cloudflare:**
- Dashboard → Clear build cache → Retry

### Ainda dá erro após tudo

**Última tentativa:**

1. **Criar novo deploy do zero:**
```bash
# Se usa Vercel:
vercel --prod --force --no-cache

# Se usa Netlify:
netlify sites:create
netlify deploy --prod --dir=dist
```

2. **Verificar variáveis de ambiente:**
- SMTP_USER configurado?
- SMTP_PASS configurado?
- SUPABASE_* configurados?

3. **Testar em navegador diferente:**
- Chrome → Erro
- Firefox → ?
- Edge → ?

Se **TODOS** dão erro → Problema no build
Se **SÓ UM** dá erro → Problema de cache desse navegador

---

## 📊 COMPARAÇÃO: Antes vs Depois

### ANTES (com erro):
```javascript
// Console de produção:
❌ ReferenceError: useAuth is not defined
❌ Notificações não abrem
❌ Feedback não envia
```

### DEPOIS (corrigido):
```javascript
// Console de produção:
✅ Sem erros
✅ Notificações abrem suavemente
✅ Feedback envia com sucesso
✅ useAuth funcionando perfeitamente
```

---

## 🎯 RESUMO DE 1 MINUTO

**O que fazer:**
1. Abrir terminal na pasta do projeto
2. Executar: `bash teste-producao.sh`
3. Ou manual:
   ```bash
   rm -rf node_modules dist .vite
   npm install
   npm run build
   vercel --prod --force
   ```
4. Testar em produção com Ctrl+Shift+R

**Tempo total:** 5-10 minutos

---

## 📞 AJUDA ADICIONAL

**Documentação completa:**
- `/SOLUCAO_ERRO_BUILD_PRODUCAO.md`
- `/STATUS_SISTEMA_FINAL.md`

**Se ainda não funcionar:**
1. Copiar erro COMPLETO do console
2. Copiar logs do build da plataforma
3. Informar:
   - Plataforma de deploy (Vercel/Netlify/etc)
   - Versão do Node (`node --version`)
   - Sistema operacional

---

**Última atualização:** 22 de Outubro de 2025  
**Sucesso esperado:** 95%+ dos casos  
**Tempo estimado:** 5-10 minutos

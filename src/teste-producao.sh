#!/bin/bash

# 🧪 Script de Teste e Correção para Produção - Autazul
# Execute: bash teste-producao.sh

echo "🔧 AUTAZUL - Correção de Build de Produção"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para perguntar sim/não
ask() {
    while true; do
        read -p "$1 (s/n): " yn
        case $yn in
            [SsYy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Por favor responda s ou n.";;
        esac
    done
}

echo "📋 Este script vai:"
echo "  1. Fazer backup do código atual"
echo "  2. Limpar node_modules e cache"
echo "  3. Reinstalar dependências"
echo "  4. Fazer build de produção"
echo "  5. Testar localmente"
echo ""

if ! ask "Deseja continuar?"; then
    echo "❌ Operação cancelada"
    exit 0
fi

echo ""
echo "🔍 Verificando ambiente..."

# Verificar se tem git
if ! command -v git &> /dev/null; then
    echo "${RED}❌ Git não encontrado${NC}"
    exit 1
fi

# Verificar se tem npm
if ! command -v npm &> /dev/null; then
    echo "${RED}❌ npm não encontrado${NC}"
    exit 1
fi

echo "${GREEN}✅ Ambiente OK${NC}"
echo ""

# 1. BACKUP
echo "📦 Passo 1: Fazendo backup..."
git add .
git commit -m "backup antes de rebuild - $(date +%Y-%m-%d_%H:%M:%S)" 2>/dev/null || echo "Nada para commitar"
echo "${GREEN}✅ Backup feito${NC}"
echo ""

# 2. LIMPAR
echo "🧹 Passo 2: Limpando arquivos antigos..."

if [ -d "node_modules" ]; then
    echo "  Removendo node_modules..."
    rm -rf node_modules
fi

if [ -d "dist" ]; then
    echo "  Removendo dist..."
    rm -rf dist
fi

if [ -d ".vite" ]; then
    echo "  Removendo .vite..."
    rm -rf .vite
fi

if [ -d ".next" ]; then
    echo "  Removendo .next..."
    rm -rf .next
fi

if [ -d "out" ]; then
    echo "  Removendo out..."
    rm -rf out
fi

if [ -f "package-lock.json" ]; then
    echo "  Removendo package-lock.json..."
    rm package-lock.json
fi

echo "${GREEN}✅ Limpeza completa${NC}"
echo ""

# 3. REINSTALAR
echo "📥 Passo 3: Reinstalando dependências..."
npm install

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# 4. BUILD
echo "🔨 Passo 4: Fazendo build de produção..."
npm run build

if [ $? -ne 0 ]; then
    echo "${RED}❌ Erro no build${NC}"
    echo ""
    echo "Possíveis soluções:"
    echo "  1. Verificar erros acima"
    echo "  2. Verificar package.json"
    echo "  3. Verificar vite.config.ts"
    exit 1
fi

echo "${GREEN}✅ Build concluído${NC}"
echo ""

# 5. VERIFICAR TAMANHO
echo "📊 Tamanho do build:"
du -sh dist 2>/dev/null || du -sh out 2>/dev/null || echo "Pasta de build não encontrada"
echo ""

# 6. TESTAR LOCAL
echo "🧪 Passo 5: Testando localmente..."
echo ""
echo "${YELLOW}⚠️  O servidor vai iniciar agora.${NC}"
echo "${YELLOW}   Abra http://localhost:4173 no navegador${NC}"
echo "${YELLOW}   Teste:${NC}"
echo "${YELLOW}     - Login funciona?${NC}"
echo "${YELLOW}     - Notificações abrem (sino 🔔)?${NC}"
echo "${YELLOW}     - Feedback funciona (💬)?${NC}"
echo ""
echo "${YELLOW}   Pressione Ctrl+C para parar o servidor${NC}"
echo ""

if ask "Iniciar servidor de teste?"; then
    npm run preview
else
    echo ""
    echo "⏭️  Pulando teste local"
fi

echo ""
echo "=========================================="
echo "✅ PROCESSO CONCLUÍDO"
echo "=========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "  1. Se o teste local funcionou:"
echo "     ${GREEN}git add .${NC}"
echo "     ${GREEN}git commit -m \"rebuild completo - corrigir useAuth\"${NC}"
echo "     ${GREEN}git push${NC}"
echo ""
echo "  2. Deploy (escolha sua plataforma):"
echo ""
echo "     ${YELLOW}Vercel:${NC}"
echo "     ${GREEN}vercel --prod --force${NC}"
echo ""
echo "     ${YELLOW}Netlify:${NC}"
echo "     ${GREEN}netlify deploy --prod --clear-cache${NC}"
echo ""
echo "     ${YELLOW}Cloudflare Pages:${NC}"
echo "     Ir no dashboard → Clear build cache → Deploy"
echo ""
echo "  3. Após deploy, teste em produção:"
echo "     - Abra o site"
echo "     - Pressione Ctrl+Shift+R (hard reload)"
echo "     - Teste notificações e feedback"
echo ""
echo "=========================================="
echo ""

# Mostrar resumo
echo "📝 RESUMO:"
echo "  ${GREEN}✅${NC} Backup feito"
echo "  ${GREEN}✅${NC} Cache limpo"
echo "  ${GREEN}✅${NC} Dependências reinstaladas"
echo "  ${GREEN}✅${NC} Build de produção criado"
echo ""
echo "💡 Se o erro persistir em produção:"
echo "   1. Verifique os logs da plataforma de deploy"
echo "   2. Limpe o cache da plataforma (Vercel/Netlify/etc)"
echo "   3. Faça hard reload no navegador (Ctrl+Shift+R)"
echo ""
echo "📞 Documentação completa em:"
echo "   /SOLUCAO_ERRO_BUILD_PRODUCAO.md"
echo ""

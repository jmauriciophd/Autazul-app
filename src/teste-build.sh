#!/bin/bash

# Script de teste para validar build de produção
# Verifica se useAuth está presente no bundle final

echo "🧪 TESTE DE BUILD - VALIDAÇÃO useAuth"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Limpar build anterior
echo "📦 Limpando build anterior..."
rm -rf dist
echo ""

# 2. Build de produção
echo "🔨 Executando build de produção..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Build falhou!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""

# 3. Verificar se useAuth está no bundle
echo "🔍 Verificando presença de useAuth no bundle..."
echo ""

# Procurar por 'useAuth' em todos os arquivos JS do bundle
if grep -r "useAuth" dist/*.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ useAuth encontrado no bundle!${NC}"
else
    echo -e "${RED}❌ useAuth NÃO encontrado no bundle!${NC}"
    echo -e "${YELLOW}⚠️  Possível problema de tree-shaking${NC}"
fi

echo ""

# 4. Verificar se AuthProvider está no bundle
echo "🔍 Verificando presença de AuthProvider no bundle..."
echo ""

if grep -r "AuthProvider" dist/*.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AuthProvider encontrado no bundle!${NC}"
else
    echo -e "${RED}❌ AuthProvider NÃO encontrado no bundle!${NC}"
fi

echo ""

# 5. Verificar tamanho do bundle
echo "📊 Tamanho do bundle:"
echo ""
du -sh dist/
echo ""

# 6. Listar arquivos principais
echo "📄 Arquivos principais no bundle:"
echo ""
ls -lh dist/*.js dist/*.html 2>/dev/null | awk '{print $9, "-", $5}'
echo ""

# 7. Instruções para preview
echo "======================================"
echo "🎯 PRÓXIMOS PASSOS:"
echo "======================================"
echo ""
echo "1. Execute o preview local:"
echo -e "   ${YELLOW}npm run preview${NC}"
echo ""
echo "2. Abra http://localhost:4173 no navegador"
echo ""
echo "3. Teste o fluxo:"
echo "   ✅ Fazer login"
echo "   ✅ Verificar que dashboard carrega"
echo "   ✅ Abrir DevTools (F12) e verificar console"
echo "   ✅ NÃO deve ter erro 'useAuth is not defined'"
echo ""
echo "4. Se tudo funcionar:"
echo -e "   ${GREEN}git add .${NC}"
echo -e "   ${GREEN}git commit -m \"fix: corrigir tela branca após login\"${NC}"
echo -e "   ${GREEN}git push${NC}"
echo ""
echo "======================================"

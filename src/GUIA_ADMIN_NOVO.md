# Guia Rápido - Painel Administrativo Atualizado

## 🎯 Acesso Rápido

1. Faça login como administrador
2. Clique no ícone da **coroa** 👑 no header
3. Você verá 3 abas: **Dashboard**, **Configurações** e **Banners**

---

## 📊 Dashboard - Estatísticas do Sistema

### O que você vê:

**Cards com métricas:**
- Total de usuários cadastrados
- Quantidade de pais
- Quantidade de profissionais
- Total de crianças cadastradas
- Total de eventos registrados

**Tabela de usuários:**
- Nome completo
- Email
- Tipo (Pai/Mãe ou Profissional)
- Quantidade de cadastros realizados
- Data de entrada no sistema

### Como usar:
- As estatísticas são atualizadas automaticamente ao acessar a aba
- Role a página para ver a tabela completa de usuários
- Use a tabela para entender quem está usando o sistema

---

## ⚙️ Configurações - Google Ads

### Código de Rastreamento

1. Acesse a aba **Configurações**
2. Cole o código JavaScript do Google Ads no campo **"Código de Rastreamento"**
3. Clique em **"Salvar Configurações"**

O código será automaticamente injetado no sistema.

### Parâmetros de Segmentação (NOVO!)

1. No campo **"Parâmetros de Segmentação"**, defina:
   - Palavras-chave (ex: "autismo", "TEA", "crianças autistas")
   - Público-alvo
   - Localização geográfica
   - Outros critérios importantes

2. Clique em **"Salvar Configurações"**

**Exemplo:**
```
Palavras-chave: autismo, TEA, crianças autistas, pais de autistas
Público: Pais de crianças de 2-12 anos
Localização: Brasil, foco em SP, RJ, MG
Dispositivos: Mobile e Desktop
```

---

## 🖼️ Banners - Carrossel Dinâmico

### Adicionar Novo Banner

1. Acesse a aba **Banners**
2. Preencha o formulário:
   - **Título** (opcional) - Nome para identificar o banner
   - **URL da Imagem** (obrigatório) - Link da imagem do banner
   - **Link de Destino** (opcional) - Para onde o clique levará

3. Visualize o preview da imagem
4. Clique em **"Adicionar Banner"**

**Exemplo:**
```
Título: Consulta Psicológica
URL da Imagem: https://meusite.com/banner-psicologa.jpg
Link: https://meusite.com/contato
```

### Gerenciar Banners Existentes

**Reordenar:**
- Use as setas **←** e **→** para mudar a ordem
- O primeiro banner será o primeiro exibido no carrossel

**Remover:**
- Clique no ícone da **lixeira** 🗑️
- O banner será removido imediatamente

### Como o Carrossel Funciona

**Para os usuários finais:**
- Os banners aparecem nos dashboards (Pais e Profissionais)
- Troca automática a cada 5 segundos
- Setas laterais para navegação manual
- Bolinhas na parte inferior mostram a posição atual

**Regras de exibição:**
- ✅ **2+ banners:** Exibe carrossel completo com navegação
- ✅ **1 banner:** Exibe banner único (sem navegação)
- ❌ **0 banners:** Não exibe nada

---

## 💡 Dicas e Boas Práticas

### Google Ads
- ✅ Cole o código exatamente como fornecido pelo Google
- ✅ Documente os parâmetros de segmentação para referência futura
- ✅ Teste se o código está funcionando após salvar

### Banners
- ✅ Use imagens de alta qualidade (mínimo 1200px de largura)
- ✅ Formato recomendado: 16:9 ou 21:9 (horizontal)
- ✅ Adicione sempre um link de destino para maximizar conversão
- ✅ Ordene do mais importante para o menos importante
- ✅ Mantenha 3-5 banners para rotação ideal
- ⚠️ Evite mais de 10 banners (pode ficar confuso)

### Dashboard
- ✅ Verifique as estatísticas regularmente
- ✅ Use os dados para entender o crescimento do sistema
- ✅ Identifique usuários mais ativos

---

## 🔧 Solução de Problemas

### "Acesso Negado"
**Problema:** Não consigo acessar o painel admin
**Solução:** 
- Verifique se seu email está configurado como admin
- Entre em contato com o administrador do sistema

### Banner não aparece
**Problema:** Adicionei um banner mas não vejo no sistema
**Solução:**
- Verifique se a URL da imagem está correta
- Abra a URL da imagem em uma nova aba
- Se a imagem não carregar, corrija a URL

### Carrossel não troca automaticamente
**Problema:** Os banners não mudam sozinhos
**Solução:**
- Certifique-se de ter 2 ou mais banners cadastrados
- Recarregue a página
- O carrossel troca a cada 5 segundos

### Estatísticas não carregam
**Problema:** Dashboard mostra loading infinito
**Solução:**
- Recarregue a página
- Verifique sua conexão com internet
- Aguarde alguns segundos e tente novamente

---

## 📱 Responsividade

### Desktop
- Todas as abas em linha
- Estatísticas em grid 3 colunas
- Tabela completa visível

### Tablet
- Abas em linha
- Estatísticas em grid 2 colunas
- Tabela com scroll horizontal

### Mobile
- Abas em grid (stack)
- Estatísticas em 1 coluna
- Tabela otimizada para toque
- Carrossel com gestos de swipe

---

## ⚡ Atalhos e Recursos

### Navegação Rápida
- **Dashboard:** Métricas e usuários
- **Configurações:** Google Ads
- **Banners:** Gestão de carrossel

### Ações Rápidas
- **Adicionar Banner:** Formulário sempre visível na aba Banners
- **Reordenar:** Setas diretas em cada banner
- **Remover:** Ícone de lixeira em cada banner

### Feedback Visual
- ✅ Mensagens de sucesso ao salvar
- ❌ Mensagens de erro se algo falhar
- ⏳ Loading durante operações

---

## 🎓 Recursos Avançados

### Para desenvolvedores

**API Endpoints:**
- `GET /admin/stats` - Estatísticas completas
- `PUT /admin/settings` - Atualizar configurações
- `GET /admin/public-settings` - Configurações públicas

**Estrutura de dados:**
```typescript
// Banner
{
  id: string
  imageUrl: string
  link?: string
  title?: string
  order: number
}

// Settings
{
  googleAdsCode: string
  googleAdsSegmentation: string
  banners: Banner[]
}
```

---

## 📞 Precisa de Ajuda?

**Problemas técnicos:**
- Verifique o console do navegador (F12)
- Procure por mensagens de erro em vermelho
- Anote o erro e contate o suporte

**Dúvidas sobre uso:**
- Consulte este guia
- Leia a documentação completa em `/ADMIN_PANEL_MELHORIAS.md`
- Entre em contato com o administrador do sistema

---

## ✅ Checklist de Configuração Inicial

Ao configurar o painel pela primeira vez:

- [ ] Adicionar código do Google Ads
- [ ] Definir parâmetros de segmentação
- [ ] Criar pelo menos 3 banners
- [ ] Testar clique nos banners
- [ ] Verificar carrossel em diferentes dispositivos
- [ ] Confirmar que estatísticas estão corretas
- [ ] Documentar configurações realizadas

---

**Última atualização:** 24 de outubro de 2025  
**Versão:** 2.0 - Painel Administrativo Completo

# 📊 Funcionalidade de Relatórios em PDF - Documentação Completa

## 📋 Visão Geral

A funcionalidade de relatórios em PDF permite que os pais gerem relatórios detalhados e personalizáveis sobre o histórico de eventos de seus filhos autistas. Os relatórios incluem gráficos interativos, análise de tendências, comparações temporais e estatísticas completas.

## ✨ Recursos Principais

### 1. **Filtros Flexíveis**
- **Período**: Mês, Ano ou Período Customizado
- **Tipo de Evento**: Filtrar por categorias específicas (Comportamental, Acadêmico, Social, etc.)
- **Severidade**: Filtrar por níveis de gravidade (Normal, Médio, Alerta, Grave)

### 2. **Análise de Dados**
- **Total de Eventos**: Contador de eventos no período selecionado
- **Tendências**: Análise automática de aumento, diminuição ou estabilidade
- **Tipo Mais Comum**: Identificação do evento mais frequente
- **Métricas Estatísticas**: Médias, comparações e distribuições

### 3. **Visualizações Gráficas**

#### Aba "Linha do Tempo"
- **Gráfico de Área**: Visualiza a distribuição temporal dos eventos
- **Gráfico de Barras**: Para períodos mensais curtos
- Permite identificar picos e quedas na frequência de eventos

#### Aba "Por Tipo"
- **Gráfico de Pizza**: Distribuição percentual por tipo de evento
- **Gráfico de Barras Horizontal**: Ranking dos tipos mais frequentes
- Visualização clara das categorias predominantes

#### Aba "Por Severidade"
- **Gráfico de Pizza Colorido**: Distribuição por níveis de gravidade
  - 🟢 Normal (Verde)
  - ⚪ Médio (Cinza)
  - 🟡 Alerta (Amarelo)
  - 🔴 Grave (Vermelho)
- **Resumo Detalhado**: Lista com quantidade de eventos por severidade

#### Aba "Comparação"
- **Gráfico de Linha**: Evolução temporal dos eventos
- **Insights Automáticos**:
  - ⚠️ Tendência de Aumento: Alerta quando há crescimento significativo
  - ✅ Tendência Positiva: Parabeniza pela redução de eventos
  - ℹ️ Tendência Estável: Informa sobre estabilidade

### 4. **Tabela Resumo Estatístico**
Apresenta métricas consolidadas:
- Total de eventos
- Média de eventos por mês
- Tipo mais frequente
- Severidade mais comum
- Variação da tendência (%)

### 5. **Exportação para PDF**
- Geração dinâmica de PDF com todos os gráficos e dados
- Layout profissional formatado para A4
- Inclui cabeçalho com informações do relatório:
  - Nome do filho
  - Período analisado
  - Data e hora de geração
- Nome do arquivo: `relatorio_[nome_filho]_[data].pdf`

## 🎯 Como Usar

### Passo 1: Acessar a Funcionalidade
1. Faça login no sistema Autazul como **Pai/Responsável**
2. Selecione o filho desejado na lista
3. Clique na aba **"Relatórios"** (ícone de gráfico de barras)

### Passo 2: Configurar Filtros
1. **Selecione o Período**:
   - **Mês**: Escolha um mês específico
   - **Ano**: Selecione um ano completo
   - **Customizado**: Defina data inicial e final

2. **Aplicar Filtros Opcionais**:
   - **Tipo de Evento**: Selecione "Todos" ou uma categoria específica
   - **Severidade**: Selecione "Todas" ou um nível específico

3. Clique em **"Atualizar Relatório"** para carregar os dados

### Passo 3: Analisar os Dados
1. Navegue pelas 4 abas de visualização:
   - **Linha do Tempo**: Veja a evolução temporal
   - **Por Tipo**: Analise a distribuição por categorias
   - **Por Severidade**: Verifique níveis de gravidade
   - **Comparação**: Observe tendências e insights

2. Verifique as métricas principais no topo:
   - Total de Eventos
   - Tendência (aumento/diminuição/estável)
   - Tipo Mais Comum

### Passo 4: Exportar PDF
1. Após configurar filtros e visualizar os dados
2. Clique em **"Exportar PDF"**
3. Aguarde a geração (alguns segundos)
4. O PDF será baixado automaticamente no seu dispositivo

## 📊 Tipos de Eventos Disponíveis

O sistema suporta análise para os seguintes tipos de eventos:
- Crise
- Birra
- Agressividade
- Comportamento Repetitivo
- Dificuldade de Comunicação
- Interação Social Positiva
- Progresso
- Outro

## 🎨 Cores e Indicadores de Severidade

| Severidade | Cor | Indicação |
|------------|-----|-----------|
| **Normal** | 🟢 Verde | Situação tranquila, comportamento esperado |
| **Médio** | ⚪ Cinza | Requer atenção, mas controlável |
| **Alerta** | 🟡 Amarelo | Situação que necessita monitoramento |
| **Grave** | 🔴 Vermelho | Situação crítica, requer intervenção |

## 🔍 Interpretação de Tendências

### Tendência de Aumento (⚠️ +X%)
- **Significado**: A frequência de eventos aumentou no período
- **Ação Sugerida**: Revisar estratégias de intervenção com profissionais
- **Cor**: Laranja

### Tendência de Diminuição (✅ -X%)
- **Significado**: A frequência de eventos diminuiu no período
- **Ação Sugerida**: Manter as estratégias atuais que estão funcionando
- **Cor**: Verde

### Tendência Estável (ℹ️)
- **Significado**: A frequência se manteve constante
- **Ação Sugerida**: Monitorar e ajustar conforme necessário
- **Cor**: Azul

## 💡 Casos de Uso

### 1. Preparação para Consultas Médicas
- Gere relatório do último trimestre
- Exporte em PDF para compartilhar com médicos/terapeutas
- Use os gráficos para ilustrar progressos ou desafios

### 2. Avaliação de Intervenções
- Compare períodos antes e depois de nova terapia
- Analise se houve redução de eventos críticos
- Identifique quais tipos de eventos melhoraram

### 3. Compartilhamento com Escola
- Gere relatório mensal para reuniões escolares
- Mostre evolução do comportamento na escola vs casa
- Use dados para embasar solicitações de suporte

### 4. Acompanhamento de Longo Prazo
- Gere relatório anual para avaliar progresso geral
- Compare anos diferentes para identificar padrões sazonais
- Documente a jornada de desenvolvimento da criança

## 🔧 Aspectos Técnicos

### Bibliotecas Utilizadas
- **recharts**: Geração de gráficos interativos
- **jspdf**: Criação de arquivos PDF
- **html2canvas**: Captura de tela para PDF

### Processamento de Dados
1. **Coleta**: Busca eventos do KV Store filtrados por período
2. **Agregação**: Processa dados para contagens e distribuições
3. **Análise**: Calcula tendências comparando primeira e segunda metade do período
4. **Visualização**: Renderiza gráficos com dados processados

### Performance
- Carregamento otimizado por mês
- Cache de dados durante sessão
- Geração de PDF assíncrona para não travar interface

## 📱 Responsividade

A funcionalidade é totalmente responsiva e funciona em:
- 💻 Desktop (experiência completa)
- 📱 Tablets (layout adaptado)
- 📱 Smartphones (visualização simplificada)

## 🛡️ Privacidade e Segurança

- ✅ Apenas o responsável e co-responsáveis podem gerar relatórios
- ✅ Dados são filtrados por child ID no backend
- ✅ Exportação local - PDF gerado no navegador
- ✅ Nenhum dado é enviado para servidores externos

## 🚀 Próximas Melhorias Sugeridas

1. **Comparação entre Filhos**: Para pais com múltiplos filhos
2. **Exportação para Excel**: Dados tabulares para análise avançada
3. **Agendamento de Relatórios**: Envio automático mensal por email
4. **Anotações Personalizadas**: Adicionar comentários ao relatório
5. **Gráficos por Profissional**: Análise de eventos por terapeuta/professor

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se há eventos cadastrados no período selecionado
2. Tente diferentes combinações de filtros
3. Certifique-se de que o navegador permite download de arquivos
4. Entre em contato com o suporte técnico do Autazul

---

**Desenvolvido com ❤️ para famílias que buscam o melhor acompanhamento para seus filhos autistas**

*Última atualização: Outubro 2025*

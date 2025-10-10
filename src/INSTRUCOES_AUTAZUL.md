# Sistema Autazul - Instruções de Uso

## Visão Geral

O **Autazul** é um sistema completo de acompanhamento e registro de eventos para crianças autistas, permitindo que pais/responsáveis e profissionais colaborem no monitoramento do desenvolvimento.

---

## 🎯 Funcionalidades Principais

### Para Pais/Responsáveis:
- ✅ Cadastro e gerenciamento de perfis de filhos autistas
- ✅ Geração de links únicos para vincular profissionais
- ✅ Visualização de eventos em calendário mensal
- ✅ Acompanhamento detalhado de cada evento
- ✅ Gerenciamento de múltiplos filhos
- ✅ Controle total sobre profissionais vinculados

### Para Profissionais:
- ✅ Acesso via link único de convite
- ✅ Cadastro de eventos detalhados
- ✅ Classificação por tipo e gravidade
- ✅ Registro de avaliações profissionais
- ✅ Visualização de histórico de eventos
- ✅ Dashboard com estatísticas

---

## 📋 Como Usar

### **1. Cadastro de Pais/Responsáveis**

1. Acesse o sistema
2. Clique em "Não tem conta? Cadastre-se"
3. Preencha:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
4. Clique em "Criar Conta"

### **2. Adicionar Filhos Autistas**

1. Após login, clique em "Adicionar Filho"
2. Preencha:
   - Nome do filho
   - Data de nascimento
3. Clique em "Salvar"
4. Repita para cada filho que desejar cadastrar

### **3. Vincular Profissionais**

1. Selecione o filho desejado
2. Clique em "Adicionar Profissional"
3. Preencha:
   - Nome do profissional
   - Email
   - Tipo (Professor, Psicólogo, etc.)
4. Clique em "Gerar Link de Convite"
5. **Copie o link gerado** e envie para o profissional

### **4. Profissional Aceitar Convite**

1. Profissional acessa o link recebido
2. Visualiza informações do convite (nome da criança, responsável)
3. Preenche:
   - Nome (pode editar)
   - Email (pode editar)
   - Senha
4. Clica em "Aceitar Convite e Criar Conta"
5. É automaticamente vinculado à criança

### **5. Cadastrar Eventos (Profissional)**

1. Profissional faz login
2. Clica em "Novo Evento"
3. Preenche:
   - Seleciona o autista (se vinculado a mais de um)
   - Tipo de evento (Comportamental, Acadêmico, Social, etc.)
   - Data e hora
   - Gravidade (Baixa, Média, Alta)
   - Descrição do ocorrido
   - Avaliação profissional
4. Clica em "Cadastrar Evento"

### **6. Visualizar Eventos (Responsável)**

1. Selecione o filho no dropdown
2. Navegue pelo calendário
   - **Dias com eventos aparecem destacados em azul**
3. Clique em um dia para ver os eventos
4. Clique em um evento para ver detalhes completos

### **7. Gerenciar Profissionais**

- **Visualizar**: Lista aparece no painel esquerdo
- **Remover**: Clique no ícone de lixeira ao lado do nome do profissional
- **Adicionar novo**: Use o botão "Adicionar Profissional"

---

## 🔐 Segurança e Privacidade

### Controle de Acesso:
- ✅ Cada usuário tem autenticação individual
- ✅ Pais só veem dados de seus filhos
- ✅ Profissionais só veem dados dos autistas vinculados
- ✅ Links de convite são únicos e de uso único

### Hierarquia de Dados:
```
Responsável (Pai/Mãe)
  └── Filho Autista 1
       ├── Profissional A (Professor)
       ├── Profissional B (Psicólogo)
       └── Eventos registrados
  └── Filho Autista 2
       └── Profissionais e eventos...
```

---

## 📱 Responsividade

O sistema é **totalmente responsivo** e funciona em:
- 💻 Desktop (experiência completa)
- 📱 Tablets (layout adaptado)
- 📱 Smartphones (interface mobile-first)

---

## 🎨 Tipos de Eventos Disponíveis

- **Comportamental**: Comportamentos, crises, avanços comportamentais
- **Acadêmico**: Atividades escolares, aprendizado
- **Social**: Interações sociais, comunicação
- **Sensorial**: Questões sensoriais, estímulos
- **Comunicação**: Desenvolvimento da linguagem
- **Saúde**: Questões médicas, consultas
- **Outro**: Eventos diversos

## 📊 Níveis de Gravidade

- 🟢 **Baixa**: Situação controlada, evolução positiva
- 🟡 **Média**: Requer atenção, acompanhamento
- 🔴 **Alta**: Situação crítica, intervenção necessária

---

## 🔄 Fluxo Completo do Sistema

### Fluxo do Responsável:
```
1. Cadastro → 2. Login → 3. Adicionar Filho → 4. Convidar Profissional → 
5. Compartilhar Link → 6. Acompanhar Eventos no Calendário
```

### Fluxo do Profissional:
```
1. Receber Link → 2. Aceitar Convite → 3. Login Automático → 
4. Cadastrar Eventos → 5. Acompanhar Estatísticas
```

---

## ⚠️ Avisos Importantes

### Ambiente de Demonstração:
- Este sistema foi desenvolvido no **Figma Make** para fins de **demonstração e prototipagem**
- **NÃO recomendado** para uso em produção sem medidas adicionais de segurança
- Para uso real, implemente:
  - Criptografia de dados sensíveis
  - Backup regular dos dados
  - Conformidade com LGPD/GDPR
  - Auditoria de acesso
  - Certificado SSL

### Dados Sensíveis:
- O sistema armazena informações de saúde e desenvolvimento
- Use apenas em ambientes seguros
- Não compartilhe links de convite publicamente

---

## 🆘 Resolução de Problemas

### **"Link de convite inválido"**
- Link já foi usado (cada link só pode ser usado uma vez)
- Peça ao responsável para gerar um novo link

### **"Não consigo ver eventos"**
- Verifique se está no mês correto do calendário
- Certifique-se de que há eventos cadastrados
- Profissionais: verifique se está vinculado ao autista

### **"Erro ao cadastrar evento"**
- Preencha todos os campos obrigatórios (marcados com *)
- Verifique a conexão com internet
- Tente fazer logout e login novamente

---

## 📞 Suporte Técnico

Para dúvidas sobre o funcionamento do sistema:
1. Leia estas instruções completamente
2. Verifique a seção de Resolução de Problemas
3. Entre em contato com o administrador do sistema

---

## 🚀 Próximos Passos Sugeridos

Para expandir o sistema, considere adicionar:
- 📸 Upload de fotos nos eventos
- 📈 Gráficos e relatórios de evolução
- 🔔 Notificações para responsáveis quando eventos são criados
- 💬 Sistema de mensagens entre pais e profissionais
- 📄 Exportação de relatórios em PDF
- 🗓️ Agendamento de consultas e sessões
- 🎯 Metas e objetivos de desenvolvimento

---

**Desenvolvido com ❤️ para ajudar famílias e profissionais no acompanhamento de autistas**

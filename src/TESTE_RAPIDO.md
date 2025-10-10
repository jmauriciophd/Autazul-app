# 🧪 Teste Rápido do Sistema Autazul

## Cenário de Teste Completo (5-10 minutos)

### Parte 1: Cadastro do Responsável e Filho

1. **Criar conta de responsável**
   - Email: `pai@teste.com`
   - Senha: `senha123`
   - Nome: `João Silva`

2. **Adicionar primeiro filho**
   - Nome: `Lucas Silva`
   - Data de nascimento: `2018-05-15`

3. **Adicionar segundo filho (opcional)**
   - Nome: `Maria Silva`
   - Data de nascimento: `2020-03-20`

### Parte 2: Convidar Profissional

1. **Gerar convite para profissional**
   - Selecione o filho: `Lucas Silva`
   - Nome do profissional: `Dra. Ana Santos`
   - Email: `ana@teste.com`
   - Tipo: `Psicólogo(a)`
   - Clique em "Gerar Link de Convite"

2. **Copiar o link gerado**
   - Exemplo: `http://localhost:3000/professional/accept/abc123...`
   - **IMPORTANTE:** Copie este link para usar na próxima etapa

### Parte 3: Profissional Aceitar Convite

1. **Abrir o link em nova aba ou janela anônima**
   - Cole o link copiado na barra de endereços
   - Ou faça logout e cole o link

2. **Aceitar o convite**
   - Verifique as informações (nome da criança, responsável)
   - Nome: `Ana Santos` (pode editar)
   - Email: `ana@teste.com` (pode editar)
   - Senha: `senha123`
   - Clique em "Aceitar Convite e Criar Conta"

3. **Login automático**
   - Você será redirecionado para o dashboard do profissional

### Parte 4: Cadastrar Eventos (como Profissional)

1. **Criar primeiro evento**
   - Autista: `Lucas Silva`
   - Tipo: `Comportamental`
   - Data: (data de hoje)
   - Hora: `10:30`
   - Gravidade: `Baixa`
   - Descrição: `Lucas conseguiu manter contato visual durante toda a sessão de 30 minutos. Mostrou interesse em atividades de encaixe.`
   - Avaliação: `Progresso excelente. Continuar com atividades de concentração e coordenação motora.`

2. **Criar segundo evento (dia anterior)**
   - Autista: `Lucas Silva`
   - Tipo: `Social`
   - Data: (ontem)
   - Hora: `14:00`
   - Gravidade: `Média`
   - Descrição: `Teve dificuldade em compartilhar brinquedos com colegas durante recreação.`
   - Avaliação: `Recomendar atividades em grupo com supervisão mais próxima.`

3. **Criar terceiro evento (semana passada)**
   - Autista: `Lucas Silva`
   - Tipo: `Acadêmico`
   - Data: (7 dias atrás)
   - Hora: `09:15`
   - Gravidade: `Baixa`
   - Descrição: `Completou todas as atividades de matemática com autonomia.`
   - Avaliação: `Demonstra evolução clara no raciocínio lógico. Aumentar complexidade gradualmente.`

### Parte 5: Visualizar Eventos (como Responsável)

1. **Fazer logout do profissional**
   - Clique em "Sair" no canto superior direito

2. **Login como responsável**
   - Email: `pai@teste.com`
   - Senha: `senha123`

3. **Navegar pelo calendário**
   - Selecione o filho: `Lucas Silva`
   - Observe os dias destacados em azul (dias com eventos)
   - Clique no dia de hoje
   - Veja o evento listado à direita

4. **Ver detalhes do evento**
   - Clique no card do evento
   - Veja todas as informações: tipo, gravidade, descrição, avaliação, profissional

5. **Navegar entre meses**
   - Use as setas do calendário para ver eventos de outros meses

### Parte 6: Gerenciar Profissionais

1. **Ver lista de profissionais**
   - No painel esquerdo, veja `Dra. Ana Santos` listada
   - Informações: tipo, email, data de vinculação

2. **Adicionar outro profissional (opcional)**
   - Tipo: `Professor(a)`
   - Nome: `Prof. Carlos Souza`
   - Email: `carlos@teste.com`

3. **Remover profissional (opcional - teste apenas)**
   - Clique no ícone de lixeira
   - Confirme a remoção
   - **Nota:** Isso NÃO remove os eventos já cadastrados

---

## ✅ Checklist de Testes

Marque conforme completar:

- [ ] Cadastro de responsável funcionou
- [ ] Consegui adicionar filho
- [ ] Link de convite foi gerado
- [ ] Profissional aceitou convite com sucesso
- [ ] Profissional conseguiu cadastrar eventos
- [ ] Responsável vê eventos no calendário
- [ ] Dias com eventos aparecem destacados
- [ ] Detalhes do evento são exibidos corretamente
- [ ] Posso alternar entre filhos (se tiver mais de um)
- [ ] Dashboard do profissional mostra estatísticas
- [ ] Posso fazer logout e login novamente

---

## 🔍 Pontos de Atenção

### O que deve funcionar:
✅ Múltiplos filhos por responsável
✅ Múltiplos profissionais por filho
✅ Eventos em diferentes datas
✅ Filtro de eventos por mês
✅ Navegação entre responsável e profissional
✅ Layout responsivo (teste em mobile)

### O que é esperado:
- Links de convite são de **uso único** (cada link só funciona uma vez)
- Profissionais só veem filhos vinculados a eles
- Responsáveis só veem seus próprios filhos
- Eventos aparecem agrupados por mês no calendário

---

## 📱 Teste Mobile

1. **Redimensione a janela** do navegador para tamanho mobile (375px)
2. **Ou use DevTools** (F12) → Toggle device toolbar
3. **Verifique:**
   - Menu hambúrguer aparece no mobile
   - Cards ficam em coluna única
   - Calendário se adapta ao tamanho
   - Formulários são legíveis
   - Botões são clicáveis

---

## 🐛 Problemas Comuns e Soluções

### "Erro ao criar conta"
- ✅ Verifique se está usando emails diferentes para cada usuário
- ✅ Senha deve ter no mínimo 6 caracteres

### "Link de convite não funciona"
- ✅ Cada link só pode ser usado uma vez
- ✅ Gere um novo link se necessário

### "Não vejo eventos no calendário"
- ✅ Certifique-se de estar no mês correto
- ✅ Verifique se os eventos foram criados para este filho
- ✅ Tente recarregar a página (F5)

### "Dashboard vazio (profissional)"
- ✅ Você precisa aceitar um convite primeiro
- ✅ Só aparecerão filhos aos quais você foi vinculado

---

## 🎯 Casos de Uso Avançados

### Cenário 1: Múltiplos Profissionais
1. Adicione 3 profissionais diferentes (psicólogo, professor, terapeuta)
2. Cada um deve registrar eventos
3. Veja todos os eventos consolidados no calendário do responsável

### Cenário 2: Dois Filhos
1. Adicione 2 filhos
2. Adicione profissionais diferentes para cada filho
3. Alterne entre filhos no dropdown
4. Veja como os eventos mudam conforme a seleção

### Cenário 3: Histórico Longo
1. Crie eventos em diferentes datas (últimos 3 meses)
2. Navegue pelo calendário entre meses
3. Observe o padrão de eventos ao longo do tempo

---

## 📊 Dados de Teste Sugeridos

### Tipos de Eventos para Testar:
- ✅ Comportamental (crise, comportamento positivo)
- ✅ Acadêmico (atividade, conquista)
- ✅ Social (interação, comunicação)
- ✅ Sensorial (hipersensibilidade, resposta)
- ✅ Saúde (consulta, medicação)

### Gravidades para Testar:
- 🟢 Baixa (evolução, sucesso)
- 🟡 Média (atenção necessária)
- 🔴 Alta (intervenção urgente)

---

## 🎓 Aprendizados Esperados

Após este teste, você deve conseguir:
1. ✅ Criar conta como responsável
2. ✅ Gerenciar filhos autistas
3. ✅ Convidar e vincular profissionais
4. ✅ Aceitar convites como profissional
5. ✅ Registrar eventos detalhados
6. ✅ Visualizar eventos no calendário
7. ✅ Navegar entre diferentes perfis
8. ✅ Entender o fluxo completo do sistema

---

**Tempo estimado: 10-15 minutos para teste completo**

**Dica:** Teste em duas abas do navegador (uma para pai, outra para profissional) para simular uso real!

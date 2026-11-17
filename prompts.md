# Uso de Inteligência Artificial · ClimaPonto (Python)

Global Solution FIAP 2026.2 · Computational Thinking with Python · Equipe Debuggers

## 1. Ferramentas utilizadas e finalidade

| Ferramenta | Finalidade |
|---|---|
| **Claude** (Anthropic) | Apoio na idealização e no planejamento da aplicação, na conferência dos requisitos do edital, no desenvolvimento do código do `main.py` e na redação do `README.md` e deste arquivo |

Nenhuma outra ferramenta de IA foi utilizada nesta parte do projeto. Todas as decisões de escopo, funcionalidades e regras foram tomadas pelo grupo, e cada resultado gerado foi revisado antes de ser aceito.

## 2. Prompts utilizados

Os prompts estão organizados nas etapas em que o trabalho foi feito.

### Etapa 1 · Idealização do projeto e ajustes de planejamento

> Somos a equipe Debuggers e estamos desenvolvendo o ClimaPonto, uma solução que monitora o calor em pontos de ônibus de São Paulo com um sensor ESP32. Precisamos idealizar uma aplicação em Python, executada no terminal, que funcione como central das leituras de temperatura e umidade. Proponha um menu de funcionalidades coerente com o problema, que não seja um cadastro genérico, e indique como ele se conecta às outras partes da solução.

> Ajuste a proposta: toda a aplicação deve ficar em um único arquivo `main.py`. A opção de importação não deve gerar dados simulados pelo programa; ela deve buscar as leituras reais do sensor ESP32 desenvolvido na parte de Edge Computing.

> O servidor FIWARE da equipe é baseado no "FIWARE Descomplicado" e não fica ligado o tempo todo. A aplicação deve fazer uma requisição de informações e voltar com as mais recentes, sobrescrevendo as antigas.

### Etapa 2 · Requisitos

> Com base no edital da disciplina Computational Thinking with Python, liste os requisitos obrigatórios da aplicação, os critérios de avaliação e o formato de entrega.

> Considere também os conteúdos trabalhados no semestre: anotação de tipo e docstring; parâmetros posicionais, nomeados e arbitrários; strings, listas e tuplas; dicionários; arquivos de texto e JSON; consumo de API; matrizes; busca linear e binária; métodos de ordenação. Indique em qual funcionalidade cada conteúdo pode ser aplicado com utilidade real, e não apenas para cumprir requisito.

> Para o consumo de API, utilize a biblioteca `requests`, que foi vista em aula.

### Etapa 3 · Apoio ao desenvolvimento do código

> Revise o `main.py` seguindo o menu aprovado. Use apenas funções, anotação de tipo e docstring em todas elas, `match/case` no menu, validação de todas as entradas e tratamento de exceções específicas. Os limites de 30 °C e 35 °C devem ser os mesmos do ESP32.

> Implemente a integração com o FIWARE: consultar o IoT Agent para identificar a entidade do dispositivo `climaponto-p001`, buscar o histórico no STH-Comet e usar o Orion como alternativa. Trate servidor desligado, demora na resposta e erro de cadastro do dispositivo com mensagens claras.

> Ao abrir, a aplicação deve fazer uma verificação rápida do servidor. Se estiver ligado, atualiza as leituras; se não estiver, usa as leituras salvas e informa o usuário.

> Não armazene todas as leituras recebidas. Quando o servidor estiver ligado, guarde apenas as 6 leituras mais recentes do sensor de cada ponto, substituindo as anteriores, e mantenha as leituras digitadas.

> Teste a aplicação com entradas inválidas, servidor ligado e desligado, arquivo JSON corrompido e reinício do programa, e apresente os resultados antes de qualquer alteração ser salva.

### Etapa 4 · Desenvolvimento do README e do prompts.md

> Elabore o `README.md` com os ODS conectados e a explicação de como o projeto contribui para suas metas. Inclua requisitos, execução, funcionalidades, origem dos dados, regras, persistência, conceitos aplicados, exemplos, testes e limitações.

> Elabore o `prompts.md` conforme o edital: ferramentas e finalidades, prompts utilizados, funcionalidades desenvolvidas com apoio da IA, forma de verificação e análise crítica.

### Etapa 5 · Integração com o sensor real e correção de erros

*Os prompts desta etapa foram enviados em sequência, durante os testes com o servidor FIWARE ligado. Abaixo estão resumidos por objetivo.*

> O integrante responsável pela parte de Edge Computing vai informar apenas o IP do servidor FIWARE. Teste a conexão a partir dele e considere que o STH-Comet pode não estar assinado. A aplicação deve funcionar mesmo sem o histórico.

> **Correção de erro (dados antigos):** mesmo após a alteração da temperatura no Wokwi, a aplicação continua exibindo leituras antigas. Analise a configuração enviada pelo integrante de Edge (serviço `climaponto`, entidade `urn:ngsi-ld:ClimaPonto:P001`, tipo `ClimaPontoMonitor`, dispositivo `climaponto-p001`), identifique a causa e corrija. *(Causa encontrada: a aplicação usava o serviço `smart`, de outro exemplo, e lia uma entidade antiga.)*

> **Correção de erro (histórico parado):** quando o STH-Comet não acompanhar as leituras novas, busque-as diretamente no Orion por meio de uma coleta ao vivo, e mostre na tela a data da última leitura de cada fonte, para que o diagnóstico fique visível.

### Etapa 6 · Regras de negócio e experiência do usuário

> Inclua títulos em cada seção das telas, cabeçalhos nas tabelas e uma opção para voltar ao menu em todas as telas. Como já existe o comando `v` para voltar, a confirmação com Enter deve aparecer apenas em opções inválidas.

> A opção de registrar leituras digitadas não faz sentido para o passageiro. Proponha uma justificativa real para ela ou sua remoção. *(Decisão do grupo: transformar em "medição de campo", feita pela equipe com termômetro portátil nos pontos sem sensor.)*

### Etapa 7 · Adequação ao conteúdo da disciplina

> Confira se o código usa apenas estruturas e conteúdos vistos na disciplina, conforme a restrição do edital. Considere o material do professor sobre arquivos JSON e a lista de conteúdos do 1º e do 2º semestre. Mantenha todo o funcionamento, o menu e a integração com o FIWARE, e adapte apenas os comandos que estiverem fora do escopo. *(Resultado: as compreensões de lista e as expressões condicionais foram reescritas, e os arquivos passaram a seguir o padrão do material; o tratamento de datas foi mantido por decisão do grupo, e `sum`, `max` e `min` continuam sendo usados de forma simples.)*

### Etapa 8 · Execução no Windows

*Prompts seguidos para resolver um erro de execução, resumidos.*

> O botão Run do VS Code não executa o programa e retorna `[Errno 22] Invalid argument`, com o caminho do arquivo entre aspas duplicadas. Informe um comando para executar o programa enquanto o problema não é resolvido e, em seguida, corrija a causa. *(Causa: o terminal padrão do VS Code era o Git Bash, que duplica as aspas em caminhos com espaços. Solução: terminal padrão alterado para PowerShell.)*

> Documente no README desta disciplina e no de Differentiated Problem Solving o passo a passo de execução para quando os comandos não funcionarem, incluindo a opção de trocar o terminal padrão para PowerShell.

### Etapa 9 · Revisão final, testes de QA e documentação

> Atue como especialista em QA: elabore e execute uma bateria de testes cobrindo entradas válidas e inválidas, valores-limite, falhas de rede, arquivos corrompidos ou bloqueados, ausência da biblioteca `requests` e o cálculo da média, conferindo tanto a tela quanto os arquivos gravados.

> Faça a revisão completa do código e do README: confira as linhas de fluxo de cada opção do menu, corrija os problemas encontrados, otimize o que for possível sem alterar o funcionamento e atualize a documentação com o que foi realmente executado.

> Acrescente a este arquivo a participação da IA a partir das alterações feitas pelo grupo, mantendo o formato e deixando explícito o objetivo de cada prompt.

## 3. Funcionalidades desenvolvidas, sugeridas ou modificadas com apoio da IA

| Funcionalidade | Decisão | Apoio da IA |
|---|---|---|
| Menu com 7 opções e `match/case` | Proposta aprovada e ajustada pelo grupo | Sugestão do menu e escrita do código |
| Busca das leituras reais do ESP32 na API do FIWARE (opção 2) | Grupo | Análise do código do ESP32 (mensagem `t\|h\|m\|s` enviada por MQTT), identificação do caminho IoT Agent → Orion → STH-Comet e escrita das consultas com `requests` |
| Verificação do servidor ao abrir e uso das leituras salvas quando ele está desligado | Grupo | Escrita da verificação e das mensagens |
| Armazenamento apenas das 6 leituras mais recentes do sensor por ponto | Grupo | Escrita da substituição das leituras antigas, preservando as digitadas |
| Aplicação dos conteúdos do semestre (buscas, ordenação, matriz, `*args`/`**kwargs`, arquivo de texto) | Grupo | Sugestão de onde cada conteúdo tem utilidade real |
| Tendência de aquecimento (°C por hora e minutos até o próximo limite) | Grupo | Adaptação da taxa de variação usada na análise matemática para um cálculo simples |
| Fuso horário de Brasília: constante `FUSO_BRASILIA` e funções `para_brasilia` e `hora_texto` | Sugerido pela IA e aceito pelo grupo | Criação completa: `para_brasilia` converte o horário UTC enviado pelo FIWARE para o de Brasília, `hora_texto` o exibe em todas as telas como `dd/mm/aaaa hh:mm`, e `ler_data_hora` faz a conversão inversa, para que as medições de campo fiquem no mesmo padrão do sensor |
| Uso da biblioteca `os` | Sugerido pela IA e aceito pelo grupo | `os.path.exists`, `os.path.join`, `os.path.dirname` e `os.path.abspath` para os caminhos relativos à pasta do programa; `os.mkdir` para criar as pastas; `os.listdir` para encontrar o backup mais recente; `os.rename` para guardar um arquivo corrompido sem apagá-lo |
| Gravação segura dos arquivos e cópia de JSON corrompido | Sugerido pela IA e aceito pelo grupo | Escrita do código |
| Configuração correta do FIWARE do grupo (serviço `climaponto`) e diagnóstico STH-Comet × Orion | Grupo | Identificação da causa das leituras antigas e escrita da correção |
| Coleta ao vivo no Orion quando o histórico está parado | Sugerido pela IA e aceito pelo grupo | Escrita da coleta, com parada automática após 4 consultas sem leitura nova |
| Média 1h e guarda das leituras da última hora (substituiu a regra das 6 leituras) | Grupo | Escrita do cálculo e da regra que retira sempre a leitura mais antiga |
| Backup automático, recuperação pelo backup e captura real embutida no código | Grupo | Escrita das três camadas de proteção dos dados |
| Medição de campo (substituiu a leitura digitada) | Grupo, a partir de sugestão da IA | Reescrita da opção 1 e do aviso para pontos com sensor |
| Títulos, subtítulos, tabelas com cabeçalho, `v` para voltar e Enter só em opção inválida | Grupo | Escrita das telas |
| Adequação ao conteúdo da disciplina e ao padrão de arquivos JSON do material | Grupo | Levantamento dos comandos fora do escopo e reescrita |
| Tratamento de erros de gravação, de arquivo corrompido e de edição cancelada | Sugerido pela IA e aceito pelo grupo | Mensagens específicas para servidor desligado, demora na resposta, erro HTTP e sensor não encontrado; gravação que não interrompe o programa se o arquivo estiver aberto em outro programa; arquivo corrompido renomeado em vez de apagado; edição de ponto aplicada só no final, para que o `v` cancele sem deixar alterações pela metade (a gravação por arquivo temporário foi trocada pelo padrão do material) |

## 4. Como o grupo verificou, testou e ajustou os resultados

- **Supervisão de cada versão:** nenhuma alteração foi aceita sem revisão. Cada versão do código e da documentação foi apresentada e explicada antes de ser salva, e o grupo solicitou ajustes sempre que o resultado não correspondia ao planejado. Por exemplo: a opção de importação deixou de gerar dados simulados, a quantidade de leituras guardadas foi limitada a 6 e os textos foram reescritos para ficarem claros ao usuário.
- **Testes:** foram testados entradas inválidas, data no futuro, IP inválido, servidor desligado, servidor ligado (com um servidor de teste que reproduz as respostas do FIWARE), JSON corrompido, persistência após fechar e abrir o programa e estatísticas com valores conhecidos (28, 32 e 36 °C, média 32). A tabela completa está no `README.md`.
- **Teste com o sensor real:** em 10/11/2026, a opção 2 recebeu 6 leituras reais do ESP32 (37,6 °C, estado crítico). Em 16/11/2026, às 23h33, com a temperatura sendo alterada no Wokwi, a opção 2 recebeu 6 leituras de 49,8 °C a 24,4 °C, com o estado acompanhando a média. Em 17/11/2026, a aplicação abriu com o servidor ligado, encontrou a entidade `urn:ngsi-ld:ClimaPonto:P001` e, sem leituras novas, não alterou nada.
- **Teste no computador do grupo:** Windows, Python 3.14 (64 bits) e VS Code, com o terminal padrão em PowerShell. Foram testadas a abertura com o servidor ligado e desligado, a busca no FIWARE (opção 2), a listagem das leituras salvas do sensor e a execução pelo botão Run.
- **Conferência das linhas de fluxo:** com apoio da IA, cada opção do menu foi percorrida do início ao fim, incluindo o retorno com `v`, as opções inválidas e os caminhos com o servidor ligado e desligado. Foram conferidas também a ordem de carregamento dos dados (arquivo principal, backup e captura embutida) e a regra que impede apagar leituras boas.
- **Testes de QA:** a IA atuou como especialista em QA, elaborando e executando uma bateria de 18 casos automatizados, que roda o `main.py` com entradas simuladas e confere a tela e os arquivos gravados. Os casos cobrem entradas inválidas, valores-limite, falha de rede, servidor de teste do FIWARE, arquivo corrompido ou bloqueado, ausência do `requests` e o cálculo da Média 1h. Todos passaram; a tabela está na seção 12 do `README.md`.
- **Revisão e otimização do código:** a revisão completa feita com a IA incluiu docstring em todas as 52 funções, remoção de condições repetidas, uso da constante da janela da média no lugar de valores fixos, correção da consulta por estado com acento (`crítico`), alinhamento das colunas do painel e a opção de tirar o sensor de um ponto na edição. Nas adaptações ao conteúdo da disciplina, a saída do programa foi comparada antes e depois de cada mudança; a revisão final foi validada pela bateria de QA.

## 5. Análise crítica

**Benefícios.** A IA acelerou as partes mais trabalhosas, como validações, mensagens e tratamento de erros, e facilitou a integração com a parte de Edge: a análise do código do ESP32 mostrou rapidamente como buscar os dados no FIWARE. Também ajudou a aplicar os conteúdos do semestre onde eles fazem sentido no problema.

**Limitações.** A IA não tem acesso ao servidor FIWARE da equipe, que fica na nuvem e só é ligado durante os testes; por isso, o teste com o sensor real precisou ser feito pelo grupo. Além disso, ela tende a propor mais funcionalidades do que o necessário, e coube ao grupo cortar e simplificar.

**Dificuldades.** Foi preciso especificar com precisão o que se esperava, como a exigência de que a importação usasse apenas dados reais do sensor. Também foi necessário estudar cada parte do código gerado para conseguir explicá-lo e defendê-lo, o que exigiu tempo, mas garantiu o entendimento do grupo sobre a aplicação.
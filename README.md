<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Disciplina <b>Computational Thinking with Python</b> · Equipe <b>Debuggers</b>
</p>

# ClimaPonto · Central de Leituras

Aplicação em Python, executada no terminal, que **recebe as leituras de temperatura e umidade dos pontos de ônibus**, classifica o calor em *normal*, *atenção* ou *crítico* e transforma esses dados em informação útil: painel do estado atual, consultas, estatísticas, ranking dos pontos mais quentes e tendência de aquecimento.

Repositório: https://github.com/DebuggersGS/ClimaPonto-Python

---

## Sumário

1. [O projeto ClimaPonto](#1-o-projeto-climaponto)
2. [Solução integrada](#2-solução-integrada)
3. [Impacto e contribuição para os ODS](#3-impacto-e-contribuição-para-os-ods)
4. [Requisitos e execução](#4-requisitos-e-execução)
5. [Funcionalidades](#5-funcionalidades)
6. [Dados e integração com o FIWARE](#6-dados-e-integração-com-o-fiware)
7. [Regras de negócio e validações](#7-regras-de-negócio-e-validações)
8. [Persistência em JSON](#8-persistência-em-json)
9. [Conceitos de programação aplicados](#9-conceitos-de-programação-aplicados)
10. [Boas práticas e experiência do usuário](#10-boas-práticas-e-experiência-do-usuário)
11. [Exemplos de execução](#11-exemplos-de-execução)
12. [Testes realizados](#12-testes-realizados)
13. [Limitações](#13-limitações)
14. [Equipe e uso de IA](#14-equipe-e-uso-de-ia)

---

## 1. O projeto ClimaPonto

**O problema.** Em São Paulo, quem espera ônibus fica exposto ao sol e ao calor do asfalto sem nenhuma informação sobre a temperatura naquele ponto. Não dá para saber se o calor do momento é comum ou se já é motivo para procurar sombra e água.

**Quem é beneficiado.** Os passageiros que esperam nos pontos, principalmente **idosos e trabalhadores** que passam muito tempo na rua e são os mais afetados pelo calor.

**Onde.** O ponto piloto é o **P001, na região de Santana (Zona Norte de São Paulo)**. A aplicação também já traz cadastrados os pontos de Interlagos (Zona Sul) e Barueri (Grande São Paulo), as outras regiões estudadas pelo grupo.

**Como funciona.** Um **ESP32 com sensor DHT22**, instalado no ponto, mede temperatura e umidade, classifica o calor e alerta no próprio local com LEDs, buzzer e display, mesmo sem internet. Quando há rede, as leituras seguem para a plataforma **FIWARE**, na nuvem. É de lá que **esta aplicação** busca os dados para mostrar o estado de cada ponto e analisá-los.

| Estado | Temperatura | O que significa para o passageiro |
|---|---|---|
| Normal | abaixo de 30 °C | Espera sem alerta |
| Atenção | de 30 °C a 34,9 °C | Calor: procurar sombra e se hidratar |
| Crítico | 35 °C ou mais | Calor forte: evitar esperar no sol |

**O que esta aplicação faz.** Ela é a **central de operação** dos dados do ClimaPonto e responde a perguntas que o sensor sozinho não responde:

- Qual é o estado de cada ponto agora?
- Qual ponto é o mais quente? Em que período do dia?
- O ponto está esquentando? Em quanto tempo chega a 30 °C ou a 35 °C?

## 2. Solução integrada

```
[ESP32 + DHT22 no ponto]  --MQTT-->  [FIWARE na nuvem]  --API HTTP-->  [Central de Leituras (Python)]
  mede, classifica e                  IoT Agent, Orion                  guarda, consulta, analisa
  alerta no local                     (atual) e STH-Comet               e mostra o estado dos pontos
                                      (histórico)
```

| Parte | Disciplina | O que faz | Responsável |
|---|---|---|---|
| Sensor no ponto (Wokwi) e FIWARE | Edge Computing & Computer Systems | Mede, classifica, alerta no ponto e envia as leituras | Vinícius |
| **Central de Leituras (este repositório)** | **Computational Thinking with Python** | **Busca as leituras na API do FIWARE, guarda, consulta e analisa** | **Guilherme** |
| Modelagem matemática | Differentiated Problem Solving | Define o intervalo de leitura de 10 min, os horários críticos e a tendência | Guilherme |
| Aplicação web | Front-end Design · Web Development | Mostra os dados ao cidadão e gerencia os pontos | Enrico |
| Experiência e apresentação | Software & Total Experience Design · Storytelling | Pesquisa com usuários, protótipos e pitch | Vinícius |

Os limites de 30 °C e 35 °C são **os mesmos** no ESP32, nesta aplicação e no site. São limites de demonstração definidos pelo grupo, não índices oficiais ou clínicos.

## 3. Impacto e contribuição para os ODS

**Indicador de impacto.** O ClimaPonto acompanha, por ponto, as **horas em atenção e em crítico** e os **graus-hora acima de 30 °C**, que medem quanto calor se acumulou e por quanto tempo o passageiro ficou exposto. Como referência, a análise matemática do grupo (Differentiated Problem Solving), feita com dados do INMET, mediu **331 °C·h acima de 30 °C em um ano em Santana**, metade em um único mês. Nesta aplicação, a opção 5 (estatísticas) mostra quantas leituras de cada ponto ficaram em normal, atenção e crítico.

O projeto está conectado a três Objetivos de Desenvolvimento Sustentável da ONU:

| ODS | Meta | Como esta aplicação contribui |
|---|---|---|
| 3 · Saúde e Bem-Estar | 3.d · alerta precoce e redução de riscos à saúde | O painel avisa quando o ponto está em atenção ou crítico, e a tendência estima quando o limite será atingido, permitindo avisar antes |
| 11 · Cidades e Comunidades Sustentáveis | 11.2 · transporte público seguro e acessível, com atenção a idosos e pessoas vulneráveis | O foco é o ponto de ônibus; o ranking e a tabela por período mostram onde e quando o passageiro mais precisa de sombra e informação |
| 13 · Ação Contra a Mudança do Clima | 13.1 · resiliência e adaptação a riscos relacionados ao clima | As estatísticas por ponto dão base para medidas de adaptação ao calor nos pontos mais expostos |

## 4. Requisitos e execução

**Requisitos**

| Item | Versão / observação |
|---|---|
| Python | **3.10 ou mais novo** (o menu usa `match/case`) |
| Biblioteca `requests` | Usada apenas para consultar a API do FIWARE |

**Execução**

```bash
pip install requests
python main.py
```

Execute a partir da pasta onde está o `main.py`. O programa usa caminhos relativos à própria pasta, então funciona em qualquer computador depois de extrair o ZIP.

**Estrutura**

```
ClimaPonto-Python/
├── main.py                 # aplicação completa
├── README.md
├── prompts.md              # documentação do uso de IA
├── dados/                  # criada pelo programa
│   ├── pontos.json         # pontos de ônibus
│   ├── leituras.json       # leituras salvas
│   └── config_fiware.json  # último IP do servidor FIWARE
└── relatorios/             # criada quando um relatório .txt é salvo
```

## 5. Funcionalidades

```
========================================================================
  CLIMAPONTO | CENTRAL DE LEITURAS   (7 leituras salvas)
========================================================================
  1 - Registrar leitura digitada
  2 - Buscar leituras do sensor ESP32 (API do FIWARE)
  3 - Painel: estado atual de cada ponto
  4 - Consultar leituras (por ponto, estado ou horário)
  5 - Estatísticas por ponto e ranking dos mais quentes
  6 - Tendência: o ponto está esquentando?
  7 - Pontos de ônibus (cadastrar, editar, remover)
  0 - Sair
```

| Opção | Funcionalidade |
|---|---|
| **1** | Registra uma leitura digitada (ponto, temperatura, umidade, data e hora) e classifica o estado na hora |
| **2** | Consulta a API do FIWARE e traz as **6 leituras mais recentes** do sensor ESP32 do ponto |
| **3** | Mostra a última leitura de cada ponto, com o estado e uma orientação ao passageiro |
| **4** | Consulta leituras por ponto, por estado, pelos dois juntos, ou acha a leitura mais próxima de um horário |
| **5** | Mínima, média e máxima por ponto, contagem de estados, ranking dos mais quentes e tabela por período do dia; pode exportar um relatório `.txt` |
| **6** | Calcula a velocidade de aquecimento (°C por hora) e estima em quantos minutos o ponto chega ao próximo limite |
| **7** | Cadastra, edita e remove pontos de ônibus, com confirmação antes de remover |

## 6. Dados e integração com o FIWARE

**Origem dos dados**

| Origem | Caminho | Marcação no arquivo |
|---|---|---|
| Sensor ESP32 do ponto (simulado no Wokwi pela parte de Edge) | ESP32 → MQTT → FIWARE → API → esta aplicação | `"origem": "esp32_fiware"` |
| Leitura digitada | Opção 1 do menu | `"origem": "manual"` |

**Fluxo de atualização**

1. **Ao abrir**, a aplicação faz uma verificação rápida (até 3 s) no último servidor usado.
2. **Servidor ligado:** busca as 6 leituras mais recentes do sensor e **substitui** as anteriores daquele ponto. As leituras digitadas são mantidas.
3. **Servidor desligado:** avisa e trabalha com as **leituras salvas**. O servidor do grupo fica na nuvem e só é ligado nos testes; como o IP muda a cada vez, a opção 2 permite informar o novo IP.

**Endpoints consultados** (padrão FIWARE, cabeçalhos `fiware-service` e `fiware-servicepath`)

| Serviço | Requisição | Para quê |
|---|---|---|
| Orion | `GET :1026/version` | Verificar se o servidor está ligado |
| IoT Agent | `GET :4041/iot/devices/climaponto-p001` | Descobrir a entidade e os nomes dos atributos do sensor |
| STH-Comet | `GET :8666/STH/v1/contextEntities/type/{tipo}/id/{id}/attributes/{atributo}?lastN=6` | Buscar as últimas leituras de temperatura, umidade e média móvel |
| Orion | `GET :1026/v2/entities/{id}?options=keyValues` | Valor atual, usado se o histórico estiver vazio |

**Formato de uma leitura** (o mesmo combinado com o ESP32 e o site)

```json
{
  "ponto_id": "P001",
  "temperatura": 31.6,
  "umidade": 52.0,
  "media_movel": 31.0,
  "estado": "atencao",
  "origem": "esp32_fiware",
  "timestamp": "2026-11-16T22:32:00Z"
}
```

O horário é guardado em UTC, como chega do FIWARE, e exibido no horário de Brasília.

## 7. Regras de negócio e validações

**Classificação do calor**

```python
def classificar_temperatura(temperatura: float, limites: tuple = (30.0, 35.0)) -> str:
    atencao, critico = limites
    if temperatura >= critico:
        return "critico"
    elif temperatura >= atencao:
        return "atencao"
    else:
        return "normal"
```

O estado é sempre **recalculado** pela aplicação, usando a média móvel quando ela existe (como o ESP32 faz), para que nunca fique um estado incoerente com a temperatura.

**Tendência de aquecimento**

```
velocidade (°C/h) = (temperatura da última leitura − temperatura da primeira) ÷ horas entre elas
minutos até o limite = (limite − temperatura atual) ÷ velocidade × 60
```

É a mesma ideia de taxa de variação (derivada) usada na análise matemática do grupo.

**Validações de entrada**

| Entrada | Regra | Se for inválida |
|---|---|---|
| Opção do menu | 0 a 7 | "Opção inválida" e volta ao menu |
| Temperatura | número entre −40 e 80 °C (faixa do sensor DHT22) | Pede de novo, explicando o motivo |
| Umidade | número entre 0 e 100 % | Pede de novo |
| Data e hora | formato `dd/mm/aaaa hh:mm`, não pode estar no futuro | Pede de novo, com exemplo |
| IP do servidor | quatro números de 0 a 255 | Pede de novo, com exemplo |
| Ponto | código ou nome existente; Enter mostra a lista | Avisa e oferece a lista |
| Campos obrigatórios | não podem ficar vazios | "Este campo é obrigatório" |
| Leituras do FIWARE | precisam ter temperatura e umidade dentro da faixa válida | São descartadas |

## 8. Persistência em JSON

| Arquivo | Conteúdo |
|---|---|
| `dados/pontos.json` | Pontos de ônibus (criado na primeira execução com P001, P002 e P003) |
| `dados/leituras.json` | As 6 leituras mais recentes do sensor de cada ponto e as leituras digitadas |
| `dados/config_fiware.json` | Último IP do servidor FIWARE usado |
| `relatorios/*.txt` | Relatórios de estatísticas, quando o usuário pede para salvar |

- **Gravação segura:** o JSON é escrito primeiro em um arquivo temporário e só depois substitui o original, para não ficar pela metade.
- **Arquivo corrompido:** a aplicação **não apaga nada**; guarda uma cópia com o nome `..._corrompido_<data>.json`, avisa o usuário e continua.
- **Arquivo inexistente:** é criado automaticamente.

## 9. Conceitos de programação aplicados

| Conceito | Onde aparece no `main.py` |
|---|---|
| Estruturas de decisão `if/elif/else` | `classificar_temperatura`, validações e mensagens da tendência |
| Estruturas de decisão `match/case` | Menu principal, submenu de consultas e submenu de pontos |
| Repetição `while` | Laço do menu e das entradas com validação (`ler_numero`, `ler_data_hora`, `escolher_ponto`) |
| Repetição `for` | Buscas, estatísticas, painel, matriz e montagem de relatórios |
| Funções com parâmetros e retorno | 39 funções, como `classificar_temperatura(...) -> str` e `calcular_tendencia(...) -> dict` |
| Anotação de tipo e docstring | Em todas as funções |
| Parâmetros posicionais, nomeados e com valor padrão | `ler_texto(mensagem, obrigatorio=False)`, `ordenar(lista, chave, decrescente=True)` |
| Parâmetros arbitrários | `resumo_numerico(*valores)` e `buscar_leituras(leituras, **criterios)` |
| Tratamento de exceções `try/except` | Conversão de números e datas (`ValueError`), arquivos (`OSError`, `JSONDecodeError`) e API (`ConnectionError`, `Timeout`, `HTTPError`), sem `except` genérico |
| Strings | Formatação das telas, validação do IP com `split` e `isdigit`, busca de ponto por nome |
| Listas | Lista de leituras e de pontos, filtros e listas por compreensão |
| Tuplas | `LIMITES`, `FAIXA_TEMPERATURA`, `PERIODOS_DIA` e o par `(ponto, horário)` |
| Dicionários | Cada leitura, cada ponto, contagem de estados e configuração do FIWARE |
| Arquivos de texto | Exportação do relatório de estatísticas (`.txt`) |
| Arquivos JSON | Leitura e gravação de pontos, leituras e configuração |
| Consumo de API | `requests.get` no IoT Agent, STH-Comet e Orion do FIWARE |
| Matrizes | Tabela ponto × período do dia (`matriz_periodos`) |
| Busca linear | `buscar_leituras` e `escolher_ponto` |
| Busca binária | `busca_binaria_horario`: leitura mais próxima de um horário |
| Método de ordenação | `ordenar`: ordenação por inserção, implementada sem `sort` |

## 10. Boas práticas e experiência do usuário

**Boas práticas**

- Código organizado em seções (configurações, regras, arquivos, entradas, buscas, cálculos, API, telas, menu).
- Constantes em maiúsculas no início do arquivo: limites, faixas válidas e caminhos podem ser ajustados em um só lugar.
- Funções pequenas, cada uma com uma responsabilidade, nomes em português e docstring.
- Caminhos relativos à pasta do programa, sem dependência da máquina do aluno.
- Exceções específicas, sem `except` genérico; mensagens que dizem o que fazer.
- Dados de entrada sempre validados antes de entrar no arquivo.

**Experiência do usuário**

- Cada tela tem um título e o menu mostra quantas leituras estão salvas.
- Enter mostra a lista de pontos; o usuário pode digitar código, nome ou número.
- Mensagens de erro explicam o problema e dão um exemplo do formato certo.
- Ação destrutiva (remover ponto) pede confirmação e informa quantas leituras serão apagadas.
- O painel traz uma orientação simples ao passageiro em atenção e em crítico.
- Ctrl+C encerra o programa sem mensagem de erro.

## 11. Exemplos de execução

*Exemplos com leituras de teste.*

**Painel (opção 3)**

```
  PAINEL - ESTADO ATUAL DE CADA PONTO
  P001 Santana       33.4 °C  Atenção  (às 16/11/2026 13:00)  <- calor: procure sombra e água
  P002 Interlagos    36.0 °C  CRÍTICO  (às 16/11/2026 12:00)  <- CALOR FORTE: evite esperar no sol
  P003 Barueri      sem leituras

  Regra: Normal < 30 °C <= Atenção < 35 °C <= Crítico
```

**Tendência (opção 6)**

```
  TENDÊNCIA - O PONTO ESTÁ ESQUENTANDO?
Ponto (código, nome ou Enter para ver a lista): P001
  Últimas 6 leituras, em 15 minutos.
  Agora: 32.3 °C (Atenção)
  Velocidade: +12.40 °C por hora  (taxa = variação da temperatura ÷ tempo)
  -> Esquentando: no ritmo atual, chega a 35 °C (CRÍTICO) em cerca de 13 min.
```

**Abertura com o servidor desligado**

```
Verificando se o sensor do ClimaPonto está online...
  Sensor offline: usando as 6 leituras salvas (a mais recente é de 16/11/2026 19:54).
  Se o servidor foi ligado com outro IP, use a opção 2.
```

## 12. Testes realizados

| # | Cenário | Entrada | Resultado esperado e obtido |
|---|---|---|---|
| 1 | Opção inválida no menu | `x`, `9` | Mensagem de erro e volta ao menu |
| 2 | Temperatura inválida | `abc`, `100` | Pede de novo com o motivo |
| 3 | Umidade fora da faixa | `150` | Pede de novo |
| 4 | Data no futuro | `31/12/2099 10:00` | "A leitura não pode ser no futuro" |
| 5 | Classificação | 26 · 33,4 · 36 °C | normal · atenção · crítico |
| 6 | IP inválido | `1.2.3` | Pede de novo com exemplo |
| 7 | Servidor FIWARE desligado | IP sem resposta | Avisa e usa as leituras salvas, sem travar |
| 8 | Servidor FIWARE ligado (servidor de teste) | 10 leituras disponíveis | Guarda só as 6 mais recentes e substitui as anteriores |
| 9 | JSON corrompido | `leituras.json` com texto inválido | Guarda cópia `_corrompido_`, avisa e continua |
| 10 | Persistência | Registrar, sair e abrir de novo | Leituras continuam salvas |
| 11 | Estatísticas | 28, 32 e 36 °C | Mínima 28, média 32, máxima 36 |
| 12 | Filtro por ponto | Leituras de P001 e P002 | Cada consulta mostra só o ponto escolhido |

## 13. Limitações

- O servidor FIWARE fica na nuvem e só é ligado nos testes do grupo; fora disso, a aplicação usa as leituras salvas.
- As leituras do sensor vêm de uma simulação no Wokwi, não de um ponto de ônibus real.
- Ficam guardadas só as 6 leituras mais recentes do sensor por ponto: o objetivo é mostrar o estado atual e a tendência, não manter um histórico longo.
- Os limites de 30 °C e 35 °C são de demonstração; não medem sensação térmica nem substituem alertas oficiais.

## 14. Equipe e uso de IA

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme De Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

O uso de inteligência artificial no desenvolvimento está documentado em [`prompts.md`](prompts.md).

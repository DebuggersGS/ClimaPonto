<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Disciplina <b>Computational Thinking with Python</b> · Equipe <b>Debuggers</b>
</p>

# ClimaPonto · Central de Leituras

Aplicação em Python, executada no terminal, que **recebe as leituras de temperatura e umidade dos pontos de ônibus**, classifica o calor em *normal*, *atenção* ou *crítico* e transforma esses dados em informação útil: painel do estado atual, consultas, estatísticas, ranking dos pontos mais quentes e tendência de aquecimento.

---

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | ClimaPonto |
| **Cidade / bairro** | São Paulo/SP. Ponto piloto **P001** na região de Santana (Zona Norte); pontos de Interlagos (Zona Sul) e Barueri (Grande São Paulo) também cadastrados |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores |
| **Problema em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um ESP32 com sensor DHT22 no ponto mede temperatura e umidade, classifica o calor em *normal*, *atenção* (≥ 30 °C) ou *crítico* (≥ 35 °C) e alerta no próprio ponto, mesmo sem internet. Quando há rede, envia as leituras por MQTT para a plataforma FIWARE, de onde esta Central de Leituras em Python as busca para mostrar o estado de cada ponto e analisá-las |
| **Papel de cada componente** | ver a tabela da [seção 2](#2-solução-integrada) |
| **Repositório** | https://github.com/DebuggersGS/ClimaPonto-Python |
| **Indicador de impacto** | Horas em atenção e em crítico e graus-hora acima de 30 °C por ponto (calor acumulado a que o passageiro fica exposto). Referência: 331 °C·h no ano em Santana (nov/2025 a out/2026, dados INMET, repositório [ClimaPonto-DPS](https://github.com/DebuggersGS/ClimaPonto-DPS)) |
| **ODS** | **3** Saúde e Bem-Estar (meta 3.d) · **11** Cidades e Comunidades Sustentáveis (meta 11.2) · **13** Ação Contra a Mudança do Clima (meta 13.1), detalhados na [seção 3](#3-impacto-e-contribuição-para-os-ods) |

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

**Onde.** O ponto piloto é o **P001, na região de Santana (Zona Norte de São Paulo)**, que tem o sensor. A aplicação também já traz cadastrados os pontos de Interlagos (Zona Sul) e Barueri (Grande São Paulo), as outras regiões estudadas pelo grupo. Esses dois ainda não têm sensor e recebem **medições de campo**, feitas pela equipe com termômetro portátil, como aconteceria na expansão do projeto.

**Como funciona.** Um **ESP32 com sensor DHT22**, instalado no ponto, mede temperatura e umidade, classifica o calor e alerta no próprio local com LEDs, buzzer e display, mesmo sem internet. Quando há rede, as leituras seguem para a plataforma **FIWARE**, na nuvem. É de lá que **esta aplicação** busca os dados para mostrar o estado de cada ponto e analisá-los.

| Estado | Média da última hora | O que significa para o passageiro |
|---|---|---|
| Normal | abaixo de 30 °C | Espera sem alerta |
| Atenção | de 30 °C a 34,9 °C | Calor: procurar sombra e se hidratar |
| Crítico | 35 °C ou mais | Calor forte: evitar esperar no sol |

**O que esta aplicação faz.** Ela é a **central de operação** dos dados do ClimaPonto e responde a perguntas que o sensor sozinho não responde:

- Qual é o estado de cada ponto agora, considerando a última hora e não um pico isolado?
- Qual ponto é o mais quente? Em que período do dia?
- O ponto está esquentando? Em quanto tempo chega a 30 °C ou a 35 °C?

## 2. Solução integrada

```
[ESP32 + DHT22 no ponto]  --MQTT-->  [FIWARE na nuvem]  --API HTTP-->  [Central de Leituras (Python)]
  mede, classifica e                  IoT Agent, Orion                  guarda, consulta, analisa
  alerta no local                     (atual) e STH-Comet               e mostra o estado dos pontos
                                      (histórico)
```

| Parte | Disciplina | O que faz |
|---|---|---|
| Sensor no ponto (Wokwi) e FIWARE | Edge Computing & Computer Systems | Mede, classifica, alerta no ponto e envia as leituras |
| **Central de Leituras (este repositório)** | **Computational Thinking with Python** | **Busca as leituras na API do FIWARE, guarda, consulta e analisa** |
| Modelagem matemática | Differentiated Problem Solving | Define o intervalo de leitura de 10 min, os horários críticos e a tendência |
| Aplicação web | Front-end Design · Web Development | Mostra os dados ao cidadão e gerencia os pontos |
| Experiência e apresentação | Software & Total Experience Design · Storytelling | Pesquisa com usuários, protótipos e pitch |

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
| Python | **3.10 ou mais novo** (o menu usa `match/case`). Confira com `python --version` |
| Biblioteca `requests` | Usada apenas para consultar a API do FIWARE (opção 2). Sem ela, o resto do programa funciona normalmente |

**Execução**

Abra um terminal **na pasta onde está o `main.py`** e rode:

```bash
pip install requests
python main.py
```

O programa usa caminhos relativos à própria pasta, então funciona em qualquer computador depois de extrair o ZIP. **Não é preciso nenhum arquivo além do `main.py`**: se as pastas de dados não existirem, ele as cria e já começa com uma captura real do sensor (ver seção 8).

**Se o programa não rodar (Windows)**

1. **Entre na pasta antes de rodar.** O nome da pasta tem espaços, então use aspas:

   | Terminal | Comando |
   |---|---|
   | PowerShell ou Prompt de Comando | `cd "C:\Users\SEU_USUARIO\Downloads\ClimaPonto-Python"` e depois `python main.py` |
   | Git Bash | `cd "/c/Users/SEU_USUARIO/Downloads/ClimaPonto-Python"` e depois `python main.py` |

2. **`python` não é reconhecido:** use o inicializador do Windows, `py main.py`. Se também não funcionar, reinstale o Python marcando a opção *Add python.exe to PATH*.
3. **`pip` não é reconhecido** ou aparece `ModuleNotFoundError: No module named 'requests'`: instale pelo mesmo Python que vai rodar o programa, com `python -m pip install requests` (ou `py -m pip install requests`).
4. **Botão Run do VS Code dá `[Errno 22] Invalid argument`** e o caminho aparece com aspas duplicadas (`'"c:/Users/.../main.py"'`): isso acontece quando o terminal padrão do VS Code é o **Git Bash** e a pasta tem espaços no nome. Há duas saídas:
   - **Opção A, rodar pelo comando:** use os comandos do item 1 no próprio terminal.
   - **Opção B, trocar o terminal padrão para PowerShell** (resolve o botão Run de vez):
     1. Pressione `Ctrl+Shift+P` e digite **Terminal: Select Default Profile**. Também dá para clicar na setinha ao lado do **+** do terminal e escolher **Select Default Profile**.
     2. Escolha **PowerShell**.
     3. Feche os terminais abertos no ícone da lixeira.
     4. Clique em **Run** de novo. O programa abre no PowerShell e roda normalmente.

**Estrutura**

```
ClimaPonto-Python/
├── main.py                     # aplicação completa (um único arquivo)
├── README.md
├── prompt.md                   # documentação do uso de IA
├── dados/                      # criada pelo programa
│   ├── pontos.json             # pontos de ônibus
│   ├── leituras.json           # leituras em uso
│   └── config_fiware.json      # último IP do servidor FIWARE
├── backup_dados/               # cópias de cada captura do sensor (o programa só cria, nunca apaga)
└── relatorios/                 # criada quando um relatório .txt é salvo
```

## 5. Funcionalidades

```
========================================================================
  CLIMAPONTO | CENTRAL DE LEITURAS   (7 leituras salvas)
========================================================================
  1 - Registrar medição de campo (pontos sem sensor)
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
| **1** | Registra uma **medição de campo**: a equipe mede com termômetro portátil nos pontos sem sensor, ou quando o sensor está com defeito. Pede ponto, temperatura, umidade, data e hora. Em um ponto que tem sensor, avisa que o certo é usar a opção 2 e pede confirmação |
| **2** | Consulta a API do FIWARE e traz as leituras reais do sensor ESP32 da última hora, uma a cada 10 minutos. Mostra de onde veio a leitura mais recente (histórico ou valor atual), coleta ao vivo quando o histórico está parado e, no fim, lista as leituras do sensor guardadas |
| **3** | Painel com a última leitura de cada ponto: temperatura, **Média 1h**, estado, horário e orientação ao passageiro. Mostra também quanto tempo de dados a Média 1h de cada ponto cobre |
| **4** | Consulta leituras por ponto, por estado, pelos dois juntos, ou acha a leitura mais próxima de um horário |
| **5** | Mínima, média e máxima por ponto, contagem de estados, ranking dos mais quentes e tabela por período do dia; pode exportar um relatório `.txt` |
| **6** | Mostra a variação da temperatura, a velocidade de aquecimento (°C por hora) e em quantos minutos o ponto chega ao próximo limite |
| **7** | Cadastra, edita e remove pontos de ônibus. Na edição, `-` tira o sensor de um ponto; remover pede confirmação |

**Navegação.** Em qualquer pergunta, digitar **`v`** volta ao menu principal, e os submenus têm a opção **0 - Voltar ao menu**. Depois de uma opção válida, o resultado aparece e o menu volta logo abaixo, sem precisar apertar Enter. O "Pressione Enter" só aparece depois de uma opção inválida.

## 6. Dados e integração com o FIWARE

**Origem dos dados**

| Origem | Caminho | Marcação no arquivo | Como aparece na tela |
|---|---|---|---|
| Sensor ESP32 do ponto (simulado no Wokwi pela parte de Edge) | ESP32 → MQTT → FIWARE → API → esta aplicação | `"origem": "esp32_fiware"` | sensor ESP32 (FIWARE) |
| Medição de campo | Opção 1 do menu | `"origem": "manual"` | medição de campo |

**Configuração do FIWARE do grupo**

| Item | Valor |
|---|---|
| Serviço (`fiware-service`) | `climaponto` |
| Caminho (`fiware-servicepath`) | `/` |
| Dispositivo no IoT Agent | `climaponto-p001` |
| Entidade no Orion | `urn:ngsi-ld:ClimaPonto:P001`, tipo `ClimaPontoMonitor` |
| Mensagem do ESP32 (UltraLight, a cada 2 s) | `t\|temperatura\|h\|umidade\|m\|média móvel\|s\|estado` |

O servidor fica na nuvem e só é ligado nos testes do grupo, e o **IP muda a cada vez que ele é ligado**. Por isso só o IP fica salvo (`dados/config_fiware.json`) e a opção 2 permite informar um novo.

**Fluxo de atualização**

1. **Ao abrir**, a aplicação faz uma verificação rápida (até 3 s) no último servidor usado.
2. **Servidor ligado:** atualiza o ponto com sensor pelo histórico, sem esperar. Se o valor atual estiver mais novo que o histórico, avisa para usar a opção 2.
3. **Servidor desligado:** avisa e trabalha com as **leituras salvas**.
4. **Na opção 2:**
   1. A aplicação descobre a entidade do sensor pelo IoT Agent. Se ele não responder, procura a entidade no Orion.
   2. Busca no STH-Comet o histórico da última hora, de 100 em 100 leituras (o limite de cada consulta ao servidor), guarda uma leitura a cada 10 minutos e compara com o horário do valor atual no Orion. As duas datas aparecem na tela.
   3. Se não houver histórico, ou se o Orion estiver mais novo, faz uma **coleta ao vivo** de 6 leituras, uma a cada 5 s. A coleta para sozinha depois de 4 consultas sem leitura nova (o Wokwi parou), e Ctrl+C também interrompe, ficando com o que já chegou.

**Regra de guarda das leituras do sensor (nunca perder leitura boa)**

- As leituras novas são juntadas às salvas, sem repetir horário, e ficam guardadas as da **última hora**, contada a partir da leitura mais nova. São elas que formam a Média 1h.
- Como o ESP32 envia a cada poucos segundos, do histórico fica **uma leitura a cada 10 minutos** (cerca de 6 por hora), o intervalo recomendado pela análise matemática do grupo (Differentiated Problem Solving). Assim a média é calculada sem sobrecarregar o programa e os arquivos com centenas de leituras.
- Quando uma leitura sai, **sai sempre a mais antiga**: ela só é descartada quando chega outra pelo menos 1 hora mais nova.
- Se nada mais novo chegar (servidor desligado, Wokwi parado, erro na API), **nada é alterado**.
- As medições de campo nunca são apagadas por essa regra.
- A cada captura com leituras novas, uma **cópia de segurança** é gravada em `backup_dados/`, com data e hora no nome, sem sobrescrever as anteriores.

**Endpoints consultados** (com os cabeçalhos `fiware-service` e `fiware-servicepath`)

| Serviço | Requisição | Para quê |
|---|---|---|
| Orion | `GET :1026/version` | Verificar se o servidor está ligado |
| IoT Agent | `GET :4041/iot/devices/climaponto-p001` | Descobrir a entidade e os nomes dos atributos do sensor |
| Orion | `GET :1026/v2/entities?options=keyValues` | Plano B: achar a entidade se o IoT Agent não responder |
| STH-Comet | `GET :8666/STH/v1/contextEntities/type/{tipo}/id/{id}/attributes/{atributo}?dateFrom={1h10 antes}&hLimit=100&hOffset=0, 100, 200...` | Histórico da última hora de temperatura, umidade e média móvel, de 100 em 100 leituras |
| Orion | `GET :1026/v2/entities/{id}?options=keyValues` | Valor atual e horário da última leitura, usado na comparação e na coleta ao vivo |

**Formato de uma leitura** (leitura real do sensor, capturada em 16/11/2026 às 23h33)

```json
{
    "ponto_id": "P001",
    "temperatura": 49.8,
    "umidade": 40.0,
    "media_movel": 41.3,
    "estado": "critico",
    "origem": "esp32_fiware",
    "timestamp": "2026-11-17T02:33:01Z",
    "media_1h": 49.8,
    "leituras_1h": 1
}
```

O horário é guardado em **UTC**, como chega do FIWARE, e exibido no **horário de Brasília** (UTC−3) pelas funções `para_brasilia` e `hora_texto`. Por isso a leitura acima, gravada às 02:33 de 17/11 em UTC, aparece na tela como 16/11/2026 23:33. `media_movel` é a média que o próprio ESP32 envia e fica guardada como veio; `media_1h` e `leituras_1h` são calculadas pela aplicação.

## 7. Regras de negócio e validações

**Classificação do calor**

```python
def classificar_temperatura(temperatura: float, limites: tuple = LIMITES) -> str:
    atencao, critico = limites
    if temperatura >= critico:
        return "critico"
    elif temperatura >= atencao:
        return "atencao"
    else:
        return "normal"
```

**Média 1h.** Para cada leitura, a aplicação calcula a média das temperaturas do mesmo ponto nos 60 minutos anteriores a ela, somando sensor e medições de campo. O **estado é classificado por essa média**, e não por uma leitura isolada. Assim, um pico de alguns segundos não muda o estado do ponto sozinho, e várias leituras em sequência não distorcem a média. O painel mostra quanto tempo de dados a Média 1h de cada ponto cobre e avisa quando é menos de uma hora.

**Tendência de aquecimento**

```
variação (°C)       = temperatura da última leitura − temperatura da primeira
velocidade (°C/h)   = variação ÷ horas entre as duas leituras
minutos até limite  = (limite − temperatura atual) ÷ velocidade × 60
```

É a mesma ideia de taxa de variação (derivada) usada na análise matemática do grupo. Quando as leituras cobrem menos de 10 minutos, a aplicação mostra só a variação. Converter poucos segundos em "°C por hora" daria números exagerados, como −4.572 °C/h.

**Validações de entrada**

| Entrada | Regra | Se for inválida |
|---|---|---|
| Opção do menu e dos submenus | 0 a 7 (menu) ou as opções listadas | "Opção inválida", Enter e volta ao menu |
| Temperatura | número entre −40 e 80 °C (faixa do sensor DHT22); aceita vírgula ou ponto | Pede de novo, explicando o motivo |
| Umidade | número entre 0 e 100 % | Pede de novo |
| Data e hora | formato `dd/mm/aaaa hh:mm`, não pode estar no futuro; Enter = agora | Pede de novo, com exemplo |
| IP do servidor | quatro números de 0 a 255 | Pede de novo, com exemplo |
| Ponto | código, nome ou número da lista; Enter mostra a lista | Avisa e oferece a lista |
| Estado na consulta | normal, atenção ou crítico (com ou sem acento) | "Estado inválido" |
| Sim ou não | `s` ou `n` (`v` conta como não) | Pede de novo |
| Campos obrigatórios | não podem ficar vazios | "Este campo é obrigatório" |
| Leituras do FIWARE | precisam ter temperatura e umidade dentro da faixa válida | São descartadas |

## 8. Persistência em JSON

| Arquivo | Conteúdo |
|---|---|
| `dados/pontos.json` | Pontos de ônibus (criado na primeira execução com P001, P002 e P003) |
| `dados/leituras.json` | Leituras do sensor da última hora de cada ponto (uma a cada 10 minutos) e todas as medições de campo |
| `dados/config_fiware.json` | Último IP do servidor FIWARE usado |
| `backup_dados/leituras_climaponto_p001_<data>_<hora>.json` | Cópia de cada captura do sensor com leituras novas |
| `relatorios/estatisticas_<data>_<hora>.txt` | Relatórios de estatísticas, quando o usuário pede para salvar |

Os arquivos são lidos e gravados como no material da disciplina: `os.path.exists` para checar se o arquivo existe, `with open(...)` com `encoding="utf-8"`, `json.load` e `json.dump(dados, arquivo, indent=4, ensure_ascii=False)`.

**De onde vêm as leituras ao abrir o programa**

1. `dados/leituras.json`, o caso normal.
2. Se ele não existir ou estiver vazio: a captura **mais recente** de `backup_dados/`.
3. Se também não houver backup: a **captura real embutida no código** (`CAPTURA_REAL_EMBUTIDA`), com uma hora de leituras do sensor de 18/11/2026 (6 leituras, uma a cada 10 minutos, das 19h18 às 20h11). Assim, quem recebe só o `main.py` e nunca rodou o programa com o servidor ligado vê dados reais.

**Proteção dos dados**

- **Arquivo corrompido:** a aplicação **não apaga nada**. Renomeia o arquivo para `....json.corrompido`, avisa e continua. Se for o de leituras, recupera pelo backup.
- **Falha ao gravar** (arquivo aberto em outro programa, pasta sem permissão): mostra o erro e o programa continua rodando.
- **Arquivo ou pasta inexistente:** é criado automaticamente.

## 9. Conceitos de programação aplicados

O código usa apenas o conteúdo da disciplina (1º e 2º semestres) e a biblioteca `requests` para a API. O módulo `datetime` entra para tratar datas e o fuso de Brasília.

| Conceito | Onde aparece no `main.py` |
|---|---|
| Tipos de dados e *casting* | `float(texto)` nas entradas, `int(...)` nos números de ponto e no IP, `str(...)` no IP salvo |
| Operadores relacionais e lógicos | Validação de faixas (`minimo <= valor <= maximo`), regras de guarda (`and`, `or`, `not`) |
| Estruturas de decisão `if/elif/else` | `classificar_temperatura`, validações e mensagens da tendência |
| Estrutura de seleção `match/case` | Menu principal, submenu de consultas e submenu de pontos |
| Repetição `while` | Laço do menu, entradas com validação e coleta ao vivo |
| Repetição `for` | Buscas, Média 1h, estatísticas, painel, matriz e relatórios |
| Funções (subalgoritmos) | 54 funções, todas com **anotação de tipo e docstring**, como `classificar_temperatura(...) -> str` e `calcular_tendencia(...) -> dict \| None` |
| Parâmetros posicionais, nomeados e default | `ler_texto(mensagem, obrigatorio=False)`, `ordenar(lista, chave, decrescente=True)`, `sincronizar(..., ao_vivo=False)` |
| Parâmetros arbitrários | `resumo_numerico(*valores)`, `nome_do_atributo(chaves, *apelidos)` e `buscar_leituras(leituras, **criterios)` |
| Tratamento de exceções | `ValueError` (números, datas, JSON), `OSError` (arquivos), erros do `requests` (`ConnectionError`, `Timeout`, `HTTPError`), `KeyboardInterrupt` e `EOFError`, sem `except` genérico |
| Strings | Formatação das telas em colunas, validação do IP com `split` e `isdigit`, busca de ponto por nome |
| Listas | Leituras e pontos, filtros com `for` + `append`, `clear` e `extend` na troca das leituras do sensor |
| Tuplas | `LIMITES`, `FAIXA_TEMPERATURA`, `PERIODOS_DIA`, `CAPTURA_REAL_EMBUTIDA` e retorno de `resumo_numerico` |
| Dicionários | Cada leitura e cada ponto, contagem de estados, configuração do FIWARE e junção de leituras por horário |
| Arquivos de texto | Exportação do relatório de estatísticas (`.txt`) |
| Arquivos JSON | Leitura e gravação de pontos, leituras, configuração e backups |
| Consumo de API | `requests.get` no IoT Agent, Orion e STH-Comet do FIWARE |
| Matrizes | Tabela ponto × período do dia (`matriz_periodos`) |
| Busca linear | `buscar_leituras`, `escolher_ponto` e `procurar_no_orion` (com pontuação) |
| Busca binária | `busca_binaria_horario`: leitura mais próxima de um horário |
| Método de ordenação | `ordenar`: ordenação por inserção, implementada sem `sort` |
| Biblioteca `os` | `os.path.exists`, `os.path.join`, `os.mkdir`, `os.listdir` e `os.rename` para pastas, backups e arquivos corrompidos |

## 10. Boas práticas e experiência do usuário

**Boas práticas**

- Código organizado em seções: configurações, regras, arquivos, entradas, buscas, cálculos, API, telas e menu.
- Constantes em maiúsculas no início do arquivo: limites, faixas válidas, janela da média, intervalo da coleta e caminhos podem ser ajustados em um só lugar.
- Funções pequenas, cada uma com uma responsabilidade, nomes em português, anotação de tipo e docstring.
- Caminhos relativos à pasta do programa, sem dependência da máquina do aluno.
- Exceções específicas, sem `except` genérico; mensagens que dizem o que fazer.
- Dados de entrada sempre validados antes de entrar no arquivo.
- Nenhuma operação automática apaga leitura boa: arquivos corrompidos são renomeados, e as leituras do sensor só saem quando chega outra mais nova.

**Experiência do usuário**

- Cada tela tem um título, e cada parte da tela tem um subtítulo (`--- Consulta ao FIWARE ---`, `--- Ranking ... ---`).
- Tabelas com cabeçalho e colunas alinhadas; o menu mostra quantas leituras estão salvas.
- `v` volta ao menu de qualquer pergunta; Enter só é pedido depois de uma opção inválida.
- Enter mostra a lista de pontos; o usuário pode digitar código, nome ou número.
- Mensagens de erro explicam o problema e dão um exemplo do formato certo.
- Ação destrutiva (remover ponto) pede confirmação e informa quantas leituras serão apagadas; a edição cancelada com `v` não altera nada.
- O painel traz uma orientação simples ao passageiro e explica a regra de classificação.
- Ctrl+C encerra o programa sem mensagem de erro.

## 11. Exemplos de execução

*Os exemplos abaixo foram executados com as leituras reais do sensor capturadas em 16/11/2026 e uma medição de campo no P002; o último usa a hora completa de leituras reais de 18/11/2026.*

**Abertura com o servidor ligado** (execução de 17/11/2026, servidor do grupo na AWS)

```
Verificando se o sensor do ClimaPonto está online...
  Servidor FIWARE ligado (34.224.168.227). Atualizando as leituras...
  Dispositivo climaponto-p001 -> entidade urn:ngsi-ld:ClimaPonto:P001
  Última leitura no histórico (STH-Comet): 16/11/2026 23:36
  Última leitura no valor atual (Orion):   16/11/2026 23:36
  P001: nenhuma leitura mais nova que as salvas. Nada foi alterado.
```

**Abertura com o servidor desligado**

```
Verificando se o sensor do ClimaPonto está online...
  Sensor offline: usando as 6 leituras salvas (a mais recente é de 16/11/2026 23:33).
  Se o servidor foi ligado com outro IP, use a opção 2.
```

**Medição de campo (opção 1)**

```
  --- Medição de campo registrada ---
  Data e hora       Ponto     Temp.  Umidade  Média 1h   Estado   Origem
  ----------------------------------------------------------------------------------
  17/11/2026 00:30  P002    31.5 °C   55.0 %   31.5 °C   Atenção  medição de campo
```

**Painel (opção 3)**

```
  Ponto                 Temp.  Média 1h   Estado   Última leitura    Orientação
  --------------------------------------------------------------------------------------------
  P001 Santana        24.4 °C   30.5 °C   Atenção  16/11/2026 23:33  Calor: procure sombra e água
  P002 Interlagos     31.5 °C   31.5 °C   Atenção  17/11/2026 00:30  Calor: procure sombra e água
  P003 Barueri              -         -   -        sem leituras      -

  --- Regra de classificação ---
  Normal: abaixo de 30 °C | Atenção: de 30 °C | Crítico: de 35 °C
  O estado é calculado pela média da última hora (Média 1h), não por uma leitura isolada.

  --- Quanto da última hora a Média 1h cobre ---
  P001 Santana      6 leitura(s) em 20 s  (menos de 1 hora de dados: a média fica completa com o sensor ligado por 1 hora)
  P002 Interlagos   1 leitura(s) em 0 s  (menos de 1 hora de dados: a média fica completa com o sensor ligado por 1 hora)
```

O P001 mostra 24,4 °C agora, mas está em **Atenção**: a temperatura caiu de 49,8 °C para 24,4 °C em 20 segundos, e a média do período (30,5 °C) ainda está acima de 30 °C.

**Consulta por ponto (opção 4)**

```
  --- Leituras encontradas ---
  Data e hora       Ponto     Temp.  Umidade  Média 1h   Estado   Origem
  ----------------------------------------------------------------------------------
  16/11/2026 23:33  P001    24.4 °C   40.0 %   30.5 °C   Atenção  sensor ESP32 (FIWARE)
  16/11/2026 23:33  P001    24.4 °C   40.0 %   31.7 °C   Atenção  sensor ESP32 (FIWARE)
  16/11/2026 23:33  P001    24.4 °C   40.0 %   33.5 °C   Atenção  sensor ESP32 (FIWARE)
  16/11/2026 23:33  P001    24.4 °C   40.0 %   36.6 °C   CRÍTICO  sensor ESP32 (FIWARE)
  16/11/2026 23:33  P001    35.6 °C   40.0 %   42.7 °C   CRÍTICO  sensor ESP32 (FIWARE)
  16/11/2026 23:33  P001    49.8 °C   40.0 %   49.8 °C   CRÍTICO  sensor ESP32 (FIWARE)
```

**Tendência (opção 6)**

```
  --- Resultado para P001 Santana ---
  Últimas 6 leituras, em 20 segundos.
  Agora: 24.4 °C (Atenção)
  Variação: -25.4 °C em 20 segundos
  (intervalo curto: a velocidade em °C por hora não é mostrada para não exagerar a tendência)
  -> O ponto está esfriando.
```

**Painel com uma hora completa de leituras** (trecho; leituras reais de 18/11/2026, das 19h18 às 20h11, uma a cada 10 minutos, baixadas do histórico do FIWARE do grupo)

```
  Ponto                 Temp.  Média 1h   Estado   Última leitura    Orientação
  --------------------------------------------------------------------------------------------
  P001 Santana        21.8 °C   22.1 °C   Normal   18/11/2026 20:11  Espera sem alerta
  P002 Interlagos           -         -   -        sem leituras      -
  P003 Barueri              -         -   -        sem leituras      -

  --- Quanto da última hora a Média 1h cobre ---
  P001 Santana      6 leitura(s) em 52 min
```

Com uma hora de dados, a Média 1h deixa de cobrir segundos e o aviso de "menos de 1 hora" some.

## 12. Testes realizados

**Testes com o sensor real (FIWARE e Wokwi do grupo)**

| Data | O que foi testado | Resultado |
|---|---|---|
| 10/11/2026 | Primeira captura pela opção 2 | 6 leituras reais de 37,6 °C, estado crítico |
| 16/11/2026, 23h33 | Temperatura alterada no Wokwi e busca pela opção 2 | 6 leituras de 49,8 °C a 24,4 °C, com o estado acompanhando a média |
| 18/11/2026, 19h11 às 20h11 | Wokwi ligado por mais de uma hora, com a temperatura ajustada pela previsão do tempo para Santana naquele horário; histórico do STH-Comet buscado de 100 em 100 | 6 leituras, uma a cada 10 minutos, de 22,3 °C a 21,8 °C e umidade de 75,5 % a 89 %; Média 1h de 22,1 °C cobrindo 52 minutos |
| 17/11/2026 | Abertura com o servidor ligado, sem leituras novas | Entidade encontrada, diagnóstico STH × Orion na tela e nada alterado |

**Bateria de QA** (18 casos automatizados, que rodam o `main.py` com entradas simuladas e conferem a tela e os arquivos; um servidor FIWARE de teste simula o IoT Agent, o Orion e o STH-Comet)

| Caso | Cenário | Resultado esperado e obtido |
|---|---|---|
| QA01 | Pasta só com o `main.py` | Carrega a captura real embutida e cria os arquivos |
| QA02 | Sem leituras, com 3 backups (um corrompido) | Recupera o backup mais novo e ignora o corrompido |
| QA03 | `leituras.json` corrompido | Arquivo guardado como `.corrompido`, nada perdido |
| QA04 | Menu com `9`, `abc` e vazio | "Opção inválida" nas três, volta ao menu |
| QA05 | Medição de campo com `abc`, `100`, `31,5`, `-1`, data inválida e data futura | Recusa cada valor inválido com o motivo; aceita a vírgula; `v` no meio não salva nada |
| QA06 | Medição de campo no P001 (tem sensor), respondendo `n` | Avisa para usar a opção 2 e não registra |
| QA07 | Consultas por nome, por estado com acento (`crítico`), estado inválido, ponto + estado, horário antes da primeira e depois da última leitura | Resultados corretos nas duas pontas da busca binária |
| QA08 | Estatísticas salvando (`s`) e não salvando (`v`) | Gera exatamente um `.txt` |
| QA09 | Tendência com 1 leitura e com as leituras reais | Avisa que precisa de 2 leituras; mostra −25,4 °C |
| QA10 | Cadastrar, editar cancelando com `v`, tirar sensor com `-`, remover com `n` e com `s` | Cadastra P004; a edição cancelada não altera nada; o `-` tira o sensor; remove só com `s` |
| QA11 | Servidor FIWARE desligado | Mensagem clara; as 6 leituras salvas continuam |
| QA12 | IP `999.1.1.1`, `abc` e `1.2.3` | Os três recusados |
| QA13 | FIWARE simulado com leituras novas e, depois, sem novidade | Entram as novas e o backup é criado; na segunda vez, nada muda |
| QA14 | Fim da entrada (Ctrl+D ou Ctrl+Z) | "Programa encerrado", sem erro |
| QA15 | Sem a biblioteca `requests` | A opção 2 orienta `pip install requests`; o resto funciona |
| QA16 | Arquivo de leituras bloqueado para gravação | Mostra o erro e o programa continua |
| QA17 | Média 1h com medições às 13h00, 13h40 e 14h30 | 32,5 °C às 13h40 (entra a das 13h00) e 33,5 °C às 14h30 (sai a das 13h00) |
| QA18 | Formato do JSON gravado | `indent=4`, válido e com acentos legíveis |

Resultado: **18 de 18 casos passaram**. Também foi conferido que o botão Run do VS Code funciona com o terminal padrão em PowerShell (seção 4).

## 13. Limitações

- O servidor FIWARE fica na nuvem e só é ligado nos testes do grupo; fora disso, a aplicação usa as leituras salvas.
- As leituras do sensor vêm de uma simulação no Wokwi, não de um ponto de ônibus real.
- A **Média 1h** só fica completa quando o sensor fica ligado por pelo menos uma hora. Na captura de 18/11/2026, ela cobriu 52 minutos (6 leituras, uma a cada 10 minutos); com capturas mais curtas, o painel avisa quanto tempo a média cobre.
- Do sensor, fica guardada uma leitura a cada 10 minutos da última hora (o histórico completo fica no FIWARE e nos backups), porque o objetivo é mostrar o estado atual e a tendência.
- Os limites de 30 °C e 35 °C são de demonstração; não medem sensação térmica nem substituem alertas oficiais.

## 14. Equipe e uso de IA

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme De Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

O uso de inteligência artificial no desenvolvimento está documentado em [`prompt.md`](prompt.md).

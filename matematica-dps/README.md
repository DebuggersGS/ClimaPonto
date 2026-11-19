<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/climaponto_logo_dark.png">
    <img src="assets/climaponto_logo.png" alt="ClimaPonto - Monitoramento de calor nos pontos de ônibus" width="460">
  </picture>
</p>

<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Disciplina <b>Differentiated Problem Solving</b> · Equipe <b>Debuggers</b>
</p>

---

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | ClimaPonto |
| **Cidade / bairro** | São Paulo/SP. Ponto piloto **P001** em Santana (Zona Norte), na região da estação INMET A701 Mirante de Santana |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores |
| **Problema em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um ESP32 com sensor DHT22 no ponto mede temperatura e umidade, classifica o calor em *normal*, *atenção* (≥ 30 °C) ou *crítico* (≥ 35 °C) e alerta no próprio ponto, mesmo sem internet. Quando há rede, envia as leituras por MQTT para a plataforma FIWARE, consultada pela Central de Leituras em Python, cujas leituras alimentam a aplicação web pelo Supabase. A análise matemática (este repositório) define a frequência de leitura recomendada (10 min), os horários críticos e a tendência de aquecimento |
| **Papel de cada componente** | ver tabela abaixo |
| **Repositório** | https://github.com/DebuggersGS/ClimaPonto (pasta [`matematica-dps/`](https://github.com/DebuggersGS/ClimaPonto/tree/main/matematica-dps)) |
| **Indicador de impacto** | Graus-hora acima de 30 °C por ponto (calor acumulado a que o passageiro fica exposto) e horas com alerta informado. Referência medida: 331 °C·h no ano em Santana (nov/2025 a out/2026, dados INMET) |
| **ODS** | **3 Saúde e Bem-Estar** (meta 3.d: alerta precoce de riscos à saúde, com o aviso de calor no ponto) · **11 Cidades e Comunidades Sustentáveis** (meta 11.2: transporte público seguro e acessível, protegendo quem espera o ônibus) · **13 Ação Contra a Mudança do Clima** (meta 13.1: adaptação ao calor, medindo o calor acumulado e os meses mais críticos) |

## Solução integrada

```
[ESP32 + DHT22 no ponto]
   │  classifica e alerta no local (LEDs, buzzer e LCD), mesmo sem internet
   │
   └──(MQTT)──> [FIWARE: IoT Agent → Orion (dado atual) → STH-Comet (histórico)]
                                   │
                                   └──> [Central de Leituras em Python] ──(leituras importadas)──> [Supabase] ──> [Aplicação web ClimaPonto]

[INMET - dados históricos oficiais] ──(robô mensal)──> dados/inmet_sp.json
                                   │
                                   └──> [Análise matemática (esta pasta): limites, derivadas, integrais]
                                          define a frequência de leitura recomendada (10 min),
                                          os horários críticos e a regra de tendência usados pelo sensor e pelo painel
```

| Componente | Disciplina |
|---|---|
| Sensor ESP32 (Wokwi): leitura, classificação local, sinais | Edge Computing & Computer Systems |
| Painel web com CRUD de pontos | Front-end Design · Web Development |
| Programa de operação (cadastro e consulta de leituras) | Computational Thinking with Python |
| **Modelagem matemática (limites, derivadas, integrais)** | **Differentiated Problem Solving** |
| UX, requisitos, protótipos e pitch | Software & Total Experience Design · Storytelling |

Esta pasta contém a parte de **Differentiated Problem Solving** (código em `matematica/`). As demais partes ficam nas outras pastas deste repositório, descritas no [README principal](../README.md).

## Relatório técnico

O relatório técnico em PDF (normas ABNT), com a descrição do problema, o modelo, as análises de limites, derivadas e integrais e a interpretação dos resultados, está em [`relatorio/ClimaPonto_Relatorio_Differentiated_Problem_Solving.pdf`](relatorio/ClimaPonto_Relatorio_Differentiated_Problem_Solving.pdf). Ele é entregue no Portal junto com o código `matematica/climaponto_modelagem.py`.

## Dados

- **Fonte:** medições reais das estações automáticas do **INMET** ([dados históricos](https://portal.inmet.gov.br/dadoshistoricos)), convertidas de UTC para o horário de Brasília.
- **Estações de referência:** A701 Mirante de Santana (P001), A771 Interlagos (P002), A755 Barueri (P003).
- **Atualização automática:** o robô [`atualizar_dados.yml`](../.github/workflows/atualizar_dados.yml) roda todo dia 3, baixa os arquivos oficiais do INMET (grandes, com todas as estações do país) nos servidores do GitHub e publica só as 3 estações em [`dados/inmet_sp.json`](dados/inmet_sp.json) (~230 KB).
- **No programa:** baixa esse JSON leve do GitHub em segundos. Se o GitHub falhar, baixa direto do portal do INMET (reserva). Guarda uma cópia em `dados_cache` para rodar sem internet nas próximas vezes.
- **Falhas do INMET:** a estação de Barueri ficou sem dados em vários meses de 2026. O programa detecta e usa automaticamente os 12 meses completos mais recentes com dados suficientes.
- **Sensor ESP32:** as leituras do sensor no programa de matemática são de **demonstração** (`"origem": "simulacao_esp32"`), no mesmo formato de leitura da solução, porque o servidor FIWARE só fica ligado durante os testes do grupo. As leituras reais do ESP32 chegam por MQTT ao FIWARE e são consultadas pela Central de Leituras em Python (pasta [`python/`](../python/)).

## Como rodar a modelagem matemática

Requisito: **Python 3.10 ou mais novo**, com internet na primeira execução.

```bash
pip install numpy sympy matplotlib
python matematica/climaponto_modelagem.py
```

| No menu | O que faz |
|---|---|
| **1** | Escolhe o ponto de ônibus: digite número, código ou nome, ou dê Enter para ver a lista |
| **2** | Troca o período: últimos 12 meses ou período do relatório. Se o ponto não tiver dados suficientes, o programa explica e usa os 12 meses completos mais recentes |
| **3** | Sensor ESP32: temperatura agora, estado do ponto e tendência |
| **4** | Dados reais: com que frequência passa de 30 °C e de 35 °C? |
| **5** | Modelo e limites: de quanto em quanto tempo o sensor deve medir? |
| **6** | Derivadas: quando o calor sobe, chega ao pico e desce? |
| **7** | Integrais: quanto calor se acumula? |

Cada análise responde a uma pergunta em linguagem simples, com tabelas e um resumo final, abre os gráficos e depois pergunta se você quer salvá-los em `matematica/figuras`. As fórmulas e o passo a passo ficam no relatório.

> Os dados são baixados automaticamente do repositório na primeira vez e ficam guardados em `matematica/dados_cache`. Nas próximas vezes, o programa roda até sem internet.

### Se o programa não rodar (Windows)

1. **Rode a partir da pasta `matematica-dps`** (a que tem as pastas `matematica/` e `dados/`):

   | Terminal | Comandos |
   |---|---|
   | PowerShell ou Prompt de Comando | `cd "C:\Users\SEU_USUARIO\Downloads\ClimaPonto\matematica-dps"` e depois `python matematica/climaponto_modelagem.py` |
   | Git Bash | `cd "/c/Users/SEU_USUARIO/Downloads/ClimaPonto/matematica-dps"` e depois `python matematica/climaponto_modelagem.py` |

   As aspas no `cd` são necessárias quando o caminho tem espaços.

2. **`python` não é reconhecido:** use o inicializador do Windows, `py matematica/climaponto_modelagem.py`. Se também não funcionar, reinstale o Python marcando a opção *Add python.exe to PATH*.
3. **`pip` não é reconhecido** ou aparece `ModuleNotFoundError` (por exemplo, `No module named 'numpy'`): instale as bibliotecas pelo mesmo Python que vai rodar o programa, com `python -m pip install numpy sympy matplotlib` (ou `py -m pip install numpy sympy matplotlib`).
4. **Botão Run do VS Code dá `[Errno 22] Invalid argument`** e o caminho aparece com aspas duplicadas (`'"c:/Users/.../climaponto_modelagem.py"'`): isso acontece quando o terminal padrão do VS Code é o **Git Bash** e o caminho da pasta tem espaços. Há duas saídas:
   - **Opção A, rodar pelo comando:** use os comandos do item 1 no próprio terminal.
   - **Opção B, trocar o terminal padrão para PowerShell** (resolve o botão Run de vez; o programa roda normalmente no PowerShell, inclusive os gráficos):
     1. Pressione `Ctrl+Shift+P` e digite **Terminal: Select Default Profile**. Também dá para clicar na setinha ao lado do **+** do terminal e escolher **Select Default Profile**.
     2. Escolha **PowerShell**.
     3. Feche os terminais abertos no ícone da lixeira.
     4. Abra o arquivo `matematica/climaponto_modelagem.py` e clique em **Run**.

## Testes

```bash
python -m unittest discover -s testes -v
```

51 testes automatizados cobrem regras de estado, validação de dados, falta de internet, arquivos corrompidos, entradas inválidas no menu, Ctrl+C, terminal do Windows, matemática (reproduz os números do relatório) e o robô de atualização.

## Equipe Debuggers

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme De Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

## Uso de inteligência artificial

O grupo usou IA como copiloto, como o edital permite. Na parte de matemática, o assistente Claude (Anthropic) apoiou a escolha do modelo, a escrita do código, os gráficos e a redação do relatório. Todos os resultados são gerados pelo código a partir dos dados reais do INMET e foram conferidos por métodos independentes.

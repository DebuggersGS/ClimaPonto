<p align="center">
  <img src="assets/climaponto_logo.svg" alt="ClimaPonto - Monitoramento de calor nos pontos de ônibus" width="560">
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
| **Cidade / bairro** | São Paulo/SP. Ponto piloto **P001** na região de Santana (Zona Norte), endereço exato a confirmar |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores |
| **Problema em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um sensor ESP32 no ponto mede temperatura e umidade a cada 10 min, classifica o calor em *normal*, *atenção* (≥ 30 °C) ou *crítico* (≥ 35 °C), aciona sinais locais e envia as leituras para um painel web; a análise matemática define a frequência de leitura, os horários críticos e a tendência de aquecimento |
| **Papel de cada componente** | ver tabela abaixo |
| **Repositório** | https://github.com/DebuggersGS/ClimaPonto-DPS |
| **Indicador de impacto** | Graus-hora acima de 30 °C por ponto (calor acumulado a que o passageiro fica exposto) e horas com alerta informado. Referência medida: 331 °C·h no ano em Santana (nov/2025 a out/2026, dados INMET) |
| **ODS** | 3 Saúde e Bem-Estar · 11 Cidades e Comunidades Sustentáveis · 13 Ação Contra a Mudança do Clima |

## Solução integrada

```
[ESP32 + DHT22 no ponto]  ──(JSON a cada 10 min)──>  [API ClimaPonto]  ──>  [Painel web]
   classifica localmente                                   │
   LEDs/buzzer sem internet                                ▼
                                          [Análise em Python: limites, derivadas, integrais]
                                                   ▲
[INMET - dados históricos oficiais] ──(robô mensal)── dados/inmet_sp.json
```

| Componente | Disciplina | Responsável |
|---|---|---|
| Sensor ESP32 (Wokwi): leitura, classificação local, sinais | Edge Computing & Computer Systems | Vinícius |
| Painel web com CRUD de pontos | Front-end Design · Web Development | Enrico |
| Programa de operação (cadastro e consulta de leituras) | Computational Thinking with Python | Guilherme |
| **Modelagem matemática (limites, derivadas, integrais)** | **Differentiated Problem Solving** | **Guilherme** |
| UX, requisitos, protótipos e pitch | Software & Total Experience Design · Storytelling | Vinícius |

Este repositório contém a parte de **Differentiated Problem Solving** (pasta `matematica/`). As demais partes ficam nos repositórios de cada disciplina, na organização DebuggersGS.

## Dados

- **Fonte:** medições reais das estações automáticas do **INMET** ([dados históricos](https://portal.inmet.gov.br/dadoshistoricos)), convertidas de UTC para o horário de Brasília.
- **Estações de referência:** A701 Mirante de Santana (P001), A771 Interlagos (P002), A755 Barueri (P003).
- **Atualização automática:** o robô [`atualizar_dados.yml`](.github/workflows/atualizar_dados.yml) roda todo dia 3, baixa os arquivos oficiais do INMET (grandes, com todas as estações do país) nos servidores do GitHub e publica só as 3 estações em [`dados/inmet_sp.json`](dados/inmet_sp.json) (~230 KB).
- **No programa:** baixa esse JSON leve do GitHub em segundos. Se o GitHub falhar, baixa direto do portal do INMET (reserva). Guarda uma cópia em `dados_cache` para rodar sem internet nas próximas vezes.
- **Falhas do INMET:** a estação de Barueri ficou sem dados em vários meses de 2026. O programa detecta e usa automaticamente os 12 meses completos mais recentes com dados suficientes.
- **Sensor ESP32:** nesta versão, as leituras do sensor no programa de matemática são de **demonstração** (`"origem": "simulacao_esp32"`), no mesmo formato JSON que o ESP32 vai enviar.

## Como rodar a modelagem matemática

Requisito: **Python 3.10 ou mais novo**, com internet na primeira execução.

```bash
pip install numpy sympy matplotlib
python matematica/climaponto_modelagem.py
```

| No menu | O que faz |
|---|---|
| **1** | Escolhe o ponto de ônibus: digite número, código ou nome, ou dê Enter para ver a lista |
| **2** | Alterna o período: últimos 12 meses ou período do relatório |
| **3** | Mostra a leitura do sensor ESP32, o estado do ponto e a tendência |
| **4 a 6** | Modelo e limites, derivadas e integrais |
| **7** | Roda tudo e abre os gráficos (também salvos em `matematica/figuras`) |

> Os dados são baixados automaticamente do repositório na primeira vez e ficam guardados em `matematica/dados_cache`. Nas próximas vezes, o programa roda até sem internet.

## Testes

```bash
python -m unittest discover -s testes -v
```

50 testes automatizados cobrem regras de estado, validação de dados, falta de internet, arquivos corrompidos, entradas inválidas no menu, Ctrl+C, terminal do Windows, matemática (reproduz os números do relatório) e o robô de atualização.

## Equipe Debuggers

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme de Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

## Uso de inteligência artificial

O grupo usou IA como copiloto, como o edital permite. Na parte de matemática, o assistente Claude (Anthropic) apoiou a escolha do modelo, a escrita do código, os gráficos e a redação do relatório. Todos os resultados são gerados pelo código a partir dos dados reais do INMET e foram conferidos por métodos independentes.

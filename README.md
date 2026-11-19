<p align="center">
  <img src="assets/climaponto_logo.svg" alt="ClimaPonto - Monitoramento de calor nos pontos de ônibus" width="560">
</p>

<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Equipe <b>Debuggers</b> · Repositório oficial com todas as partes do projeto
</p>

---

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome da CitizenTech** | ClimaPonto |
| **Cidade e bairro** | São Paulo/SP. Ponto piloto **P001 em Santana** (Zona Norte), que tem o sensor, mais **P002 Interlagos** (Zona Sul) e **P003 Barueri** (Grande São Paulo). Cada ponto usa como referência a estação do INMET da sua região (A701 Mirante de Santana, A771 Interlagos e A755 Barueri) |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores que dependem do transporte público |
| **Problema, em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um ESP32 com sensor DHT22 no ponto mede temperatura e umidade, classifica o calor em *normal* (abaixo de 30 °C), *atenção* (30 °C a 34,9 °C) ou *crítico* (35 °C ou mais) e alerta no próprio ponto com LEDs, buzzer e display, mesmo sem internet. Com rede, envia as leituras por MQTT para a plataforma FIWARE, de onde a Central de Leituras em Python as busca e analisa. A aplicação web mostra mapa, estado, histórico e alertas e faz o cadastro dos pontos no Supabase. A análise matemática, com dados reais do INMET, define a frequência de leitura recomendada (10 minutos), os horários críticos e a tendência de aquecimento |
| **O que cada parte faz** | ver [Mapa do repositório](#mapa-do-repositório) |
| **Link do repositório** | https://github.com/DebuggersGS/ClimaPonto |
| **Indicador de impacto** | Graus-hora acima de 30 °C por ponto, ou seja, o calor acumulado a que o passageiro fica exposto. Referência medida: **331 °C·h** em 12 meses na estação de Santana (nov/2025 a out/2026, dados INMET) |
| **ODS conectados** | **3** Saúde e Bem-Estar (meta 3.d, alerta precoce de risco à saúde) · **11** Cidades e Comunidades Sustentáveis (meta 11.2, transporte público seguro) · **13** Ação Contra a Mudança do Clima (meta 13.1, adaptação ao calor) |

## Como as partes se conectam

```
[ESP32 + DHT22 no ponto (Wokwi)]                          → edge-computing/
   │  mede, suaviza, classifica e alerta no local, mesmo sem internet
   │
   └──(MQTT)──> [FIWARE na AWS: IoT Agent → Orion (dado atual) → STH-Comet (histórico)]
                         │
                         └──(API HTTP)──> [Central de Leituras em Python]    → python/
                                                │  leituras importadas
                                                ▼
                                [Supabase] ──> [Aplicação web ClimaPonto]   → front-end-web/

[INMET, dados históricos oficiais] ──> [Análise matemática]                 → matematica-dps/
        limites, derivadas e integrais: intervalo de leitura de 10 min, horários críticos e tendência

[Pesquisa com passageiros, requisitos e protótipo]                          → total-experience/

[Pitch de 3 minutos, arquétipo e plataforma de marca]                       → storytelling/
```

## Mapa do repositório

| Pasta | Disciplina | Responsável | O que tem |
|---|---|---|---|
| [`edge-computing/`](edge-computing/) | Edge Computing & Computer Systems | Vinícius | Código do ESP32, circuito do Wokwi e vídeo da simulação |
| [`python/`](python/) | Computational Thinking with Python | Guilherme | Central de Leituras: busca as leituras do sensor no FIWARE, guarda em JSON e calcula a Média 1h, as estatísticas e a tendência |
| [`matematica-dps/`](matematica-dps/) | Differentiated Problem Solving | Guilherme | Modelagem com limites, derivadas e integrais sobre os dados do INMET, testes e relatório técnico em PDF |
| [`front-end-web/`](front-end-web/) | Front-end Design · Web Development | Enrico | Aplicação React + Vite + Tailwind com mapa, histórico, alertas e CRUD de pontos no Supabase |
| [`total-experience/`](total-experience/) | Software & Total Experience Design | Vinícius | Apresentação com problema, escopo, requisitos, caso de uso, protótipo e roadmap |
| [`storytelling/`](storytelling/) | Storytelling & Inspiração Empreendedora | Vinícius | Videopitch, e-mail ao investidor com o arquétipo da marca (missão, visão, valores e objetivos) e slides do pitch |
| [`assets/`](assets/) | Todas | Equipe | Logo do ClimaPonto |

Cada pasta tem o próprio `README.md`, com a explicação completa e o passo a passo de execução daquela parte.

## Links das entregas

| Entrega | Link |
|---|---|
| Aplicação web publicada | https://climaponto.vercel.app |
| Simulação do ESP32 no Wokwi | https://wokwi.com/projects/480316994502816769 |
| Vídeo de Edge Computing | https://youtu.be/46aChij6YnE |
| Pitch (Storytelling & Inspiração Empreendedora) | https://youtu.be/HLrAQ7t6M1k |

## Como executar cada parte

| Parte | Requisitos | Comando (a partir da pasta indicada) |
|---|---|---|
| Sensor ESP32 | Navegador | Abrir o link do Wokwi e clicar em **Play** |
| Central de Leituras | Python 3.10+ e `pip install requests` | `cd python` e `python main.py` |
| Análise matemática | Python 3.10+ e `pip install numpy sympy matplotlib` | `cd matematica-dps` e `python matematica/climaponto_modelagem.py` |
| Aplicação web | Node.js 20.19+ ou 22.12+ | `cd front-end-web/web`, `npm install` e `npm run dev` |

A Central de Leituras e a aplicação web funcionam mesmo com o servidor FIWARE desligado: a primeira usa as leituras reais já salvas, e a segunda tem um modo com dados demonstrativos.

## Dados e privacidade

- **Sensor:** leituras do ESP32 simulado no Wokwi, enviadas de verdade ao FIWARE do grupo (`"origem": "simulacao_wokwi"`).
- **Clima:** medições reais das estações automáticas do INMET.
- **Pesquisa:** conversa com passageiros feita pelo grupo, sem nomes.
- Nenhum dado pessoal real é guardado em nenhuma parte do projeto.

## Equipe Debuggers

| Integrante | RM | Partes |
|---|---|---|
| Enrico Vieira de Almeida Vidal | 569217 | Front-end Design · Web Development |
| Guilherme De Rosa Peres | 569193 | Computational Thinking with Python · Differentiated Problem Solving |
| Vinícius Fuentes Cavalcanti | 570818 | Edge Computing · Software & Total Experience Design · Storytelling |

## Uso de inteligência artificial

O grupo usou IA como copiloto, como o edital permite. O registro de cada parte fica junto dela:

| Parte | Arquivo |
|---|---|
| Aplicação web | [`front-end-web/AI.md`](front-end-web/AI.md) e [`front-end-web/prompts.md`](front-end-web/prompts.md) |
| Central de Leituras | [`python/prompt.md`](python/prompt.md) |
| Edge, matemática, Total Experience e Storytelling | seção "Uso de inteligência artificial" do README de cada pasta |

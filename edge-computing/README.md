<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/climaponto_logo_dark.png">
    <img src="assets/climaponto_logo.png" alt="ClimaPonto - Monitoramento de calor nos pontos de ônibus" width="460">
  </picture>
</p>

<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Disciplina <b>Edge Computing &amp; Computer Systems</b> · Equipe <b>Debuggers</b>
</p>

---

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | ClimaPonto |
| **Cidade / bairro** | São Paulo/SP. Ponto piloto **P001** em Santana (Zona Norte), com a estação do INMET A701 Mirante de Santana como referência |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores |
| **Problema em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um ESP32 com sensor DHT22 no ponto mede temperatura e umidade, suaviza as leituras com média móvel, classifica o calor em *normal*, *atenção* (≥ 30 °C) ou *crítico* (≥ 35 °C) e alerta no próprio ponto com LEDs, buzzer e display LCD, mesmo sem internet. Quando há rede, envia as leituras por MQTT para a plataforma FIWARE, de onde a aplicação web as consulta |
| **Papel de cada componente** | ver tabela abaixo |
| **Repositório** | https://github.com/DebuggersGS/ClimaPonto (pasta [`edge-computing/`](https://github.com/DebuggersGS/ClimaPonto/tree/main/edge-computing)) |
| **Indicador de impacto** | Graus-hora acima de 30 °C por ponto (calor acumulado a que o passageiro fica exposto). Referência: 331 °C·h no ano em Santana (nov/2025 a out/2026, dados INMET, pasta [`matematica-dps/`](../matematica-dps/)) |
| **ODS** | 3 Saúde e Bem-Estar · 11 Cidades e Comunidades Sustentáveis · 13 Ação Contra a Mudança do Clima |

## Entrega da disciplina

| Item | Link |
|---|---|
| Simulação no Wokwi | https://wokwi.com/projects/480316994502816769 |
| Vídeo no YouTube (até 7 min) | https://youtu.be/46aChij6YnE |

O arquivo do vídeo também está em [`video/`](video/) (3min46s).

## Arquitetura em 3 camadas

```
[ESP32 + DHT22 no ponto (Wokwi)]
   │  mede → valida → média móvel → classifica
   │  LEDs, buzzer e LCD funcionam sem internet
   │
   └──(MQTT)──> [FIWARE: IoT Agent → Orion (dado atual) → STH-Comet (histórico)]
                                   │
                                   └──(API HTTP)──> [Central de Leituras em Python]
                                                          │  leituras importadas
                                                          ▼
                                       [Supabase] ──> [Aplicação web ClimaPonto]
                                                      mapa, histórico e CRUD dos pontos
```

| Camada | O que faz | Responsável |
|---|---|---|
| Dispositivo IoT (esta pasta) | Mede, decide e alerta no ponto | Vinícius |
| Back-end FIWARE (AWS) | Recebe por MQTT, guarda o dado atual e o histórico | Vinícius |
| Aplicação web | Mostra mapa, estado e histórico ao cidadão e faz o CRUD dos pontos no Supabase (pasta [`front-end-web/`](../front-end-web/)) | Enrico |
| Central de Leituras (Python) | Busca as leituras no FIWARE, guarda em JSON e analisa (pasta [`python/`](../python/)) | Guilherme |

## Circuito

| Componente | Pino no ESP32 | Por que está no circuito |
|---|---|---|
| DHT22 | GPIO 15 | Mede temperatura (°C) e umidade (%) do ponto |
| LED verde + resistor 330 Ω | GPIO 16 | Estado **normal** |
| LED amarelo + resistor 330 Ω | GPIO 17 | Estado **atenção** |
| LED vermelho + resistor 330 Ω | GPIO 18 | Estado **crítico** |
| Buzzer | GPIO 25 | Alerta sonoro: bipe curto em atenção, mais agudo e frequente em crítico |
| LCD 16×2 (I2C) | SDA 21 · SCL 22 | Mostra temperatura, umidade e estado para quem está no ponto |

## Lógica de borda

| Estado | Condição (média móvel) | Resposta |
|---|---|---|
| `normal` | abaixo de 30 °C | LED verde, buzzer desligado |
| `atencao` | de 30 °C até 34,9 °C | LED amarelo, bipe de 1000 Hz (0,2 s a cada 2 s) |
| `critico` | 35 °C ou mais | LED vermelho, bipe de 1800 Hz (0,3 s a cada 0,8 s) |
| `falha_sensor` | leitura inválida (`NaN` ou fora de −40 °C a 80 °C) | LEDs apagados, LCD "FALHA NO SENSOR", nenhum estado falso |

- **Suavização:** média móvel das últimas 5 leituras válidas. Leitura inválida não entra na média.
- **Limites:** 30 °C e 35 °C foram definidos pelo grupo em teste, para demonstração. Não são limites clínicos nem alerta oficial de saúde. São os mesmos valores do programa Python e da aplicação web.
- **Tempo:** `millis()` controla leitura, LCD, buzzer e reconexão, sem `delay()` bloqueante. Na simulação a leitura é feita a cada 2 s para a demonstração; em campo, o intervalo proposto pela análise matemática é de 10 min.
- **Offline:** sem Wi-Fi ou MQTT, o dispositivo continua lendo, classificando e alertando. Para demonstrar, mude `SIMULAR_REDE_OFFLINE` para `true`.
- **Falha simulada:** para demonstrar a falha do sensor, mude `SIMULAR_FALHA_SENSOR` para `true`.

## Como executar

1. Abra https://wokwi.com/projects/480316994502816769 e clique em **Play**.
2. Clique no DHT22 durante a simulação e mova o controle de temperatura:
   - 27 °C → **normal** · 33 °C → **atenção** · 37 °C → **crítico**
   - A troca de estado leva alguns segundos por causa da média móvel.
3. Acompanhe o **Serial Monitor**: temperatura, umidade, média móvel, estado e envio MQTT.

Para rodar a partir desta pasta, crie um projeto ESP32 no Wokwi e substitua `sketch.ino`, `diagram.json` e `libraries.txt` pelos arquivos da pasta [`wokwi/`](wokwi/).

> O endereço do servidor FIWARE em `MQTT_SERVIDOR` é um exemplo: a instância na AWS recebe um novo IP sempre que é ligada. A chave do serviço FIWARE fica visível no código por decisão do grupo; ela é usada só nesta demonstração.

## Dados

Todas as leituras do ESP32 são **simuladas no Wokwi** (`"origem": "simulacao_wokwi"`). Não há dados pessoais.

## Equipe Debuggers

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme De Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

## Uso de inteligência artificial

O grupo usou IA como copiloto, como o edital permite. Nesta parte, o assistente Claude (Anthropic) foi usado para revisar o código e os comentários do ESP32 frente à rubrica, sugerir a justificativa dos limites no comentário e editar o vídeo (montagem dos takes com as narrações gravadas pelo grupo, legendas e mixagem de áudio). O circuito, o código e a simulação foram montados e testados pelo grupo no Wokwi.

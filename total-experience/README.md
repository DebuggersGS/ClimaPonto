<p align="center">
  <img src="assets/climaponto_logo.svg" alt="ClimaPonto - Monitoramento de calor nos pontos de ônibus" width="560">
</p>

<p align="center">
  <b>Global Solution FIAP 2026.2 · CitizenTech da Minha Cidade · Engenharia de Software 1º ano</b><br>
  Disciplina <b>Software &amp; Total Experience Design</b> · Equipe <b>Debuggers</b>
</p>

---

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | ClimaPonto |
| **Cidade / bairro** | São Paulo/SP. Ponto piloto **P001** na região de Santana (Zona Norte), endereço exato a confirmar |
| **Cidadão beneficiado** | Passageiros que esperam ônibus expostos ao calor, principalmente idosos e trabalhadores |
| **Problema em uma frase** | Quem espera ônibus em São Paulo fica exposto ao calor sem nenhuma informação sobre a temperatura naquele ponto |
| **Como funciona** | Um ESP32 com sensor no ponto mede temperatura e umidade, classifica o calor em *normal*, *atenção* (≥ 30 °C) ou *crítico* (≥ 35 °C) e alerta no local, mesmo sem internet. As leituras seguem por MQTT para a plataforma FIWARE, são coletadas pela Central em Python e aparecem numa aplicação web com mapa, estado, histórico e gerenciamento dos pontos |
| **Papel de cada componente** | ver tabela abaixo |
| **Repositório** | https://github.com/DebuggersGS/ClimaPonto (pasta [`total-experience/`](https://github.com/DebuggersGS/ClimaPonto/tree/main/total-experience)) |
| **Indicador de impacto** | Graus-hora acima de 30 °C por ponto. Referência: 331 °C·h no ano em Santana (dados INMET, pasta [`matematica-dps/`](../matematica-dps/)). Para a experiência: 80 % ou mais das pessoas interpretando o estado corretamente em teste com 5 participantes (meta proposta) |
| **ODS** | 3 Saúde e Bem-Estar · 11 Cidades e Comunidades Sustentáveis · 13 Ação Contra a Mudança do Clima |

| Componente | Disciplina | Responsável |
|---|---|---|
| Sensor ESP32 (Wokwi) e integração FIWARE (pasta [`edge-computing/`](../edge-computing/)) | Edge Computing & Computer Systems | Vinícius |
| Aplicação web com mapa, histórico e CRUD de pontos (pasta [`front-end-web/`](../front-end-web/)) | Front-end Design · Web Development | Enrico |
| Central de Leituras em Python (pasta [`python/`](../python/)) | Computational Thinking with Python | Guilherme |
| Modelagem matemática (pasta [`matematica-dps/`](../matematica-dps/)) | Differentiated Problem Solving | Guilherme |
| **Experiência, requisitos, protótipo e roadmap** | **Software & Total Experience Design** | **Vinícius** |
| Pitch e marca (pasta [`storytelling/`](../storytelling/)) | Storytelling & Inspiração Empreendedora | Vinícius |

## Entrega

Apresentação em slides: [`ClimaPonto_TotalExperience.pdf`](ClimaPonto_TotalExperience.pdf) (23 slides).

| Critério do edital | Pontos | Slides |
|---|---:|---|
| Capa | 5 | 1 |
| Descrição do problema | 10 | 2 a 4 |
| Escopo da solução | 10 | 5 a 7 |
| Requisitos funcionais, não funcionais e regras de negócio | 20 | 8 a 11 |
| Diagrama de caso de uso e contextualização | 15 | 12 e 13 |
| Protótipo de média fidelidade, heurísticas e tom de voz | 25 | 14 a 19 |
| Roadmap: próximos passos | 15 | 20 |
| ODS, indicadores e síntese | — | 21 a 23 |

## Fontes citadas

- Pesquisa Mackenzie (FAU) sobre diferenças de temperatura entre bairros de São Paulo, 2024.
- *Estudo sobre as condições das paradas de ônibus na cidade de São Paulo*. Revista ENIAC Pesquisa, 2018.
- Prefeitura de São Paulo, Câmara Temática da Mobilidade a Pé, reunião de 13/05/2026.
- INMET, estação A701 Mirante de Santana, nov/2025 a out/2026 (análise do grupo na pasta `matematica-dps/`).
- Pesquisa de campo do grupo: conversa com 2 passageiros que usam ônibus todos os dias, nov/2026. Os nomes foram omitidos para proteger os entrevistados.

## Equipe Debuggers

| Integrante | RM |
|---|---|
| Enrico Vieira de Almeida Vidal | 569217 |
| Guilherme De Rosa Peres | 569193 |
| Vinícius Fuentes Cavalcanti | 570818 |

## Uso de inteligência artificial

O grupo usou IA como copiloto, como o edital permite. Nesta disciplina, o assistente Claude (Anthropic) ajudou a estruturar a apresentação conforme a rubrica, redigir requisitos, regras de negócio e textos de interface, desenhar os protótipos de média fidelidade e pesquisar fontes públicas sobre calor urbano. O conteúdo foi revisado pelo grupo para ficar coerente com o código do ESP32, a aplicação web e a análise matemática. As entrevistas foram feitas pelo grupo com passageiros reais; nenhuma fala foi criada pela IA.

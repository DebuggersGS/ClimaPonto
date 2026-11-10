# Proposta — Etapa 3: dashboard de monitoramento ambiental

> **Status:** proposta para revisão técnica. Nada foi instalado ou implementado.

## 1. Pré-requisitos (bloqueiam a etapa)

| Item | Responsável | Por quê |
| --- | --- | --- |
| Limites ambientais (`normal` / `attention` / `critical`) e `rules_version` inicial | Equipe (Thiago e Gui) | Os indicadores e alertas exibem a classificação; sem limites aprovados, não há o que mostrar. |
| Intervalo de envio do ESP32 | Thiago | Define a regra de conectividade (2×/5× provisória) e a frequência de atualização da tela. |
| Fonte de leituras | Equipe | Hoje há **0 leituras**. Opções: (a) implementar a ingestão por Edge Function (seção 4 de `security-review.md`); (b) enquanto isso, inserir leituras `simulation` claramente identificadas, por script de servidor, para desenvolver a interface. Nunca pelo navegador. |

## 2. Bibliotecas avaliadas

| Biblioteca | Recomendação | Justificativa |
| --- | --- | --- |
| **Recharts** | **Adotar**, carregada sob demanda | Séries temporais de temperatura e umidade com eixos, tooltip e responsividade prontos. Custo estimado de ~90–100 kB gzip, por isso fica só na página de histórico (`React.lazy`), sem pesar no carregamento inicial. |
| **Lucide React** | **Adotar** | Ícones SVG com *tree-shaking* (só os importados entram no bundle). Úteis para estados (sensor online/offline, alerta). Sempre acompanhados de texto, nunca como único indicador. |
| **shadcn/ui** | **Não adotar agora** | Não é uma dependência única: copia componentes que trazem Radix, `class-variance-authority` e `tailwind-merge`. Já temos Button, Card, TextField, FeedbackMessage e ConfirmDialog (com `<dialog>` nativo). Reavaliar só se surgir a necessidade de primitivas complexas (Tabs, Tooltip, Popover); nesse caso, adotar **apenas** o componente necessário. |
| TanStack Query | Reavaliar na implementação | A atualização automática com `useEffect` + `setInterval` e pausa quando a aba está oculta resolve. Só se justifica se houver muitos recursos em cache com invalidação cruzada. |

## 3. Arquitetura proposta (mantendo a separação atual)

**services/**
- `readingsService.js`
  - `listLatestReadings()` (view `stop_latest_readings`);
  - `listReadings(stopId, { from, to })`;
  - para períodos longos, uma função SQL de agregação (médias por hora), com `GRANT EXECUTE` explícito, já que os privilégios padrão foram revogados.
- `environmentalRules.js`: limites versionados e funções puras de classificação, com as **mesmas regras** do firmware e do endpoint.

**hooks/**
- `useLatestReadings({ intervalMs })`: atualização automática por *polling*, pausada quando `document.hidden` e com intervalo derivado do envio do ESP32. Realtime do Supabase fica como evolução.
- `useReadingsHistory(stopId, period)`: histórico por período (24 h / 7 dias / 30 dias).
- `useConnectivity(lastMeasuredAt, sendIntervalMs)`: online / atrasado / offline / sem dados, calculado no cliente e recalculado a cada minuto.

**components/dashboard/**
- `MetricCard` (valor + unidade + variação), `StatusBadge` (estado ambiental: cor + ícone + texto), `ConnectivityBadge`, `StopStatusGrid`, `AlertList`, `PeriodFilter` (grupo de botões acessível), `LastUpdated` (tempo relativo, `aria-live` discreto), `ReadingsChart` (Recharts, lazy) com **tabela alternativa** ou resumo textual para leitores de tela.

**pages/**
- `DashboardPage`: visão geral (grade de pontos com estado e conectividade, alertas).
- `HistoryPage`: gráfico por ponto e período.

## 4. Diretrizes de interface

- **Responsivo:** grade de cartões (1 coluna no celular, 2–3 no desktop); gráfico com largura fluida.
- **Acessível:** estado nunca indicado só por cor; contraste AA; gráfico com alternativa textual; foco visível; `prefers-reduced-motion` respeitado.
- **Microanimações discretas:** transições de cor e opacidade do Tailwind (150–200 ms) ao atualizar valores; sem animações contínuas.
- **Dados honestos:** origem visível (`simulation` sinalizada); horário da última leitura sempre exibido; estado "sem dados" explícito.
- **Design:** alinhar a paleta e os estados visuais com o Vini (Total Experience) antes de implementar.

## 5. Testes previstos

- Funções puras (classificação ambiental e conectividade) com casos de borda nos limites.
- Testes de interface (mesmo método da Etapa 2B): atualização automática, filtros de período, estados vazios e de erro, mobile e axe-core.
- RLS: confirmar que leituras `test` continuam invisíveis para visitantes no dashboard.

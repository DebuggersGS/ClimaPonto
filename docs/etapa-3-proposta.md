# Status atualizado — Etapa 3C (12/11/2026)

**Feito na 3C (objetivo G-20261112-bf4e8c):**
- Dependências de interface autorizadas e instaladas pelo harness, sem fallback: `lucide-react`, `motion`, `recharts`, `clsx`, `tailwind-merge`, `class-variance-authority` (decisão 32). **Recharts e Lucide, que a 3B havia deixado de lado, foram adotados.**
- Design system: tokens, `cn()`, variantes com `cva`, componentes base (Button, Card, Section, Skeleton, MetricCard, SegmentedControl, EmptyState), shell com navegação animada e `MotionConfig reducedMotion="user"` (decisão 33).
- Gráficos Recharts por grandeza, com agrupamento por intervalos em `utils/chartSeries.js` (substitui `chartGeometry.js` e `maxGapMs`) e resumo estatístico (decisão 34).
- Fonte de dados única guiada por `VITE_DATA_MODE` (`mock`, `supabase`, `auto`), sem fallback para mock em erro, dataset mock determinístico com 8 cenários e sinalização persistente do modo (decisão 35).
- Dashboard, Histórico, Pontos, área administrativa (tokens e aviso de modo demonstrativo) e página 404 redesenhados.
- Testes `node:test` ampliados para modo de dados, dataset, adaptador mock, fábrica da fonte, `statusTones` e `chartSeries` (204 aprovados na última execução).

**Continua pendente na 3C:**
- Nenhuma tela foi renderizada em navegador: 375/768/1366 px, contraste, teclado, reduced motion e axe-core dependem de aceite humano.
- Carregamento sob demanda do Recharts (hoje no bundle principal, ~894 kB / 277 kB gzip, com aviso de chunk >500 kB).
- Os itens da 3B abaixo (limites ambientais, ingestão, agregação SQL) seguem inalterados.

---

# Status anterior — Etapa 3B (12/11/2026)

**Implementado:**
- Dashboard: resumo, última medição, conectividade provisória, visão por ponto e evolução recente, com atualização automática pausada com a aba oculta.
- Histórico: filtros de ponto e período na URL, gráfico SVG com alternativa textual, tabela e limite de 500 registros com aviso.
- `utils/connectivity.js`, `readings.js`, `historyPeriods.js`, `chartGeometry.js`; `services/readingsApi.js` e `readingsService.js`; hooks `useLatestReadings`, `useReadingsHistory` e `useNow`.
- Testes `node:test` (`cd web && node --test`).

**Divergiu da proposta:**
- Sem Recharts e sem Lucide: gráfico SVG próprio e ícones inline (decisão 24 em `architecture-decisions.md`; revertido na 3C).
- Sem função SQL de agregação: consulta limitada com aviso de truncamento (decisão 27).
- Sem `environmentalRules.js`: os limites ambientais não foram aprovados, então o front só exibe o `environmental_status` gravado.
- Componentes em `components/history` e `components/dashboard` (a proposta citava só `components/dashboard`); `useConnectivity` virou o utilitário `utils/connectivity.js`.

**Segue pendente:**
- Limites ambientais e `rules_version`; intervalo de envio e regra de conectividade definitivos.
- Ingestão (Edge Function) e leituras reais ou simuladas.
- Agregação SQL para períodos longos.
- Validação visual em navegador (375/768/1366 px, teclado, axe-core) e conferência com Supabase configurado (aceite humano).

---

## Texto original da proposta (histórico)

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

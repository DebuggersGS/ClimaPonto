# Fontes e metodologia

## Origens dos dados

| Origem | Uso | Observação |
| --- | --- | --- |
| Conjunto demonstrativo local (`data/mock`, 8 pontos, semente `20261112`) | build `mock` e cenários demonstrativos | Leituras `simulation`/`test`; sempre com selo "Demonstrativo". Coordenadas ilustrativas, sem fonte rastreável. |
| Supabase `climaponto-gs-2026` (modo `observado`) | pontos e leituras do banco | Pontos demonstrativos (`is_demo`); não há leituras reais de ESP32 (endpoint de ingestão inexistente). Leitura só com chave publishable. |
| OpenFreeMap + OpenStreetMap | mapa base | Estilos `positron` e `fiord` em `components/map/mapConfig.js`, sem chave de API. Atribuição "© OpenStreetMap" e "OpenFreeMap" mantida no mapa. CSP libera apenas `tiles.openfreemap.org`. |

Não há integração com GTFS, GeoSampa nem Open-Meteo nesta release.

## Regras de qualidade

- Nunca há mistura de conjuntos nem fallback para mock em erro (`utils/dataScenario.js`).
- Ponto sem leituras mostra estado vazio; nenhum KPI, gráfico ou linha é inventado.
- Comparação A/B só calcula com unidade e período coerentes; caso contrário mostra "não comparável" com o motivo (`utils/stopComparison.js`).
- Conectividade: regra provisória (5 × o intervalo de envio, ainda não definido para o dispositivo real).
- Alertas são calculados no cliente a partir do estado gravado; não há limiar ambiental aprovado nem notificação externa.
- Qualidade das leituras: `utils/readingQuality.js`.

## Narrativa

Problema: calor em pontos de ônibus de São Paulo. Evidência: leituras de temperatura e umidade por ponto. Decisão: priorizar pontos em atenção ou críticos. Hoje a narrativa é demonstrativa; a página "CitizenTech" não existe (termo indefinido).

## Limites

Sem dados reais de sensor, sem coordenadas rastreáveis, sem Open-Meteo, sem Lighthouse, sem validação remota nesta rodada.

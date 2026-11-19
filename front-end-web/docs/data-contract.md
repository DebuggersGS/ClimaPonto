# Contrato de dados — ClimaPonto

> **Status: v0.2 (18/11/2026).** Formato do banco em uso; a ingestão automática a partir do FIWARE é pendência (seção 9).
> O ESP32 da equipe (parte de Edge Computing, Vinícius) envia por MQTT ao FIWARE, com campos em português (ver seção *Correspondência com o ESP32 e o FIWARE*). Este contrato é o formato do banco da aplicação web; a correspondência campo a campo está documentada abaixo. Os limites ambientais e de conectividade citados aqui são **propostas**, não regras aprovadas.

Este documento descreve como os dados do ClimaPonto são organizados no banco (Supabase/PostgreSQL) e como os demais integrantes — firmware ESP32, scripts Python e front-end — devem produzi-los e consumi-los.

Fonte da verdade do esquema: [`supabase/migrations/`](../supabase/migrations/).

---

## 1. Convenções gerais

| Item | Convenção |
| --- | --- |
| Identificadores | `id` em **UUID v4**, gerado pelo banco. Pontos também têm um `code` legível e único (ex.: `DEMO-01`). |
| Nomes de campos | `snake_case` no banco e na API. O front-end converte para `camelCase` internamente. |
| Datas e horários | **ISO 8601 em UTC**, com `Z` no final: `2026-11-09T17:45:00Z`. A conversão para o horário de Brasília acontece apenas na exibição. |
| Temperatura | Graus Celsius (`temperature_c`), 1 casa decimal. |
| Umidade | Umidade relativa em % (`humidity_pct`), 0 a 100, 1 casa decimal. |
| Códigos de estado | Em inglês e minúsculas (`normal`, `attention`, `critical`). A interface traduz para português. |

---

## 2. Pontos monitorados — `stops`

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `id` | uuid | gerado | Chave primária. |
| `code` | texto | sim | Único. Letras maiúsculas, dígitos e hífens; até 32 caracteres. Ex.: `DEMO-01`, `SP-0001`. |
| `name` | texto | sim | 3 a 120 caracteres. |
| `neighborhood` | texto | sim | Bairro/região, 2 a 80 caracteres. |
| `description` | texto | não | Até 500 caracteres. |
| `latitude` | número | não | −90 a 90, 6 casas decimais. Informar junto com `longitude`. |
| `longitude` | número | não | −180 a 180, 6 casas decimais. Informar junto com `latitude`. |
| `is_demo` | booleano | sim (padrão `false`) | `true` = ponto **fictício/demonstrativo**, não instalado. |
| `active` | booleano | sim (padrão `true`) | `false` = desativado: some para visitantes, mas o histórico é preservado. |
| `created_at` | timestamp UTC | gerado | Data de criação. |
| `updated_at` | timestamp UTC | gerado | Atualizado automaticamente a cada edição. |

**Exclusão:** um ponto que já possui leituras **não pode ser excluído** (integridade referencial). Para retirá-lo de exibição, use `active = false`.

### Exemplo

```json
{
  "id": "6f1c2a9e-3b7d-4c55-9a0e-2d8f1b4c7e10",
  "code": "DEMO-01",
  "name": "Ponto demonstrativo 01",
  "neighborhood": "Região Central (demonstrativo)",
  "description": "Ponto fictício usado para demonstrar a interface. Não há sensor instalado.",
  "latitude": null,
  "longitude": null,
  "is_demo": true,
  "active": true,
  "created_at": "2026-11-09T20:27:10Z",
  "updated_at": "2026-11-09T20:27:10Z"
}
```

> O `id` acima é ilustrativo. Use sempre o valor retornado pelo banco.

---

## 3. Leituras ambientais — `readings`

| Campo | Tipo | Obrigatório | Regras |
| --- | --- | --- | --- |
| `id` | uuid | gerado | Chave primária. |
| `stop_id` | uuid | sim | Referência a `stops.id`. |
| `temperature_c` | número | sim | −40 a 80 °C (faixa de **plausibilidade do sensor**, não limite ambiental). |
| `humidity_pct` | número | sim | 0 a 100 %. |
| `environmental_status` | texto | não | `normal`, `attention`, `critical` ou `null` (= ainda não classificada). Ver seção 4. |
| `source` | texto | sim | Origem da leitura. Ver seção 6. |
| `measured_at` | timestamp UTC | sim | Momento da medição no dispositivo. Não pode estar mais de 5 min no futuro em relação ao servidor. |
| `received_at` | timestamp UTC | gerado | Momento em que o servidor recebeu a leitura. |

**Duplicidade:** não pode haver duas leituras do mesmo ponto com o mesmo `measured_at`. Isso torna seguro o **reenvio** de uma leitura após falha de rede: o segundo envio é rejeitado como duplicado (ver seção 7).

### Exemplo (como armazenado)

```json
{
  "id": "0b8e7c52-91a4-4f0e-8d3b-5c2e6a1f9d77",
  "stop_id": "6f1c2a9e-3b7d-4c55-9a0e-2d8f1b4c7e10",
  "temperature_c": 31.4,
  "humidity_pct": 48.2,
  "environmental_status": null,
  "source": "simulation",
  "measured_at": "2026-11-09T17:45:00Z",
  "received_at": "2026-11-09T17:45:02Z"
}
```

---

## 4. Estado ambiental

| Código | Exibição | Significado |
| --- | --- | --- |
| `normal` | Normal | Condições dentro do esperado. |
| `attention` | Atenção | Condições que exigem cuidado. |
| `critical` | Crítico | Condições de risco. |
| `null` | Não classificado | Leitura sem classificação. |

**Quem classifica (aprovado):** o **ESP32 classifica localmente**, de modo que os alertas locais funcionam sem rede e sem depender de outros serviços. O endpoint de ingestão **valida** o estado recebido aplicando as **mesmas regras** e armazena o resultado. As análises em Python (Gui) são complementares e não são dependência dos alertas.

**Limites (pendente):** os valores de "atenção" e "crítico" ainda não foram aprovados e não estão codificados no banco. Quando forem definidos, ficarão em um documento versionado de regras (ex.: `rules_version: 1`), compartilhado entre o firmware e o endpoint.

---

## 5. Estado de conectividade do sensor

É **separado** do estado ambiental: indica se o ponto está enviando dados, não se o clima está bom ou ruim. Não é armazenado; é **calculado** pela idade da última leitura (`now − measured_at`), disponível na view `stop_latest_readings`.

| Código | Exibição | Regra **proposta** (pendente de aprovação) |
| --- | --- | --- |
| `online` | Online | Última leitura há no máximo 2× o intervalo de envio. |
| `delayed` | Atrasado | Entre 2× e 5× o intervalo de envio. |
| `offline` | Offline | Mais de 5× o intervalo de envio. |
| `no_data` | Sem dados | O ponto nunca enviou leitura. |

O **intervalo de envio** do ESP32 foi definido pela parte de Edge: 2 s na simulação do Wokwi e 10 min proposto para campo pela análise matemática (DPS). A aplicação usa os mesmos 10 min da Central de Leituras em Python na regra de conectividade (`SEND_INTERVAL_MS` em `web/src/utils/connectivity.js`): online até 20 min, atrasado até 50 min e offline acima disso.

---

## 6. Origem dos dados — `source`

| Código | Significado |
| --- | --- |
| `sensor` | Medição **real de campo**, feita por sensor físico instalado. Reservado; não usado no protótipo atual. |
| `simulation` | Valores **simulados** (ex.: ESP32 no Wokwi ou gerador de dados). |
| `test` | Dados de teste manual ou automatizado. |

Dados `simulation` e `test` **nunca devem ser apresentados como medições reais**. A interface deve sinalizar a origem.

**Visibilidade por origem** (migração `20261110193817_hide_test_readings`, aplicada no remoto):

| Origem | Visitantes e usuários comuns | Administradores |
| --- | --- | --- |
| `simulation` | Sim, se o ponto estiver ativo | Sim |
| `sensor` | Sim, se o ponto estiver ativo | Sim |
| `test` | **Não** | Sim |

Leituras enviadas por dispositivos Wokwi são gravadas como `simulation`, e o servidor força esse valor.

---

## 7. Operações de API previstas

O front-end usa o cliente `@supabase/supabase-js`, que fala com a API REST do Supabase (PostgREST). Todas as requisições usam a chave **publishable**; as permissões são aplicadas pelo RLS do banco.

| Operação | Quem pode | Equivalente REST |
| --- | --- | --- |
| Listar pontos | Todos (visitantes veem só ativos; admins veem todos) | `GET /rest/v1/stops?select=*&order=code` |
| Detalhar ponto | Todos (mesma regra) | `GET /rest/v1/stops?id=eq.{id}` |
| Criar ponto | Admin autenticado | `POST /rest/v1/stops` (campos graváveis abaixo) |
| Editar ponto | Admin autenticado | `PATCH /rest/v1/stops?id=eq.{id}` (campos graváveis abaixo) |
| Excluir ponto | Admin autenticado (só sem leituras) | `DELETE /rest/v1/stops?id=eq.{id}` |
| Listar leituras de um ponto | Todos (pontos visíveis; `test` só admins) | `GET /rest/v1/readings?stop_id=eq.{id}&order=measured_at.desc&limit=50` |
| Última leitura por ponto | Todos (última leitura **visível** a quem consulta) | `GET /rest/v1/stop_latest_readings` |

**Campos graváveis em `stops`** (migração `20261109224553_restrict_stop_write_columns`, aplicada no remoto): `code`, `name`, `neighborhood`, `description`, `latitude`, `longitude`, `is_demo`, `active`. Enviar `id`, `created_at` ou `updated_at` em um `POST`/`PATCH` resulta em erro `42501`; `updated_at` é atualizado automaticamente.
| **Enviar leitura (ESP32)** | **Dispositivo autorizado** | `POST /functions/v1/ingest-reading` — **ainda não implementado** |

Nenhum usuário do navegador — nem administrador — insere leituras diretamente na tabela.

### 7.1 Endpoint de ingestão para o ESP32 (proposta)

Será uma **Supabase Edge Function** que autentica o dispositivo, valida o corpo e grava a leitura usando credencial de servidor (que nunca sai do servidor). A **direção aprovada** é uma credencial individual por dispositivo. Detalhes em [security-review.md, seção 4](security-review.md#4-estratégia-de-autenticação-dos-dispositivos-aprovada-como-direção-não-implementada). **Ainda não implementado.**

**Requisição — exemplo:**

```http
POST https://<projeto>.supabase.co/functions/v1/ingest-reading
Content-Type: application/json
Authorization: Bearer <token do dispositivo — proposta; nunca versionado nem em projeto Wokwi público>
```

```json
{
  "stop_code": "DEMO-01",
  "temperature_c": 31.4,
  "humidity_pct": 48.2,
  "environmental_status": "attention",
  "rules_version": 1,
  "source": "simulation",
  "measured_at": "2026-11-09T17:45:00Z"
}
```

> Os valores acima são **exemplo de formato**. `"attention"` não reflete nenhum limite aprovado.

Observações para o firmware:

- `stop_code` (e não o UUID) identifica o ponto (**aprovado**). O endpoint confere se o token pertence ao dispositivo daquele ponto.
- `environmental_status` é calculado **no ESP32** (aprovado); `rules_version` indica qual versão das regras foi usada.
- `measured_at` exige relógio sincronizado (NTP). **A decidir:** se o ESP32 não tiver horário confiável, o campo poderá ser omitido e o servidor usará o horário de recebimento.
- Enviar números com ponto decimal (`31.4`), não vírgula.
- Usar HTTPS (`WiFiClientSecure`).

**Respostas propostas:**

| HTTP | Situação | Corpo |
| --- | --- | --- |
| `201` | Leitura gravada | `{ "id": "<uuid>", "received_at": "2026-11-09T17:45:02Z" }` |
| `400` | Corpo inválido | `{ "error": { "code": "validation_error", "message": "humidity_pct deve estar entre 0 e 100", "field": "humidity_pct" } }` |
| `401` | Credencial ausente ou inválida | `{ "error": { "code": "unauthorized", "message": "..." } }` |
| `403` | Token válido, mas de outro ponto | `{ "error": { "code": "forbidden_stop", "message": "..." } }` |
| `422` | `environmental_status` incompatível com as regras da `rules_version` | `{ "error": { "code": "status_mismatch", "message": "..." } }` |
| `429` | Envios mais frequentes que o permitido | `{ "error": { "code": "rate_limited", "message": "..." } }` |
| `404` | `stop_code` inexistente ou inativo | `{ "error": { "code": "stop_not_found", "message": "..." } }` |
| `409` | Leitura duplicada (reenvio) | `{ "error": { "code": "duplicate_reading", "message": "..." } }` — o dispositivo pode descartá-la com segurança. |
| `500` | Erro interno | `{ "error": { "code": "internal_error", "message": "..." } }` |

---

## 8. Convenções de erro

### Erros da API do banco (PostgREST)

Retornados pelo `supabase-js` no objeto `error` (`code`, `message`, `details`, `hint`). Códigos mais relevantes:

| Código | Significado | Exemplo |
| --- | --- | --- |
| `42501` | Sem permissão (grant ou RLS) | Visitante tentando criar ponto. |
| `23505` | Valor único duplicado | `code` de ponto repetido; leitura duplicada. |
| `23514` | Restrição de validação violada | Umidade 120 %; `source` desconhecida. |
| `23503` | Integridade referencial | Excluir ponto que possui leituras. |
| `PGRST116` | Nenhuma linha para `.single()` | Ponto não encontrado. |

### No front-end

A camada `services/` converte falhas em `Error` com mensagem em português e preserva o erro original em `error.cause`. Os hooks expõem `error` para a interface exibir uma mensagem acessível (`role="alert"`). Quando o Supabase está configurado e falha, a aplicação **não** troca silenciosamente para dados locais.

---

## 9. Pendências deste contrato

- [ ] Ponte automática FIWARE → endpoint de ingestão (próximo passo).
- [x] Quem classifica as leituras: o ESP32, com validação no endpoint (aprovado).
- [ ] Definir limites ambientais (e `rules_version` inicial).
- [x] Intervalo de leitura definido: 10 min (análise matemática). Os fatores 2×/5× da regra de conectividade continuam provisórios.
- [x] Modelo de autenticação dos dispositivos: credencial individual, aleatória e revogável (direção aprovada; ver `security-review.md`, seção 4).
- [ ] Implementar a ingestão (fora do escopo atual).
- [ ] Adicionar `rules_version` à tabela `readings` (migração futura, junto com o endpoint).
- [ ] Definir comportamento quando o ESP32 não tiver relógio sincronizado.

## 10. Correspondência com o ESP32 e o FIWARE

O ESP32 (pasta `edge-computing/`) publica por MQTT no FIWARE (IoT Agent → Orion → STH-Comet), e a Central de Leituras em Python (pasta `python/`) guarda as leituras em JSON. Cada leitura desse formato vira uma linha de `readings` assim:

| ESP32 / Python (`dados/leituras.json`) | `readings` (Supabase) | Conversão |
| --- | --- | --- |
| `ponto_id` (`P001`) | `stop_id` | Busca o `id` do ponto pelo `code` |
| `temperatura` (°C) | `temperature_c` | Igual |
| `umidade` (%) | `humidity_pct` | Igual |
| `estado` (`normal`, `atencao`, `critico`) | `environmental_status` (`normal`, `attention`, `critical`) | Tradução direta; os limites são os mesmos (30 °C e 35 °C) |
| `origem` (`esp32_fiware`, `simulacao_wokwi`) | `source` | Sempre `simulation`, porque o ESP32 roda no Wokwi |
| `timestamp` (UTC) | `measured_at` | Igual |
| `media_movel` | (não armazenado) | O estado já reflete a média móvel calculada no ESP32 |

As 6 leituras do ESP32 recebidas pelo FIWARE em 17/11/2026 foram importadas no ponto P001 com essa correspondência (ver *Dados em produção* no README).

-- =============================================================================
-- ClimaPonto — esquema principal: pontos monitorados (stops) e leituras (readings)
--
-- Convenções:
--   * Datas/horas em timestamptz (armazenadas em UTC pelo Postgres).
--   * Códigos de estado em inglês (normal/attention/critical); a interface traduz.
--   * Limites de plausibilidade abaixo NÃO são limites ambientais: apenas
--     descartam valores fisicamente impossíveis para o sensor previsto (DHT22).
--   * Os limites ambientais (quando uma leitura é "atenção" ou "crítico")
--     ainda não foram aprovados e não estão codificados aqui.
-- =============================================================================

-- Schema interno para funções auxiliares. Não é exposto pela Data API.
create schema if not exists private;

-- -----------------------------------------------------------------------------
-- stops — pontos de ônibus monitorados
-- -----------------------------------------------------------------------------
create table public.stops (
  id           uuid primary key default gen_random_uuid(),
  code         text not null,
  name         text not null,
  neighborhood text not null,
  description  text,
  latitude     numeric(9, 6),
  longitude    numeric(9, 6),
  is_demo      boolean not null default false,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint stops_code_unique      unique (code),
  constraint stops_code_format      check (code ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$' and char_length(code) <= 32),
  constraint stops_name_length      check (char_length(btrim(name)) between 3 and 120),
  constraint stops_neighborhood_len check (char_length(btrim(neighborhood)) between 2 and 80),
  constraint stops_description_len  check (description is null or char_length(description) <= 500),
  constraint stops_latitude_range   check (latitude is null or latitude between -90 and 90),
  constraint stops_longitude_range  check (longitude is null or longitude between -180 and 180),
  constraint stops_coordinates_pair check ((latitude is null) = (longitude is null))
);

comment on table  public.stops is 'Pontos de ônibus monitorados pelo ClimaPonto.';
comment on column public.stops.code is 'Identificador amigável e único (ex.: DEMO-01). Maiúsculas, dígitos e hífens.';
comment on column public.stops.is_demo is 'true quando o ponto é fictício/demonstrativo e não corresponde a um ponto real instalado.';
comment on column public.stops.active is 'false = ponto desativado: oculto para visitantes, histórico preservado.';

-- -----------------------------------------------------------------------------
-- readings — leituras ambientais
-- -----------------------------------------------------------------------------
create table public.readings (
  id                   uuid primary key default gen_random_uuid(),
  stop_id              uuid not null references public.stops (id) on delete restrict,
  temperature_c        numeric(4, 1) not null,
  humidity_pct         numeric(4, 1) not null,
  environmental_status text,
  source               text not null,
  measured_at          timestamptz not null,
  received_at          timestamptz not null default now(),

  constraint readings_temperature_plausible check (temperature_c between -40 and 80),
  constraint readings_humidity_range        check (humidity_pct between 0 and 100),
  constraint readings_status_values         check (environmental_status is null
                                                   or environmental_status in ('normal', 'attention', 'critical')),
  constraint readings_source_values         check (source in ('sensor', 'simulation', 'test')),
  -- tolera até 5 min de diferença entre o relógio do dispositivo e o servidor
  constraint readings_not_in_future         check (measured_at <= received_at + interval '5 minutes'),
  -- evita duplicar a mesma medição quando o dispositivo reenvia após falha
  constraint readings_unique_measurement    unique (stop_id, measured_at)
);

comment on table  public.readings is 'Leituras de temperatura e umidade associadas a um ponto.';
comment on column public.readings.environmental_status is 'normal | attention | critical; null = ainda não classificada (limites pendentes de aprovação).';
comment on column public.readings.source is 'sensor = medição real de campo; simulation = valores simulados (ex.: ESP32/Wokwi); test = dados de teste.';
comment on column public.readings.measured_at is 'Momento da medição no dispositivo (UTC).';
comment on column public.readings.received_at is 'Momento em que o servidor recebeu a leitura (UTC).';

-- A unique (stop_id, measured_at) já cria o índice usado para
-- "leituras de um ponto ordenadas por data". Índice extra para consultas
-- globais por data (histórico geral / dashboard):
create index readings_measured_at_idx on public.readings (measured_at desc);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger stops_set_updated_at
  before update on public.stops
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- Última leitura por ponto (base para status de conectividade)
-- security_invoker: a view respeita o RLS de quem consulta.
-- O status de conectividade (online/atrasado/offline) é derivado da idade da
-- última leitura no front-end, pois os limites ainda serão aprovados.
-- -----------------------------------------------------------------------------
create view public.stop_latest_readings
with (security_invoker = true)
as
select distinct on (r.stop_id)
  r.stop_id,
  r.id as reading_id,
  r.temperature_c,
  r.humidity_pct,
  r.environmental_status,
  r.source,
  r.measured_at,
  r.received_at
from public.readings r
order by r.stop_id, r.measured_at desc;

comment on view public.stop_latest_readings is 'Leitura mais recente de cada ponto (respeita RLS).';

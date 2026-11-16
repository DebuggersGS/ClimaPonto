import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSupabaseStopsApi, noRowsAffected } from './stopsApi.js'
import { AppError } from './errors.js'

/**
 * Cliente Supabase falso (sem rede): from(table) devolve um query builder
 * encadeável que registra as chamadas e, ao ser aguardado, resolve para `result`.
 */
function createFakeClient(result) {
  const calls = []
  const tables = []
  const builder = {}
  for (const method of ['select', 'order', 'eq', 'insert', 'update', 'delete']) {
    builder[method] = (...args) => {
      calls.push({ method, args })
      return builder
    }
  }
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return {
    calls,
    tables,
    from(table) {
      tables.push(table)
      return builder
    },
  }
}

const ROW = {
  id: 'uuid-1',
  code: 'SP-001',
  name: 'Ponto Sé',
  neighborhood: 'Sé',
  description: null,
  latitude: '-23.55',
  longitude: -46.63,
  is_demo: true,
  active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}

const INPUT = {
  id: 'ignorado',
  code: 'SP-001',
  name: 'Ponto Sé',
  neighborhood: 'Sé',
  description: 'desc',
  latitude: -23.55,
  longitude: -46.63,
  isDemo: true,
  active: true,
  createdAt: 'x',
  updatedAt: 'y',
}

const callsOf = (client, method) => client.calls.filter((c) => c.method === method)

test('listStops consulta stops ordenado por code e só ativos, convertendo para camelCase', async () => {
  const client = createFakeClient({ data: [ROW], error: null })
  const stops = await createSupabaseStopsApi(client).listStops()

  assert.deepEqual(client.tables, ['stops'])
  assert.match(callsOf(client, 'select')[0].args[0], /id, code, name/)
  assert.deepEqual(callsOf(client, 'order')[0].args, ['code'])
  assert.deepEqual(callsOf(client, 'eq')[0].args, ['active', true])
  assert.equal(stops.length, 1)
  assert.equal(stops[0].isDemo, true)
  assert.equal(stops[0].createdAt, ROW.created_at)
  assert.equal(stops[0].updatedAt, ROW.updated_at)
  assert.equal(stops[0].latitude, -23.55)
  assert.equal(stops[0].description, null)
})

test('listStops com includeInactive não filtra por active', async () => {
  const client = createFakeClient({ data: [], error: null })
  await createSupabaseStopsApi(client).listStops({ includeInactive: true })
  assert.equal(callsOf(client, 'eq').length, 0)
})

test('createStop envia só colunas graváveis e devolve o Stop convertido', async () => {
  const client = createFakeClient({ data: [ROW], error: null })
  const stop = await createSupabaseStopsApi(client).createStop(INPUT)

  const payload = callsOf(client, 'insert')[0].args[0]
  assert.deepEqual(payload, {
    code: 'SP-001',
    name: 'Ponto Sé',
    neighborhood: 'Sé',
    description: 'desc',
    latitude: -23.55,
    longitude: -46.63,
    is_demo: true,
    active: true,
  })
  for (const key of ['id', 'created_at', 'updated_at']) assert.equal(key in payload, false)
  assert.equal(stop.id, 'uuid-1')
  assert.equal(stop.isDemo, true)
})

test('updateStop usa update com eq(id)', async () => {
  const client = createFakeClient({ data: [ROW], error: null })
  const stop = await createSupabaseStopsApi(client).updateStop('uuid-1', INPUT)

  assert.equal(callsOf(client, 'update')[0].args[0].is_demo, true)
  assert.equal('id' in callsOf(client, 'update')[0].args[0], false)
  assert.deepEqual(callsOf(client, 'eq')[0].args, ['id', 'uuid-1'])
  assert.equal(stop.code, 'SP-001')
})

test('setStopActive envia apenas { active } com eq(id)', async () => {
  const client = createFakeClient({ data: [{ ...ROW, active: false }], error: null })
  const stop = await createSupabaseStopsApi(client).setStopActive('uuid-1', false)

  assert.deepEqual(callsOf(client, 'update')[0].args[0], { active: false })
  assert.deepEqual(callsOf(client, 'eq')[0].args, ['id', 'uuid-1'])
  assert.equal(stop.active, false)
})

test('deleteStop usa delete().eq(id) e resolve sem valor', async () => {
  const client = createFakeClient({ data: [{ id: 'uuid-1' }], error: null })
  const result = await createSupabaseStopsApi(client).deleteStop('uuid-1')

  assert.equal(callsOf(client, 'delete').length, 1)
  assert.deepEqual(callsOf(client, 'eq')[0].args, ['id', 'uuid-1'])
  assert.equal(result, undefined)
})

test('data vazio em create/update/setStopActive/deleteStop lança noRowsAffected (permission)', async () => {
  const operations = {
    createStop: (api) => api.createStop(INPUT),
    updateStop: (api) => api.updateStop('uuid-1', INPUT),
    setStopActive: (api) => api.setStopActive('uuid-1', true),
    deleteStop: (api) => api.deleteStop('uuid-1'),
  }
  for (const [name, run] of Object.entries(operations)) {
    const api = createSupabaseStopsApi(createFakeClient({ data: [], error: null }))
    await assert.rejects(run(api), (err) => {
      assert.ok(err instanceof AppError, name)
      assert.equal(err.kind, 'permission', name)
      assert.equal(err.message, noRowsAffected().message, name)
      return true
    })
  }
})

test('erro do cliente vira AppError preservando a causa, sem vazar o objeto cru', async () => {
  const raw = { code: '23503', message: 'violates foreign key constraint' }
  const api = createSupabaseStopsApi(createFakeClient({ data: null, error: raw }))

  await assert.rejects(api.deleteStop('uuid-1'), (err) => {
    assert.ok(err instanceof AppError)
    assert.equal(err.kind, 'integrity')
    assert.equal(err.cause, raw)
    assert.doesNotMatch(err.message, /foreign key/)
    return true
  })
  await assert.rejects(
    createSupabaseStopsApi(createFakeClient({ data: null, error: { message: 'x' } })).listStops(),
    (err) => err instanceof AppError && err.kind === 'unknown' && err.message === 'Não foi possível consultar os pontos.',
  )
})

test('countStopReadings devolve count, ou 0 quando nulo', async () => {
  const client = createFakeClient({ count: 7, error: null })
  assert.equal(await createSupabaseStopsApi(client).countStopReadings('uuid-1'), 7)
  assert.deepEqual(client.tables, ['readings'])
  assert.deepEqual(callsOf(client, 'eq')[0].args, ['stop_id', 'uuid-1'])

  const empty = createFakeClient({ count: null, error: null })
  assert.equal(await createSupabaseStopsApi(empty).countStopReadings('uuid-1'), 0)
})

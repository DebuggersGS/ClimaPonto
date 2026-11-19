// Apoio dos specs que abrem o Explorar: o mapa tenta buscar estilo e blocos no OpenFreeMap, e o gate roda sem rede.
// Aqui a única tentativa externa permitida é interceptada: abortada (cai na lista de reserva, determinística)
// ou respondida com um estilo vazio (o MapLibre carrega sem blocos).
import { expect } from 'harness-e2e'

/** Erros de console esperados quando o OpenFreeMap é abortado ou o estilo vazio não tem glifos/sprites. */
export const CONSOLE_MAPA = [/ERR_FAILED|ERR_BLOCKED|Failed to load resource|Failed to fetch|NetworkError|openfreemap|maplibre|WebGL|glyph|sprite|AJAXError|style/i]

const OPENFREEMAP = /^https:\/\/tiles\.openfreemap\.org\//

/** Estilo mínimo válido (só fundo): o mapa carrega sem depender de rede. */
export const ESTILO_VAZIO = { version: 8, sources: {}, layers: [{ id: 'fundo', type: 'background', paint: { 'background-color': '#e5e7eb' } }] }

/** Aborta toda requisição ao OpenFreeMap (estilo e blocos): o mapa falha e a lista de reserva aparece. */
export async function mapaSemRede(page) {
  await page.route(OPENFREEMAP, (route) => route.abort('failed'))
}

/** Responde o estilo com `ESTILO_VAZIO` e aborta o resto: com WebGL o mapa carrega; sem WebGL cai no fallback. */
export async function mapaComEstiloVazio(page) {
  await page.route(OPENFREEMAP, (route) =>
    route.request().url().includes('/styles/')
      ? route.fulfill({ json: ESTILO_VAZIO, headers: { 'access-control-allow-origin': '*' } })
      : route.abort('failed'),
  )
}

export const avisoMapa = (page) => page.getByRole('alert').filter({ hasText: 'Os pontos continuam disponíveis na lista abaixo' })
export const listaDoMapa = (page) => page.getByRole('list', { name: 'Pontos com localização' })
export const botaoDoPonto = (page, codigo) => listaDoMapa(page).getByRole('button', { name: new RegExp(`\\(${codigo}\\)`) })

/** Abre "Lista dos pontos no mapa" (<details>) se estiver recolhida e devolve a lista de botões por ponto. */
export async function abrirListaDoMapa(page) {
  const lista = listaDoMapa(page)
  if (!(await lista.isVisible())) await page.getByText(/^Lista dos pontos no mapa/).click()
  await expect(lista).toBeVisible()
  return lista
}

/** Abre uma URL do Explorar com o mapa abortado, espera o aviso de fallback e a lista de reserva. */
export async function abrirExplorarSemMapa(page, url = '/pontos') {
  await mapaSemRede(page)
  await page.goto(url)
  await expect(avisoMapa(page)).toBeVisible()
  await abrirListaDoMapa(page)
}

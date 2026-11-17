// Visual premium: Bento, tema escuro, vidro, microinterações, sparklines e galeria de screenshots (modo mock).
// Cores computadas pelo Tailwind 4 vêm em oklch: são convertidas para RGB no navegador (canvas) antes do contraste.
import { test, expect, snap, settle, horizontalOverflow } from 'harness-e2e'

const DESKTOP = { width: 1366, height: 900 }
const MOBILE = { width: 375, height: 812 }
const HISTORICO = '/historico?ponto=MOCK-01&periodo=24h'
const REGIOES = ['Resumo', 'Última medição', 'Evolução recente', 'Insights']

const regiao = (page, nome) => page.getByRole('region', { name: nome, exact: true })
const aguardarDashboard = async (page) => {
  await page.goto('/')
  await expect(regiao(page, 'Resumo')).toBeVisible()
  await expect(regiao(page, 'Insights')).toBeVisible()
}
const aguardarHistorico = async (page) => {
  await page.goto(HISTORICO)
  await expect(regiao(page, 'Evolução')).toBeVisible()
}

/** Retângulos das quatro regiões, na ordem do DOM. */
async function retangulos(page) {
  const out = []
  for (const nome of REGIOES) {
    const box = await regiao(page, nome).boundingBox()
    expect(box, `região ${nome} sem caixa`).not.toBeNull()
    out.push({ nome, ...box })
  }
  return out
}

const sobrepoe = (a, b) =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5

function semSobreposicao(rects) {
  const pares = []
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (sobrepoe(rects[i], rects[j])) pares.push(`${rects[i].nome} x ${rects[j].nome}`)
    }
  }
  return pares
}

test.describe('Bento 1366', () => {
  test.use({ viewport: DESKTOP })

  test('as quatro regiões compartilham uma grade e se distribuem em blocos de larguras diferentes', async ({ page }) => {
    await aguardarDashboard(page)
    await settle(page)
    const r = await page.evaluate((nomes) => {
      const secoes = nomes.map((nome) =>
        [...document.querySelectorAll('section[aria-labelledby]')].find(
          (s) => document.getElementById(s.getAttribute('aria-labelledby'))?.textContent.trim() === nome,
        ),
      )
      const pais = secoes.map((s) => s?.parentElement)
      return {
        todas: pais.every(Boolean),
        mesmoPai: pais.every((p) => p === pais[0]),
        displays: pais.map((p) => p && getComputedStyle(p).display),
      }
    }, REGIOES)
    expect(r.todas, 'seções encontradas').toBe(true)
    expect(r.mesmoPai, 'mesmo elemento pai').toBe(true)
    expect(r.displays).toEqual(['grid', 'grid', 'grid', 'grid'])

    const rects = await retangulos(page)
    const lado = []
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        if (Math.abs(rects[i].y - rects[j].y) <= 4 && Math.abs(rects[i].width - rects[j].width) > 24) lado.push([rects[i].nome, rects[j].nome])
      }
    }
    expect(lado.length, 'blocos lado a lado com larguras diferentes').toBeGreaterThanOrEqual(1)
    expect(semSobreposicao(rects)).toEqual([])
  })

  test('ordem visual (topo, esquerda) coincide com a ordem do DOM', async ({ page }) => {
    await aguardarDashboard(page)
    await settle(page)
    const rects = await retangulos(page)
    const visual = [...rects].sort((a, b) => (Math.abs(a.y - b.y) <= 4 ? a.x - b.x : a.y - b.y)).map((r) => r.nome)
    expect(visual).toEqual(REGIOES)
  })

  test('h1 único e cada região tem um h2 com o próprio nome', async ({ page }) => {
    await aguardarDashboard(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    for (const nome of REGIOES) {
      await expect(regiao(page, nome).getByRole('heading', { level: 2, name: nome, exact: true })).toHaveCount(1)
    }
  })
})

test.describe('Bento 375', () => {
  test.use({ viewport: MOBILE })

  test('as regiões empilham em coluna única, sem sobreposição nem rolagem horizontal', async ({ page }) => {
    await aguardarDashboard(page)
    await settle(page)
    const rects = await retangulos(page)
    for (const r of rects.slice(1)) {
      expect(Math.abs(r.x - rects[0].x), `${r.nome}: left`).toBeLessThanOrEqual(2)
      expect(Math.abs(r.width - rects[0].width), `${r.nome}: largura`).toBeLessThanOrEqual(2)
    }
    for (let i = 1; i < rects.length; i++) {
      expect(rects[i].y, `${rects[i].nome} abaixo de ${rects[i - 1].nome}`).toBeGreaterThan(rects[i - 1].y)
    }
    expect(semSobreposicao(rects)).toEqual([])
    expect(await horizontalOverflow(page)).toEqual([])
  })
})

/** Converte cores computadas (inclusive oklch) para RGBA via canvas e calcula contraste WCAG. */
const medirTema = () => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  ctx.canvas.width = ctx.canvas.height = 1
  const rgba = (cor) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#000'
    ctx.fillStyle = cor
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
    return { r, g, b, a: a / 255 }
  }
  const sobre = (f, t) => ({
    r: f.r * f.a + t.r * (1 - f.a),
    g: f.g * f.a + t.g * (1 - f.a),
    b: f.b * f.a + t.b * (1 - f.a),
    a: 1,
  })
  const fundoEfetivo = (el) => {
    const camadas = []
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor)
      if (c.a > 0) camadas.push(c)
      if (c.a >= 0.999) break
    }
    let base = { r: 255, g: 255, b: 255, a: 1 }
    for (const c of camadas.reverse()) base = sobre(c, base)
    return base
  }
  const lum = ({ r, g, b }) => {
    const [R, G, B] = [r, g, b].map((v) => {
      const s = v / 255
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }
  const contraste = (el) => {
    const fundo = fundoEfetivo(el)
    const texto = sobre(rgba(getComputedStyle(el).color), fundo)
    const [a, b] = [lum(texto), lum(fundo)]
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  }
  const chave = (c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a.toFixed(2)}`
  const bg = (el) => chave(rgba(getComputedStyle(el).backgroundColor))
  const cartao = (() => {
    const raiz = document.querySelector('main section[aria-labelledby]:not(:first-child)') ?? document.querySelector('main')
    const alvo = [raiz, ...raiz.querySelectorAll('*')].find((n) => rgba(getComputedStyle(n).backgroundColor).a > 0)
    return alvo ?? raiz
  })()
  const h2 = document.querySelector('main h2')
  return {
    body: bg(document.body),
    header: bg(document.querySelector('header')),
    cartao: bg(cartao),
    contrasteH1: contraste(document.querySelector('h1')),
    contrasteH2: contraste(h2),
  }
}

for (const [nome, rota, pronto] of [
  ['Dashboard', '/', aguardarDashboard],
  ['Histórico', HISTORICO, aguardarHistorico],
]) {
  test(`${nome}: tema escuro muda fundo, cabeçalho e cartões e mantém contraste AA nos títulos`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
    await pronto(page)
    await settle(page)
    const claro = await page.evaluate(medirTema)
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await settle(page)
    const escuro = await page.evaluate(medirTema)
    expect(escuro.body, `${rota}: body`).not.toBe(claro.body)
    expect(escuro.header, `${rota}: header`).not.toBe(claro.header)
    expect(escuro.cartao, `${rota}: cartão`).not.toBe(claro.cartao)
    for (const [tema, m] of [['claro', claro], ['escuro', escuro]]) {
      expect(m.contrasteH1, `${rota} ${tema}: h1`).toBeGreaterThanOrEqual(4.5)
      expect(m.contrasteH2, `${rota} ${tema}: h2`).toBeGreaterThanOrEqual(4.5)
    }
  })
}

test.describe('Vidro', () => {
  test('cabeçalho usa backdrop-filter e a barra lateral, que se sobrepõe ao conteúdo no hover, é opaca', async ({ page }) => {
    await aguardarDashboard(page)
    const r = await page.evaluate(() => {
      const v = (el) => {
        const cs = getComputedStyle(el)
        return cs.backdropFilter || cs.webkitBackdropFilter || 'none'
      }
      // A barra lateral (aside) cobre o conteúdo ao expandir: o fundo opaco garante a leitura (alfa 1).
      const fundo = getComputedStyle(document.querySelector('aside[data-sidebar]')).backgroundColor
      const alfa = fundo.match(/\/\s*([\d.]+)\s*\)|,\s*([\d.]+)\)\s*$/)
      return { header: v(document.querySelector('header')), alfaSidebar: alfa ? Number(alfa[1] ?? alfa[2]) : 1 }
    })
    expect(r.header).not.toBe('none')
    expect(r.alfaSidebar).toBe(1)
  })

  test('o seletor de período do Histórico usa backdrop-filter', async ({ page }) => {
    await aguardarHistorico(page)
    const grupo = page.getByRole('group', { name: 'Período do histórico' })
    await expect(grupo).toBeVisible()
    const valor = await grupo.evaluate((el) => {
      const cs = getComputedStyle(el)
      return cs.backdropFilter || cs.webkitBackdropFilter || 'none'
    })
    expect(valor).not.toBe('none')
  })

  test('cartões de conteúdo do Dashboard não têm desfoque de fundo', async ({ page }) => {
    await aguardarDashboard(page)
    await expect(regiao(page, 'Pontos monitorados')).toBeVisible()
    const comBlur = await page.evaluate((nomes) => {
      const achados = []
      for (const sec of document.querySelectorAll('section[aria-labelledby]')) {
        const titulo = document.getElementById(sec.getAttribute('aria-labelledby'))?.textContent.trim()
        if (!nomes.includes(titulo)) continue
        for (const el of sec.querySelectorAll('*')) {
          if (el.closest('[role="group"], nav, select, input, button')) continue
          const cs = getComputedStyle(el)
          const v = cs.backdropFilter || cs.webkitBackdropFilter || 'none'
          if (v !== 'none') achados.push(`${titulo}: ${el.tagName.toLowerCase()}.${el.className}`)
        }
      }
      return achados
    }, [...REGIOES, 'Pontos monitorados'])
    expect(comBlur).toEqual([])
  })
})

test.describe('Microinterações e movimento reduzido nos controles', () => {
  const amostra = (page) =>
    page.evaluate(() => {
      const duracao = (el) => {
        const cs = getComputedStyle(el)
        const ms = (cs.transitionDuration || '0s').split(',').map((v) => (v.trim().endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000))
        return { prop: cs.transitionProperty, max: Math.max(...ms) }
      }
      return {
        link: duracao(document.querySelector('nav[aria-label="Navegação principal"] a')),
        botao: duracao(document.querySelector('main [role="group"] button') ?? document.querySelector('main button')),
      }
    })

  test('sem emulação, links e botões têm transição', async ({ page }) => {
    await page.goto(HISTORICO)
    await expect(page.getByRole('group', { name: 'Período do histórico' })).toBeVisible()
    const a = await amostra(page)
    for (const [k, v] of Object.entries(a)) {
      expect(v.prop, `${k}: transitionProperty`).not.toBe('none')
      expect(v.max, `${k}: duração`).toBeGreaterThan(0)
    }
  })

  test('com movimento reduzido, a transição some ou fica imperceptível', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(HISTORICO)
    await expect(page.getByRole('group', { name: 'Período do histórico' })).toBeVisible()
    const a = await amostra(page)
    for (const [k, v] of Object.entries(a)) {
      expect(v.prop === 'none' || v.max <= 0.01, `${k}: ${v.prop} ${v.max}ms`).toBe(true)
    }
  })
})

test.describe('Sparklines', () => {
  const TEMPERATURA = /Tendência de temperatura: mínimo .+, máximo .+, último .+/
  const UMIDADE = /Tendência de umidade: mínimo .+, máximo .+, último .+/

  test('Dashboard: tendências de temperatura e umidade com o último valor em texto', async ({ page }) => {
    await aguardarDashboard(page)
    const evo = regiao(page, 'Evolução recente')
    await expect(evo.getByRole('img', { name: TEMPERATURA })).toBeVisible()
    await expect(evo.getByRole('img', { name: UMIDADE })).toBeVisible()
    await expect(evo.getByText('Último:').first()).toBeVisible()
  })

  test('Histórico: a região Evolução tem as duas tendências', async ({ page }) => {
    await aguardarHistorico(page)
    const evo = regiao(page, 'Evolução')
    await expect(evo.getByRole('img', { name: TEMPERATURA })).toBeVisible()
    await expect(evo.getByRole('img', { name: UMIDADE })).toBeVisible()
  })

  test('ponto sem leituras não exibe tendência', async ({ page }) => {
    await page.goto('/historico?ponto=MOCK-04&periodo=24h')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('main')).toContainText('Nenhuma leitura no período')
    await expect(page.getByRole('img', { name: /Tendência de/ })).toHaveCount(0)
  })
})

const GALERIA = [
  ['dashboard', '/', aguardarDashboard],
  ['historico', HISTORICO, aguardarHistorico],
]
const VIEWPORTS_GALERIA = [['desktop', DESKTOP], ['mobile', MOBILE]]
const TEMAS = [['claro', 'light'], ['escuro', 'dark']]

for (const [tela, , pronto] of GALERIA) {
  for (const [vpNome, vp] of VIEWPORTS_GALERIA) {
    for (const [temaNome, scheme] of TEMAS) {
      test(`snap premium: ${tela} ${vpNome} ${temaNome}`, async ({ page }, testInfo) => {
        await page.setViewportSize(vp)
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await pronto(page)
        await settle(page)
        await snap(page, testInfo, `premium-${tela}-${vpNome}-${temaNome}`)
      })
    }
  }
}

test('Última medição: temperatura e umidade não se sobrepõem em 1366 px', async ({ page }) => {
  await page.setViewportSize(DESKTOP)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await aguardarDashboard(page)
  await settle(page)
  const cartao = regiao(page, 'Última medição')
  const caixa = await cartao.boundingBox()
  const temp = await cartao.getByText(/°C/).first().boundingBox()
  const umid = await cartao.getByText(/%/).first().boundingBox()
  expect(caixa && temp && umid).toBeTruthy()
  const separados = temp.x + temp.width <= umid.x + 1 || umid.x + umid.width <= temp.x + 1 ||
    temp.y + temp.height <= umid.y + 1 || umid.y + umid.height <= temp.y + 1
  expect(separados).toBe(true)
  for (const r of [temp, umid]) {
    expect(r.x).toBeGreaterThanOrEqual(caixa.x - 1)
    expect(r.x + r.width).toBeLessThanOrEqual(caixa.x + caixa.width + 1)
  }
})

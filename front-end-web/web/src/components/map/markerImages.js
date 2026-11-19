import { SHAPE_BY_STATUS, STATUS_COLORS, parseMarkerImageId } from './mapConfig.js'

const SIZE = 28
const PIXEL_RATIO = 2

function tracePath(ctx, shape, c, r) {
  ctx.beginPath()
  if (shape === 'circle') ctx.arc(c, c, r, 0, Math.PI * 2)
  else if (shape === 'triangle') {
    ctx.moveTo(c, c - r - 1)
    ctx.lineTo(c + r + 1, c + r - 1)
    ctx.lineTo(c - r - 1, c + r - 1)
    ctx.closePath()
  } else if (shape === 'diamond') {
    ctx.moveTo(c, c - r - 2)
    ctx.lineTo(c + r + 2, c)
    ctx.lineTo(c, c + r + 2)
    ctx.lineTo(c - r - 2, c)
    ctx.closePath()
  } else ctx.rect(c - r + 1, c - r + 1, (r - 1) * 2, (r - 1) * 2)
}

/**
 * Desenha o marcador no canvas: forma por estado ambiental, cor de reforço,
 * halo branco e contorno tracejado quando o ponto não está online.
 * @param {string} imageId nome gerado por markerImageId
 * @returns {{ data: ImageData, pixelRatio: number }|null} null para nomes que não são de marcador
 */
export function drawMarkerImage(imageId) {
  const parsed = parseMarkerImageId(imageId)
  if (!parsed) return null
  const px = SIZE * PIXEL_RATIO
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  ctx.scale(PIXEL_RATIO, PIXEL_RATIO)
  const shape = SHAPE_BY_STATUS[parsed.status]
  const center = SIZE / 2
  ctx.lineJoin = 'round'
  tracePath(ctx, shape, center, 9)
  ctx.lineWidth = 6
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.fillStyle = STATUS_COLORS[parsed.status]
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#0b1220'
  ctx.setLineDash(parsed.online ? [] : [3, 2.5])
  ctx.stroke()
  return { data: ctx.getImageData(0, 0, px, px), pixelRatio: PIXEL_RATIO }
}

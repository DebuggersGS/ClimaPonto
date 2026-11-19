/** true quando o navegador consegue criar um contexto WebGL (exigido pelo MapLibre). */
export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

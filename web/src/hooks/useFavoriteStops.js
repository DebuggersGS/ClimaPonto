import { useCallback, useState } from 'react'
import { parseFavorites, serializeFavorites, toggleFavorite } from '../utils/favoriteStops.js'

/** Chave única do localStorage: guarda só uma lista de códigos de ponto. */
const STORAGE_KEY = 'climaponto:pontos-favoritos'

function readStored() {
  try {
    return parseFavorites(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // Armazenamento indisponível (modo privado, política do navegador): segue sem favoritos.
    return []
  }
}

function writeStored(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeFavorites(list))
  } catch {
    // Sem persistência, os favoritos valem só nesta sessão; a interface continua funcionando.
  }
}

/**
 * Favoritos locais de pontos (somente códigos). Único acesso ao localStorage
 * para favoritos; a regra de leitura, alternância e limite fica em utils/favoriteStops.js.
 * @returns {{ favorites: string[], isFavorite: (code: string) => boolean, toggle: (code: string) => void }}
 */
export function useFavoriteStops() {
  const [favorites, setFavorites] = useState(readStored)

  const toggle = useCallback(
    (code) => {
      const next = toggleFavorite(favorites, code)
      setFavorites(next)
      writeStored(next)
    },
    [favorites],
  )
  const isFavorite = useCallback((code) => favorites.includes(code), [favorites])

  return { favorites, isFavorite, toggle }
}

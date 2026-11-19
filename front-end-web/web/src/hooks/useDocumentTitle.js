import { useEffect } from 'react'

const APP_NAME = 'ClimaPonto'

/** Atualiza o título da aba do navegador conforme a página atual. */
export function useDocumentTitle(pageTitle) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME
  }, [pageTitle])
}

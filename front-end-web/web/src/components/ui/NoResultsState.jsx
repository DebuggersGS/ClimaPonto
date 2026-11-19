import Button from './Button.jsx'
import EmptyState from './EmptyState.jsx'

/** Estado vazio de busca/filtros, com ação para restaurar a lista. */
export default function NoResultsState({ onClear }) {
  return (
    <EmptyState
      title="Nenhum ponto encontrado"
      message="Nenhum ponto corresponde à busca e aos filtros escolhidos."
      action={<Button onClick={onClear}>Limpar filtros</Button>}
    />
  )
}

import { useMemo, useState } from 'react'
import AdminStopCard from '../components/admin/AdminStopCard.jsx'
import StopForm from '../components/admin/StopForm.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage.jsx'
import PageHeader from '../components/ui/PageHeader.jsx'
import SearchField from '../components/ui/SearchField.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import { useAdminStops } from '../hooks/useAdminStops.js'
import { useDataMode } from '../hooks/useDataMode.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { stopToFormValues } from '../utils/stopValidation.js'

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativos' },
  { value: 'inactive', label: 'Inativos' },
]

function matchesSearch(stop, term) {
  if (!term) return true
  const text = `${stop.code} ${stop.name} ${stop.neighborhood}`.toLocaleLowerCase('pt-BR')
  return text.includes(term)
}

export default function AdminStopsPage() {
  useDocumentTitle('Gerenciar pontos')
  const { stops, isLoading, error, reload, create, update, setActive, remove, readingsCount } = useAdminStops()

  const { mode } = useDataMode()
  const isMock = mode === 'mock'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [form, setForm] = useState(null) // null | { mode: 'create' } | { mode: 'edit', stop }
  const [feedback, setFeedback] = useState(null) // { tone, text }
  const [dialog, setDialog] = useState(null) // { type, stop, count? }
  const [dialogBusy, setDialogBusy] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const visibleStops = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return stops.filter((stop) => {
      if (statusFilter === 'active' && !stop.active) return false
      if (statusFilter === 'inactive' && stop.active) return false
      return matchesSearch(stop, term)
    })
  }, [stops, search, statusFilter])

  const hasFilters = search !== '' || statusFilter !== 'all'

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
  }

  function openCreate() {
    setFeedback(null)
    setForm({ mode: 'create' })
  }

  function openEdit(stop) {
    setFeedback(null)
    setForm({ mode: 'edit', stop })
  }

  async function handleFormSubmit(input) {
    if (form.mode === 'create') {
      const stop = await create(input)
      setFeedback({ tone: 'success', text: `Ponto ${stop.code} cadastrado.` })
    } else {
      const stop = await update(form.stop.id, input)
      setFeedback({ tone: 'success', text: `Ponto ${stop.code} atualizado.` })
    }
    setForm(null)
  }

  async function handleToggleActive(stop) {
    setFeedback(null)
    if (stop.active) {
      setDialog({ type: 'deactivate', stop })
      return
    }
    setBusyId(stop.id)
    try {
      await setActive(stop.id, true)
      setFeedback({ tone: 'success', text: `Ponto ${stop.code} reativado.` })
    } catch (err) {
      setFeedback({ tone: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteRequest(stop) {
    setFeedback(null)
    setBusyId(stop.id)
    try {
      const count = await readingsCount(stop.id)
      setDialog(count > 0 ? { type: 'has-readings', stop, count } : { type: 'delete', stop })
    } catch (err) {
      setFeedback({ tone: 'error', text: err.message })
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDialog() {
    const { type, stop } = dialog
    setDialogBusy(true)
    try {
      if (type === 'delete') {
        await remove(stop.id)
        setFeedback({ tone: 'success', text: `Ponto ${stop.code} excluído.` })
      } else {
        await setActive(stop.id, false)
        setFeedback({ tone: 'success', text: `Ponto ${stop.code} desativado. O histórico foi preservado.` })
      }
    } catch (err) {
      setFeedback({ tone: 'error', text: err.message })
    } finally {
      setDialogBusy(false)
      setDialog(null)
    }
  }

  const dialogContent = {
    delete: {
      title: 'Excluir ponto?',
      body: 'Este ponto não possui leituras. A exclusão é definitiva e não pode ser desfeita.',
      confirmLabel: 'Excluir',
      tone: 'danger',
    },
    deactivate: {
      title: 'Desativar ponto?',
      body: 'O ponto deixará de aparecer para os visitantes. As leituras já registradas serão preservadas e você poderá reativá-lo depois.',
      confirmLabel: 'Desativar',
      tone: 'primary',
    },
    'has-readings': {
      title: 'Este ponto possui histórico',
      body: `Há ${dialog?.count} leitura(s) registrada(s) para este ponto, por isso ele não pode ser excluído. ${
        dialog?.stop.active ? 'Você pode desativá-lo para ocultá-lo dos visitantes, mantendo o histórico.' : 'Ele já está desativado.'
      }`,
      confirmLabel: 'Desativar',
      tone: 'primary',
    },
  }[dialog?.type]

  const canConfirm = dialog && !(dialog.type === 'has-readings' && !dialog.stop.active)

  return (
    <>
      <PageHeader
        title="Gerenciar pontos"
        description="Cadastre, edite, desative ou exclua os pontos monitorados."
        actions={!form ? <Button onClick={openCreate}>Novo ponto</Button> : null}
      />

      {isMock && (
        <FeedbackMessage tone="info">
          Modo demonstração: cadastro, edição, desativação e exclusão valem só na memória desta aba. As alterações
          são descartadas ao recarregar a página e não chegam ao Supabase.
        </FeedbackMessage>
      )}

      <FeedbackMessage tone={feedback?.tone} onDismiss={() => setFeedback(null)}>
        {feedback?.text}
      </FeedbackMessage>

      {form ? (
        <Card className="mb-6">
          <StopForm
            key={form.mode === 'edit' ? form.stop.id : 'new'}
            title={form.mode === 'create' ? 'Novo ponto' : `Editar ${form.stop.code}`}
            submitLabel={form.mode === 'create' ? 'Cadastrar' : 'Salvar alterações'}
            initialValues={form.mode === 'edit' ? stopToFormValues(form.stop) : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setForm(null)}
          />
        </Card>
      ) : (
        <div role="group" aria-label="Busca e filtros dos pontos" className="mb-6 flex flex-col gap-x-4 gap-y-3 sm:flex-row sm:items-end">
          <SearchField
            className="min-w-0 flex-1"
            label="Pesquisar pontos"
            hideLabel={false}
            value={search}
            onValueChange={setSearch}
            placeholder="Código, nome ou bairro"
          />
          <div>
            <label htmlFor="stop-status" className="mb-1 block text-sm font-medium text-slate-800">
              Situação
            </label>
            <select
              id="stop-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block h-field w-full rounded-pill border border-slate-300 bg-surface px-4 text-sm shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:w-44"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {isLoading && (
        <Skeleton shape="table" rows={4} label="Carregando pontos…" />
      )}

      {error && (
        <EmptyState
          variant="error"
          title="Não foi possível carregar os pontos"
          message={error}
          action={<Button onClick={reload}>Tentar novamente</Button>}
        />
      )}

      {!isLoading && !error && (
        <>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-sm font-semibold text-slate-900">Pontos cadastrados</h2>
            <p className="text-sm text-slate-600" aria-live="polite">
              {visibleStops.length} de {stops.length} pontos
            </p>
          </div>
          {visibleStops.length === 0 ? (
            <EmptyState
              title={stops.length === 0 ? 'Nenhum ponto cadastrado' : 'Nenhum ponto encontrado'}
              message={stops.length === 0 ? 'Use "Novo ponto" para cadastrar o primeiro.' : 'Ajuste a pesquisa ou o filtro.'}
            />
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleStops.map((stop) => (
                <li key={stop.id}>
                  <AdminStopCard
                    stop={stop}
                    busy={busyId === stop.id || Boolean(form)}
                    onEdit={openEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteRequest}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialogContent?.title}
        confirmLabel={dialogContent?.confirmLabel}
        cancelLabel={canConfirm ? 'Cancelar' : 'Fechar'}
        tone={dialogContent?.tone}
        busy={dialogBusy}
        onConfirm={canConfirm ? confirmDialog : undefined}
        onCancel={() => setDialog(null)}
      >
        {dialog && (
          <p>
            <strong className="font-mono">{dialog.stop.code}</strong> — {dialog.stop.name}. {dialogContent.body}
          </p>
        )}
      </ConfirmDialog>
    </>
  )
}

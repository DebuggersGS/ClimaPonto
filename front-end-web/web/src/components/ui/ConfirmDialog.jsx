import { useEffect, useRef } from 'react'
import Button from './Button.jsx'

/**
 * Diálogo de confirmação usando o elemento nativo <dialog> (showModal):
 * o navegador cuida do foco preso no diálogo, da tecla Esc e do fundo inerte.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleCancel(event) {
    // Esc: o fechamento é controlado pelo estado do componente pai.
    event.preventDefault()
    if (!busy) onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      aria-labelledby="confirm-dialog-title"
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg p-0 shadow-xl backdrop:bg-ink/60"
    >
      {open && (
        <div className="p-6">
          <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <div className="mt-2 text-sm text-slate-700">{children}</div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button variant={tone} onClick={onConfirm} disabled={busy} autoFocus>
                {busy ? 'Aguarde…' : confirmLabel}
              </Button>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}

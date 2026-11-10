import { useEffect, useRef, useState } from 'react'
import { EMPTY_STOP_FORM, STOP_LIMITS, normalizeStopForm, validateStop } from '../../utils/stopValidation.js'
import Button from '../ui/Button.jsx'
import FeedbackMessage from '../ui/FeedbackMessage.jsx'
import TextField from '../ui/TextField.jsx'

/**
 * Formulário de cadastro/edição de ponto (controlado com useState).
 *
 * @param {object}   props.initialValues  valores do formulário (strings)
 * @param {Function} props.onSubmit       async (stopNormalizado) => void; pode lançar AppError
 * @param {Function} props.onCancel
 * @param {string}   props.submitLabel
 */
export default function StopForm({ initialValues = EMPTY_STOP_FORM, onSubmit, onCancel, submitLabel = 'Salvar', title }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef(null)

  // Leva o foco ao título ao abrir, para leitores de tela e teclado.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  function setField(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError(null)

    const normalized = normalizeStopForm(values)
    const validation = validateStop(normalized)
    if (Object.keys(validation).length) {
      setErrors(validation)
      setFormError('Revise os campos destacados.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(normalized)
    } catch (err) {
      if (err.field) setErrors((current) => ({ ...current, [err.field]: err.message }))
      setFormError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="stop-form-title">
      <h2 id="stop-form-title" ref={headingRef} tabIndex={-1} className="mb-4 text-lg font-semibold text-slate-900 focus:outline-none">
        {title}
      </h2>

      <FeedbackMessage tone="error">{formError}</FeedbackMessage>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Código"
          required
          value={values.code}
          onChange={(e) => setField('code', e.target.value.toUpperCase())}
          error={errors.code}
          hint="Maiúsculas, números e hífens. Ex.: SP-0001"
          maxLength={STOP_LIMITS.codeMax}
          autoComplete="off"
          spellCheck={false}
        />
        <TextField
          label="Nome"
          required
          value={values.name}
          onChange={(e) => setField('name', e.target.value)}
          error={errors.name}
          maxLength={STOP_LIMITS.nameMax}
        />
        <TextField
          label="Bairro ou região"
          required
          value={values.neighborhood}
          onChange={(e) => setField('neighborhood', e.target.value)}
          error={errors.neighborhood}
          maxLength={STOP_LIMITS.neighborhoodMax}
          className="sm:col-span-2"
        />
        <TextField
          label="Descrição"
          multiline
          value={values.description}
          onChange={(e) => setField('description', e.target.value)}
          error={errors.description}
          hint={`Opcional. ${values.description.length}/${STOP_LIMITS.descriptionMax} caracteres.`}
          maxLength={STOP_LIMITS.descriptionMax}
          className="sm:col-span-2"
        />
        <TextField
          label="Latitude"
          inputMode="decimal"
          value={values.latitude}
          onChange={(e) => setField('latitude', e.target.value)}
          error={errors.latitude}
          hint="Opcional. Ex.: -23.561414"
        />
        <TextField
          label="Longitude"
          inputMode="decimal"
          value={values.longitude}
          onChange={(e) => setField('longitude', e.target.value)}
          error={errors.longitude}
          hint="Opcional. Ex.: -46.655881"
        />
      </div>

      <fieldset className="mt-4 space-y-2">
        <legend className="sr-only">Situação do ponto</legend>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={values.active}
            onChange={(e) => setField('active', e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Ativo (visível para visitantes)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={values.isDemo}
            onChange={(e) => setField('isDemo', e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Ponto demonstrativo (fictício, sem sensor real)
        </label>
      </fieldset>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

import { Bell, BellOff, LoaderCircle, X } from 'lucide-react'
import {
  getAlertaCode,
  orderFields,
  prettyLabel,
  prettySeverityLabel,
  prettyStatusLabel,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  isLongTextField,
} from './alertasUtils'

function AlertaEditModal({
  isOpen,
  alertId,
  formValues,
  headerMeta,
  alertTypeOptions,
  addTypeOptionValue,
  isLoading,
  isSaving,
  isRead,
  isTogglingRead,
  onChange,
  onRequestIncludeType,
  onToggleRead,
  onClose,
  onSave,
}) {
  if (!isOpen || !alertId) {
    return null
  }

  const alertaCode =
    getAlertaCode(formValues) ||
    String(alertId)

  const reporterId = headerMeta?.reported_by ?? null
  const reporterName = headerMeta?.reported_by_nome || '-'
  const reportedAt = headerMeta?.created_at

  const reportedAtLabel = reportedAt
    ? new Date(reportedAt).toLocaleString('pt-BR')
    : '-'

  const hiddenFields = new Set([
    'is_read',
    'lido',
    'read_by_me',
    'lido_por_mim',
    'read_at',
    'read_by',
    'resolved_at',
    'resolved_by',
    'resolved_by_nome',
    'reported_by',
    'reported_by_nome',
    'read_by_nome',
    'telegram_message_id',
    'photo_urls',
    'priority_score',
    'notified_channels',
    'raw_text',
  ])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">Alertas</p>
            <h2 className="mt-1 font-display text-2xl font-extrabold text-stone-900">Editar alerta {alertaCode}</h2>
            <div className="mt-2 text-xs text-stone-600">
              <p>
                <span className="font-semibold text-stone-700">Reportado por:</span>{' '}
                {reporterId ? `#${reporterId} - ${reporterName}` : reporterName}
              </p>
              <p>
                <span className="font-semibold text-stone-700">Reportado em:</span> {reportedAtLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 p-2 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              <LoaderCircle size={16} className="animate-spin" />
              Carregando dados do alerta...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Leitura</p>
                  <p className="text-sm font-semibold text-stone-800">{isRead ? 'Lido' : 'Nao lido'}</p>
                </div>
                <button
                  type="button"
                  onClick={onToggleRead}
                  disabled={isTogglingRead}
                  title={isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                  aria-label={isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                  className="inline-flex items-center justify-center rounded-xl border border-stone-300 bg-white p-2.5 text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isTogglingRead ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <>{isRead ? <BellOff size={16} /> : <Bell size={16} />}</>
                  )}
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
              {orderFields(formValues).map((field) => {
                if (hiddenFields.has(field)) {
                  return null
                }

                const value = formValues[field] ?? ''

                if (field === 'severity') {
                  return (
                    <label key={field} className="block md:col-span-1">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">{prettyLabel(field)}</span>
                      <select
                        value={value}
                        onChange={(event) => onChange(field, event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        {SEVERITY_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {prettySeverityLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                }

                if (field === 'status') {
                  return (
                    <label key={field} className="block md:col-span-1">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">{prettyLabel(field)}</span>
                      <select
                        value={value}
                        onChange={(event) => onChange(field, event.target.value)}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        {STATUS_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {prettyStatusLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )
                }

                if (field === 'type') {
                  const hasCurrentType = alertTypeOptions.some(
                    (item) => (item.nome || item.tipo_canonico) === value,
                  )

                  return (
                    <label key={field} className="block md:col-span-1">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">{prettyLabel(field)}</span>
                      <select
                        value={value}
                        onChange={(event) => {
                          if (event.target.value === addTypeOptionValue) {
                            onRequestIncludeType()
                            return
                          }

                          onChange(field, event.target.value)
                        }}
                        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      >
                        {!hasCurrentType && value && value !== addTypeOptionValue && (
                          <option value={value}>{value}</option>
                        )}

                        {alertTypeOptions.map((item) => (
                          <option key={item.id || item.nome || item.tipo_canonico} value={item.nome || item.tipo_canonico}>
                            {item.nome || item.tipo_canonico}
                          </option>
                        ))}

                        <option value={addTypeOptionValue}>Incluir tipo</option>
                      </select>
                    </label>
                  )
                }

                if (isLongTextField(field)) {
                  return (
                    <label key={field} className="block md:col-span-2">
                      <span className="mb-1 block text-xs font-semibold text-stone-600">{prettyLabel(field)}</span>
                      <textarea
                        value={value}
                        onChange={(event) => onChange(field, event.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                      />
                    </label>
                  )
                }

                return (
                  <label key={field} className="block md:col-span-1">
                    <span className="mb-1 block text-xs font-semibold text-stone-600">{prettyLabel(field)}</span>
                    <input
                      value={value}
                      onChange={(event) => onChange(field, event.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F97316] focus:ring-2 focus:ring-orange-200"
                    />
                  </label>
                )
              })}
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-stone-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isLoading || isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C1917] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving && <LoaderCircle size={16} className="animate-spin" />}
            Salvar alteracoes
          </button>
        </footer>
      </div>
    </div>
  )
}

export default AlertaEditModal

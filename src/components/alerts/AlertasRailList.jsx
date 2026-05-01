import { Bell, BellOff, LoaderCircle } from 'lucide-react'
import { getAlertaDescription, getAlertaId, severityClasses } from './alertasUtils'

function formatAlertDateTime(alerta) {
  const value = alerta?.reported_at || alerta?.created_at
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleString('pt-BR')
}

function AlertasRailList({
  alertas,
  isLoading,
  onSelect,
  getAlertaReadState,
  onToggleRead,
  markingReadId,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        <LoaderCircle size={14} className="animate-spin" />
        Carregando alertas...
      </div>
    )
  }

  if (alertas.length === 0) {
    return (
      <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-6 text-center text-xs text-stone-500">
        Nenhum alerta encontrado.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {alertas.map((alerta) => {
        const alertId = getAlertaId(alerta)
        const severity = String(alerta.severity || '').toLowerCase()
        const isRead = getAlertaReadState(alerta)
        const alertDateTime = formatAlertDateTime(alerta)
        const alertDescription = getAlertaDescription(alerta)

        return (
          <div
            key={String(alertId)}
            onClick={() => onSelect(alertId)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelect(alertId)
              }
            }}
            className="w-full cursor-pointer rounded-xl border border-stone-200 bg-[#FAFAF9] px-3 py-2 text-left transition hover:border-stone-300 hover:bg-stone-50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold text-stone-900">{alerta.title || 'Sem titulo'}</p>

              <div className="flex items-center gap-1">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${severityClasses(severity)}`}>
                  {severity || 'N/A'}
                </span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    onToggleRead(alerta)
                  }}
                  disabled={!alertId || markingReadId === alertId}
                  title={isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                  aria-label={isRead ? 'Marcar como nao lido' : 'Marcar como lido'}
                  className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white p-1.5 text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {markingReadId === alertId ? (
                    <LoaderCircle size={13} className="animate-spin" />
                  ) : (
                    <>{isRead ? <BellOff size={13} /> : <Bell size={13} />}</>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">{alerta.type || '-'}</p>
            <p className="mt-1 line-clamp-2 text-xs text-stone-600">{alertDescription || 'Sem descricao'}</p>
            <p className="mt-1 text-[11px] text-stone-500">{alertDateTime}</p>
          </div>
        )
      })}
    </div>
  )
}

export default AlertasRailList

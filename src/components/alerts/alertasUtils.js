export const STATUS_OPTIONS = ['aberto', 'em_atendimento', 'aguardando_peca', 'resolvido', 'cancelado']
export const SEVERITY_OPTIONS = ['baixa', 'media', 'alta', 'critica']

const FIELD_LABELS_PT = {
  title: 'Titulo',
  type: 'Tipo',
  severity: 'Severidade',
  status: 'Status',
  description: 'Descricao',
  resolution_notes: 'Observacoes de resolucao',
  raw_text: 'Texto bruto',
  photo_urls: 'URLs das fotos',
  notified_channels: 'Canais notificados',
  priority_score: 'Pontuacao de prioridade',
  telegram_message_id: 'ID da mensagem no Telegram',
  location_detail: 'Detalhe do local',
  equipment_name: 'Nome do equipamento',
  obra_id: 'ID da obra',
  usuario_id: 'ID do usuario',
  codigo: 'Codigo',
  code: 'Codigo',
}

const NON_EDITABLE_FIELDS = new Set(['id', 'alert_id', 'uuid', 'alert_uuid', 'created_at', 'updated_at'])
const ARRAY_FIELDS = new Set(['photo_urls', 'notified_channels'])
const NUMBER_FIELDS = new Set(['priority_score', 'telegram_message_id', 'obra_id', 'usuario_id'])
const LONG_TEXT_FIELDS = new Set(['description', 'raw_text', 'resolution_notes'])

export function normalizeAlertas(data) {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.alertas)) {
    return data.alertas
  }

  if (Array.isArray(data?.alerts)) {
    return data.alerts
  }

  if (Array.isArray(data?.items)) {
    return data.items
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  return []
}

export function normalizeAlerta(data) {
  if (data?.alerta) {
    return data.alerta
  }

  if (data?.alert) {
    return data.alert
  }

  if (data?.data) {
    return data.data
  }

  return data
}

export function getAlertaId(alerta) {
  return alerta?.id || alerta?.alert_id || alerta?.uuid || alerta?.alert_uuid || null
}

export function prettyLabel(field) {
  if (FIELD_LABELS_PT[field]) {
    return FIELD_LABELS_PT[field]
  }

  return field
    .replaceAll('_', ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function prettyStatusLabel(status) {
  const map = {
    aberto: 'Aberto',
    em_atendimento: 'Em atendimento',
    aguardando_peca: 'Aguardando peca',
    resolvido: 'Resolvido',
    cancelado: 'Cancelado',
  }

  return map[status] || status
}

export function prettySeverityLabel(severity) {
  const map = {
    baixa: 'Baixa',
    media: 'Media',
    alta: 'Alta',
    critica: 'Critica',
  }

  return map[severity] || severity
}

export function getAlertaCode(alertaLike) {
  return (
    alertaLike?.codigo ||
    alertaLike?.code ||
    alertaLike?.alert_code ||
    alertaLike?.codigo_alerta ||
    null
  )
}

export function parseReadValue(value) {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value === 1
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'sim', 'yes'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'nao', 'não', 'no'].includes(normalized)) {
      return false
    }
  }

  return null
}

export function isAlertaRead(alertaLike) {
  if (!alertaLike || typeof alertaLike !== 'object') {
    return false
  }

  const directRead = [
    alertaLike.lido,
    alertaLike.is_read,
    alertaLike.read_by_me,
    alertaLike.lido_por_mim,
  ]
    .map(parseReadValue)
    .find((value) => value !== null)

  if (directRead !== undefined) {
    return directRead ?? false
  }

  if (alertaLike.read_at || alertaLike.lido_em || alertaLike.alert_read_at || alertaLike.last_read_at) {
    return true
  }

  if (Array.isArray(alertaLike.alert_reads) && alertaLike.alert_reads.length > 0) {
    return true
  }

  return false
}

export function severityClasses(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'critica':
      return 'border-red-300 bg-red-50 text-red-700'
    case 'alta':
      return 'border-orange-300 bg-orange-50 text-orange-700'
    case 'media':
      return 'border-amber-300 bg-amber-50 text-amber-700'
    case 'baixa':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700'
    default:
      return 'border-stone-300 bg-stone-50 text-stone-700'
  }
}

export function buildEditableState(alerta) {
  const values = {}
  const types = {}

  Object.entries(alerta || {}).forEach(([field, value]) => {
    if (NON_EDITABLE_FIELDS.has(field)) {
      return
    }

    if (Array.isArray(value)) {
      values[field] = value.join(', ')
      types[field] = 'array'
      return
    }

    if (value && typeof value === 'object') {
      values[field] = JSON.stringify(value)
      types[field] = 'object'
      return
    }

    if (typeof value === 'number') {
      values[field] = String(value)
      types[field] = 'number'
      return
    }

    if (typeof value === 'boolean') {
      values[field] = value ? 'true' : 'false'
      types[field] = 'boolean'
      return
    }

    values[field] = value ?? ''
    types[field] = 'string'
  })

  if (!('title' in values)) values.title = ''
  if (!('type' in values)) values.type = ''
  if (!('severity' in values)) values.severity = 'media'
  if (!('description' in values)) values.description = ''

  return { values, types }
}

export function buildPayloadFromState(formValues, fieldTypes) {
  const payload = {}

  Object.entries(formValues).forEach(([field, rawValue]) => {
    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue

    if (ARRAY_FIELDS.has(field) || fieldTypes[field] === 'array') {
      payload[field] = value ? String(value).split(',').map((item) => item.trim()).filter(Boolean) : []
      return
    }

    if (NUMBER_FIELDS.has(field) || fieldTypes[field] === 'number') {
      payload[field] = value === '' ? null : Number(value)
      return
    }

    if (fieldTypes[field] === 'boolean') {
      const normalized = String(value).toLowerCase()
      payload[field] = ['true', '1', 'sim', 'yes'].includes(normalized)
      return
    }

    if (fieldTypes[field] === 'object') {
      payload[field] = value ? JSON.parse(String(value)) : null
      return
    }

    payload[field] = value
  })

  return payload
}

export function orderFields(formValues) {
  const priority = ['title', 'type', 'severity', 'status', 'description', 'resolution_notes']
  const fields = Object.keys(formValues)

  return fields.sort((a, b) => {
    const indexA = priority.indexOf(a)
    const indexB = priority.indexOf(b)

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b)
    }

    if (indexA === -1) {
      return 1
    }

    if (indexB === -1) {
      return -1
    }

    return indexA - indexB
  })
}

export function isLongTextField(field) {
  return LONG_TEXT_FIELDS.has(field)
}

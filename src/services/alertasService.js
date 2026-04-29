import { apiRequest } from './apiClient'

function buildAlertasQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.append('status', filters.status)
  }

  if (filters.severity) {
    params.append('severity', filters.severity)
  }

  if (typeof filters.apenas_nao_lidos === 'boolean') {
    params.append('apenas_nao_lidos', String(filters.apenas_nao_lidos))
  }

  const queryString = params.toString()
  return queryString ? `/alertas?${queryString}` : '/alertas'
}

export async function listAlertas(token, filters = {}) {
  return apiRequest(buildAlertasQuery(filters), {
    method: 'GET',
    token,
  })
}

export async function getAlertaById(token, alertId) {
  return apiRequest(`/alertas/${alertId}`, {
    method: 'GET',
    token,
  })
}

export async function createAlerta(token, payload) {
  return apiRequest('/alertas', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateAlertaStatus(token, alertId, payload) {
  return apiRequest(`/alertas/${alertId}/status`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function updateAlerta(token, alertId, payload) {
  return apiRequest(`/alertas/${alertId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function markAlertaAsRead(token, alertId) {
  return apiRequest(`/alertas/${alertId}/read`, {
    method: 'POST',
    token,
  })
}

export async function markAlertaAsUnread(token, alertId) {
  return apiRequest(`/alertas/${alertId}/unread`, {
    method: 'POST',
    token,
  })
}

export async function listAlertaTiposSimples(token, options = {}) {
  const params = new URLSearchParams()

  if (typeof options.ativos_apenas === 'boolean') {
    params.append('ativos_apenas', String(options.ativos_apenas))
  }

  const queryString = params.toString()

  return apiRequest(`/alertas/tipos/simples${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    token,
  })
}

export async function createAlertaTipoSimples(token, payload) {
  return apiRequest('/alertas/tipos/simples', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateAlertaTipoSimples(token, tipoId, payload) {
  return apiRequest(`/alertas/tipos/simples/${tipoId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function deleteAlertaTipoSimples(token, tipoId) {
  return apiRequest(`/alertas/tipos/simples/${tipoId}`, {
    method: 'DELETE',
    token,
  })
}

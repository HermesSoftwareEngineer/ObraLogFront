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

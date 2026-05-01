import { apiRequest } from './apiClient'

function buildQuery(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    params.append(key, String(value))
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export async function getDashboardOverview(token, query = {}) {
  return apiRequest(`/dashboard/overview${buildQuery(query)}`, {
    method: 'GET',
    token,
  })
}

export async function getDashboardProducao(token, query) {
  return apiRequest(`/dashboard/producao${buildQuery(query)}`, {
    method: 'GET',
    token,
  })
}

export async function getDashboardAlertas(token, query = {}) {
  return apiRequest(`/dashboard/alertas${buildQuery(query)}`, {
    method: 'GET',
    token,
  })
}

export async function getDashboardEquipe(token, query = {}) {
  return apiRequest(`/dashboard/equipe${buildQuery(query)}`, {
    method: 'GET',
    token,
  })
}

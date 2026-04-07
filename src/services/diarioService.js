import { apiRequest } from './apiClient'

function buildDiaQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.data) {
    params.append('data', filters.data)
  }

  if (filters.frente_servico_id) {
    params.append('frente_servico_id', String(filters.frente_servico_id))
  }

  return `/diario/dia?${params.toString()}`
}

function buildPeriodoQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.data_inicio) {
    params.append('data_inicio', filters.data_inicio)
  }

  if (filters.data_fim) {
    params.append('data_fim', filters.data_fim)
  }

  if (filters.frente_servico_id) {
    params.append('frente_servico_id', String(filters.frente_servico_id))
  }

  if (filters.usuario_id) {
    params.append('usuario_id', String(filters.usuario_id))
  }

  if (typeof filters.apenas_impraticaveis === 'boolean') {
    params.append('apenas_impraticaveis', String(filters.apenas_impraticaveis))
  }

  return `/diario/periodo?${params.toString()}`
}

export async function getDiarioDia(token, filters) {
  return apiRequest(buildDiaQuery(filters), {
    method: 'GET',
    token,
  })
}

export async function getDiarioPeriodo(token, filters) {
  return apiRequest(buildPeriodoQuery(filters), {
    method: 'GET',
    token,
  })
}

export async function exportarDiarioPeriodo(token, filters) {
  return apiRequest(`/diario/exportar?${buildPeriodoQuery(filters).split('?')[1] || ''}`, {
    method: 'GET',
    token,
  })
}

export async function listDiarioFrentes(token) {
  return apiRequest('/diario/frentes', {
    method: 'GET',
    token,
  })
}

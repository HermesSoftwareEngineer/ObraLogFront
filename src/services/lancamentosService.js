import { apiRequest } from './apiClient'

function buildLancamentosQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.append('status', filters.status)
  }

  if (filters.frente_servico_id) {
    params.append('frente_servico_id', String(filters.frente_servico_id))
  }

  if (filters.usuario_id) {
    params.append('usuario_id', String(filters.usuario_id))
  }

  if (filters.data_referencia) {
    params.append('data_referencia', filters.data_referencia)
  }

  if (typeof filters.include_children === 'boolean') {
    params.append('include_children', String(filters.include_children))
  }

  if (filters.limit) {
    params.append('limit', String(filters.limit))
  }

  const queryString = params.toString()
  return queryString ? `/lancamentos?${queryString}` : '/lancamentos'
}

export async function listLancamentos(token, filters = {}) {
  return apiRequest(buildLancamentosQuery(filters), {
    method: 'GET',
    token,
  })
}

export async function createLancamento(token, payload) {
  return apiRequest('/lancamentos', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateLancamento(token, lancamentoId, payload) {
  return apiRequest(`/lancamentos/${lancamentoId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function addLancamentoItem(token, lancamentoId, payload) {
  return apiRequest(`/lancamentos/${lancamentoId}/itens`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function addLancamentoRecurso(token, lancamentoId, payload) {
  return apiRequest(`/lancamentos/${lancamentoId}/recursos`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function addLancamentoMidia(token, lancamentoId, payload) {
  return apiRequest(`/lancamentos/${lancamentoId}/midias`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function confirmarLancamento(token, lancamentoId) {
  return apiRequest(`/lancamentos/${lancamentoId}/confirmar`, {
    method: 'POST',
    token,
  })
}

export async function descartarLancamento(token, lancamentoId) {
  return apiRequest(`/lancamentos/${lancamentoId}/descartar`, {
    method: 'POST',
    token,
  })
}

export async function consolidarLancamento(token, lancamentoId, payload) {
  return apiRequest(`/lancamentos/${lancamentoId}/consolidar`, {
    method: 'POST',
    token,
    body: payload,
  })
}

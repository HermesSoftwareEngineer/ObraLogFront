import { apiRequest } from './apiClient'

function buildMensagensCampoQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.append('status', filters.status)
  }

  if (filters.telegram_chat_id) {
    params.append('telegram_chat_id', String(filters.telegram_chat_id))
  }

  if (filters.limit) {
    params.append('limit', String(filters.limit))
  }

  const queryString = params.toString()
  return queryString ? `/mensagens-campo?${queryString}` : '/mensagens-campo'
}

export async function listMensagensCampo(token, filters = {}) {
  return apiRequest(buildMensagensCampoQuery(filters), {
    method: 'GET',
    token,
  })
}

export async function getMensagemCampoById(token, mensagemId) {
  return apiRequest(`/mensagens-campo/${mensagemId}`, {
    method: 'GET',
    token,
  })
}

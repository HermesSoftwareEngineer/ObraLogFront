import { apiRequest } from './apiClient'

function appendPaginationParams(params, options = {}) {
  if (Number.isFinite(options.page) && options.page >= 1) {
    params.append('page', String(options.page))
  }

  if (Number.isFinite(options.per_page) && options.per_page >= 1) {
    params.append('per_page', String(options.per_page))
  }
}

function buildConversasQuery(options = {}) {
  const params = new URLSearchParams()
  appendPaginationParams(params, options)

  const queryString = params.toString()
  return queryString ? `/chat/conversas?${queryString}` : '/chat/conversas'
}

function buildMensagensQuery(chatId, options = {}) {
  const params = new URLSearchParams()
  params.append('chat_id', String(chatId))
  appendPaginationParams(params, options)

  const queryString = params.toString()
  return `/chat/mensagens?${queryString}`
}

function buildMensagensLegacyQuery(chatId, options = {}) {
  const params = new URLSearchParams()
  appendPaginationParams(params, options)

  const queryString = params.toString()
  return queryString
    ? `/chat/conversas/${chatId}/mensagens?${queryString}`
    : `/chat/conversas/${chatId}/mensagens`
}

export async function listChatConversas(token, options = {}) {
  return apiRequest(buildConversasQuery(options), {
    method: 'GET',
    token,
  })
}

export async function listChatMensagens(token, chatId, options = {}) {
  return apiRequest(buildMensagensQuery(chatId, options), {
    method: 'GET',
    token,
  })
}

export async function listChatMensagensLegacy(token, chatId, options = {}) {
  return apiRequest(buildMensagensLegacyQuery(chatId, options), {
    method: 'GET',
    token,
  })
}

export async function listChatMensagensWithFallback(token, chatId, options = {}) {
  try {
    return await listChatMensagens(token, chatId, options)
  } catch (err) {
    if (err?.status === 404) {
      return listChatMensagensLegacy(token, chatId, options)
    }
    throw err
  }
}

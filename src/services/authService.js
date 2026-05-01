import { apiRequest } from './apiClient'

export async function registerUser({ nome, email, senha, telefone }) {
  const body = { nome, email, senha }

  if (telefone) {
    body.telefone = telefone
  }

  return apiRequest('/auth/register', {
    method: 'POST',
    body,
  })
}

export async function loginUser({ email, senha }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, senha },
  })
}

export async function getCurrentUser(token) {
  return apiRequest('/auth/me', {
    method: 'GET',
    token,
  })
}

export async function linkTelegramChatId(token, telegramChatId) {
  return apiRequest('/auth/link-telegram', {
    method: 'PATCH',
    token,
    body: {
      telegram_chat_id: telegramChatId,
    },
  })
}

export async function generateTelegramLinkCode(token, payload) {
  return apiRequest('/auth/telegram-link-codes', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function createInviteCode(token, payload) {
  return apiRequest('/auth/invite-codes', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function listInviteCodes(token) {
  return apiRequest('/auth/invite-codes', {
    method: 'GET',
    token,
  })
}

export async function cancelInviteCode(token, inviteCode) {
  return apiRequest(`/auth/invite-codes/${encodeURIComponent(inviteCode)}`, {
    method: 'DELETE',
    token,
  })
}

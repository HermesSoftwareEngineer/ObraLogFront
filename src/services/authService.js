import { apiRequest } from './apiClient'

export async function registerUser({ nome, email, senha }) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: { nome, email, senha },
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

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

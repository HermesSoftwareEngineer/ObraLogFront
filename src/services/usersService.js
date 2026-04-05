import { apiRequest } from './apiClient'

export async function listUsers(token) {
  return apiRequest('/usuarios', {
    method: 'GET',
    token,
  })
}

export async function getUserById(token, userId) {
  return apiRequest(`/usuarios/${userId}`, {
    method: 'GET',
    token,
  })
}

export async function createUser(token, payload) {
  return apiRequest('/usuarios', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateUser(token, userId, payload) {
  return apiRequest(`/usuarios/${userId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function deleteUser(token, userId) {
  return apiRequest(`/usuarios/${userId}`, {
    method: 'DELETE',
    token,
  })
}

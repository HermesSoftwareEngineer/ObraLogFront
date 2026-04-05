import { apiRequest } from './apiClient'

export async function listRegistros(token) {
  return apiRequest('/registros', {
    method: 'GET',
    token,
  })
}

export async function getRegistroById(token, registroId) {
  return apiRequest(`/registros/${registroId}`, {
    method: 'GET',
    token,
  })
}

export async function createRegistro(token, payload) {
  return apiRequest('/registros', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateRegistro(token, registroId, payload) {
  return apiRequest(`/registros/${registroId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function deleteRegistro(token, registroId) {
  return apiRequest(`/registros/${registroId}`, {
    method: 'DELETE',
    token,
  })
}

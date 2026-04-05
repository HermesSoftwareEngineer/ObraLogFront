import { apiRequest } from './apiClient'

export async function listFrentesServico(token) {
  return apiRequest('/frentes-servico', {
    method: 'GET',
    token,
  })
}

export async function getFrenteServicoById(token, frenteId) {
  return apiRequest(`/frentes-servico/${frenteId}`, {
    method: 'GET',
    token,
  })
}

export async function createFrenteServico(token, payload) {
  return apiRequest('/frentes-servico', {
    method: 'POST',
    token,
    body: payload,
  })
}

export async function updateFrenteServico(token, frenteId, payload) {
  return apiRequest(`/frentes-servico/${frenteId}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

export async function deleteFrenteServico(token, frenteId) {
  return apiRequest(`/frentes-servico/${frenteId}`, {
    method: 'DELETE',
    token,
  })
}

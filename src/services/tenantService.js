import { apiRequest } from './apiClient'

export async function getTenant(token) {
  return apiRequest('/tenant', {
    method: 'GET',
    token,
  })
}

export async function updateTenant(token, payload) {
  return apiRequest('/tenant', {
    method: 'PATCH',
    token,
    body: payload,
  })
}
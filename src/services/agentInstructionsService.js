import { apiRequest } from './apiClient'

export async function getAgentInstructions(token) {
  return apiRequest('/agent/instructions', {
    method: 'GET',
    token,
  })
}

export async function updateAgentInstructions(token, content) {
  return apiRequest('/agent/instructions', {
    method: 'PUT',
    token,
    body: {
      content,
    },
  })
}

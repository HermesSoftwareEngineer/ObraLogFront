import { apiRequest } from './apiClient'

function buildRegistrosQuery(filters = {}) {
  const params = new URLSearchParams()

  if (filters.data) {
    params.append('data', filters.data)
  }

  if (filters.frente_servico_id) {
    params.append('frente_servico_id', String(filters.frente_servico_id))
  }

  if (filters.usuario_id) {
    params.append('usuario_id', String(filters.usuario_id))
  }

  const queryString = params.toString()
  return queryString ? `/registros?${queryString}` : '/registros'
}

export async function listRegistros(token, filters = {}) {
  return apiRequest(buildRegistrosQuery(filters), {
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

export async function listRegistroImagens(token, registroId) {
  return apiRequest(`/registros/${registroId}/imagens`, {
    method: 'GET',
    token,
  })
}

export async function uploadRegistroImagem(token, registroId, imageFile) {
  const formData = new FormData()
  formData.append('imagem', imageFile)

  return apiRequest(`/registros/${registroId}/imagens`, {
    method: 'POST',
    token,
    body: formData,
  })
}

export async function deleteRegistroImagem(token, registroId, imageId) {
  return apiRequest(`/registros/${registroId}/imagens/${imageId}`, {
    method: 'DELETE',
    token,
  })
}

import { clearAuthSession } from './authStorage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

function getApiErrorMessage(data, responseStatus) {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (data && typeof data === 'object') {
    if (typeof data.error === 'string' && data.error.trim()) {
      return data.error
    }

    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message
    }
  }

  if (responseStatus >= 500) {
    return 'Erro interno no servidor.'
  }

  return 'Erro ao comunicar com o servidor.'
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, headers = {} } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const hasBody = body !== undefined && body !== null

  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      method,
      headers: {
        ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: hasBody ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })

    const data = await parseResponseBody(response)

    if (!response.ok) {
      // Handle 401 Unauthorized - session expired
      if (response.status === 401) {
        clearAuthSession()
        window.location.href = '/login'
      }
      throw new ApiError(getApiErrorMessage(data, response.status), response.status)
    }

    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new ApiError('Falha de conexao com o servidor.', 0)
  }
}

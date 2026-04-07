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

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token, headers = {} } = options
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const hasBody = body !== undefined && body !== null

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
    const message = data?.error || data?.message || 'Erro ao comunicar com o servidor.'
    throw new ApiError(message, response.status)
  }

  return data
}

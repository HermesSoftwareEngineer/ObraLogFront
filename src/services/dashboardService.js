import { apiRequest } from './apiClient'

export async function getDashboardOverview(token) {
  return apiRequest('/dashboard/overview', {
    method: 'GET',
    token,
  })
}

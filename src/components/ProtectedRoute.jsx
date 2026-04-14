import { Navigate } from 'react-router-dom'
import { getAuthToken, getStoredUser } from '../services/authStorage'
import { hasAnyLevelAccess } from '../services/accessControl'

function ProtectedRoute({ children, allowedLevels = [] }) {
  const token = getAuthToken()
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyLevelAccess(user, allowedLevels)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

const LEVEL_RANK = {
  encarregado: 1,
  gerente: 2,
  administrador: 3,
}

export function getUserLevelRank(user) {
  const level = user?.nivel_acesso
  return LEVEL_RANK[level] || 0
}

export function hasAnyLevelAccess(user, allowedLevels = []) {
  if (!Array.isArray(allowedLevels) || allowedLevels.length === 0) {
    return true
  }

  const userRank = getUserLevelRank(user)
  return allowedLevels.some((level) => userRank >= (LEVEL_RANK[level] || 0))
}

export function isManagerOrAdmin(user) {
  return hasAnyLevelAccess(user, ['gerente'])
}

export function isAdmin(user) {
  return hasAnyLevelAccess(user, ['administrador'])
}

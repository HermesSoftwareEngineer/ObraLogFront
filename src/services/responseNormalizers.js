export function normalizeCollection(data, keys = []) {
  if (Array.isArray(data)) {
    return data
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key]
    }
  }

  return []
}

export function normalizeEntity(data, keys = []) {
  for (const key of keys) {
    if (data?.[key] && typeof data[key] === 'object') {
      return data[key]
    }
  }

  return data
}

export function getEntityId(entity, idKeys = []) {
  for (const key of idKeys) {
    if (entity?.[key] !== undefined && entity?.[key] !== null) {
      return entity[key]
    }
  }

  return null
}

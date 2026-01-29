export function getCurrentUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

export function hasRole(role) {
  const u = getCurrentUser()
  if (!u) return false
  if (role === 'admin') return u.role === 'admin' || u.isAdmin === true
  return u.role === role
}

export function requireRole(role) {
  const u = getCurrentUser()
  if (!u) return false
  if (role === 'admin') return u.role === 'admin' || u.isAdmin === true
  return u.role === role
}

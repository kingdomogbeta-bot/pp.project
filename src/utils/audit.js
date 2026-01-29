import { getCurrentUser } from './auth'

function readLogs() {
  try {
    const raw = localStorage.getItem('audit_logs')
    return raw ? JSON.parse(raw) : []
  } catch (e) { return [] }
}

export function logAction(action, entity, details) {
  try {
    const user = getCurrentUser()
    const entry = {
      id: 'a' + Date.now() + Math.random().toString(36).slice(2,6),
      action,
      entity,
      details: details || null,
      user: user?.email || user?.name || 'unknown',
      time: new Date().toISOString()
    }
    const logs = readLogs()
    logs.unshift(entry)
    localStorage.setItem('audit_logs', JSON.stringify(logs))
    return entry
  } catch (e) { return null }
}

export function getAuditLogs(limit = 200) {
  try {
    const logs = readLogs()
    return logs.slice(0, limit)
  } catch (e) { return [] }
}

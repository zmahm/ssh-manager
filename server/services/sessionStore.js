// In-memory store for active SSH sessions (terminal + stats)
const sessions = new Map()

export function setSession(sessionId, data) {
  sessions.set(sessionId, data)
}

export function getSession(sessionId) {
  return sessions.get(sessionId)
}

export function deleteSession(sessionId) {
  sessions.delete(sessionId)
}

export function getAllSessions() {
  return sessions
}

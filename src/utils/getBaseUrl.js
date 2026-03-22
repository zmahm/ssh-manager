const API_URL = import.meta.env.VITE_API_URL || ''

export function getApiBase() {
  return API_URL
}

export function getWsBase() {
  if (API_URL) {
    return API_URL.replace(/^http/, 'ws')
  }
  // Same host as page (works through Vite proxy in dev)
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}

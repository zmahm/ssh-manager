import axios from 'axios'
import { getApiBase } from '../utils/getBaseUrl'

const client = axios.create({
  baseURL: getApiBase(),
})

// Attach JWT + derived key from sessionStorage on every request
client.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken')
  const derivedKey = sessionStorage.getItem('derivedKey')
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  if (derivedKey) config.headers['X-Derived-Key'] = derivedKey
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let pendingQueue = []

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err)
    }
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers['Authorization'] = `Bearer ${token}`
        return client(original)
      })
    }
    original._retry = true
    isRefreshing = true
    try {
      const refreshToken = sessionStorage.getItem('refreshToken')
      if (!refreshToken) throw new Error('No refresh token')
      const { data } = await axios.post(`${getApiBase()}/api/auth/refresh`, { refreshToken })
      sessionStorage.setItem('accessToken', data.accessToken)
      sessionStorage.setItem('refreshToken', data.refreshToken)
      pendingQueue.forEach(({ resolve }) => resolve(data.accessToken))
      pendingQueue = []
      original.headers['Authorization'] = `Bearer ${data.accessToken}`
      return client(original)
    } catch (refreshErr) {
      pendingQueue.forEach(({ reject }) => reject(refreshErr))
      pendingQueue = []
      sessionStorage.clear()
      window.location.reload()
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default client

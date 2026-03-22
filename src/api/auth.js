import client from './client'
import axios from 'axios'
import { getApiBase } from '../utils/getBaseUrl'

export async function getStatus() {
  const { data } = await axios.get(`${getApiBase()}/api/auth/status`)
  return data
}

export async function setup(password) {
  const { data } = await axios.post(`${getApiBase()}/api/auth/setup`, { password })
  return data
}

export async function login(password) {
  const { data } = await axios.post(`${getApiBase()}/api/auth/login`, { password })
  return data
}

export async function refreshTokens(refreshToken) {
  const { data } = await axios.post(`${getApiBase()}/api/auth/refresh`, { refreshToken })
  return data
}

export async function logout() {
  await client.post('/api/auth/logout')
}

import { useEffect, useState } from 'react'
import { getStatus } from './api/auth'
import useAuthStore from './store/authStore'
import SetupScreen from './components/auth/SetupScreen'
import LoginScreen from './components/auth/LoginScreen'
import AppShell from './components/layout/AppShell'

export default function App() {
  const { isAuthenticated, isSetupComplete, setSetupComplete } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStatus()
      .then(({ isSetup }) => setSetupComplete(isSetup))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Check if already authenticated via session storage
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken')
    const key = sessionStorage.getItem('derivedKey')
    if (token && key) {
      useAuthStore.getState().loginSuccess({
        accessToken: token,
        refreshToken: sessionStorage.getItem('refreshToken') || '',
        derivedKey: key,
      })
    }
  }, [])

  // Capacitor: lock app when backgrounded
  useEffect(() => {
    let cleanup = () => {}
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) useAuthStore.getState().lock()
      }).then(handle => {
        cleanup = () => handle.remove()
      })
    }).catch(() => {})
    return cleanup
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isSetupComplete) return <SetupScreen />
  if (!isAuthenticated) return <LoginScreen />
  return <AppShell />
}

import { useState } from 'react'
import { motion } from 'framer-motion'
import { login } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Button from '../shared/Button'
import Input from '../shared/Input'

export default function LoginScreen() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginSuccess = useAuthStore(s => s.loginSuccess)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(password)
      loginSuccess(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-800 border border-gray-700 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-100">SSH Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your master password to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Master Password"
            type="password"
            placeholder="Enter master password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={error}
            autoFocus
          />
          <Button type="submit" className="w-full" loading={loading}>
            Unlock
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

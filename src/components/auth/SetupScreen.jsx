import { useState } from 'react'
import { motion } from 'framer-motion'
import { setup } from '../../api/auth'
import useAuthStore from '../../store/authStore'
import Button from '../shared/Button'
import Input from '../shared/Input'

export default function SetupScreen() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const loginSuccess = useAuthStore(s => s.loginSuccess)
  const setSetupComplete = useAuthStore(s => s.setSetupComplete)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const data = await setup(password)
      setSetupComplete(true)
      loginSuccess(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed')
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mb-4">
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-100">Create Master Password</h1>
          <p className="text-sm text-gray-500 mt-1">This protects all your SSH credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Master Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            error={error}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create & Unlock
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

import { useState } from 'react'
import { themes } from './terminalThemes'
import Button from '../shared/Button'

export default function TerminalToolbar({ status, themeName, onChangeTheme, onSearch, onDisconnect }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const statusColors = {
    connecting: 'text-yellow-400',
    connected: 'text-emerald-400',
    closed: 'text-gray-500',
    error: 'text-red-400',
    idle: 'text-gray-600',
  }

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 border-b border-gray-800 shrink-0">
      {/* Status indicator */}
      <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColors[status] || 'text-gray-500'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-400 animate-pulse-slow' : 'bg-current'}`} />
        {status}
      </div>

      <div className="flex-1" />

      {/* Search */}
      {searchOpen && (
        <form onSubmit={handleSearch} className="flex items-center gap-1">
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 w-40 focus:outline-none focus:border-indigo-500"
          />
          <Button type="submit" variant="ghost" size="icon">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </Button>
        </form>
      )}

      <Button
        variant="ghost" size="icon"
        onClick={() => setSearchOpen(v => !v)}
        title="Search"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </Button>

      {/* Theme picker */}
      <select
        value={themeName}
        onChange={e => onChangeTheme(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-indigo-500"
      >
        {Object.entries(themes).map(([key, t]) => (
          <option key={key} value={key}>{t.name}</option>
        ))}
      </select>

      {/* Disconnect */}
      {status === 'connected' && (
        <Button variant="danger" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      )}
    </div>
  )
}

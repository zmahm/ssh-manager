import { useRef } from 'react'
import { useTerminal } from '../../hooks/useTerminal'
import TerminalToolbar from './TerminalToolbar'
import 'xterm/css/xterm.css'

export default function TerminalPane({ tab }) {
  const containerRef = useRef(null)
  const { status, themeName, changeTheme, search, disconnect } = useTerminal({ containerRef, tab })

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <TerminalToolbar
        status={status}
        themeName={themeName}
        onChangeTheme={changeTheme}
        onSearch={search}
        onDisconnect={disconnect}
      />
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}

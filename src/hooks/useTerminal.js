import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { SearchAddon } from 'xterm-addon-search'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { themes, defaultTheme } from '../components/terminal/terminalThemes'
import { useWebSocket } from './useWebSocket'
import useSessionStore from '../store/sessionStore'

export function useTerminal({ containerRef, tab }) {
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const searchAddonRef = useRef(null)
  const initializedRef = useRef(false)
  const [themeName, setThemeName] = useState(defaultTheme)
  const [status, setStatus] = useState('idle')
  const setTabStatus = useSessionStore(s => s.setTabStatus)

  const { send, sendJSON, wsRef } = useWebSocket({
    path: `/ws/terminal`,
    enabled: !!tab,
    onOpen: () => {
      // Send connect request
      sendJSON({
        type: 'connect',
        profileId: tab.profileId,
        sessionId: tab.id,
        cols: termRef.current?.cols || 80,
        rows: termRef.current?.rows || 24,
      })
    },
    onMessage: (e) => {
      if (!termRef.current) return
      // Binary = raw terminal data
      if (e.data instanceof ArrayBuffer) {
        termRef.current.write(new Uint8Array(e.data))
        return
      }
      const msg = JSON.parse(e.data)
      if (msg.type === 'ready') {
        setStatus('connected')
        setTabStatus(tab.id, 'connected')
      } else if (msg.type === 'closed') {
        setStatus('closed')
        setTabStatus(tab.id, 'closed')
        termRef.current.writeln('\r\n\x1b[33m[Connection closed]\x1b[0m')
      } else if (msg.type === 'error') {
        setStatus('error')
        setTabStatus(tab.id, 'error')
        termRef.current.writeln(`\r\n\x1b[31m[Error: ${msg.message}]\x1b[0m`)
      } else if (msg.type === 'connecting') {
        termRef.current.writeln('\x1b[36mConnecting...\x1b[0m')
      }
    },
    onClose: () => {
      setStatus('closed')
    },
  })

  // Mount xterm once
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      theme: themes[defaultTheme].theme,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    const searchAddon = new SearchAddon()
    const linksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(searchAddon)
    term.loadAddon(linksAddon)
    term.open(containerRef.current)

    fitAddonRef.current = fitAddon
    searchAddonRef.current = searchAddon
    termRef.current = term

    // Fit after DOM is ready
    requestAnimationFrame(() => {
      try { fitAddon.fit() } catch {}
    })

    // Handle input → send as binary
    term.onData((data) => {
      send(new TextEncoder().encode(data))
    })

    // Handle resize
    term.onResize(({ cols, rows }) => {
      sendJSON({ type: 'resize', cols, rows })
    })

    // ResizeObserver for container size changes
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        try { fitAddon.fit() } catch {}
      })
    })
    ro.observe(containerRef.current)

    // Mobile touch helpers
    setupMobileKeys(term)

    return () => {
      ro.disconnect()
      term.dispose()
      initializedRef.current = false
    }
  }, []) // mount once

  // Theme switching
  const changeTheme = useCallback((name) => {
    setThemeName(name)
    termRef.current?.options.theme && (termRef.current.options.theme = themes[name]?.theme)
    if (termRef.current && themes[name]) {
      termRef.current.options.theme = themes[name].theme
    }
  }, [])

  // Search
  const search = useCallback((query, opts) => {
    searchAddonRef.current?.findNext(query, opts)
  }, [])

  const disconnect = useCallback(() => {
    sendJSON({ type: 'disconnect', sessionId: tab?.id })
    wsRef.current?.close()
  }, [tab?.id])

  return { termRef, status, themeName, changeTheme, search, disconnect }
}

function setupMobileKeys(term) {
  // Basic mobile touch support: send Ctrl+C on long press area
  // More comprehensive: handled by xterm's built-in touch events
  term.element?.addEventListener('touchstart', () => {}, { passive: true })
}

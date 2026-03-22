import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

// A "tab" is one active connection to a profile with a terminal + stats + docker view
const useSessionStore = create((set, get) => ({
  tabs: [],          // [{ id, profileId, label, color, activeView: 'terminal'|'stats'|'docker', status }]
  activeTabId: null,

  openTab: (profile) => {
    const existing = get().tabs.find(t => t.profileId === profile.id)
    if (existing) {
      set({ activeTabId: existing.id })
      return existing.id
    }
    const id = uuidv4()
    const tab = {
      id,
      profileId: profile.id,
      label: profile.label,
      color: profile.color,
      activeView: 'terminal',
      status: 'connecting',
    }
    set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }))
    return id
  },

  closeTab: (tabId) => {
    set((s) => {
      const remaining = s.tabs.filter(t => t.id !== tabId)
      const newActive = s.activeTabId === tabId
        ? (remaining[remaining.length - 1]?.id || null)
        : s.activeTabId
      return { tabs: remaining, activeTabId: newActive }
    })
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  setTabView: (tabId, view) => set((s) => ({
    tabs: s.tabs.map(t => t.id === tabId ? { ...t, activeView: view } : t),
  })),

  setTabStatus: (tabId, status) => set((s) => ({
    tabs: s.tabs.map(t => t.id === tabId ? { ...t, status } : t),
  })),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId) || null
  },
}))

export default useSessionStore

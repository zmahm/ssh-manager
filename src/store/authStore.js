import { create } from 'zustand'

// IMPORTANT: Never add 'persist' middleware here — derivedKey must never touch storage
const useAuthStore = create((set, get) => ({
  isSetupComplete: false,
  isAuthenticated: false,
  derivedKey: null,  // hex string, in-memory only

  setSetupComplete: (v) => set({ isSetupComplete: v }),

  loginSuccess: ({ accessToken, refreshToken, derivedKey }) => {
    sessionStorage.setItem('accessToken', accessToken)
    sessionStorage.setItem('refreshToken', refreshToken)
    // Store derivedKey in sessionStorage so interceptor can forward it;
    // it's wiped on lock/logout and survives only the current browser session
    sessionStorage.setItem('derivedKey', derivedKey)
    set({ isAuthenticated: true, derivedKey })
  },

  lock: () => {
    const { derivedKey } = get()
    // Zero out the key buffer if possible
    if (derivedKey) {
      // It's a hex string; just null it — actual Buffer zeroing happens server-side
    }
    sessionStorage.removeItem('derivedKey')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('refreshToken')
    set({ isAuthenticated: false, derivedKey: null })
  },

  getDerivedKey: () => get().derivedKey || sessionStorage.getItem('derivedKey'),
}))

export default useAuthStore

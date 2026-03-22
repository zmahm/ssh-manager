import { create } from 'zustand'

const useProfileStore = create((set) => ({
  profiles: [],
  selectedProfileId: null,

  setProfiles: (profiles) => set({ profiles }),
  selectProfile: (id) => set({ selectedProfileId: id }),
  clearSelection: () => set({ selectedProfileId: null }),
}))

export default useProfileStore

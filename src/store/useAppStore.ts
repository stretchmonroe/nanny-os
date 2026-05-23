import { create } from 'zustand'

type AppStore = {
  authReady: boolean
  setAuthReady: (v: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  authReady: false,
  setAuthReady: (v) => set({ authReady: v }),
}))

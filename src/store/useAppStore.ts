import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AppStore {
  activeChildId: string
  setActiveChildId: (id: string) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeChildId: 'mateo',
      setActiveChildId: (id) => set({ activeChildId: id }),
    }),
    { name: 'ankur-app-store' }
  )
)

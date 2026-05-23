import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = "parent" | "nanny"

export type ActiveChild = {
  id: string
  name: string
  birthDate: string | null
}

type AppStore = {
  authReady:       boolean
  profileFullName: string | null
  currentUserRole: UserRole | null
  activeChild:     ActiveChild | null

  setAuthReady:       (v: boolean) => void
  setProfileFullName: (v: string | null) => void
  setCurrentUserRole: (v: UserRole | null) => void
  setActiveChild:     (v: ActiveChild | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      authReady:       false,
      profileFullName: null,
      currentUserRole: null,
      activeChild:     null,

      setAuthReady:       (v) => set({ authReady: v }),
      setProfileFullName: (v) => set({ profileFullName: v }),
      setCurrentUserRole: (v) => set({ currentUserRole: v }),
      setActiveChild:     (v) => set({ activeChild: v }),
    }),
    {
      name: 'ankur-app-store',
      // Only persist child/role — authReady and profileFullName are always re-fetched.
      partialize: (state) => ({
        activeChild:     state.activeChild,
        currentUserRole: state.currentUserRole,
      }),
    }
  )
)

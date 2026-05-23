import { create } from 'zustand'

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

export const useAppStore = create<AppStore>((set) => ({
  authReady:       false,
  profileFullName: null,
  currentUserRole: null,
  activeChild:     null,

  setAuthReady:       (v) => set({ authReady: v }),
  setProfileFullName: (v) => set({ profileFullName: v }),
  setCurrentUserRole: (v) => set({ currentUserRole: v }),
  setActiveChild:     (v) => set({ activeChild: v }),
}))

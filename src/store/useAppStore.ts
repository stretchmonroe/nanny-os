import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChildInfo {
  id: string
  name: string
  age: string
}

export interface MemberNames {
  nanny: string
  parent: string
}

export interface AppStore {
  authReady: boolean
  activeChildId: string
  activeChild: ChildInfo
  memberNames: MemberNames
  currentUserRole: "nanny" | "parent" | null
  setAuthReady: (v: boolean) => void
  setActiveChildId: (id: string) => void
  setActiveChild: (child: ChildInfo) => void
  setMemberNames: (names: MemberNames) => void
  setCurrentUserRole: (role: "nanny" | "parent" | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      authReady:       false,
      activeChildId:   'mateo',
      activeChild:     { id: 'mateo', name: 'Mateo', age: '18 months' },
      memberNames:     { nanny: 'Caregiver', parent: 'Parent' },
      currentUserRole: null,
      setAuthReady:       (v)     => set({ authReady: v }),
      setActiveChildId:   (id)    => set({ activeChildId: id }),
      setActiveChild:     (child) => set({ activeChild: child, activeChildId: child.id }),
      setMemberNames:     (names) => set({ memberNames: names }),
      setCurrentUserRole: (role)  => set({ currentUserRole: role }),
    }),
    {
      name: 'ankur-app-store',
      // authReady is transient — never persist it
      partialize: (state) => ({
        activeChildId:   state.activeChildId,
        activeChild:     state.activeChild,
        memberNames:     state.memberNames,
        currentUserRole: state.currentUserRole,
      }),
    }
  )
)

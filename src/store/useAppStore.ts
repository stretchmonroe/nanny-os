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
  activeChildId: string
  activeChild: ChildInfo
  memberNames: MemberNames
  currentUserRole: "nanny" | "parent" | null
  setActiveChildId: (id: string) => void
  setActiveChild: (child: ChildInfo) => void
  setMemberNames: (names: MemberNames) => void
  setCurrentUserRole: (role: "nanny" | "parent" | null) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeChildId:   'mateo',
      activeChild:     { id: 'mateo', name: 'Mateo', age: '18 months' },
      memberNames:     { nanny: 'Caregiver', parent: 'Parent' },
      currentUserRole: null,
      setActiveChildId:   (id)    => set({ activeChildId: id }),
      setActiveChild:     (child) => set({ activeChild: child, activeChildId: child.id }),
      setMemberNames:     (names) => set({ memberNames: names }),
      setCurrentUserRole: (role)  => set({ currentUserRole: role }),
    }),
    { name: 'ankur-app-store' }
  )
)

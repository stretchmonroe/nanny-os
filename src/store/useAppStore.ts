import { create } from 'zustand'

type AppStore = {
  // add state here
}

export const useAppStore = create<AppStore>(() => ({}))

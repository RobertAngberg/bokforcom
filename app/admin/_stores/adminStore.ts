"use client";

import { create } from "zustand";
import type { AdminStoreState } from "../_types/types";

export const useAdminStore = create<AdminStoreState>((set) => ({
  // Initial state
  userInfo: null,
  foretagsInfo: null,

  // Setters
  setUserInfo: (user) => set({ userInfo: user }),
  setForetagsInfo: (foretag) => set({ foretagsInfo: foretag }),

  // Init function
  initStore: (data) =>
    set({
      userInfo: data.userInfo || null,
      foretagsInfo: data.foretagsInfo || null,
    }),
}));

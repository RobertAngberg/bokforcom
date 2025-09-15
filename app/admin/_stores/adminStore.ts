"use client";

import { create } from "zustand";
import type { AnvandarInfo, ForetagsProfil } from "../_types/types";

interface AdminStoreState {
  // User state
  userInfo: AnvandarInfo | null;
  setUserInfo: (user: AnvandarInfo | null) => void;

  // Company state
  foretagsInfo: ForetagsProfil | null;
  setForetagsInfo: (foretag: ForetagsProfil | null) => void;

  // Loading states
  isLoadingUser: boolean;
  isLoadingForetag: boolean;
  setIsLoadingUser: (loading: boolean) => void;
  setIsLoadingForetag: (loading: boolean) => void;

  // Init function
  initStore: (data: {
    userInfo?: AnvandarInfo | null;
    foretagsInfo?: ForetagsProfil | null;
  }) => void;
}

export const useAdminStore = create<AdminStoreState>((set) => ({
  // Initial state
  userInfo: null,
  foretagsInfo: null,
  isLoadingUser: false,
  isLoadingForetag: false,

  // Setters
  setUserInfo: (user) => set({ userInfo: user }),
  setForetagsInfo: (foretag) => set({ foretagsInfo: foretag }),
  setIsLoadingUser: (loading) => set({ isLoadingUser: loading }),
  setIsLoadingForetag: (loading) => set({ isLoadingForetag: loading }),

  // Init function
  initStore: (data) =>
    set({
      userInfo: data.userInfo || null,
      foretagsInfo: data.foretagsInfo || null,
    }),
}));

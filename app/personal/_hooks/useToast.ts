"use client";

import { useState, useCallback } from "react";
import type { ToastTillstand } from "../_types/types";

export function useToast() {
  const [toast, setToast] = useState<ToastTillstand>({
    isVisible: false,
    message: "",
    type: "success",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success") => {
      setToast({ message, type, isVisible: true });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast({ message: "", type: "success", isVisible: false });
  }, []);

  const clearToast = useCallback(() => {
    hideToast();
  }, [hideToast]);

  return {
    // State
    toast,

    // Actions
    showToast,
    hideToast,
    clearToast,
  };
}

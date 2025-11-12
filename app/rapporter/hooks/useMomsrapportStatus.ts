"use client";

import { useState, useEffect } from "react";
import {
  getMomsrapportStatus,
  updateMomsrapportStatus,
  saveNoteringar,
  MomsrapportStatusData,
  MomsrapportStatus,
} from "../actions/momsrapportStatusActions";

export function useMomsrapportStatus(year: number, period: string) {
  const [status, setStatus] = useState<MomsrapportStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ladda status
  useEffect(() => {
    async function loadStatus() {
      setLoading(true);
      const result = await getMomsrapportStatus(year, period);

      if (result.success && result.data) {
        setStatus(result.data);
      } else {
        setError(result.error || "Kunde inte ladda status");
      }
      setLoading(false);
    }

    loadStatus();
  }, [year, period]);

  // Uppdatera status
  const updateStatus = async (newStatus: MomsrapportStatus) => {
    const result = await updateMomsrapportStatus(year, period, newStatus);

    if (result.success && result.data) {
      setStatus(result.data);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  // Spara noteringar
  const saveNotes = async (noteringar: string) => {
    const result = await saveNoteringar(year, period, noteringar);

    if (result.success && result.data) {
      setStatus(result.data);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  // Helper functions
  const canProceedToGranska = () => {
    return status?.status === "öppen";
  };

  const canProceedToDeklarera = () => {
    return status?.status === "granskad";
  };

  const canProceedToBetala = () => {
    return status?.status === "deklarerad";
  };

  const isCompleted = () => {
    return status?.status === "betald" || status?.status === "stängd";
  };

  return {
    status,
    loading,
    error,
    updateStatus,
    saveNotes,
    canProceedToGranska,
    canProceedToDeklarera,
    canProceedToBetala,
    isCompleted,
  };
}

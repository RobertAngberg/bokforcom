import { useState } from "react";
import { useRouter } from "next/navigation";
import { taBortUtlägg } from "../actions/utlaggActions";
import type { Utlägg } from "../types/types";

export const useUtlaggFlik = (
  state: any,
  handlers: any,
  utlaggFlikData: () => { columns: any[]; utlägg: Utlägg[]; loading: boolean }
) => {
  const router = useRouter();
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Använd den delade utlaggFlikData funktionen
  const { columns: basicColumns, utlägg, loading } = utlaggFlikData();

  const handleNyttUtlägg = async () => {
    router.push("/bokfor?utlagg=true");
  };

  const handleTaBortUtlägg = async (utläggId: number) => {
    if (!confirm("Är du säker på att du vill ta bort detta utlägg?")) {
      return;
    }

    try {
      await taBortUtlägg(utläggId);

      // Uppdatera listan genom att ladda om utlägg för vald anställd
      if (handlers.laddaUtläggFörAnställd && state.valdAnställd) {
        await handlers.laddaUtläggFörAnställd(state.valdAnställd.id);
      }

      setToast({ type: "success", message: "Utlägg borttaget!" });
    } catch (error) {
      console.error("Fel vid borttagning av utlägg:", error);
      setToast({ type: "error", message: "Kunde inte ta bort utlägg" });
    }
  };

  // Helper functions för kolumnrendering
  const formatDatum = (row: Utlägg) => {
    return row?.datum ? new Date(row.datum).toLocaleDateString("sv-SE") : "-";
  };

  const formatBelopp = (row: Utlägg) => {
    return row && row.belopp !== undefined && row.belopp !== null
      ? `${row.belopp.toLocaleString("sv-SE")} kr`
      : "-";
  };

  const getStatusClass = (status: string) => {
    if (status === "Inkluderat i lönespec") {
      return "bg-green-900 text-green-300";
    } else if (status === "Väntande") {
      return "bg-yellow-900 text-yellow-300";
    } else {
      return "bg-gray-700 text-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    return status === "Inkluderat i lönespec" ? "Inkluderat" : status || "Okänd";
  };

  return {
    // State
    toast,
    setToast,
    // Data
    utlägg,
    loading,
    // Functions
    handleNyttUtlägg,
    handleTaBortUtlägg,
    // Helper functions
    formatDatum,
    formatBelopp,
    getStatusClass,
    getStatusText,
  };
};

"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  UtläggBokföringModal,
  UtlaggBokföringsRad,
  UtläggQueryResult,
  UseUtlaggProps,
} from "../types/types";
import { ColumnDefinition } from "../../_components/Tabell";
import { hämtaUtlägg, taBortUtlägg } from "../actions/utlaggActions";
import { showToast } from "../../_components/Toast";

// Use the shared Utlägg interface from types

export function useUtlagg(props?: UseUtlaggProps | number | null) {
  // Backwards compatibility: support both old signature and new object
  const anställdId = typeof props === "object" && props !== null ? props.anställdId : props;
  const [utlägg, setUtlägg] = useState<UtläggQueryResult[]>([]);
  const [utläggLoading, setUtläggLoading] = useState(false);
  const [utläggBokföringModal, setUtläggBokföringModal] = useState<UtläggBokföringModal>({
    isOpen: false,
    utlägg: null,
    previewRows: [],
    loading: false,
  });
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUtläggId, setDeleteUtläggId] = useState<number | null>(null);

  const openUtläggBokföringModal = (
    utlägg: UtläggQueryResult,
    previewRows: UtlaggBokföringsRad[]
  ) => {
    setUtläggBokföringModal({
      isOpen: true,
      utlägg,
      previewRows,
      loading: false,
    });
  };

  const closeUtläggBokföringModal = () => {
    setUtläggBokföringModal({
      isOpen: false,
      utlägg: null,
      previewRows: [],
      loading: false,
    });
  };

  // Ladda utlägg för vald anställd
  const laddaUtläggFörAnställd = useCallback(async (anställdId: number) => {
    setUtläggLoading(true);
    try {
      const utläggData = await hämtaUtlägg(anställdId);
      setUtlägg(utläggData || []);
    } catch (error) {
      console.error("Fel vid laddning av utlägg:", error);
      setUtlägg([]);
    } finally {
      setUtläggLoading(false);
    }
  }, []);

  // ===========================================
  // UI HELPER FUNCTIONS - Flyttade från useUtlaggFlik
  // ===========================================

  // Helper functions för kolumnrendering
  const formatDatum = (row: UtläggQueryResult) => {
    return row?.datum ? new Date(row.datum).toLocaleDateString("sv-SE") : "-";
  };

  const formatBelopp = (row: UtläggQueryResult) => {
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

  // ===========================================
  // INTERACTION FUNCTIONS - Flyttade från useUtlaggFlik
  // ===========================================

  const router = useRouter();

  const handleNyttUtlägg = async () => {
    router.push("/bokfor?utlagg=true");
  };

  const handleTaBortUtlägg = async (utläggId: number) => {
    setDeleteUtläggId(utläggId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteUtläggId) return;

    setShowDeleteModal(false);

    try {
      await taBortUtlägg(deleteUtläggId);

      // Uppdatera listan genom att ladda om utlägg för vald anställd
      if (anställdId) {
        await laddaUtläggFörAnställd(anställdId);
      }

      showToast("Utlägg borttaget!", "success");
    } catch (error) {
      console.error("Fel vid borttagning av utlägg:", error);
      showToast("Kunde inte ta bort utlägg", "error");
    } finally {
      setDeleteUtläggId(null);
    }
  };

  // Ladda utlägg när anställdId ändras
  useEffect(() => {
    if (anställdId) {
      laddaUtläggFörAnställd(anställdId);
    } else {
      setUtlägg([]);
    }
  }, [anställdId, laddaUtläggFörAnställd]);

  // ===========================================
  // UTLÄGG FLIK - För UtlaggFlik.tsx
  // ===========================================

  const utlaggFlikData = useCallback(() => {
    const columns = [
      {
        key: "datum",
        label: "Datum",
        render: (value: string, row: UtläggQueryResult) => formatDatum(row),
      },
      {
        key: "belopp",
        label: "Belopp",
        render: (value: number, row: UtläggQueryResult) => formatBelopp(row),
      },
      { key: "beskrivning", label: "Beskrivning" },
      {
        key: "status",
        label: "Status",
        render: (value: string) => getStatusText(value),
      },
      {
        key: "åtgärd",
        label: "Åtgärd",
        render: (_: unknown, row: UtläggQueryResult) => (row.status === "Väntande" ? null : null), // Placeholder för nu
      },
    ];

    return {
      columns,
      utlägg,
      loading: utläggLoading,
    };
  }, [utlägg, utläggLoading]);

  // ===========================================
  // UTLÄGG BOKFÖRING MODAL - För UtlaggBokforModal.tsx
  // ===========================================

  const utlaggModalData = useCallback(() => {
    const columns: ColumnDefinition<UtlaggBokföringsRad>[] = [
      { key: "kontonummer", label: "Konto" },
      { key: "beskrivning", label: "Beskrivning" },
      { key: "debet", label: "Debet", render: (v) => (v ? v + " kr" : "") },
      { key: "kredit", label: "Kredit", render: (v) => (v ? v + " kr" : "") },
    ];

    return {
      isOpen: utläggBokföringModal.isOpen && !!utläggBokföringModal.utlägg,
      utlägg: utläggBokföringModal.utlägg,
      previewRows: utläggBokföringModal.previewRows || [],
      columns,
      onClose: closeUtläggBokföringModal,
    };
  }, [utläggBokföringModal]);

  return {
    // Core state
    utlägg,
    utläggLoading,
    utläggBokföringModal,
    utbetalningsdatum,
    setUtlägg,
    setUtläggLoading,
    laddaUtläggFörAnställd,
    openUtläggBokföringModal,
    closeUtläggBokföringModal,
    setUtbetalningsdatum,

    // Specialized data functions
    utlaggFlikData,
    utlaggModalData,

    // UI Helper functions (from useUtlaggFlik)
    formatDatum,
    formatBelopp,
    getStatusClass,
    getStatusText,

    // Interaction functions (from useUtlaggFlik)
    handleNyttUtlägg,
    handleTaBortUtlägg,
    confirmDelete,

    // Modal state
    showDeleteModal,
    setShowDeleteModal,
    deleteUtläggId,

    // Loading state for compatibility
    loading: utläggLoading,
  };
}

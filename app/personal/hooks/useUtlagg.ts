"use client";

import { useState, useCallback, useEffect } from "react";
import type { UtläggBokföringModal, UtlaggBokföringsRad } from "../types/types";
import { ColumnDefinition } from "../../_components/Tabell";
import { hämtaUtlägg } from "../actions/utlaggActions";

export function useUtlagg(anställdId?: number | null) {
  const [utlägg, setUtlägg] = useState<any[]>([]);
  const [utläggLoading, setUtläggLoading] = useState(false);
  const [utläggBokföringModal, setUtläggBokföringModal] = useState<UtläggBokföringModal>({
    isOpen: false,
    utlägg: null,
    previewRows: [],
    loading: false,
  });
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);

  const openUtläggBokföringModal = (utlägg: any, previewRows: any[]) => {
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
        render: (value: string) => (value ? new Date(value).toLocaleDateString("sv-SE") : ""),
      },
      {
        key: "belopp",
        label: "Belopp",
        render: (value: number) => `${value} kr`,
      },
      { key: "beskrivning", label: "Beskrivning" },
      { key: "status", label: "Status" },
      {
        key: "åtgärd",
        label: "Åtgärd",
        render: (_: any, row: any) => (row.status === "Väntande" ? null : null), // Placeholder för nu
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
    utlägg,
    utläggLoading,
    utläggBokföringModal,
    utbetalningsdatum,
    setUtlägg,
    setUtläggLoading,
    openUtläggBokföringModal,
    closeUtläggBokföringModal,
    setUtbetalningsdatum,
    // Specialized data functions
    utlaggFlikData,
    utlaggModalData,
  };
}

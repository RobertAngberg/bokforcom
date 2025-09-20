"use client";

import { useState } from "react";
import type { UtläggBokföringModal } from "../_types/types";

export function useUtlagg() {
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
  };
}

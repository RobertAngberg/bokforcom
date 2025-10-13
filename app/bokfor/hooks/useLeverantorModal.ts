"use client";

import { useState, useCallback } from "react";
import type { Leverantör } from "../../faktura/types/types";

interface UseLeverantorModalProps {
  setLeverantör: (leverantör: Leverantör | null) => void;
}

export function useLeverantorModal({ setLeverantör }: UseLeverantorModalProps) {
  // ====================================================
  // MODAL STATE
  // ====================================================
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // ====================================================
  // MODAL CONTROL HANDLERS
  // ====================================================

  const openLeverantorModal = useCallback(() => {
    setVisaLeverantorModal(true);
  }, []);

  const closeLeverantorModal = useCallback(() => {
    setVisaLeverantorModal(false);
  }, []);

  // ====================================================
  // LEVERANTÖR INTERACTION HANDLERS
  // ====================================================

  const handleLeverantorCheckboxChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setVisaLeverantorModal(true);
      } else {
        setVisaLeverantorModal(false);
        setLeverantör(null);
      }
    },
    [setLeverantör]
  );

  const handleLeverantorRemove = useCallback(() => {
    setLeverantör(null);
    setVisaLeverantorModal(false);
  }, [setLeverantör]);

  const handleLeverantorSelected = useCallback(
    (leverantörData: Leverantör) => {
      setLeverantör(leverantörData);
      setVisaLeverantorModal(false);
    },
    [setLeverantör]
  );

  const handleLeverantorModalClose = useCallback(() => {
    setVisaLeverantorModal(false);
  }, []);

  // ====================================================
  // COMPUTED VALUES
  // ====================================================

  const isModalOpen = visaLeverantorModal;

  // ====================================================
  // RETURN INTERFACE
  // ====================================================

  return {
    // Modal State
    visaLeverantorModal,
    isModalOpen,

    // Modal Control
    openLeverantorModal,
    closeLeverantorModal,
    setVisaLeverantorModal,

    // Leverantör Handlers
    handleLeverantorCheckboxChange,
    handleLeverantorRemove,
    handleLeverantorSelected,
    handleLeverantorModalClose,
  };
}

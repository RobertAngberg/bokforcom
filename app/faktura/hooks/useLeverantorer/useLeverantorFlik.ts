"use client";

/**
 * useLeverantorFlik.ts
 *
 * Hook för leverantörsflik med state management för modaler och actions
 */

import { useState, useEffect, useCallback } from "react";
import { deleteLeverantor } from "../../actions/leverantorActions";
import { Leverantör, UseLeverantorFlikReturn, UseLeverantorFlikParams } from "../../types/types";
import { ensureLeverantorer, getLeverantorerCache } from "./leverantorCache";

/**
 * Hook för leverantörsflik med full state management
 */
export function useLeverantorFlik({
  onLeverantörUpdated,
}: UseLeverantorFlikParams): UseLeverantorFlikReturn {
  const [leverantörer, setLeverantörer] = useState(() => getLeverantorerCache() ?? []);
  const [loading, setLoading] = useState(!getLeverantorerCache());
  const [showModal, setShowModal] = useState(false);
  const [editLeverantör, setEditLeverantör] = useState<Leverantör | undefined>();
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bokförModal, setBokförModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });

  const loadLeverantörer = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await ensureLeverantorer(force);
      setLeverantörer(data ?? []);
    } catch (error) {
      console.error("[useLeverantorFlik] loadLeverantörer misslyckades", error);
      setLeverantörer([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureLeverantorer()
      .then((data) => {
        if (cancelled) return;
        setLeverantörer(data ?? []);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[useLeverantorFlik] initial load misslyckades", error);
        setLeverantörer([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLeverantörAdded = () => {
    loadLeverantörer(true);
    if (onLeverantörUpdated) {
      onLeverantörUpdated();
    }
  };

  const handleEditLeverantör = (leverantör: Leverantör) => {
    setEditLeverantör(leverantör);
    setShowModal(true);
  };

  const handleDeleteLeverantör = (leverantör: Leverantör) => {
    setDeleteModal({ show: true, leverantör });
  };

  const handleBokförLeverantör = (leverantör: Leverantör) => {
    setBokförModal({ show: true, leverantör });
  };

  const confirmDelete = async () => {
    if (!deleteModal.leverantör) return;

    setDeleteLoading(true);
    const result = await deleteLeverantor(deleteModal.leverantör.id!);

    if (result.success) {
      setDeleteModal({ show: false });
      loadLeverantörer(true);
      if (onLeverantörUpdated) {
        onLeverantörUpdated();
      }
    }
    setDeleteLoading(false);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditLeverantör(undefined);
    if (editLeverantör && onLeverantörUpdated) {
      onLeverantörUpdated();
    }
  };

  return {
    leverantörer,
    loading,
    showModal,
    editLeverantör,
    deleteModal,
    deleteLoading,
    bokförModal,
    loadLeverantörer,
    handleLeverantörAdded,
    handleEditLeverantör,
    handleDeleteLeverantör,
    handleBokförLeverantör,
    confirmDelete,
    handleModalClose,
    setShowModal,
    setDeleteModal,
    setBokförModal,
  };
}

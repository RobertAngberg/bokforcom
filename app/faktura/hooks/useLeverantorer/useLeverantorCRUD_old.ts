"use client";

/**
 * useLeverantorCRUD.ts
 *
 * Hantering av CRUD-operationer för leverantörer:
 * - Läsa leverantörer (med cache)
 * - Skapa ny leverantör
 * - Uppdatera befintlig leverantör
 * - Ta bort leverantör
 * - Cache-hantering och validering
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getLeverantorer,
  deleteLeverantor,
  saveLeverantor,
  updateLeverantor,
} from "../../actions/leverantorActions";
import { validateEmail } from "../../../_utils/validationUtils";
import {
  Leverantör,
  LeverantörFormData,
  UseLeverantörerReturn,
  UseLeverantorFlikReturn,
  UseLeverantorFlikParams,
  UseNyLeverantorModalReturn,
  UseNyLeverantorModalParams,
  UseValjLeverantorModalReturn,
  UseValjLeverantorModalParams,
} from "../../types/types";

// =============================================================================
// VALIDERING
// =============================================================================

function validateLeverantörEmail(email: string): boolean {
  if (!email) return true; // Email är valfritt
  return validateEmail(email);
}

function validateLeverantörData(formData: LeverantörFormData): {
  isValid: boolean;
  error?: string;
} {
  const namn = formData.namn || "";
  if (!namn || namn.length < 2) {
    return { isValid: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  if (formData.epost && !validateLeverantörEmail(formData.epost)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  return { isValid: true };
}

function mapLeverantorFormData(formData: LeverantörFormData): LeverantörFormData {
  return {
    ...formData,
    namn: formData.namn ?? "",
    organisationsnummer: formData.organisationsnummer ?? "",
    adress: formData.adress ?? "",
    postnummer: formData.postnummer ?? "",
    stad: formData.stad ?? "",
    telefon: formData.telefon ?? "",
  };
}

// =============================================================================
// CACHE-HANTERING
// =============================================================================

let leverantorerCache: Leverantör[] | null = null;
let leverantorerPromise: Promise<Leverantör[] | null> | null = null;
let leverantorerErrorCache: string | null = null;

async function ensureLeverantorer(force = false): Promise<Leverantör[] | null> {
  if (!force) {
    if (leverantorerCache) {
      return leverantorerCache;
    }
    if (leverantorerPromise) {
      return leverantorerPromise;
    }
  }

  if (force) {
    resetLeverantorerCache();
  }

  const fetchPromise = (async () => {
    try {
      const apiResult = await getLeverantorer();

      if (!apiResult.success) {
        throw new Error("API returned success: false");
      }

      leverantorerCache = apiResult.leverantörer || [];
      leverantorerErrorCache = null;
      return leverantorerCache;
    } catch (error) {
      leverantorerCache = [];
      leverantorerErrorCache = "Kunde inte ladda leverantörer";
      throw error;
    } finally {
      leverantorerPromise = null;
    }
  })();

  leverantorerPromise = fetchPromise;
  return fetchPromise;
}

function resetLeverantorerCache() {
  leverantorerCache = null;
  leverantorerErrorCache = null;
}

export { resetLeverantorerCache };

// Import andra cache-reset funktioner för invalidateLeverantorsfakturaCaches
import { resetBokfordaCache } from "./useBokfordaFakturor";
import { resetSparadeFakturorPageCache } from "./useSparadeFakturor";

/**
 * Rensar alla caches för leverantörsfakturor
 * Används när data uppdateras och caches behöver invalideras
 */
export function invalidateLeverantorsfakturaCaches() {
  resetLeverantorerCache();
  resetBokfordaCache();
  resetSparadeFakturorPageCache();
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook för att hämta och refresha leverantörer
 */
export function useLeverantörer(): UseLeverantörerReturn {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>(() => leverantorerCache ?? []);
  const [loading, setLoading] = useState(!leverantorerCache);
  const [error, setError] = useState<string | null>(null);

  const syncState = useCallback((data: Leverantör[] | null) => {
    setLeverantörer(data ?? []);
    setError(leverantorerErrorCache);
    setLoading(false);
  }, []);

  const loadLeverantörer = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const data = await ensureLeverantorer(force);
        syncState(data);
      } catch (err) {
        console.error("[useLeverantörer] loadLeverantörer misslyckades", err);
        setLeverantörer([]);
        setError("Kunde inte ladda leverantörer");
        setLoading(false);
      }
    },
    [syncState]
  );

  useEffect(() => {
    let cancelled = false;
    if (leverantorerCache) {
      syncState(leverantorerCache);
      return () => {
        cancelled = true;
      };
    }

    ensureLeverantorer()
      .then((data) => {
        if (cancelled) return;
        syncState(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[useLeverantörer] initial load misslyckades", err);
        setLeverantörer([]);
        setError("Kunde inte ladda leverantörer");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [syncState]);

  const refresh = useCallback(async () => {
    await loadLeverantörer(true);
  }, [loadLeverantörer]);

  const harLeverantörer = leverantörer.length > 0;

  return {
    leverantörer,
    loading,
    error,
    refresh,
    harLeverantörer,
  };
}

/**
 * Hook för leverantörsflik med full CRUD-funktionalitet
 */
export function useLeverantorFlik({
  onLeverantörUpdated,
}: UseLeverantorFlikParams): UseLeverantorFlikReturn {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>(() => leverantorerCache ?? []);
  const [loading, setLoading] = useState(!leverantorerCache);
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

/**
 * Hook för modal att skapa/redigera leverantör
 */
export function useNyLeverantorModal({
  isOpen,
  editLeverantör,
  onSaved,
  onClose,
}: UseNyLeverantorModalParams): UseNyLeverantorModalReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LeverantörFormData>({
    namn: "",
    organisationsnummer: "",
    adress: "",
    postnummer: "",
    stad: "",
    telefon: "",
    epost: "",
  });

  const isEditing = !!editLeverantör;

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setFormData({
        namn: "",
        organisationsnummer: "",
        adress: "",
        postnummer: "",
        stad: "",
        telefon: "",
        epost: "",
      });
    } else if (editLeverantör) {
      setFormData({
        namn: editLeverantör.namn || "",
        organisationsnummer: editLeverantör.organisationsnummer || "",
        adress: editLeverantör.adress || "",
        postnummer: editLeverantör.postnummer || "",
        stad: editLeverantör.ort || "",
        telefon: editLeverantör.telefon || "",
        epost: editLeverantör.email || "",
      });
    }
  }, [isOpen, editLeverantör]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Frontend-validering
      const validation = validateLeverantörData(formData);
      if (!validation.isValid) {
        setError(validation.error!);
        return;
      }

      const preparedData = mapLeverantorFormData(formData);

      if (isEditing && editLeverantör) {
        const data = {
          namn: preparedData.namn,
          organisationsnummer: preparedData.organisationsnummer || undefined,
          adress: preparedData.adress || undefined,
          postnummer: preparedData.postnummer || undefined,
          ort: preparedData.stad || undefined,
          telefon: preparedData.telefon || undefined,
          email: formData.epost || undefined,
        };
        const result = await updateLeverantor(editLeverantör.id!, data);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte uppdatera leverantör");
        }
      } else {
        const submitData = new FormData();
        submitData.append("namn", preparedData.namn);
        if (preparedData.organisationsnummer)
          submitData.append("organisationsnummer", preparedData.organisationsnummer);
        if (preparedData.adress) submitData.append("adress", preparedData.adress);
        if (preparedData.postnummer) submitData.append("postnummer", preparedData.postnummer);
        if (preparedData.stad) submitData.append("ort", preparedData.stad);
        if (preparedData.telefon) submitData.append("telefon", preparedData.telefon);
        if (formData.epost) submitData.append("email", formData.epost);

        const result = await saveLeverantor(submitData);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte spara leverantör");
        }
      }
    } catch {
      setError("Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    formData,
    isEditing,
    handleInputChange,
    handleSubmit,
    setError,
  };
}

/**
 * Hook för modal att välja leverantör och navigera till bokföring
 */
export function useValjLeverantorModal({
  isOpen,
  onClose,
}: UseValjLeverantorModalParams): UseValjLeverantorModalReturn {
  const router = useRouter();
  const [selectedLeverantör, setSelectedLeverantör] = useState<number | null>(null);
  const { refresh } = useLeverantörer();

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen, refresh]);

  const handleContinue = () => {
    if (selectedLeverantör) {
      onClose();
      // Navigera till bokföringssystemet med levfakt=true
      const url = `/bokfor?levfakt=true&leverantorId=${selectedLeverantör}`;
      router.push(url);
    }
  };

  return {
    selectedLeverantör,
    setSelectedLeverantör,
    handleContinue,
  };
}

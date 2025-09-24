"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLeverantörer,
  deleteLeverantör,
  saveLeverantör,
  updateLeverantör,
} from "../actions/leverantorActions";
import { Leverantör } from "../types/types";
import { showToast } from "../../_components/Toast";
import { hamtaTransaktionsposter } from "../actions/alternativActions";
import { hamtaBokfordaFakturor } from "../actions/bokforingActions";
import { hämtaFakturaMedRader, hämtaSparadeFakturor } from "../actions/fakturaActions";
import { hämtaFöretagsprofil } from "../actions/foretagActions";
import { hämtaSparadeKunder } from "../actions/kundActions";
import { hämtaSparadeArtiklar } from "../actions/artikelActions";
import {
  betalaOchBokförLeverantörsfaktura,
  taBortLeverantörsfaktura,
} from "../actions/leverantorsfakturorActions";
import { formatSEK } from "../../_utils/format";
import { ColumnDefinition } from "../../_components/Tabell";
import { stringTillDate } from "../../_utils/datum";
import { safeAsync, logError, createError } from "../../_utils/errorUtils";
import {
  UseLeverantorFlikReturn,
  UseNyLeverantorModalReturn,
  UseLeverantörerReturn,
  UseLeverantorFlikParams,
  UseNyLeverantorModalParams,
  UseValjLeverantorModalParams,
  UseValjLeverantorModalReturn,
  UseBokfordaFakturorFlikReturn,
  UseSparadeFakturorReturn,
  UseSparadeFakturorPageReturn,
  BokfordFaktura,
} from "../types/types";
import { useFaktura } from "./useFaktura";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// Business Logic Functions for NyLeverantorModal
function sanitizeLeverantörInput(input: string): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Ta bort potentiellt farliga tecken
    .substring(0, 255); // Begränsa längd
}

function validateLeverantörEmail(email: string): boolean {
  if (!email) return true; // Email är valfritt
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateLeverantörData(formData: any): { isValid: boolean; error?: string } {
  // Validera obligatoriska fält
  const namn = sanitizeLeverantörInput(formData.namn || "");
  if (!namn || namn.length < 2) {
    return { isValid: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
  if (formData.epost && !validateLeverantörEmail(formData.epost)) {
    return { isValid: false, error: "Ogiltig email-adress" };
  }

  return { isValid: true };
}

function sanitizeLeverantörFormData(formData: any) {
  return {
    ...formData,
    namn: sanitizeLeverantörInput(formData.namn || ""),
    organisationsnummer: sanitizeLeverantörInput(formData.organisationsnummer || ""),
    adress: sanitizeLeverantörInput(formData.adress || ""),
    postnummer: sanitizeLeverantörInput(formData.postnummer || ""),
    stad: sanitizeLeverantörInput(formData.stad || ""),
    telefon: sanitizeLeverantörInput(formData.telefon || ""),
  };
}

export function useLeverantörer(): UseLeverantörerReturn {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeverantörer = useCallback(async () => {
    const result = await safeAsync(
      async () => {
        const apiResult = await getLeverantörer();

        if (!apiResult.success) {
          throw createError("API returned success: false", {
            code: "API_ERROR",
            context: { apiResult },
          });
        }

        return apiResult.leverantörer || [];
      },
      {
        operationName: "loadLeverantörer",
        fallback: [],
      }
    );

    if (result) {
      setLeverantörer(result);
      setError(null);
    } else {
      setError("Kunde inte ladda leverantörer");
    }

    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadLeverantörer();
  }, [loadLeverantörer]);

  const refresh = useCallback(async () => {
    await loadLeverantörer();
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

// =============================================================================
// LEVERANTÖR FLIK HOOK
// =============================================================================
export function useLeverantorFlik({
  onLeverantörUpdated,
}: UseLeverantorFlikParams): UseLeverantorFlikReturn {
  const [leverantörer, setLeverantörer] = useState<Leverantör[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLeverantör, setEditLeverantör] = useState<Leverantör | undefined>();
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bokförModal, setBokförModal] = useState<{ show: boolean; leverantör?: Leverantör }>({
    show: false,
  });

  const loadLeverantörer = async () => {
    setLoading(true);
    const result = await getLeverantörer();
    if (result.success) {
      setLeverantörer(result.leverantörer || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLeverantörer();
  }, []);

  const handleLeverantörAdded = () => {
    loadLeverantörer();
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
    const result = await deleteLeverantör(deleteModal.leverantör.id!);

    if (result.success) {
      setDeleteModal({ show: false });
      loadLeverantörer();
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

// =============================================================================
// NY LEVERANTÖR MODAL HOOK
// =============================================================================
export function useNyLeverantorModal({
  isOpen,
  editLeverantör,
  onSaved,
  onClose,
}: UseNyLeverantorModalParams): UseNyLeverantorModalReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
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

      // Sanitera data
      const sanitizedData = sanitizeLeverantörFormData(formData);

      if (isEditing && editLeverantör) {
        const data = {
          namn: sanitizedData.namn,
          organisationsnummer: sanitizedData.organisationsnummer || undefined,
          adress: sanitizedData.adress || undefined,
          postnummer: sanitizedData.postnummer || undefined,
          ort: sanitizedData.stad || undefined,
          telefon: sanitizedData.telefon || undefined,
          email: formData.epost.trim() || undefined,
        };
        const result = await updateLeverantör(editLeverantör.id!, data);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte uppdatera leverantör");
        }
      } else {
        const submitData = new FormData();
        submitData.append("namn", sanitizedData.namn);
        if (sanitizedData.organisationsnummer)
          submitData.append("organisationsnummer", sanitizedData.organisationsnummer);
        if (sanitizedData.adress) submitData.append("adress", sanitizedData.adress);
        if (sanitizedData.postnummer) submitData.append("postnummer", sanitizedData.postnummer);
        if (sanitizedData.stad) submitData.append("ort", sanitizedData.stad);
        if (sanitizedData.telefon) submitData.append("telefon", sanitizedData.telefon);
        if (formData.epost) submitData.append("email", formData.epost.trim());

        const result = await saveLeverantör(submitData);

        if (result.success) {
          onSaved();
          onClose();
        } else {
          setError(result.error || "Kunde inte spara leverantör");
        }
      }
    } catch (err) {
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

// =============================================================================
// VÄLJ LEVERANTÖR MODAL HOOK
// =============================================================================
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

// =============================================================================
// BOKFÖRDA FAKTUROR FLIK HOOK
// =============================================================================
export function useBokfordaFakturorFlik(): UseBokfordaFakturorFlikReturn {
  const [fakturorAntal, setFakturorAntal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadFakturorAntal = async () => {
    try {
      const result = await hamtaBokfordaFakturor();
      if (result.success && result.fakturor) {
        setFakturorAntal(result.fakturor.length);
      }
    } catch (error) {
      console.error("Fel vid hämtning av fakturor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFakturorAntal();
  }, []);

  return {
    fakturorAntal,
    loading,
    loadFakturorAntal,
  };
}

// Hook för Sparade fakturor (simplified for list view only)
export function useSparadeFakturor(initialFakturor: any[]): UseSparadeFakturorReturn {
  const { setFormData, setKundStatus, showError } = useFaktura();
  const router = useRouter();

  // Funktion för att hantera när en faktura väljs
  const hanteraValdFaktura = useCallback(
    async (fakturaId: number) => {
      // Navigera till NyFaktura med faktura-ID som parameter
      // Data kommer att laddas på NyFaktura-sidan baserat på detta ID
      router.push(`/faktura/NyFaktura?edit=${fakturaId}`);
    },
    [router]
  );

  return {
    hanteraValdFaktura,
  };
}

// Hook för Sparade page data loading
export function useSparadeFakturorPage(): UseSparadeFakturorPageReturn {
  const [data, setData] = useState<{ kunder: any[]; fakturor: any[]; artiklar: any[] } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [kunder, fakturor, artiklar] = await Promise.all([
        hämtaSparadeKunder(),
        hämtaSparadeFakturor(),
        hämtaSparadeArtiklar(),
      ]);
      setData({ kunder, fakturor, artiklar });
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    loadData,
  };
}

// =============================================================================
// BOKFÖRDA FAKTUROR HOOK
// =============================================================================

/**
 * Hook för hantering av bokförda leverantörsfakturor
 * Flyttad från useBokfordaFakturor.tsx för konsolidering
 */
export function useBokfordaFakturor() {
  // State management
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifikatModal, setVerifikatModal] = useState<{
    isOpen: boolean;
    transaktionId: number;
    fakturanummer?: string;
    leverantör?: string;
  }>({
    isOpen: false,
    transaktionId: 0,
  });
  const [bekraftelseModal, setBekraftelseModal] = useState<{
    isOpen: boolean;
    faktura: BokfordFaktura | null;
    transaktionsposter: any[];
    loadingPoster: boolean;
  }>({
    isOpen: false,
    faktura: null,
    transaktionsposter: [],
    loadingPoster: false,
  });

  // Hjälpfunktion för att säkert formatera datum
  const formateraDatum = (datum: string | Date): string => {
    if (typeof datum === "string") {
      const dateObj = stringTillDate(datum);
      return dateObj ? dateObj.toLocaleDateString("sv-SE") : datum;
    }
    return datum.toLocaleDateString("sv-SE");
  };

  // Kolumndefinitioner för transaktionsposter tabellen
  const transaktionskolumner = [
    {
      key: "konto",
      label: "Konto",
      render: (_: any, post: any) => `${post.kontonummer} - ${post.kontobeskrivning}`,
    },
    {
      key: "debet",
      label: "Debet",
      render: (_: any, post: any) => (post.debet > 0 ? formatSEK(post.debet) : "—"),
      className: "text-right",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (_: any, post: any) => (post.kredit > 0 ? formatSEK(post.kredit) : "—"),
      className: "text-right",
    },
  ];

  // Data fetching effect
  useEffect(() => {
    async function hamtaFakturor() {
      try {
        const result = await hamtaBokfordaFakturor();
        if (result.success && result.fakturor) {
          setFakturor(result.fakturor);
        }
      } catch (error) {
        console.error("Fel vid hämtning av bokförda fakturor:", error);
      } finally {
        setLoading(false);
      }
    }

    hamtaFakturor();
  }, []);

  // Event handlers
  const öppnaVerifikat = (faktura: BokfordFaktura) => {
    setVerifikatModal({
      isOpen: true,
      transaktionId: faktura.transaktionId || faktura.id,
      fakturanummer: faktura.fakturanummer,
      leverantör: faktura.leverantör,
    });
  };

  const stängVerifikat = () => {
    setVerifikatModal({
      isOpen: false,
      transaktionId: 0,
    });
  };

  const handleBetalaOchBokför = async (faktura: BokfordFaktura) => {
    setBekraftelseModal({
      isOpen: true,
      faktura: faktura,
      transaktionsposter: [],
      loadingPoster: true,
    });

    // Hämta transaktionsposter för att visa debet/kredit
    if (faktura.transaktionId) {
      try {
        const poster = await hamtaTransaktionsposter(faktura.transaktionId);
        setBekraftelseModal((prev) => ({
          ...prev,
          transaktionsposter: Array.isArray(poster) ? poster : [],
          loadingPoster: false,
        }));
      } catch (error) {
        console.error("Fel vid hämtning av transaktionsposter:", error);
        setBekraftelseModal((prev) => ({
          ...prev,
          loadingPoster: false,
        }));
      }
    } else {
      setBekraftelseModal((prev) => ({
        ...prev,
        loadingPoster: false,
      }));
    }
  };

  const stängBekraftelseModal = () => {
    setBekraftelseModal({
      isOpen: false,
      faktura: null,
      transaktionsposter: [],
      loadingPoster: false,
    });
  };

  const taBortFaktura = async (fakturaId: number) => {
    if (confirm("Är du säker på att du vill ta bort denna leverantörsfaktura?")) {
      try {
        const result = await taBortLeverantörsfaktura(fakturaId);

        if (result.success) {
          // Ta bort från listan lokalt
          setFakturor((prev) => prev.filter((f) => f.id !== fakturaId));

          showToast("Leverantörsfaktura borttagen!", "success");
        } else {
          showToast(`Fel vid borttagning: ${result.error}`, "error");
        }
      } catch (error) {
        console.error("Fel vid borttagning av faktura:", error);
        showToast("Fel vid borttagning av faktura", "error");
      }
    }
  };

  const utförBokföring = async (faktura: BokfordFaktura) => {
    try {
      const result = await betalaOchBokförLeverantörsfaktura(faktura.id, faktura.belopp);

      if (result.success) {
        showToast("Leverantörsfaktura bokförd!", "success");
        // Ladda om data för att visa uppdaterad status
        const updatedData = await hamtaBokfordaFakturor();
        if (updatedData.success) {
          setFakturor(updatedData.fakturor || []);
        }
      } else {
        showToast(`Fel vid bokföring: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Fel vid bokföring:", error);
      showToast("Ett fel uppstod vid bokföring", "error");
    }
    // Stäng modalen
    stängBekraftelseModal();
  };

  return {
    // State
    fakturor,
    loading,
    verifikatModal,
    bekraftelseModal,

    // Computed data
    transaktionskolumner,

    // Actions
    formateraDatum,
    öppnaVerifikat,
    stängVerifikat,
    handleBetalaOchBokför,
    stängBekraftelseModal,
    taBortFaktura,
    utförBokföring,
  };
}

// =============================================================================
// LEVERANTÖR NAVIGATION HOOK
// =============================================================================

/**
 * Hook för navigation mellan leverantör-relaterade sidor
 * Flyttad från useLeverantorNavigation.ts för konsolidering
 */
export function useLeverantorNavigation() {
  const router = useRouter();

  const navigateToLeverantorsfakturor = () => {
    router.push("/faktura/Leverantorsfakturor");
  };

  const navigateToBokforing = ({
    leverantorId,
    levfakt = true,
  }: {
    leverantorId: number;
    levfakt?: boolean;
  }) => {
    if (!leverantorId) {
      console.error("leverantorId is required for navigation");
      return;
    }

    const url = `/bokfor?levfakt=${levfakt}&leverantorId=${leverantorId}`;
    router.push(url);
  };

  const navigateToFaktura = () => {
    router.push("/faktura");
  };

  return {
    navigateToLeverantorsfakturor,
    navigateToBokforing,
    navigateToFaktura,
  };
}

export function useVerifikatModal({
  isOpen,
  transaktionId,
  fakturanummer,
  leverantör,
}: {
  isOpen: boolean;
  transaktionId: number | null;
  fakturanummer?: string;
  leverantör?: string;
}) {
  // State management
  const [poster, setPoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Data fetching effect
  useEffect(() => {
    if (isOpen && transaktionId) {
      hämtaPoster();
    }
  }, [isOpen, transaktionId]);

  const hämtaPoster = async () => {
    if (!transaktionId) return;

    setLoading(true);
    console.log("🔍 Hämtar verifikat för transaktionId:", transaktionId);
    try {
      const result = await hamtaTransaktionsposter(transaktionId);
      console.log("📝 Verifikat-resultat:", result);
      if (Array.isArray(result)) {
        setPoster(result as any);
      }
    } catch (error) {
      console.error("Fel vid hämtning av transaktionsposter:", error);
    } finally {
      setLoading(false);
    }
  };

  // Column definitions for table (without JSX render functions)
  const columns: ColumnDefinition<any>[] = [
    {
      key: "kontonummer",
      label: "Konto",
    },
    {
      key: "debet",
      label: "Debet",
    },
    {
      key: "kredit",
      label: "Kredit",
    },
  ];

  // Calculate totals
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  // Modal title logic
  const modalTitle = ""; // Tom titel så Modal.tsx inte visar den
  const headerTitle = `Verifikat - ${leverantör || "Okänd leverantör"}${
    fakturanummer ? ` (${fakturanummer})` : ""
  }`;

  return {
    // State
    poster,
    loading,

    // Computed data
    columns,
    totalDebet,
    totalKredit,
    modalTitle,
    headerTitle,

    // Actions
    hämtaPoster,
  };
}

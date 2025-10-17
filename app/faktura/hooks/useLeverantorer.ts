"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLeverantorer,
  deleteLeverantor,
  saveLeverantor,
  updateLeverantor,
} from "../actions/leverantorActions";
import { Leverantör } from "../types/types";
import { showToast } from "../../_components/Toast";
import { validateEmail } from "../../_utils/validationUtils";
import { hamtaTransaktionsposter } from "../actions/alternativActions";
import { hamtaBokfordaFakturor } from "../actions/bokforingActions";
import { hamtaSparadeFakturor } from "../actions/fakturaActions";
import { hamtaSparadeKunder } from "../actions/kundActions";
import { hamtaSparadeArtiklar } from "../actions/artikelActions";
import {
  betalaOchBokforLeverantorsfaktura,
  taBortLeverantorsfaktura,
} from "../actions/leverantorsfakturorActions";
import { formatSEK } from "../../_utils/format";
import { ColumnDefinition } from "../../_components/Tabell";
import { stringTillDate } from "../../_utils/datum";
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
  TransaktionsPost,
  FavoritArtikel,
  SparadeFakturorPageData,
  LeverantörFormData,
} from "../types/types";
import { useRouter } from "next/navigation";

// Business Logic Functions for NyLeverantorModal
function validateLeverantörEmail(email: string): boolean {
  if (!email) return true; // Email är valfritt
  return validateEmail(email);
}

function validateLeverantörData(formData: LeverantörFormData): {
  isValid: boolean;
  error?: string;
} {
  // Validera obligatoriska fält
  const namn = formData.namn || "";
  if (!namn || namn.length < 2) {
    return { isValid: false, error: "Leverantörsnamn krävs (minst 2 tecken)" };
  }

  // Validera email om angivet
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

function ensureLeverantorskonto(poster: TransaktionsPost[]): TransaktionsPost[] {
  if (!poster.length) {
    return poster;
  }

  const hasLeverantorskonto = poster.some((post) => post.kontonummer === "2440");
  const totalDebet = poster.reduce((sum, post) => sum + (post.debet ?? 0), 0);
  const totalKredit = poster.reduce((sum, post) => sum + (post.kredit ?? 0), 0);
  const diff = Number((totalDebet - totalKredit).toFixed(2));

  if (hasLeverantorskonto || Math.abs(diff) < 0.01) {
    return poster;
  }

  const datum = poster[0].transaktionsdatum ?? "";
  const kommentar = poster[0].transaktionskommentar ?? "";

  return [
    ...poster,
    {
      id: Number.MAX_SAFE_INTEGER,
      kontonummer: "2440",
      kontobeskrivning: "Leverantörsskulder",
      debet: diff < 0 ? Math.abs(diff) : 0,
      kredit: diff > 0 ? diff : 0,
      transaktionsdatum: datum,
      transaktionskommentar: kommentar,
    },
  ];
}

// =============================================================================
// DELAD CACHE FÖR LEVERANTÖRSDATA
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

// =============================================================================
// DELAD CACHE FÖR BOKFÖRDA LEVERANTÖRSFAKTUROR
// =============================================================================
let bokfordaFakturorCache: BokfordFaktura[] | null = null;
let bokfordaFakturorPromise: Promise<BokfordFaktura[] | null> | null = null;

async function ensureBokfordaFakturor(force = false): Promise<BokfordFaktura[] | null> {
  if (!force) {
    if (bokfordaFakturorCache) {
      return bokfordaFakturorCache;
    }
    if (bokfordaFakturorPromise) {
      return bokfordaFakturorPromise;
    }
  }

  if (force) {
    resetBokfordaCache();
  }

  const fetchPromise = (async () => {
    try {
      const result = await hamtaBokfordaFakturor();

      if (!result.success) {
        throw new Error("API returned success: false");
      }

      bokfordaFakturorCache = result.fakturor || [];
      return bokfordaFakturorCache;
    } catch (error) {
      bokfordaFakturorCache = [];
      throw error;
    } finally {
      bokfordaFakturorPromise = null;
    }
  })();

  bokfordaFakturorPromise = fetchPromise;
  return fetchPromise;
}

function resetBokfordaCache() {
  bokfordaFakturorCache = null;
}

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

// =============================================================================
// LEVERANTÖR FLIK HOOK
// =============================================================================
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
  const [fakturorAntal, setFakturorAntal] = useState(() => bokfordaFakturorCache?.length ?? 0);
  const [loading, setLoading] = useState(!bokfordaFakturorCache);

  const loadFakturorAntal = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ensureBokfordaFakturor(true);
      setFakturorAntal(data?.length ?? 0);
    } catch (error) {
      console.error("Fel vid hämtning av fakturor:", error);
      setFakturorAntal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureBokfordaFakturor()
      .then((data) => {
        if (cancelled) return;
        setFakturorAntal(data?.length ?? 0);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fel vid hämtning av fakturor:", error);
        setFakturorAntal(0);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    fakturorAntal,
    loading,
    loadFakturorAntal,
  };
}

// Hook för Sparade fakturor (simplified for list view only)
export function useSparadeFakturor(): UseSparadeFakturorReturn {
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
  const [data, setData] = useState<SparadeFakturorPageData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [kunder, fakturor, artiklar] = await Promise.all([
        hamtaSparadeKunder(),
        hamtaSparadeFakturor(),
        hamtaSparadeArtiklar(),
      ]);
      setData({
        kunder,
        fakturor,
        artiklar: artiklar as FavoritArtikel[],
      });
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
  const [fakturor, setFakturor] = useState<BokfordFaktura[]>(() => bokfordaFakturorCache ?? []);
  const [loading, setLoading] = useState(!bokfordaFakturorCache);
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
    transaktionsposter: TransaktionsPost[];
    loadingPoster: boolean;
  }>({
    isOpen: false,
    faktura: null,
    transaktionsposter: [],
    loadingPoster: false,
  });
  const [showDeleteFakturaModal, setShowDeleteFakturaModal] = useState(false);
  const [deleteFakturaId, setDeleteFakturaId] = useState<number | null>(null);

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
      render: (_: unknown, post: TransaktionsPost) =>
        `${post.kontonummer} - ${post.kontobeskrivning}`,
    },
    {
      key: "debet",
      label: "Debet",
      render: (_: unknown, post: TransaktionsPost) =>
        post.debet > 0 ? formatSEK(post.debet) : "—",
      className: "text-right",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (_: unknown, post: TransaktionsPost) =>
        post.kredit > 0 ? formatSEK(post.kredit) : "—",
      className: "text-right",
    },
  ];

  const loadFakturor = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const data = await ensureBokfordaFakturor(force);
      setFakturor(data ?? []);
    } catch (error) {
      console.error("Fel vid hämtning av bokförda fakturor:", error);
      setFakturor([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Data fetching effect
  useEffect(() => {
    let cancelled = false;
    ensureBokfordaFakturor()
      .then((data) => {
        if (cancelled) return;
        setFakturor(data ?? []);
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Fel vid hämtning av bokförda fakturor:", error);
        setFakturor([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
    const belopp = Math.abs(faktura.belopp || 0);

    const planeradePoster: TransaktionsPost[] = [
      {
        id: Number.MAX_SAFE_INTEGER - 1,
        kontonummer: "2440",
        kontobeskrivning: "Leverantörsskulder",
        debet: belopp,
        kredit: 0,
        transaktionsdatum: "",
        transaktionskommentar: "",
      },
      {
        id: Number.MAX_SAFE_INTEGER,
        kontonummer: "1930",
        kontobeskrivning: "Företagskonto",
        debet: 0,
        kredit: belopp,
        transaktionsdatum: "",
        transaktionskommentar: "",
      },
    ];

    setBekraftelseModal({
      isOpen: true,
      faktura,
      transaktionsposter: planeradePoster,
      loadingPoster: false,
    });
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
    setDeleteFakturaId(fakturaId);
    setShowDeleteFakturaModal(true);
  };

  const confirmDeleteFaktura = async () => {
    if (!deleteFakturaId) return;

    setShowDeleteFakturaModal(false);

    try {
      const result = await taBortLeverantorsfaktura(deleteFakturaId);

      if (result.success) {
        await loadFakturor(true);

        showToast("Leverantörsfaktura borttagen!", "success");
      } else {
        showToast(`Fel vid borttagning: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Fel vid borttagning av faktura:", error);
      showToast("Fel vid borttagning av faktura", "error");
    }
  };

  const utförBokföring = async (faktura: BokfordFaktura) => {
    try {
      const result = await betalaOchBokforLeverantorsfaktura(faktura.id, faktura.belopp);

      if (result.success) {
        showToast("Leverantörsfaktura bokförd!", "success");
        // Ladda om data för att visa uppdaterad status
        await loadFakturor(true);
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
    showDeleteFakturaModal,
    setShowDeleteFakturaModal,
    deleteFakturaId,

    // Computed data
    transaktionskolumner,

    // Actions
    formateraDatum,
    öppnaVerifikat,
    stängVerifikat,
    handleBetalaOchBokför,
    stängBekraftelseModal,
    taBortFaktura,
    confirmDeleteFaktura,
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
  const [poster, setPoster] = useState<TransaktionsPost[]>([]);
  const [loading, setLoading] = useState(false);

  const hamtaPoster = useCallback(async () => {
    if (!transaktionId) return;

    setLoading(true);
    console.log("🔍 Hämtar verifikat för transaktionId:", transaktionId);
    try {
      const result = await hamtaTransaktionsposter(transaktionId);
      console.log("📝 Verifikat-resultat:", result);
      if (Array.isArray(result)) {
        const rows = ensureLeverantorskonto(result as TransaktionsPost[]);
        setPoster(rows);
      }
    } catch (error) {
      console.error("Fel vid hämtning av transaktionsposter:", error);
    } finally {
      setLoading(false);
    }
  }, [transaktionId]);

  // Data fetching effect
  useEffect(() => {
    if (isOpen && transaktionId) {
      hamtaPoster();
    }
  }, [isOpen, transaktionId, hamtaPoster]);

  // Column definitions for table (without JSX render functions)
  const columns: ColumnDefinition<TransaktionsPost>[] = [
    {
      key: "kontonummer",
      label: "Konto",
      render: (_value, row) =>
        `${row.kontonummer}${row.kontobeskrivning ? ` - ${row.kontobeskrivning}` : ""}`,
    },
    {
      key: "debet",
      label: "Debet",
      className: "text-right",
      render: (_value, row) => (row.debet > 0 ? formatSEK(row.debet) : "—"),
    },
    {
      key: "kredit",
      label: "Kredit",
      className: "text-right",
      render: (_value, row) => (row.kredit > 0 ? formatSEK(row.kredit) : "—"),
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
    hamtaPoster,
  };
}

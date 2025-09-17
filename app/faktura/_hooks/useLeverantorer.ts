"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLeverantörer,
  deleteLeverantör,
  saveLeverantör,
  updateLeverantör,
  type Leverantör,
  hamtaBokfordaFakturor,
  hämtaFakturaMedRader,
  hämtaSparadeFakturor,
  hämtaFöretagsprofil,
  hämtaSparadeKunder,
  hämtaSparadeArtiklar,
} from "../actions";
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
} from "../_types/types";
import { useLeverantorNavigation } from "./useLeverantorNavigation";
import { useFakturaClient } from "./useFakturaClient";
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
  const [selectedLeverantör, setSelectedLeverantör] = useState<number | null>(null);
  const { navigateToBokforing } = useLeverantorNavigation();
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
      navigateToBokforing({ leverantorId: selectedLeverantör });
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
  const { setFormData, setKundStatus, showError } = useFakturaClient();
  const router = useRouter();

  // Funktion för att hantera när en faktura väljs
  const hanteraValdFaktura = useCallback(
    async (fakturaId: number) => {
      console.log("🔍 Väljer faktura med ID:", fakturaId);
      const data = await hämtaFakturaMedRader(fakturaId);
      if (!data || !data.faktura) {
        showError("Kunde inte hämta faktura");
        return;
      }
      const { faktura, artiklar, rotRut } = data;
      console.log("📄 Hämtad faktura:", { id: faktura.id, fakturanummer: faktura.fakturanummer });

      setFormData({
        id: faktura.id,
        fakturanummer: faktura.fakturanummer ?? "",
        fakturadatum: faktura.fakturadatum?.toISOString
          ? faktura.fakturadatum.toISOString().slice(0, 10)
          : (faktura.fakturadatum ?? ""),
        forfallodatum: faktura.forfallodatum?.toISOString
          ? faktura.forfallodatum.toISOString().slice(0, 10)
          : (faktura.forfallodatum ?? ""),
        betalningsmetod: faktura.betalningsmetod ?? "",
        betalningsvillkor: faktura.betalningsvillkor ?? "",
        drojsmalsranta: faktura.drojsmalsranta ?? "",
        kundId: faktura.kundId?.toString() ?? "",
        nummer: faktura.nummer ?? "",
        kundmomsnummer: faktura.kundmomsnummer ?? "",
        kundnamn: faktura.kundnamn ?? "",
        kundnummer: faktura.kundnummer ?? "",
        kundorganisationsnummer: faktura.kundorganisationsnummer ?? "",
        kundadress: faktura.kundadress ?? "",
        kundpostnummer: faktura.kundpostnummer ?? "",
        kundstad: faktura.kundstad ?? "",
        kundemail: faktura.kundemail ?? "",
        företagsnamn: faktura.företagsnamn ?? "",
        epost: faktura.epost ?? "",
        adress: faktura.adress ?? "",
        postnummer: faktura.postnummer ?? "",
        stad: faktura.stad ?? "",
        organisationsnummer: faktura.organisationsnummer ?? "",
        momsregistreringsnummer: faktura.momsregistreringsnummer ?? "",
        telefonnummer: faktura.telefonnummer ?? "",
        bankinfo: faktura.bankinfo ?? "",
        webbplats: faktura.webbplats ?? "",
        logo: faktura.logo ?? "",
        logoWidth: faktura.logo_width ?? 200,
        artiklar: artiklar.map((rad: any) => ({
          beskrivning: rad.beskrivning,
          antal: Number(rad.antal),
          prisPerEnhet: Number(rad.prisPerEnhet),
          moms: Number(rad.moms),
          valuta: rad.valuta ?? "SEK",
          typ: rad.typ === "tjänst" ? "tjänst" : "vara",
          rotRutTyp: rad.rotRutTyp,
          rotRutKategori: rad.rotRutKategori,
          avdragProcent: rad.avdragProcent,
          arbetskostnadExMoms: rad.arbetskostnadExMoms,
          rotRutBeskrivning: rad.rotRutBeskrivning,
          rotRutStartdatum: rad.rotRutStartdatum,
          rotRutSlutdatum: rad.rotRutSlutdatum,
          rotRutPersonnummer: rad.rotRutPersonnummer,
          rotRutFastighetsbeteckning: rad.rotRutFastighetsbeteckning,
          rotRutBoendeTyp: rad.rotRutBoendeTyp,
          rotRutBrfOrg: rad.rotRutBrfOrg,
          rotRutBrfLagenhet: rad.rotRutBrfLagenhet,
        })),
        // ROT/RUT-fält från rot_rut-tabellen eller första artikeln med ROT/RUT-data
        rotRutAktiverat:
          !!(rotRut.typ && rotRut.typ !== "") || artiklar.some((a: any) => a.rotRutTyp),
        rotRutTyp: rotRut.typ || artiklar.find((a: any) => a.rotRutTyp)?.rotRutTyp || undefined,
        rotRutKategori:
          (rotRut as any).rotRutKategori ||
          artiklar.find((a: any) => a.rotRutKategori)?.rotRutKategori ||
          undefined,
        avdragProcent:
          rotRut.avdrag_procent ||
          artiklar.find((a: any) => a.avdragProcent)?.avdragProcent ||
          undefined,
        arbetskostnadExMoms:
          rotRut.arbetskostnad_ex_moms ||
          artiklar.find((a: any) => a.arbetskostnadExMoms)?.arbetskostnadExMoms ||
          undefined,
        avdragBelopp: rotRut.avdrag_belopp || undefined,
        personnummer:
          rotRut.personnummer ||
          artiklar.find((a: any) => a.rotRutPersonnummer)?.rotRutPersonnummer ||
          "",
        fastighetsbeteckning:
          rotRut.fastighetsbeteckning ||
          artiklar.find((a: any) => a.rotRutFastighetsbeteckning)?.rotRutFastighetsbeteckning ||
          "",
        rotBoendeTyp: rotRut.rot_boende_typ || undefined,
        brfOrganisationsnummer:
          rotRut.brf_organisationsnummer ||
          artiklar.find((a: any) => a.rotRutBrfOrg)?.rotRutBrfOrg ||
          "",
        brfLagenhetsnummer:
          rotRut.brf_lagenhetsnummer ||
          artiklar.find((a: any) => a.rotRutBrfLagenhet)?.rotRutBrfLagenhet ||
          "",
        // Nya ROT/RUT-fält från rot_rut-tabellen eller första artikeln
        rotRutBeskrivning:
          (rotRut as any).rotRutBeskrivning ||
          artiklar.find((a: any) => a.rotRutBeskrivning)?.rotRutBeskrivning ||
          "",
        rotRutStartdatum:
          (rotRut as any).rotRutStartdatum ||
          artiklar.find((a: any) => a.rotRutStartdatum)?.rotRutStartdatum ||
          "",
        rotRutSlutdatum:
          (rotRut as any).rotRutSlutdatum ||
          artiklar.find((a: any) => a.rotRutSlutdatum)?.rotRutSlutdatum ||
          "",
      });

      console.log("✅ setFormData anropad med fakturanummer:", faktura.fakturanummer);

      // Sätt kundStatus till "loaded" så att kunduppgifterna visas
      if (faktura.kundnamn) {
        setKundStatus("loaded");
        console.log("👤 Sätt kundStatus till loaded");
      }

      // Navigera till NyFaktura istället för att visa flikar här
      router.push("/faktura/NyFaktura");
    },
    [setFormData, setKundStatus, router]
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

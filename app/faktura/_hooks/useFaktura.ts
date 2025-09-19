"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale";

// Context
import { useFakturaContext } from "../_context/FakturaContext";

// Actions
import {
  hämtaNästaFakturanummer,
  saveInvoice,
  deleteFaktura,
  hämtaSparadeFakturor,
} from "../_actions/fakturaActions";
import { hämtaSenasteBetalningsmetod } from "../_actions/alternativActions";
import {
  hämtaFöretagsprofil,
  sparaFöretagsprofil,
  uploadLogoAction,
} from "../_actions/foretagActions";
import {
  sparaNyKund,
  deleteKund,
  hämtaSparadeKunder,
  uppdateraKund,
} from "../_actions/kundActions";
import {
  sparaFavoritArtikel,
  hämtaSparadeArtiklar,
  deleteFavoritArtikel,
} from "../_actions/artikelActions";

// Utils
import { sanitizeFormInput, validatePersonnummer } from "../../_utils/validationUtils";
import { validateEmail } from "../../login/sakerhet/loginValidation";
import { generatePDFFromElement, generatePDFAsBase64 } from "../Alternativ/pdfGenerator";

// Types
import type {
  FakturaFormData,
  NyArtikel,
  KundStatus,
  ServerData,
  FavoritArtikel,
  Artikel,
  KundSaveResponse,
  ForhandsgranskningCalculations,
  SkickaEpostProps,
} from "../_types/types";

/**
 * Huvudhook för alla faktura-relaterade funktioner
 * Ersätter flera mindre hooks och använder Context istället för Zustand
 */
export function useFaktura() {
  // Context state
  const context = useFakturaContext();
  const {
    state: { formData, kundStatus, nyArtikel, produkterTjansterState, toastState, userSettings },
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    resetProdukterTjanster,
    setToast,
    clearToast,
    setBokföringsmetod,
    initStore,
  } = context;

  // External hooks
  const { data: session } = useSession();
  const router = useRouter();

  // Local UI state
  const [showPreview, setShowPreview] = useState(false);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [mottagareEmail, setMottagareEmail] = useState("");
  const [egetMeddelande, setEgetMeddelande] = useState("");
  const [kunder, setKunder] = useState<any[]>([]);
  const [kundSuccessVisible, setKundSuccessVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [rotRutMaterial, setRotRutMaterial] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null); // =============================================================================
  // SETUP & INITIALIZATION
  // =============================================================================

  // Registrera svensk locale för datepicker
  useEffect(() => {
    registerLocale("sv", sv);
  }, []);

  // Initialisera betalningsdata och standardvärden
  useEffect(() => {
    const initializeDefaults = async () => {
      const todayISO = new Date().toISOString().slice(0, 10);

      // Hämta senaste betalningsmetod för denna användare
      let senasteBetalning = { betalningsmetod: null, nummer: null };

      if (session?.user?.id) {
        senasteBetalning = await hämtaSenasteBetalningsmetod(session.user.id);
      }

      setFormData({
        fakturadatum: formData.fakturadatum || todayISO,
        betalningsvillkor: formData.betalningsvillkor || "30",
        drojsmalsranta: formData.drojsmalsranta || "12",
        betalningsmetod: formData.betalningsmetod || senasteBetalning.betalningsmetod || "",
        nummer: formData.nummer || senasteBetalning.nummer || "",
        forfallodatum:
          formData.forfallodatum ||
          (formData.fakturadatum
            ? addDays(
                new Date(formData.fakturadatum),
                parseInt(formData.betalningsvillkor || "30", 10)
              )
                .toISOString()
                .slice(0, 10)
            : ""),
      });
    };

    // Kör bara när session är laddad
    if (session?.user?.id) {
      initializeDefaults();
    }
  }, [session?.user?.id]);

  // Sätter förfallodatum automatiskt bara om det är tomt
  useEffect(() => {
    const fakturadatumDate = parseISODate(formData.fakturadatum);
    if (!fakturadatumDate || formData.forfallodatum) return;

    const days = parseInt(formData.betalningsvillkor || "30", 10);
    const calc = addDays(fakturadatumDate, isNaN(days) ? 30 : days)
      .toISOString()
      .slice(0, 10);
    setFormData({ forfallodatum: calc });
  }, [formData.fakturadatum, formData.betalningsvillkor, formData.forfallodatum]);

  // Uppdatera mottagarens e-post när kundens e-post ändras
  useEffect(() => {
    if (formData.kundemail && formData.kundemail.trim()) {
      setMottagareEmail(formData.kundemail);
    }
  }, [formData.kundemail]);

  // Ladda företagsprofil automatiskt när komponenten mountas
  useEffect(() => {
    loadForetagsprofil();
  }, []);

  // Hämta sparade kunder vid mount
  useEffect(() => {
    const laddaKunder = async () => {
      try {
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      } catch (error) {
        console.log("Fel vid hämtning av kunder");
      }
    };
    laddaKunder();
  }, []);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const updateFormField = useCallback(
    (field: keyof FakturaFormData, value: any) => {
      setFormData({ [field]: value });
    },
    [setFormData]
  );

  const updateMultipleFields = useCallback(
    (updates: Partial<FakturaFormData>) => {
      setFormData(updates);
    },
    [setFormData]
  );

  const updateArtikel = useCallback(
    (updates: Partial<NyArtikel>) => {
      setNyArtikel(updates);
    },
    [setNyArtikel]
  );

  // Toast helpers
  const showSuccess = useCallback(
    (message: string) => {
      setToast({ message, type: "success" });
    },
    [setToast]
  );

  const showError = useCallback(
    (message: string) => {
      setToast({ message, type: "error" });
    },
    [setToast]
  );

  const showInfo = useCallback(
    (message: string) => {
      setToast({ message, type: "info" });
    },
    [setToast]
  );

  // =============================================================================
  // BETALNING FUNCTIONS
  // =============================================================================

  function parseISODate(value: unknown): Date | null {
    if (value instanceof Date && !isNaN(value.getTime())) return value;
    if (typeof value === "string") {
      const d = new Date(value.trim());
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  function addDays(date: Date, days: number) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return out;
  }

  const updatePaymentDates = useCallback(
    (fakturadatum: Date, betalningsvillkor: string) => {
      const days = parseInt(betalningsvillkor) || 30;
      const forfallodatum = addDays(fakturadatum, days);

      setFormData({
        fakturadatum: fakturadatum.toISOString().split("T")[0],
        forfallodatum: forfallodatum.toISOString().split("T")[0],
      });
    },
    [setFormData]
  );

  // Event handlers från useBetalning
  const hanteraÄndraDatum = useCallback(
    (field: "fakturadatum" | "forfallodatum") => {
      return (d: Date | null) =>
        setFormData({
          [field]: d ? d.toISOString().slice(0, 10) : "",
        });
    },
    [setFormData]
  );

  const hanteraÄndradText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Blockera farliga tecken för nummer-fältet
      if (name === "nummer") {
        const sanitizedValue = value.replace(/[<>'"&]/g, "");
        setFormData({ [name]: sanitizedValue });
        return;
      }

      setFormData({ [name]: value });
    },
    [setFormData]
  );

  const hanteraÄndradDropdown = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({ [e.target.name]: e.target.value });
    },
    [setFormData]
  );

  // Beräknade datum-värden
  const fakturadatumDate = parseISODate(formData.fakturadatum);
  const fallbackForfallo = fakturadatumDate
    ? addDays(fakturadatumDate, parseInt(formData.betalningsvillkor || "30", 10))
    : null;
  const forfalloDate = parseISODate(formData.forfallodatum) ?? fallbackForfallo; // =============================================================================
  // AVSÄNDARE FUNCTIONS
  // =============================================================================

  // Ladda företagsprofil
  const loadForetagsprofil = useCallback(async () => {
    try {
      const data = await hämtaFöretagsprofil();
      if (data) {
        const safeData = {
          företagsnamn: data.företagsnamn || "",
          adress: data.adress || "",
          postnummer: data.postnummer || "",
          stad: data.stad || "",
          organisationsnummer: data.organisationsnummer || "",
          momsregistreringsnummer: data.momsregistreringsnummer || "",
          telefonnummer: data.telefonnummer || "",
          epost: data.epost || "",
          bankinfo: data.bankinfo || "",
          webbplats: data.webbplats || "",
          logo: data.logo || "",
          logoWidth: data.logoWidth || 200,
        };
        setFormData(safeData);
      }
    } catch (error) {
      console.error("Fel vid laddning av företagsprofil:", error);
      showError("Kunde inte ladda företagsprofil");
    }
  }, [setFormData, showError]);

  // Spara företagsprofil
  const sparaForetagsprofil = useCallback(async () => {
    try {
      const profilData = {
        företagsnamn: formData.företagsnamn,
        adress: formData.adress,
        postnummer: formData.postnummer,
        stad: formData.stad,
        organisationsnummer: formData.organisationsnummer,
        momsregistreringsnummer: formData.momsregistreringsnummer,
        telefonnummer: formData.telefonnummer,
        epost: formData.epost,
        bankinfo: formData.bankinfo,
        webbplats: formData.webbplats,
        logo: formData.logo,
        logoWidth: formData.logoWidth,
      };

      const result = await sparaFöretagsprofil(profilData);
      if (result.success) {
        showSuccess("Företagsprofil sparad");
      } else {
        showError("Fel vid sparande av företagsprofil");
      }
    } catch (error) {
      console.error("Fel vid sparande:", error);
      showError("Fel vid sparande av företagsprofil");
    }
  }, [formData, showSuccess, showError]);

  // Ladda upp logotype
  const handleLogoUpload = useCallback(
    async (file: File) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadLogoAction(formData);

        if (result.success && result.url) {
          setFormData({ logo: result.url });
          showSuccess("Logotype uppladdad");
        } else {
          showError(result.error || "Fel vid uppladdning");
        }
      } catch (error) {
        console.error("Upload error:", error);
        showError("Fel vid uppladdning av logotype");
      }
    },
    [setFormData, showSuccess, showError]
  );

  // Event handler från useAvsandare för logo upload
  const hanteraLoggaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showError("Bara bildfiler tillåtna (PNG, JPG, GIF, WebP).");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      await handleLogoUpload(file);
    },
    [handleLogoUpload, showError]
  );

  // Event handler för textfält från useAvsandare
  const hanteraTangentNer = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof FakturaFormData, value);
    },
    [updateFormField]
  );

  // =============================================================================
  // KUND FUNCTIONS
  // =============================================================================

  // Validera kunddata
  const validateKundData = useCallback((data: any): { isValid: boolean; error?: string } => {
    const kundnamn = sanitizeFormInput(data.kundnamn || "");
    if (!kundnamn || kundnamn.length < 2) {
      return { isValid: false, error: "Kundnamn krävs (minst 2 tecken)" };
    }

    if (data.kundemail && !validateEmail(data.kundemail)) {
      return { isValid: false, error: "Ogiltig email-adress" };
    }

    if (data.personnummer && !validatePersonnummer(data.personnummer)) {
      return { isValid: false, error: "Ogiltigt personnummer (format: YYMMDD-XXXX)" };
    }

    return { isValid: true };
  }, []);

  // Sanitera kunddata
  const sanitizeKundFormData = useCallback((data: any) => {
    return {
      ...data,
      kundnamn: sanitizeFormInput(data.kundnamn || ""),
      kundorganisationsnummer: sanitizeFormInput(data.kundorganisationsnummer || ""),
      kundnummer: sanitizeFormInput(data.kundnummer || ""),
      kundmomsnummer: sanitizeFormInput(data.kundmomsnummer || ""),
      kundadress: sanitizeFormInput(data.kundadress || ""),
      kundpostnummer: sanitizeFormInput(data.kundpostnummer || ""),
      kundstad: sanitizeFormInput(data.kundstad || ""),
      personnummer: sanitizeFormInput(data.personnummer || ""),
    };
  }, []);

  // Spara ny kund
  const sparaNyKundData = useCallback(async (): Promise<KundSaveResponse> => {
    const validation = validateKundData(formData);
    if (!validation.isValid) {
      showError(validation.error!);
      return { success: false, error: validation.error! };
    }

    try {
      const sanitizedData = sanitizeKundFormData(formData);
      const result = await sparaNyKund(sanitizedData);

      if (result.success) {
        setKundStatus("sparad");
        if ("id" in result && result.id) {
          setFormData({ kundId: result.id.toString() });
        }
        showSuccess("Kund sparad");
      } else {
        showError("error" in result ? result.error : "Fel vid sparande av kund");
      }

      return result;
    } catch (error) {
      const errorMsg = "Fel vid sparande av kund";
      showError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [
    formData,
    validateKundData,
    sanitizeKundFormData,
    showError,
    showSuccess,
    setKundStatus,
    setFormData,
  ]);

  // =============================================================================
  // PRODUKTER/TJÄNSTER FUNCTIONS
  // =============================================================================

  // ROT/RUT constants
  const RUT_KATEGORIER = [
    "Passa barn",
    "Fiber- och it-tjänster",
    "Flytta och packa",
    "Transport till försäljning för återanvändning",
    "Möblering",
    "Ta hand om en person och ge omsorg",
    "Reparera vitvaror",
    "Skotta snö",
    "Städa",
    "Tvätta, laga och sy",
    "Tvätt vid tvättinrättning",
    "Trädgårdsarbete – fälla och beskära träd",
    "Trädgårdsarbete – underhålla, klippa och gräva",
    "Tillsyn",
  ];

  const ROT_KATEGORIER = [
    "Bygg – reparera och underhålla",
    "Bygg – bygga om och bygga till",
    "El",
    "Glas och plåt",
    "Gräv- och markarbete",
    "Murning och sotning",
    "Målning och tapetsering",
    "Rengöring",
    "VVS",
  ];

  // ROT/RUT utility functions
  const sanitizeRotRutInput = useCallback((text: string): string => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/[<>'"&{}()[\]]/g, "") // Ta bort XSS-farliga tecken
      .replace(/\s+/g, " ") // Normalisera whitespace
      .trim()
      .substring(0, 500); // Begränsa längd
  }, []);

  const validateRotRutNumeric = useCallback((value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0 && num < 10000000;
  }, []);

  const validatePersonnummerRotRut = useCallback((personnummer: string): boolean => {
    if (!personnummer) return false;
    const clean = personnummer.replace(/[-\s]/g, "");
    return /^\d{10}$/.test(clean) || /^\d{12}$/.test(clean);
  }, []);

  // Store state destructuring
  const {
    favoritArtiklar,
    showFavoritArtiklar,
    blinkIndex,
    visaRotRutForm,
    visaArtikelForm,
    visaArtikelModal,
    redigerarIndex,
    favoritArtikelVald,
    ursprungligFavoritId,
    artikelSparadSomFavorit,
    valtArtikel,
  } = produkterTjansterState;

  // Ladda sparade artiklar
  const laddaSparadeArtiklar = useCallback(async () => {
    try {
      const artiklar = await hämtaSparadeArtiklar();
      setProdukterTjansterState({ favoritArtiklar: artiklar || [] });
    } catch (error) {
      console.error("Fel vid laddning av artiklar:", error);
      showError("Kunde inte ladda sparade artiklar");
    }
  }, [setProdukterTjansterState, showError]);

  // Lägg till artikel
  const läggTillArtikel = useCallback(() => {
    const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

    if (!beskrivning || !antal || !prisPerEnhet) {
      showError("Fyll i alla obligatoriska fält");
      return;
    }

    const nyArtikelData: Artikel = {
      beskrivning,
      antal: parseFloat(antal),
      prisPerEnhet: parseFloat(prisPerEnhet),
      moms: parseFloat(moms),
      valuta,
      typ,
      ursprungligFavoritId: ursprungligFavoritId ?? undefined,
    };

    const uppdateradeArtiklar = [...formData.artiklar, nyArtikelData];
    setFormData({ artiklar: uppdateradeArtiklar });
    resetNyArtikel();
    setProdukterTjansterState({
      visaArtikelForm: false,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
    });
    showSuccess("Artikel tillagd");
  }, [
    nyArtikel,
    formData.artiklar,
    ursprungligFavoritId,
    setFormData,
    resetNyArtikel,
    setProdukterTjansterState,
    showSuccess,
    showError,
  ]);

  // Ta bort artikel
  const taBortArtikel = useCallback(
    (index: number) => {
      const uppdateradeArtiklar = formData.artiklar.filter((_, i) => i !== index);
      setFormData({ artiklar: uppdateradeArtiklar });
      showSuccess("Artikel borttagen");
    },
    [formData.artiklar, setFormData, showSuccess]
  );

  // =============================================================================
  // ROT/RUT FUNCTIONS (från useProdukterTjanster)
  // =============================================================================

  // ROT/RUT event handlers
  const handleRotRutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let finalValue: string | boolean = value;

      if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
        finalValue = e.target.checked;
      } else if (typeof value === "string") {
        // SÄKERHETSVALIDERING: Sanitera alla textvärden
        if (name === "rotRutBeskrivning") {
          finalValue = sanitizeRotRutInput(value);
        } else if (name === "personnummer") {
          // Tillåt bara siffror och bindestreck för personnummer
          finalValue = value.replace(/[^\d-]/g, "").substring(0, 13);
        } else if (
          name === "fastighetsbeteckning" ||
          name === "brfOrganisationsnummer" ||
          name === "brfLagenhetsnummer"
        ) {
          finalValue = sanitizeRotRutInput(value);
        } else if (typeof value === "string") {
          finalValue = sanitizeRotRutInput(value);
        }
      }

      if (name === "rotRutAktiverat" && finalValue === false) {
        // Reset alla ROT/RUT fält när det inaktiveras
        const fieldsToReset = {
          rotRutAktiverat: false,
          rotRutTyp: undefined,
          rotRutKategori: undefined,
          avdragProcent: undefined,
          arbetskostnadExMoms: undefined,
          avdragBelopp: undefined,
          personnummer: undefined,
          fastighetsbeteckning: undefined,
          rotBoendeTyp: undefined,
          brfOrganisationsnummer: undefined,
          brfLagenhetsnummer: undefined,
        };

        Object.entries(fieldsToReset).forEach(([key, value]) => {
          updateFormField(key as keyof FakturaFormData, value);
        });
        return;
      }

      if (name === "rotRutTyp") {
        const procent = value === "ROT" ? 50 : value === "RUT" ? 50 : undefined;
        const isActive = value === "ROT" || value === "RUT";

        updateMultipleFields({
          rotRutAktiverat: isActive,
          rotRutTyp: isActive ? (value as "ROT" | "RUT") : undefined,
          avdragProcent: procent,
          rotRutKategori: undefined,
        });
        return;
      }

      // Vanlig uppdatering av enskilt fält
      updateFormField(name as keyof FakturaFormData, finalValue);
    },
    [updateFormField, updateMultipleFields, sanitizeRotRutInput]
  );

  const handleRotRutBoendeTypChange = useCallback(
    (typ: "fastighet" | "brf") => {
      updateFormField("rotBoendeTyp", typ);
    },
    [updateFormField]
  );

  const handleRotRutDateChange = useCallback(
    (field: string, date: Date | null) => {
      if (date) {
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        updateFormField(field as keyof FakturaFormData, dateString);
      }
    },
    [updateFormField]
  );

  // Produkter/Tjänster state setters
  const setShowFavoritArtiklar = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ showFavoritArtiklar: value });
    },
    [setProdukterTjansterState]
  );

  const setVisaRotRutForm = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ visaRotRutForm: value });
    },
    [setProdukterTjansterState]
  );

  const setVisaArtikelForm = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ visaArtikelForm: value });
    },
    [setProdukterTjansterState]
  );

  // =============================================================================
  // FÖRHANDSGRANSKNING FUNCTIONS
  // =============================================================================

  const [logoSliderValue, setLogoSliderValue] = useState(() => {
    const initial = (((formData.logoWidth ?? 200) - 50) / 150) * 100;
    return initial;
  });

  const handleLogoSliderChange = useCallback(
    (value: number) => {
      setLogoSliderValue(value);
      const calculated = 50 + (value / 100) * 150;
      setFormData({ logoWidth: calculated });
      localStorage.setItem("company_logoWidth", calculated.toString());
    },
    [setFormData]
  );

  // Beräkningar för förhandsgranskning
  const getForhandsgranskningCalculations = useCallback((): ForhandsgranskningCalculations => {
    const rows = formData.artiklar || [];
    const logoSize = formData.logoWidth ?? 200;

    // Grundläggande summor
    const sumExkl = rows.reduce(
      (acc, rad) =>
        acc + parseFloat(String(rad.antal) || "0") * parseFloat(String(rad.prisPerEnhet) || "0"),
      0
    );

    const totalMoms = rows.reduce((acc, rad) => {
      const antal = parseFloat(String(rad.antal) || "0");
      const pris = parseFloat(String(rad.prisPerEnhet) || "0");
      const moms = parseFloat(String(rad.moms) || "0");
      return acc + antal * pris * (moms / 100);
    }, 0);

    // ROT/RUT-avdrag enligt Skatteverket: 50% av arbetskostnad inkl moms
    // Kolla om ROT/RUT är aktiverat på formulärnivå ELLER om det finns ROT/RUT-artiklar
    const harROTRUTArtiklar =
      formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
    const rotRutTyp =
      formData.rotRutTyp ||
      (harROTRUTArtiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

    // Beräkna arbetskostnad bara för ROT/RUT-tjänster (inte material)
    const rotRutTjänsterSumExkl =
      formData.artiklar?.reduce((acc, rad: any) => {
        if (rad.typ === "tjänst" && rad.rotRutTyp && !rad.rotRutMaterial) {
          const antal = parseFloat(String(rad.antal) || "0");
          const pris = parseFloat(String(rad.prisPerEnhet) || "0");
          return acc + antal * pris;
        }
        return acc;
      }, 0) || 0;

    const rotRutTjänsterMoms =
      formData.artiklar?.reduce((acc, rad: any) => {
        if (rad.typ === "tjänst" && rad.rotRutTyp && !rad.rotRutMaterial) {
          const antal = parseFloat(String(rad.antal) || "0");
          const pris = parseFloat(String(rad.prisPerEnhet) || "0");
          const moms = parseFloat(String(rad.moms) || "0");
          return acc + antal * pris * (moms / 100);
        }
        return acc;
      }, 0) || 0;

    const rotRutTjänsterInklMoms = rotRutTjänsterSumExkl + rotRutTjänsterMoms;
    const arbetskostnadInklMoms = sumExkl + totalMoms;

    // Avdrag bara på tjänstekostnaden, inte material
    const rotRutAvdrag =
      (formData.rotRutAktiverat || harROTRUTArtiklar) && rotRutTyp === "ROT"
        ? 0.5 * rotRutTjänsterInklMoms
        : (formData.rotRutAktiverat || harROTRUTArtiklar) && rotRutTyp === "RUT"
          ? 0.5 * rotRutTjänsterInklMoms
          : 0;

    const totalSum = arbetskostnadInklMoms - rotRutAvdrag;
    const summaAttBetala = Math.max(totalSum, 0);

    // ROT/RUT display beräkningar
    const rotRutPersonnummer =
      formData.personnummer ||
      (formData.artiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutPersonnummer)
          ?.rotRutPersonnummer);

    const shouldShowRotRut =
      (formData.rotRutAktiverat || harROTRUTArtiklar) &&
      rotRutTyp &&
      (rotRutTyp === "ROT" || rotRutTyp === "RUT");

    const rotRutArtiklar = formData.artiklar?.filter((a: any) => a.rotRutTyp) || [];
    const rotRutTotalTimmar = rotRutArtiklar.reduce(
      (sum: number, a: any) => sum + (a.antal || 0),
      0
    );
    const rotRutGenomsnittsPris =
      rotRutArtiklar.length > 0
        ? rotRutArtiklar.reduce((sum: number, a: any) => sum + (a.prisPerEnhet || 0), 0) /
          rotRutArtiklar.length
        : 0;

    const rotRutAvdragProcent = rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—";

    // Legacy kompatibilitet
    const sumMoms = totalMoms;
    const sumInkl = sumExkl + totalMoms;

    return {
      rows,
      logoSliderValue,
      handleLogoSliderChange,
      logoSize,
      sumExkl,
      sumMoms,
      sumInkl,
      totalMoms,
      harROTRUTArtiklar,
      rotRutTyp,
      rotRutTjänsterSumExkl,
      rotRutTjänsterMoms,
      rotRutTjänsterInklMoms,
      arbetskostnadInklMoms,
      rotRutAvdrag,
      rotRutPersonnummer,
      rotRutTotalTimmar,
      rotRutGenomsnittsPris,
      rotRutAvdragProcent,
      shouldShowRotRut,
      totalSum,
      summaAttBetala,
    };
  }, [
    formData.artiklar,
    formData.logoWidth,
    formData.rotRutAktiverat,
    formData.rotRutTyp,
    formData.personnummer,
    logoSliderValue,
    handleLogoSliderChange,
  ]);

  // =============================================================================
  // PDF & EMAIL FUNCTIONS
  // =============================================================================

  // Exportera PDF
  const handleExportPDF = useCallback(async () => {
    try {
      const pdf = await generatePDFFromElement();
      pdf.save("faktura.pdf");
      showSuccess("PDF exporterad");
    } catch (error) {
      console.error("❌ Error exporting PDF:", error);
      showError("Kunde inte exportera PDF");
    }
  }, [showSuccess, showError]);

  // Validera e-postadress
  const validateEmail = useCallback(
    (email: string): boolean => {
      if (!email.trim()) {
        showError("Ange mottagarens e-postadress");
        return false;
      }

      if (!email.includes("@")) {
        showError("Ange en giltig e-postadress");
        return false;
      }

      return true;
    },
    [showError]
  );

  // Skicka e-post (avancerad version från useSkickaEpost)
  const skickaEpost = useCallback(
    async (customProps?: Partial<SkickaEpostProps>) => {
      // Validering
      if (!validateEmail(mottagareEmail)) {
        return;
      }

      if (!formData.id) {
        showError("Spara fakturan först innan du skickar den");
        return;
      }

      setIsSending(true);

      try {
        // Generera PDF med den delade funktionen
        const pdfBase64 = await generatePDFAsBase64();

        // Skapa fakturanummer med nollutfyllnad
        const fakturaNr = formData.fakturanummer
          ? formData.fakturanummer.toString().padStart(4, "0")
          : "faktura";

        // Skicka e-post med PDF-bilaga och eget meddelande
        const response = await fetch("/api/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            faktura: {
              ...formData,
              kundemail: mottagareEmail, // Använd det angivna e-postfältet
            },
            pdfAttachment: pdfBase64,
            filename: `Faktura-${fakturaNr}.pdf`,
            customMessage: egetMeddelande.trim(), // Skicka med det egna meddelandet
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Kunde inte skicka e-post");
        }

        showSuccess("Faktura skickad till kunden!");
        customProps?.onSuccess?.();
      } catch (error) {
        console.error("❌ E-postfel:", error);
        const errorMessage = error instanceof Error ? error.message : "Okänt fel";
        showError(`Kunde inte skicka faktura: ${errorMessage}`);
        customProps?.onError?.(errorMessage);
      } finally {
        setIsSending(false);
      }
    },
    [mottagareEmail, egetMeddelande, formData, showSuccess, showError, validateEmail]
  );

  // E-post hjälpfunktioner
  const isEpostButtonDisabled = useCallback(() => {
    return isSending || !formData.fakturanummer || !mottagareEmail.trim() || !formData.id;
  }, [isSending, formData.fakturanummer, mottagareEmail, formData.id]);

  const getEpostButtonText = useCallback(() => {
    if (isSending) return "📤 Skickar...";
    if (!formData.id) return "❌ Spara faktura först";
    return "📧 Skicka faktura";
  }, [isSending, formData.id]);

  const getEpostStatusMessage = useCallback(() => {
    if (!formData.id) {
      return {
        type: "warning" as const,
        text: "Spara fakturan först innan du skickar den",
      };
    }

    return {
      type: "info" as const,
      text: `E-posten skickas till ${mottagareEmail || "ingen e-post angiven"}`,
    };
  }, [formData.id, mottagareEmail]);

  // =============================================================================
  // KUND MANAGEMENT FUNCTIONS (från useKundUppgifter)
  // =============================================================================

  // Formulärhantering för kunder
  const handleKundChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      updateFormField(name as keyof FakturaFormData, value);
      if (kundStatus === "loaded") setKundStatus("editing");
    },
    [updateFormField, kundStatus, setKundStatus]
  );

  // Spara kund (förbättrad version från useKundUppgifter)
  const handleKundSave = useCallback(async () => {
    try {
      // Validera kunddata
      const validation = validateKundData(formData);
      if (!validation.isValid) {
        showError(validation.error || "Valideringsfel");
        return;
      }

      // Sanitera data
      const sanitizedData = sanitizeKundFormData(formData);

      const fd = new FormData();
      fd.append("kundnamn", sanitizedData.kundnamn);
      fd.append("kundorgnummer", sanitizedData.kundorganisationsnummer);
      fd.append("kundnummer", sanitizedData.kundnummer);
      fd.append("kundmomsnummer", sanitizedData.kundmomsnummer);
      fd.append("kundadress1", sanitizedData.kundadress);
      fd.append("kundpostnummer", sanitizedData.kundpostnummer);
      fd.append("kundstad", sanitizedData.kundstad);
      fd.append("kundemail", formData.kundemail);
      fd.append("personnummer", sanitizedData.personnummer);

      const res: KundSaveResponse = formData.kundId
        ? await uppdateraKund(parseInt(formData.kundId, 10), fd)
        : await sparaNyKund(fd);

      if (res.success) {
        if (!formData.kundId && res.id) {
          updateFormField("kundId", res.id.toString());
        }
        setKundStatus("loaded");
        setKundSuccessVisible(true);
        setFadeOut(false);
        setTimeout(() => setFadeOut(true), 1500);
        setTimeout(() => setKundSuccessVisible(false), 3000);

        // Ladda om kunder
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      } else {
        showError("Kunde inte spara kund");
      }
    } catch (error) {
      showError("Kunde inte spara kund");
    }
  }, [formData, updateFormField, setKundStatus, validateKundData, sanitizeKundFormData, showError]);

  // Välj kund
  const handleSelectCustomer = useCallback(
    (kundId: string) => {
      const valdKund = kunder.find((k) => k.id.toString() === kundId);
      if (!valdKund) return;

      updateMultipleFields({
        kundId: valdKund.id.toString(),
        kundnamn: valdKund.kundnamn,
        kundorganisationsnummer: valdKund.kundorgnummer,
        kundnummer: valdKund.kundnummer,
        kundmomsnummer: valdKund.kundmomsnummer,
        kundadress: valdKund.kundadress1,
        kundpostnummer: valdKund.kundpostnummer,
        kundstad: valdKund.kundstad,
        kundemail: valdKund.kundemail,
        personnummer: valdKund.personnummer || "",
      });
      setKundStatus("loaded");
    },
    [kunder, updateMultipleFields, setKundStatus]
  );

  // Skapa ny kund
  const handleCreateNewCustomer = useCallback(() => {
    resetKund();
    setKundStatus("editing");
  }, [resetKund, setKundStatus]);

  // Radera kund
  const handleDeleteCustomer = useCallback(async () => {
    if (!formData.kundId) return;
    if (!confirm("Är du säker på att du vill ta bort kunden?")) return;

    try {
      await deleteKund(parseInt(formData.kundId, 10));
      resetKund();
      setKundStatus("none");
      const sparade = await hämtaSparadeKunder();
      setKunder(sparade.sort((a: any, b: any) => a.kundnamn.localeCompare(b.kundnamn)));
      showSuccess("Kund raderad");
    } catch (error) {
      console.error("Fel vid radering av kund:", error);
      showError("Kunde inte radera kunden");
    }
  }, [formData.kundId, resetKund, setKundStatus, showSuccess, showError]);

  // Sätt till redigeringsläge
  const handleEditCustomer = useCallback(() => {
    setKundStatus("editing");
  }, [setKundStatus]);

  // =============================================================================
  // SPARADE FAKTUROR FUNCTIONS
  // =============================================================================

  const handleSelectInvoice = useCallback((fakturaId: number, onSelect?: (id: number) => void) => {
    if (onSelect) {
      onSelect(fakturaId);
    }
  }, []);

  const handleDeleteInvoice = useCallback(
    async (fakturaId: number) => {
      if (!confirm("Är du säker på att du vill ta bort denna faktura?")) {
        return;
      }

      try {
        setLoadingInvoiceId(fakturaId);
        const result = await deleteFaktura(fakturaId);
        if (result.success) {
          showSuccess("Faktura borttagen");
          window.location.reload();
        } else {
          showError(result.error || "Fel vid borttagning av faktura");
        }
      } catch (error) {
        showError("Fel vid borttagning av faktura");
      } finally {
        setLoadingInvoiceId(null);
      }
    },
    [showSuccess, showError]
  );

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    formData,
    kundStatus,
    nyArtikel,
    produkterTjansterState,
    toastState,
    userSettings,
    showPreview,
    loadingInvoiceId,
    isSending,
    mottagareEmail,
    egetMeddelande,
    logoSliderValue,
    kunder,
    kundSuccessVisible,
    fadeOut,
    rotRutMaterial,

    // Context actions
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    resetProdukterTjanster,
    setToast,
    clearToast,
    setBokföringsmetod,
    initStore,

    // Helper functions
    updateFormField,
    updateMultipleFields,
    updateArtikel,
    showSuccess,
    showError,
    showInfo,

    // Local state setters
    setShowPreview,
    setMottagareEmail,
    setEgetMeddelande,
    setLogoSliderValue,

    // Artikel setters för nyArtikel state
    setBeskrivning: (value: string) => updateArtikel({ beskrivning: value }),
    setAntal: (value: number) => updateArtikel({ antal: value.toString() }),
    setPrisPerEnhet: (value: number) => updateArtikel({ prisPerEnhet: value.toString() }),
    setMoms: (value: number) => updateArtikel({ moms: value.toString() }),
    setValuta: (value: string) => updateArtikel({ valuta: value }),
    setTyp: (value: "vara" | "tjänst") => updateArtikel({ typ: value }),

    // Betalning functions
    parseISODate,
    addDays,
    updatePaymentDates,
    hanteraÄndraDatum,
    hanteraÄndradText,
    hanteraÄndradDropdown,
    fakturadatumDate,
    forfalloDate,

    // Avsändare functions
    loadForetagsprofil,
    sparaForetagsprofil,
    handleLogoUpload,
    hanteraLoggaUpload,
    hanteraTangentNer,

    // Kund functions
    validateKundData,
    sanitizeKundFormData,
    sparaNyKundData,
    handleKundChange,
    handleKundSave,
    handleSelectCustomer,
    handleCreateNewCustomer,
    handleDeleteCustomer,
    handleEditCustomer,

    // Produkter/Tjänster functions
    laddaSparadeArtiklar,
    läggTillArtikel,
    taBortArtikel,
    setShowFavoritArtiklar,
    setVisaRotRutForm,
    setVisaArtikelForm,
    setRotRutMaterial,

    // ROT/RUT constants and functions
    RUT_KATEGORIER,
    ROT_KATEGORIER,
    sanitizeRotRutInput,
    validateRotRutNumeric,
    validatePersonnummerRotRut,
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,

    // Förhandsgranskning functions
    handleLogoSliderChange,
    getForhandsgranskningCalculations,

    // PDF & Email functions
    handleExportPDF,
    skickaEpost,
    validateEmail,
    isEpostButtonDisabled: isEpostButtonDisabled(),
    epostButtonText: getEpostButtonText(),
    epostStatusMessage: getEpostStatusMessage(),
    hasCustomerEmail: !!(formData.kundemail && formData.kundemail.trim()),

    // Sparade fakturor functions
    handleSelectInvoice,
    handleDeleteInvoice,

    // Refs
    fileInputRef,
  };
}

// Legacy export för backward compatibility under migration
export const useFakturaClient = useFaktura;

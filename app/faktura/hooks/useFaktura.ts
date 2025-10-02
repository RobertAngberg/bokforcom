"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale";

// Auth
import { useSession } from "../../_lib/auth-client";

// Context
import { useFakturaContext } from "../context/FakturaContext";

// Actions
import { hämtaFakturaMedRader } from "../actions/fakturaActions";
import {
  hämtaFöretagsprofil,
  sparaFöretagsprofil,
  uploadLogoAction,
} from "../actions/foretagActions";
import { sparaNyKund, deleteKund, hämtaSparadeKunder, uppdateraKund } from "../actions/kundActions";
import { hämtaSenasteBetalningsmetod } from "../actions/alternativActions";

// Utils
import {
  sanitizeFormInput,
  validatePersonnummer,
  validateEmail,
} from "../../_utils/validationUtils";
import { showToast } from "../../_components/Toast";

// Types
import type { FakturaFormData, NyArtikel, KundSaveResponse } from "../types/types";

/**
 * Huvudhook för alla faktura-relaterade funktioner
 * Ersätter flera mindre hooks och använder Context istället för Zustand
 */
export function useFaktura() {
  // Context state
  const context = useFakturaContext();
  const {
    state: { formData, kundStatus, nyArtikel, produkterTjansterState, userSettings },
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    resetProdukterTjanster,
    setBokföringsmetod,
    initStore,
  } = context;

  // External hooks
  const { data: session } = useSession();

  // Local UI state
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingFaktura, setIsLoadingFaktura] = useState(false);
  const [kunder, setKunder] = useState<
    Array<{
      id: number;
      kundnamn: string;
      kundorgnummer?: string;
      kundnummer?: string;
      kundmomsnummer?: string;
      kundadress1?: string;
      kundpostnummer?: string;
      kundstad?: string;
      kundemail?: string;
      personnummer?: string;
    }>
  >([]);
  const [showDeleteKundModal, setShowDeleteKundModal] = useState(false);

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

  // Ladda företagsprofil automatiskt när komponenten mountas
  useEffect(() => {
    loadForetagsprofil();
  }, []);

  // Hämta sparade kunder vid mount
  useEffect(() => {
    const laddaKunder = async () => {
      try {
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      } catch {
        console.log("Fel vid hämtning av kunder");
      }
    };
    laddaKunder();
  }, []);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const updateFormField = useCallback(
    (field: keyof FakturaFormData, value: string | number | boolean | unknown) => {
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
  const showSuccess = useCallback((message: string) => {
    showToast(message, "success");
  }, []);

  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, []);

  const showInfo = useCallback((message: string) => {
    showToast(message, "info");
  }, []);

  // =============================================================================
  // UI HELPER FUNCTIONS
  // =============================================================================

  // Preview functions
  const openPreview = useCallback(() => setShowPreview(true), []);
  const closePreview = useCallback(() => setShowPreview(false), []);

  // Reload function
  const reloadFaktura = useCallback(() => {
    window.location.reload();
  }, []);

  // =============================================================================
  // DATA LOADING FUNCTIONS
  // =============================================================================

  /**
   * Laddar fakturedata för redigering eller som mall för ny faktura
   */
  const laddaFakturaData = useCallback(
    async (fakturaId: number): Promise<boolean> => {
      try {
        const data = await hämtaFakturaMedRader(fakturaId);

        if (!data || !data.faktura) {
          showError("Kunde inte hämta faktura");
          return false;
        }

        const { faktura, artiklar, rotRut } = data;

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
          artiklar: artiklar.map((rad) => ({
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
          rotRutAktiverat: !!(rotRut.typ && rotRut.typ !== "") || artiklar.some((a) => a.rotRutTyp),
          rotRutTyp: rotRut.typ || artiklar.find((a) => a.rotRutTyp)?.rotRutTyp || undefined,
          rotRutKategori:
            ((rotRut as Record<string, unknown>).rotRutKategori as string | undefined) ||
            artiklar.find((a) => a.rotRutKategori)?.rotRutKategori ||
            undefined,
          avdragProcent:
            rotRut.avdrag_procent ||
            artiklar.find((a) => a.avdragProcent)?.avdragProcent ||
            undefined,
          arbetskostnadExMoms:
            rotRut.arbetskostnad_ex_moms ||
            artiklar.find((a) => a.arbetskostnadExMoms)?.arbetskostnadExMoms ||
            undefined,
          avdragBelopp: rotRut.avdrag_belopp || undefined,
          personnummer:
            rotRut.personnummer ||
            artiklar.find((a) => a.rotRutPersonnummer)?.rotRutPersonnummer ||
            "",
          fastighetsbeteckning:
            rotRut.fastighetsbeteckning ||
            artiklar.find((a) => a.rotRutFastighetsbeteckning)?.rotRutFastighetsbeteckning ||
            "",
          rotBoendeTyp: rotRut.rot_boende_typ || undefined,
          brfOrganisationsnummer:
            rotRut.brf_organisationsnummer ||
            artiklar.find((a) => a.rotRutBrfOrg)?.rotRutBrfOrg ||
            "",
          brfLagenhetsnummer:
            rotRut.brf_lagenhetsnummer ||
            artiklar.find((a) => a.rotRutBrfLagenhet)?.rotRutBrfLagenhet ||
            "",
          rotRutBeskrivning:
            ((rotRut as Record<string, unknown>).rotRutBeskrivning as string | undefined) ||
            artiklar.find((a) => a.rotRutBeskrivning)?.rotRutBeskrivning ||
            "",
          rotRutStartdatum:
            ((rotRut as Record<string, unknown>).rotRutStartdatum as string | undefined) ||
            artiklar.find((a) => a.rotRutStartdatum)?.rotRutStartdatum ||
            "",
          rotRutSlutdatum:
            ((rotRut as Record<string, unknown>).rotRutSlutdatum as string | undefined) ||
            artiklar.find((a) => a.rotRutSlutdatum)?.rotRutSlutdatum ||
            "",
        });

        // Uppdatera kundstatus för att indikera att en kund är vald
        if (faktura.kundId) {
          setKundStatus("loaded");
        }

        return true;
      } catch (error) {
        console.error("❌ Fel vid laddning av fakturedata:", error);
        showError("Kunde inte ladda fakturedata");
        return false;
      }
    },
    [setFormData, setKundStatus, showError]
  );

  // Fakturedata loading med loading state
  const laddaFakturaDataMedLoading = useCallback(
    async (fakturaId: number): Promise<boolean> => {
      setIsLoadingFaktura(true);
      try {
        const result = await laddaFakturaData(fakturaId);
        return result;
      } finally {
        setIsLoadingFaktura(false);
      }
    },
    [laddaFakturaData]
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
  const validateKundData = useCallback(
    (data: Partial<FakturaFormData>): { isValid: boolean; error?: string } => {
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
    },
    []
  );

  // Sanitera kunddata
  const sanitizeKundFormData = useCallback((data: Partial<FakturaFormData>) => {
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

      // Konvertera till FormData för server action
      const formDataToSend = new FormData();
      formDataToSend.append("kundnamn", sanitizedData.kundnamn || "");
      formDataToSend.append("kundorgnummer", sanitizedData.kundorganisationsnummer || "");
      formDataToSend.append("kundnummer", sanitizedData.kundnummer || "");
      formDataToSend.append("kundmomsnummer", sanitizedData.kundmomsnummer || "");
      formDataToSend.append("kundadress1", sanitizedData.kundadress || "");
      formDataToSend.append("kundpostnummer", sanitizedData.kundpostnummer || "");
      formDataToSend.append("kundstad", sanitizedData.kundstad || "");
      formDataToSend.append("kundemail", sanitizedData.kundemail || "");
      formDataToSend.append("personnummer", sanitizedData.personnummer || "");

      const result = await sparaNyKund(formDataToSend);

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
    } catch {
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
  // BASIC ARTIKEL FUNCTIONS (för bakåtkompatibilitet)
  // =============================================================================

  // Lägg till artikel (förenklad version)
  const läggTillArtikel = useCallback(() => {
    const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

    if (!beskrivning || !antal || !prisPerEnhet) {
      showError("Fyll i alla obligatoriska fält");
      return;
    }

    const nyArtikelData = {
      beskrivning,
      antal: parseFloat(antal),
      prisPerEnhet: parseFloat(prisPerEnhet),
      moms: parseFloat(moms),
      valuta,
      typ,
    };

    const uppdateradeArtiklar = [...formData.artiklar, nyArtikelData];
    setFormData({ artiklar: uppdateradeArtiklar });
    resetNyArtikel();
    showSuccess("Artikel tillagd");
  }, [nyArtikel, formData.artiklar, setFormData, resetNyArtikel, showSuccess, showError]);

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
        showToast("Kund sparad! ✅", "success");

        // Ladda om kunder
        const sparade = await hämtaSparadeKunder();
        setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      } else {
        showError("Kunde inte spara kund");
      }
    } catch {
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
    setShowDeleteKundModal(true);
  }, [formData.kundId, setShowDeleteKundModal]);

  const confirmDeleteKund = useCallback(async () => {
    if (!formData.kundId) return;

    setShowDeleteKundModal(false);

    try {
      await deleteKund(parseInt(formData.kundId, 10));
      resetKund();
      setKundStatus("none");
      const sparade = await hämtaSparadeKunder();
      setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
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
  // RETURN OBJECT
  // =============================================================================

  return {
    // State
    formData,
    kundStatus,
    nyArtikel,
    produkterTjansterState,
    userSettings,
    showPreview,
    kunder,
    showDeleteKundModal,
    setShowDeleteKundModal,

    // Context actions
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    resetProdukterTjanster,
    setBokföringsmetod,
    initStore,

    // Helper functions
    updateFormField,
    updateMultipleFields,
    updateArtikel,
    showSuccess,
    showError,
    showInfo,

    // Data loading functions
    laddaFakturaData,
    laddaFakturaDataMedLoading,

    // UI helper functions
    openPreview,
    closePreview,
    reloadFaktura,
    isLoadingFaktura,

    // Local state setters
    setShowPreview,

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
    confirmDeleteKund,
    handleEditCustomer,

    // Basic artikel functions (för bakåtkompatibilitet)
    läggTillArtikel,
    taBortArtikel,

    // Refs
    fileInputRef,
  };
}

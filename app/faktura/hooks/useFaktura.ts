"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale";
import { useSession } from "../../_lib/auth-client";
import { useFakturaClient, useFakturaInitialData } from "../context/hooks/FakturaContext";
import { useProdukterTjanster } from "./useProdukterTjanster";
import { useFakturaLifecycle } from "../context/hooks/FakturaFormContext";
import { hamtaFakturaMedRader, hamtaNastaFakturanummer } from "../actions/fakturaActions";
import {
  hamtaForetagsprofil,
  sparaForetagsprofil as sparaForetagsprofilAction,
  uploadLogoAction,
} from "../actions/foretagActions";
import { sparaNyKund, deleteKund, hamtaSparadeKunder, uppdateraKund } from "../actions/kundActions";
import { hamtaSenasteBetalningsmetod } from "../actions/alternativActions";
import { validatePersonnummer, validateEmail } from "../../_utils/validationUtils";
import { stringTillDate, dateToYyyyMmDd } from "../../_utils/datum";
import { showToast } from "../../_components/Toast";
import type { FakturaFormData, KundListItem, KundSaveResponse } from "../types/types";

/**
 * Huvudhook för alla faktura-relaterade funktioner
 * Ersätter flera mindre hooks och använder Context istället för Zustand
 */
export function useFaktura() {
  // Context state
  const {
    formData,
    kundStatus,
    userSettings,
    navigationState,
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    setBokföringsmetod,
  } = useFakturaClient();
  const initialData = useFakturaInitialData();

  const artikelContext = useProdukterTjanster();
  const {
    nyArtikel,
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
    showDeleteFavoritModal,
    deleteFavoritId,
    läggTillArtikel,
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,
    updateArtikel,
    resetNyArtikel,
    setVisaArtikelModal,
    setValtArtikel,
  } = artikelContext;

  const produkterTjansterState = useMemo(
    () => ({
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
      showDeleteFavoritModal,
      deleteFavoritId,
    }),
    [
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
      showDeleteFavoritModal,
      deleteFavoritId,
    ]
  );
  const lifecycle = useFakturaLifecycle();
  // Servern skickar med den senast använda betalningsinformationen så att vi slipper ett extra server-anrop vid uppstart.
  const initialSenasteBetalning = initialData?.senasteBetalning ?? null;
  // Företagsprofilen kan också hydreras direkt från initialdata (om den finns) och då behöver vi inte hämta den igen klient-side.
  const initialForetagsprofil = initialData?.foretagsprofil;

  // Avgör om vi redigerar en sparad faktura och tar fram titel/fakturanummer för vyn.
  const editFakturaId = navigationState.editFakturaId;
  const isEditingView = navigationState.currentView === "ny" && Boolean(editFakturaId);
  const displayFakturanummer =
    (formData.fakturanummer || "").trim() || (editFakturaId ? String(editFakturaId) : "");
  const displayKundnamn = (formData.kundnamn || "").trim();

  const fakturaTitle = useMemo(() => {
    if (isEditingView) {
      if (displayFakturanummer && displayKundnamn) {
        return `✏️ Redigerar Faktura #${displayFakturanummer} - ${displayKundnamn}`;
      }
      if (displayFakturanummer) {
        return `✏️ Redigerar Faktura #${displayFakturanummer}`;
      }
      return "✏️ Redigerar Faktura";
    }

    if (displayFakturanummer && displayKundnamn) {
      return `🧾 Faktura #${displayFakturanummer} - ${displayKundnamn}`;
    }
    if (displayFakturanummer) {
      return `🧾 Faktura #${displayFakturanummer}`;
    }
    return "Ny Faktura";
  }, [isEditingView, displayFakturanummer, displayKundnamn]);

  // External hooks
  const { data: session } = useSession();

  // Local UI state
  const [showPreview, setShowPreview] = useState(false);
  const [isLoadingFaktura, setIsLoadingFaktura] = useState(false);
  const initialKunder = useMemo(() => {
    const kunder = initialData?.kunder ?? [];
    return [...kunder].sort((a, b) => a.kundnamn.localeCompare(b.kundnamn));
  }, [initialData?.kunder]);
  const [kunder, setKunder] = useState<Array<KundListItem>>(() => initialKunder);
  const [showDeleteKundModal, setShowDeleteKundModal] = useState(false);

  if (!lifecycle.current.harLastatKunder && initialKunder.length > 0) {
    lifecycle.current.harLastatKunder = true;
  }
  // Synka bokföringsmetod från serverinitialiserade data så Alternativ-flödet startar med korrekt läge utan att göra ett nytt fetch.
  useEffect(() => {
    const initialBokforingsmetod = initialData?.bokforingsmetod;
    if (!initialBokforingsmetod) {
      return;
    }

    const normalized =
      initialBokforingsmetod === "kontantmetoden" ? "kontantmetoden" : "fakturametoden";

    if (userSettings.bokföringsmetod !== normalized) {
      setBokföringsmetod(normalized);
    }
  }, [initialData?.bokforingsmetod, setBokföringsmetod, userSettings.bokföringsmetod]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // =============================================================================
  // SETUP & INITIALIZATION
  // =============================================================================

  // Registrera svensk locale för datepicker
  useEffect(() => {
    registerLocale("sv", sv);
  }, []);

  // Initialisera betalningsdata och standardvärden
  // Körs bara en gång per session tack vare lifecycle-flaggan.
  useEffect(() => {
    if (!session?.user?.id) return;

    if (lifecycle.current.lastDefaultsSessionId !== session.user.id) {
      lifecycle.current.lastDefaultsSessionId = session.user.id;
      lifecycle.current.harInitDefaults = false;
      lifecycle.current.harAutoBeraknatForfallo = false;
    }

    if (lifecycle.current.harInitDefaults) {
      return;
    }

    lifecycle.current.harInitDefaults = true;

    const initializeDefaults = async () => {
      const todayISO = dateToYyyyMmDd(new Date());

      const currentFormData = formDataRef.current;
      const defaultFakturadatum = stringTillDate(currentFormData.fakturadatum);

      // Hämta senaste betalningsmetod för denna användare
      let senasteBetalning = initialSenasteBetalning;

      // Om servern saknar värden (t.ex. ny användare) hämtar vi en fallback här.
      if (!senasteBetalning && session?.user?.id) {
        senasteBetalning = await hamtaSenasteBetalningsmetod(session.user.id);
      }

      setFormData({
        fakturadatum: currentFormData.fakturadatum || todayISO,
        betalningsvillkor: currentFormData.betalningsvillkor || "30",
        drojsmalsranta: currentFormData.drojsmalsranta || "12",
        betalningsmetod: currentFormData.betalningsmetod || senasteBetalning?.betalningsmetod || "",
        nummer: currentFormData.nummer || senasteBetalning?.nummer || "",
        forfallodatum:
          currentFormData.forfallodatum ||
          (defaultFakturadatum
            ? dateToYyyyMmDd(
                addDays(
                  defaultFakturadatum!,
                  parseInt(currentFormData.betalningsvillkor || "30", 10)
                )
              )
            : ""),
      });
    };

    initializeDefaults();
  }, [session?.user?.id, setFormData, lifecycle, initialSenasteBetalning]);

  // Sätter förfallodatum automatiskt bara om det är tomt
  // Guarden säkerställer att vi inte triggar en ny render-loop när forfallodatum sätts.
  useEffect(() => {
    if (lifecycle.current.harAutoBeraknatForfallo) {
      return;
    }

    const fakturadatumDate = stringTillDate(formData.fakturadatum);
    if (!fakturadatumDate || formData.forfallodatum) return;

    const days = parseInt(formData.betalningsvillkor || "30", 10);
    const calc = dateToYyyyMmDd(addDays(fakturadatumDate!, isNaN(days) ? 30 : days));
    lifecycle.current.harAutoBeraknatForfallo = true;
    setFormData({ forfallodatum: calc });
  }, [
    formData.fakturadatum,
    formData.betalningsvillkor,
    formData.forfallodatum,
    setFormData,
    lifecycle,
  ]);

  // Hämta sparade kunder vid mount
  useEffect(() => {
    if (lifecycle.current.harLastatKunder) {
      return;
    }

    lifecycle.current.harLastatKunder = true;

    const laddaKunder = async () => {
      try {
        const sparade = await hamtaSparadeKunder();
        setKunder(sparade.sort((a, b) => a.kundnamn.localeCompare(b.kundnamn)));
      } catch (error) {
        console.log("Fel vid hämtning av kunder", error);
        lifecycle.current.harLastatKunder = false;
      }
    };

    laddaKunder();
  }, [lifecycle]);

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

  // =============================================================================
  // DATA LOADING FUNCTIONS
  // =============================================================================

  /**
   * Laddar fakturedata för redigering eller som mall för ny faktura
   */
  const laddaFakturaData = useCallback(
    async (fakturaId: number): Promise<boolean> => {
      try {
        const data = await hamtaFakturaMedRader(fakturaId);

        if (!data || !data.faktura) {
          showError("Kunde inte hämta faktura");
          return false;
        }

        const { faktura, artiklar, rotRut } = data;

        const toDateString = (value: unknown): string => {
          if (value instanceof Date) {
            return dateToYyyyMmDd(value);
          }
          return typeof value === "string" ? value : "";
        };

        const previous = formDataRef.current;

        setFormData({
          id: faktura.id,
          fakturanummer: faktura.fakturanummer ?? "",
          fakturadatum: toDateString(faktura.fakturadatum),
          forfallodatum: toDateString(faktura.forfallodatum),
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
          företagsnamn: faktura.företagsnamn ?? previous.företagsnamn ?? "",
          epost: faktura.epost ?? previous.epost ?? "",
          adress: faktura.adress ?? previous.adress ?? "",
          postnummer: faktura.postnummer ?? previous.postnummer ?? "",
          stad: faktura.stad ?? previous.stad ?? "",
          organisationsnummer: faktura.organisationsnummer ?? previous.organisationsnummer ?? "",
          momsregistreringsnummer:
            faktura.momsregistreringsnummer ?? previous.momsregistreringsnummer ?? "",
          telefonnummer: faktura.telefonnummer ?? previous.telefonnummer ?? "",
          bankinfo: faktura.bankinfo ?? previous.bankinfo ?? "",
          webbplats: faktura.webbplats ?? previous.webbplats ?? "",
          logo: faktura.logo ?? previous.logo ?? "",
          logoWidth: faktura.logo_width ?? previous.logoWidth ?? 200,
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

  // Hämtar sparad faktura när användaren går in i redigeringsläget.
  useEffect(() => {
    if (!isEditingView || !editFakturaId) {
      return;
    }

    if (Number(formData.id) === Number(editFakturaId)) {
      return;
    }

    const fetchInvoice = async () => {
      try {
        await laddaFakturaDataMedLoading(editFakturaId);
      } catch (error) {
        console.error("Kunde inte ladda faktura för redigering", error);
      }
    };

    void fetchInvoice();
  }, [isEditingView, editFakturaId, formData.id, laddaFakturaDataMedLoading]);

  useEffect(() => {
    if (navigationState.currentView !== "ny" || editFakturaId) {
      lifecycle.current.harInitNyFaktura = false;
      return;
    }

    if (lifecycle.current.harInitNyFaktura) {
      return;
    }

    lifecycle.current.harInitNyFaktura = true;

    const previousFormData = formDataRef.current;
    const today = new Date();
    const todayIso = dateToYyyyMmDd(today);
    const previousVillkor = (previousFormData.betalningsvillkor || "30").toString();
    const villkorDays = parseInt(previousVillkor, 10);
    const defaultForfallo = dateToYyyyMmDd(
      addDays(today, Number.isFinite(villkorDays) ? villkorDays : 30)
    );

    const previousFakturanummer = parseInt(previousFormData.fakturanummer ?? "", 10);
    const predictedNextFakturanummer = Number.isFinite(previousFakturanummer)
      ? (previousFakturanummer + 1).toString()
      : "";

    const preservedCompanyFields = {
      företagsnamn: previousFormData.företagsnamn || "",
      adress: previousFormData.adress || "",
      postnummer: previousFormData.postnummer || "",
      stad: previousFormData.stad || "",
      organisationsnummer: previousFormData.organisationsnummer || "",
      momsregistreringsnummer: previousFormData.momsregistreringsnummer || "",
      telefonnummer: previousFormData.telefonnummer || "",
      bankinfo: previousFormData.bankinfo || "",
      epost: previousFormData.epost || "",
      webbplats: previousFormData.webbplats || "",
      logo: previousFormData.logo || "",
      logoWidth:
        typeof previousFormData.logoWidth === "number" &&
        Number.isFinite(previousFormData.logoWidth)
          ? previousFormData.logoWidth
          : 200,
    };

    const preservedPaymentFields = {
      betalningsvillkor: previousVillkor,
      drojsmalsranta: (previousFormData.drojsmalsranta || "12").toString(),
      betalningsmetod: previousFormData.betalningsmetod || "",
    };

    resetFormData();
    resetKund();
    resetNyArtikel();

    setFormData({
      ...preservedCompanyFields,
      ...preservedPaymentFields,
      id: "",
      artiklar: [],
      fakturanummer: predictedNextFakturanummer,
      fakturadatum: todayIso,
      forfallodatum: defaultForfallo,
      nummer: "",
      rotRutAktiverat: false,
      rotRutTyp: "ROT",
      rotRutKategori: "",
      avdragProcent: 0,
      avdragBelopp: 0,
      arbetskostnadExMoms: 0,
      materialkostnadExMoms: 0,
      rotRutBeskrivning: "",
      rotRutStartdatum: "",
      rotRutSlutdatum: "",
    });

    const fetchNextNumber = async () => {
      try {
        const nextNr = await hamtaNastaFakturanummer();
        setFormData({ fakturanummer: nextNr.toString() });
      } catch (error) {
        console.error("Kunde inte hämta nästa fakturanummer", error);
      }
    };

    void fetchNextNumber();
  }, [
    navigationState.currentView,
    editFakturaId,
    resetFormData,
    resetKund,
    resetNyArtikel,
    setFormData,
    lifecycle,
  ]);

  // =============================================================================
  // BETALNING FUNCTIONS
  // =============================================================================

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
        fakturadatum: dateToYyyyMmDd(fakturadatum),
        forfallodatum: dateToYyyyMmDd(forfallodatum),
      });
    },
    [setFormData]
  );

  // Event handlers från useBetalning
  const hanteraÄndraDatum = useCallback(
    (field: "fakturadatum" | "forfallodatum") => {
      return (d: Date | null) =>
        setFormData({
          [field]: d ? dateToYyyyMmDd(d) : "",
        });
    },
    [setFormData]
  );

  const hanteraÄndradText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (typeof value !== "string") {
        setFormData({ [name]: value });
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
  const fakturadatumDate = stringTillDate(formData.fakturadatum);
  const fallbackForfallo = fakturadatumDate
    ? addDays(fakturadatumDate, parseInt(formData.betalningsvillkor || "30", 10))
    : null;
  const forfalloDate = stringTillDate(formData.forfallodatum) ?? fallbackForfallo; // =============================================================================
  // AVSÄNDARE FUNCTIONS
  // =============================================================================

  // Ladda företagsprofil
  // Samma guard-tanke: hämta och applicera bara första gången.
  const loadForetagsprofil = useCallback(async () => {
    try {
      const data = await hamtaForetagsprofil();
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

  // Om servern redan fyllde företagsprofilen markerar vi det och hoppar över klientanropet.
  useEffect(() => {
    if (lifecycle.current.harLastatForetagsprofil) {
      return;
    }

    if (initialForetagsprofil) {
      lifecycle.current.harLastatForetagsprofil = true;
      return;
    }

    lifecycle.current.harLastatForetagsprofil = true;
    loadForetagsprofil().catch((error) => {
      console.error("[useFaktura] loadForetagsprofil effect error", error);
    });
  }, [loadForetagsprofil, lifecycle, initialForetagsprofil]);

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

      const result = await sparaForetagsprofilAction(profilData);
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
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        const result = await uploadLogoAction(uploadFormData);

        if (!result.success || !result.url) {
          showError(result.error || "Fel vid uppladdning");
          return;
        }

        const nästaFormState = { ...formDataRef.current, logo: result.url };
        setFormData({ logo: result.url });

        const saveResult = await sparaForetagsprofilAction({
          företagsnamn: nästaFormState.företagsnamn,
          adress: nästaFormState.adress,
          postnummer: nästaFormState.postnummer,
          stad: nästaFormState.stad,
          organisationsnummer: nästaFormState.organisationsnummer,
          momsregistreringsnummer: nästaFormState.momsregistreringsnummer,
          telefonnummer: nästaFormState.telefonnummer,
          epost: nästaFormState.epost,
          bankinfo: nästaFormState.bankinfo,
          webbplats: nästaFormState.webbplats,
          logo: nästaFormState.logo,
          logoWidth: nästaFormState.logoWidth,
        });

        if (!saveResult.success) {
          showError("Logotypen kunde inte sparas permanent");
          return;
        }

        showSuccess("Logotyp uppladdad och sparad");
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
      const kundnamn = data.kundnamn || "";
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
      kundnamn: data.kundnamn ?? "",
      kundorganisationsnummer: data.kundorganisationsnummer ?? "",
      kundnummer: data.kundnummer ?? "",
      kundmomsnummer: data.kundmomsnummer ?? "",
      kundadress: data.kundadress ?? "",
      kundpostnummer: data.kundpostnummer ?? "",
      kundstad: data.kundstad ?? "",
      kundemail: data.kundemail ?? "",
      personnummer: data.personnummer ?? "",
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
        showError("error" in result && result.error ? result.error : "Fel vid sparande av kund");
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
  // KUND MANAGEMENT FUNCTIONS (från useKundUppgifter)
  // =============================================================================

  // Formulärhantering för kunder
  const handleKundChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const nextValue: string | boolean = value;
      updateFormField(name as keyof FakturaFormData, nextValue);
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
      fd.append("kundemail", sanitizedData.kundemail);
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
        const sparade = await hamtaSparadeKunder();
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
        kundorganisationsnummer: valdKund.kundorgnummer ?? "",
        kundnummer: valdKund.kundnummer ?? "",
        kundmomsnummer: valdKund.kundmomsnummer ?? "",
        kundadress: valdKund.kundadress1 ?? "",
        kundpostnummer: valdKund.kundpostnummer ?? "",
        kundstad: valdKund.kundstad ?? "",
        kundemail: valdKund.kundemail || "",
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
      const sparade = await hamtaSparadeKunder();
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
    navigationState,
    showPreview,
    kunder,
    showDeleteKundModal,
    setShowDeleteKundModal,
    editFakturaId,
    isEditingView,
    fakturaTitle,

    // Context actions
    setFormData,
    resetFormData,
    setKundStatus,
    resetKund,
    resetNyArtikel,
    setBokföringsmetod,

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
    isLoadingFaktura,

    // Local state setters
    setShowPreview,

    // Artikel setters för nyArtikel state
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,

    // Betalning functions
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
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    setVisaArtikelModal,
    setValtArtikel,

    // Refs
    fileInputRef,
  };
}

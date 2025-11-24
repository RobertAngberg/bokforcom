"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useFakturaClient, useFakturaInitialData } from "../context/hooks/FakturaContext";
import { useFakturaLifecycle } from "../context/hooks/FakturaFormContext";
import { hamtaFakturaMedRader, hamtaNastaFakturanummer } from "../actions/fakturaActions";
import { hamtaSenasteBetalningsmetod } from "../actions/alternativActions";
import { showToast } from "../../_components/Toast";
import { stringTillDate, dateToYyyyMmDd } from "../../_utils/datum";
import { useSession } from "../../_lib/auth-client";

/**
 * Hook för data loading och initialisering av fakturor
 */
export function useFakturaData() {
  const {
    formData,
    navigationState,
    userSettings,
    setFormData,
    resetFormData,
    resetKund,
    setKundStatus,
    setBokföringsmetod,
  } = useFakturaClient();
  const initialData = useFakturaInitialData();
  const lifecycle = useFakturaLifecycle();
  const { data: session } = useSession();

  // URL state
  const searchParams = useSearchParams();
  const isOffert = searchParams.get("type") === "offert";
  const docType = isOffert ? "Offert" : "Faktura";
  const docIcon = isOffert ? "📄" : "🧾";

  // Local state
  const [isLoadingFaktura, setIsLoadingFaktura] = useState(false);

  // Refs
  const formDataRef = useRef(formData);
  const resetNyArtikelRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Server data
  const initialSenasteBetalning = initialData?.senasteBetalning ?? null;

  // Helper functions
  const showError = useCallback((message: string) => {
    showToast(message, "error");
  }, []);

  function addDays(date: Date, days: number) {
    const out = new Date(date);
    out.setDate(out.getDate() + days);
    return out;
  }

  // Computed values
  const editFakturaId = navigationState.editFakturaId;
  const isEditingView = navigationState.currentView === "ny" && Boolean(editFakturaId);
  const displayFakturanummer =
    (formData.fakturanummer || "").trim() || (editFakturaId ? String(editFakturaId) : "");
  const displayKundnamn = (formData.kundnamn || "").trim();

  const fakturaTitle = isEditingView
    ? displayFakturanummer && displayKundnamn
      ? `✏️ Redigerar ${docType} #${displayFakturanummer} - ${displayKundnamn}`
      : displayFakturanummer
        ? `✏️ Redigerar ${docType} #${displayFakturanummer}`
        : `✏️ Redigerar ${docType}`
    : displayFakturanummer && displayKundnamn
      ? `${docIcon} ${docType} #${displayFakturanummer} - ${displayKundnamn}`
      : displayFakturanummer
        ? `${docIcon} ${docType} #${displayFakturanummer}`
        : `${docIcon} Ny ${docType}`;

  // Synka bokföringsmetod från server
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

  // Initialisera betalningsdata och standardvärden
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

      // Om servern saknar värden (t.ex. ny användare) hämtar vi en fallback här
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

  // Laddar fakturedata för redigering
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

  // Hämtar sparad faktura när användaren går in i redigeringsläget
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

  // Initialisera ny faktura
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
    if (resetNyArtikelRef.current) {
      resetNyArtikelRef.current();
    }

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
    setFormData,
    lifecycle,
  ]);

  return {
    // State
    isLoadingFaktura,
    editFakturaId,
    isEditingView,
    fakturaTitle,

    // Functions
    laddaFakturaData,
    laddaFakturaDataMedLoading,

    // Refs
    resetNyArtikelRef,
  };
}

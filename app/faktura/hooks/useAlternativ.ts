"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { dateToYyyyMmDd } from "../../_utils/datum";
import { useFaktura } from "./useFaktura";
import { useFakturaInitialData } from "../context/hooks/FakturaContext";
import { saveInvoice, konverteraOffertTillFaktura } from "../actions/fakturaActions";
import { showToast } from "../../_components/Toast";
import {
  hamtaFakturaStatus,
  bokforFaktura,
  hamtaBokforingsmetod,
} from "../actions/alternativActions";
import { laddaNerHUSFil } from "../utils/husFilGenerator";
import { BokforingsPost, BokföringsData } from "../types/types";
import { ColumnDefinition } from "../../_components/Tabell";
import { formatCurrency } from "../../_utils/format";

const normalizeStatus = (status: string | null | undefined) => {
  const normalized = (status || "").trim().toLowerCase();
  return normalized === "delvis betald" ? "skickad" : normalized;
};

const isStatusSkickad = (status: string | null | undefined) =>
  normalizeStatus(status) === "skickad";

const isStatusFardig = (status: string | null | undefined) => normalizeStatus(status) === "färdig";

const toTrimmedString = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value == null) {
    return "";
  }

  return String(value).trim();
};

// Validation functions - flyttad från useBokforFakturaModal
function validateBokföringsPost(post: BokforingsPost): { isValid: boolean; error?: string } {
  if (!post.konto || !/^\d{4}$/.test(post.konto.toString())) {
    return { isValid: false, error: "Ogiltigt kontonummer (måste vara 4 siffror)" };
  }

  if (isNaN(post.debet) || isNaN(post.kredit) || post.debet < 0 || post.kredit < 0) {
    return { isValid: false, error: "Ogiltiga belopp i bokföringsposter" };
  }

  if (post.debet > 0 && post.kredit > 0) {
    return { isValid: false, error: "En post kan inte ha både debet och kredit" };
  }

  return { isValid: true };
}

function validateBokföringsBalance(poster: BokforingsPost[]): { isValid: boolean; error?: string } {
  const totalDebet = poster.reduce((sum, post) => sum + post.debet, 0);
  const totalKredit = poster.reduce((sum, post) => sum + post.kredit, 0);

  if (Math.abs(totalDebet - totalKredit) > 0.01) {
    return {
      isValid: false,
      error: `Bokföringen balanserar inte! Debet: ${totalDebet.toFixed(2)}, Kredit: ${totalKredit.toFixed(2)}`,
    };
  }

  return { isValid: true };
}

function validateBokföringsData(data: BokföringsData): { isValid: boolean; error?: string } {
  if (!data.fakturanummer || data.fakturanummer.trim().length === 0) {
    return { isValid: false, error: "Fakturanummer krävs" };
  }

  if (!data.kundnamn || data.kundnamn.trim().length === 0) {
    return { isValid: false, error: "Kundnamn krävs" };
  }

  if (!data.poster || !Array.isArray(data.poster) || data.poster.length === 0) {
    return { isValid: false, error: "Minst en bokföringspost krävs" };
  }

  if (isNaN(data.totaltBelopp) || data.totaltBelopp <= 0) {
    return { isValid: false, error: "Ogiltigt totalbelopp" };
  }

  // Validera varje post
  for (const post of data.poster) {
    const validation = validateBokföringsPost(post);
    if (!validation.isValid) {
      return validation;
    }
  }

  // Validera balans
  const balanceValidation = validateBokföringsBalance(data.poster);
  if (!balanceValidation.isValid) {
    return balanceValidation;
  }

  return { isValid: true };
}

// Utility för att normalisera bokföringsmetod från både serverinitialiserade värden och klienthämtningar.
const normalizeBokforingsmetod = (metod?: string | null) => {
  const normalized = (metod || "").toLowerCase();
  return normalized === "kontantmetoden" ? "kontantmetoden" : "fakturametoden";
};

export function useAlternativ() {
  const searchParams = useSearchParams();
  const isOffert = searchParams.get("type") === "offert";

  const { formData, updateFormField } = useFaktura();
  const initialData = useFakturaInitialData();
  // Servern kan skicka med bokföringsmetoden; i så fall hoppar vi över första fetch och använder värdet direkt.
  const initialNormalizedBokforingsmetod = initialData?.bokforingsmetod
    ? normalizeBokforingsmetod(initialData.bokforingsmetod)
    : undefined;
  const [bokförModalOpen, setBokförModalOpen] = useState(false);
  const [sparaLoading, setSparaLoading] = useState(false);
  const [bokförLoading, setBokförLoading] = useState(false);
  const [bokföringsmetod, setBokföringsmetod] = useState<string>(
    initialNormalizedBokforingsmetod ?? "fakturametoden"
  );
  const [fakturaStatus, setFakturaStatus] = useState<{
    status?: string;
    betaldatum?: string;
  }>({});

  // Hämta användarens bokföringsmetod när komponenten laddas
  useEffect(() => {
    if (initialNormalizedBokforingsmetod) {
      return;
    }

    let isMounted = true;

    hamtaBokforingsmetod().then((metod) => {
      if (!isMounted) return;
      setBokföringsmetod(normalizeBokforingsmetod(metod));
    });

    return () => {
      isMounted = false;
    };
  }, [initialNormalizedBokforingsmetod]);

  // Hämta fakturaSTATUS när ID ändras
  useEffect(() => {
    if (formData.id) {
      hamtaFakturaStatus(parseInt(formData.id)).then((status) =>
        setFakturaStatus({ status: status.status, betaldatum: status.betaldatum })
      );
    } else {
      setFakturaStatus({});
    }
  }, [formData.id]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{
        fakturaId?: number;
        status?: string;
        betaldatum?: string;
      }>;
      const currentId = formData.id ? parseInt(formData.id, 10) : null;

      if (!currentId || customEvent.detail?.fakturaId !== currentId) {
        return;
      }

      setFakturaStatus((prev) => ({
        status: customEvent.detail?.status ?? prev.status,
        betaldatum: customEvent.detail?.betaldatum ?? prev.betaldatum,
      }));
    };

    window.addEventListener("fakturaStatusUppdaterad", handler);

    return () => {
      window.removeEventListener("fakturaStatusUppdaterad", handler);
    };
  }, [formData.id]);

  const hanteraKonverteraTillFaktura = async () => {
    if (!formData.id) {
      showToast("Spara offerten först innan konvertering", "error");
      return;
    }

    try {
      setSparaLoading(true);
      const result = await konverteraOffertTillFaktura(Number(formData.id));

      if (result.success && result.fakturaId) {
        showToast(`Offert konverterad till Faktura #${result.fakturanummer}!`, "success");

        // Navigera till den nya fakturan
        // Använd window.location för att säkerställa fullständig reload
        window.location.href = `/faktura?edit=${result.fakturaId}`;
      } else {
        showToast(result.error || "Kunde inte konvertera offert", "error");
      }
    } catch {
      showToast("Kunde inte konvertera offert till faktura", "error");
    } finally {
      setSparaLoading(false);
    }
  };

  const hanteraSpara = async () => {
    if (sparaLoading) return; // Förhindra dubbla sparningar

    setSparaLoading(true);
    const fd = new FormData();
    try {
      // Validera och rensa artiklar innan serialisering
      const artiklarToSave = (formData.artiklar ?? []).map((artikel) => ({
        beskrivning: artikel.beskrivning,
        antal: artikel.antal,
        prisPerEnhet: artikel.prisPerEnhet,
        moms: artikel.moms,
        valuta: artikel.valuta || "SEK",
        typ: artikel.typ || "vara",
        rotRutTyp: artikel.rotRutTyp || null,
        rotRutKategori: artikel.rotRutKategori || null,
        avdragProcent: artikel.avdragProcent || null,
        arbetskostnadExMoms: artikel.arbetskostnadExMoms || null,
        rotRutBeskrivning: artikel.rotRutBeskrivning || null,
        rotRutStartdatum: artikel.rotRutStartdatum || null,
        rotRutSlutdatum: artikel.rotRutSlutdatum || null,
        rotRutPersonnummer: artikel.rotRutPersonnummer || null,
        rotRutFastighetsbeteckning: artikel.rotRutFastighetsbeteckning || null,
        rotRutBoendeTyp: artikel.rotRutBoendeTyp || null,
        rotRutBrfOrg: artikel.rotRutBrfOrg || null,
        rotRutBrfLagenhet: artikel.rotRutBrfLagenhet || null,
      }));

      fd.append("artiklar", JSON.stringify(artiklarToSave));
      fd.append("isOffert", isOffert ? "true" : "false");
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "artiklar" && v != null) fd.append(k, String(v));
      });

      const res = await saveInvoice(fd);

      if (res.success) {
        showToast("Faktura sparad!", "success");

        if ("id" in res && res.id) {
          updateFormField("id", res.id.toString());
          if ("fakturanummer" in res && res.fakturanummer) {
            updateFormField("fakturanummer", res.fakturanummer);
          }
          window.dispatchEvent(
            new CustomEvent("fakturaSaved", {
              detail: { id: res.id, fakturanummer: res.fakturanummer || formData.fakturanummer },
            })
          );
        }

        // Trigga reload event så Fakturor.tsx uppdaterar sin lista
        window.dispatchEvent(new Event("reloadFakturor"));
      } else {
        const errorMessage = (res as { error?: string }).error;
        showToast(errorMessage || "Kunde inte spara fakturan.", "error");
      }
    } catch (error) {
      console.error("Fel vid sparande av faktura:", error);
      showToast(
        "Kunde inte spara fakturan. Kontrollera att alla fält är ifyllda korrekt.",
        "error"
      );
    } finally {
      setSparaLoading(false);
    }
  };

  const hanteraBokför = async () => {
    if (bokförLoading) return; // Förhindra dubbla bokföringar

    setBokförLoading(true);
    try {
      if (!formData.id) {
        const fd = new FormData();
        try {
          // Validera och rensa artiklar innan serialisering
          const artiklarToSave = (formData.artiklar ?? []).map((artikel) => ({
            beskrivning: artikel.beskrivning,
            antal: artikel.antal,
            prisPerEnhet: artikel.prisPerEnhet,
            moms: artikel.moms,
            valuta: artikel.valuta || "SEK",
            typ: artikel.typ || "vara",
            rotRutTyp: artikel.rotRutTyp || null,
            rotRutKategori: artikel.rotRutKategori || null,
            avdragProcent: artikel.avdragProcent || null,
            arbetskostnadExMoms: artikel.arbetskostnadExMoms || null,
            rotRutBeskrivning: artikel.rotRutBeskrivning || null,
            rotRutStartdatum: artikel.rotRutStartdatum || null,
            rotRutSlutdatum: artikel.rotRutSlutdatum || null,
            rotRutPersonnummer: artikel.rotRutPersonnummer || null,
            rotRutFastighetsbeteckning: artikel.rotRutFastighetsbeteckning || null,
            rotRutBoendeTyp: artikel.rotRutBoendeTyp || null,
            rotRutBrfOrg: artikel.rotRutBrfOrg || null,
            rotRutBrfLagenhet: artikel.rotRutBrfLagenhet || null,
          }));

          fd.append("artiklar", JSON.stringify(artiklarToSave));
          fd.append("isOffert", isOffert ? "true" : "false");
          Object.entries(formData).forEach(([k, v]) => {
            if (k !== "artiklar" && v != null) fd.append(k, String(v));
          });
          const res = await saveInvoice(fd);

          if (res.success && "id" in res && res.id) {
            updateFormField("id", res.id.toString());
            if ("fakturanummer" in res && res.fakturanummer) {
              updateFormField("fakturanummer", res.fakturanummer);
            }
            window.dispatchEvent(
              new CustomEvent("fakturaSaved", {
                detail: { id: res.id, fakturanummer: res.fakturanummer || formData.fakturanummer },
              })
            );
            window.dispatchEvent(new Event("reloadFakturor"));
            setBokförModalOpen(true);
          } else {
            const errorMessage = (res as { error?: string }).error;
            showToast(errorMessage || "Kunde inte spara fakturan innan bokföring.", "error");
            return;
          }
        } catch (error) {
          console.error("Fel vid sparande innan bokföring:", error);
          showToast("Kunde inte spara fakturan innan bokföring.", "error");
          return;
        }
      } else {
        setBokförModalOpen(true);
      }
    } finally {
      setBokförLoading(false);
    }
  };

  // Beräknade värden
  const ärFakturanSkickad = isStatusSkickad(fakturaStatus.status);
  const ärFakturanFärdig = isStatusFardig(fakturaStatus.status);
  const ärFakturanBetald = ärFakturanFärdig;
  const ärFakturanBokfördOchBetald = ärFakturanFärdig;
  const ärKontantmetod = bokföringsmetod === "kontantmetoden";
  const ärNyFaktura = !formData.id;

  // För offerter, dölj bokför-knappen
  const doljBokförKnapp = isOffert;
  const visaKonverteraKnapp = isOffert && formData.id; // Visa bara om offerten är sparad

  // Knapptexter
  const sparaKnappText = sparaLoading ? "💾 Sparar..." : "💾 Spara";
  const fakturaIdStr = toTrimmedString(formData.id);
  const harFakturaId = fakturaIdStr !== "";
  const statusLoading = harFakturaId && fakturaStatus.status == null && !isOffert; // Ingen status-check för offerter
  const registerButtonLabel = (() => {
    const normalized = (bokföringsmetod || "").toLowerCase();
    if (ärFakturanSkickad && !ärFakturanBokfördOchBetald) {
      return "💼 Bokför betald";
    }
    return normalized === "kontantmetoden" ? "📨 Bokför betald" : "📨 Bokför skickad";
  })();
  const bokförKnappText = bokförLoading
    ? "Registrerar..."
    : statusLoading
      ? "Hämtar status..."
      : ärFakturanBokfördOchBetald
        ? "☑️ Betald och klar"
        : registerButtonLabel;
  const återställKnappText = ärFakturanBetald ? "🔒 Betald faktura" : "🔄 Återställ";
  const granskKnappText = "👁️ Förhandsgranska";
  const pdfKnappText = "📤 Ladda ner PDF";

  // ROT/RUT-relaterade beräkningar
  return {
    // State
    bokförModalOpen,
    sparaLoading,
    bokförLoading,
    bokföringsmetod,
    fakturaStatus,
    formData,

    // Computed values
    ärFakturanBetald,
    ärKontantmetod,
    ärNyFaktura,
    ärFakturanBokfördOchBetald,
    statusLoading,
    doljBokförKnapp,
    visaKonverteraKnapp,
    sparaKnappText,
    bokförKnappText,
    återställKnappText,
    granskKnappText,
    pdfKnappText,

    // Actions
    setBokförModalOpen,
    hanteraSpara,
    hanteraBokför,
    hanteraKonverteraTillFaktura,
  };
}

export function useBokforFakturaModal(isOpen: boolean, onClose: () => void) {
  const { formData, userSettings, setBokföringsmetod } = useFaktura();
  const [loading, setLoading] = useState(false);
  const [fakturaStatus, setFakturaStatus] = useState<{
    status?: string;
    betaldatum?: string;
  }>({});
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

  // Hämta användarens bokföringsmetod och fakturaSTATUS från databasen
  useEffect(() => {
    if (isOpen && formData.id !== lastLoadedId) {
      setStatusLoaded(false);
      setLastLoadedId(formData.id);
      hamtaBokforingsmetod().then((metod) => {
        const normalized =
          (metod || "").toLowerCase() === "kontantmetoden" ? "kontantmetoden" : "fakturametoden";
        setBokföringsmetod(normalized);
      });

      // Hämta fakturaSTATUS om ID finns
      if (formData.id) {
        hamtaFakturaStatus(parseInt(formData.id)).then((status) => {
          setFakturaStatus({ status: status.status, betaldatum: status.betaldatum });
          setStatusLoaded(true);
        });
      } else {
        setStatusLoaded(true);
      }
    } else if (isOpen && formData.id === lastLoadedId) {
      // Samma ID, sätt bara statusLoaded till true
      setStatusLoaded(true);
    }
  }, [isOpen, formData.id, lastLoadedId, setBokföringsmetod]); // Inkludera setBokföringsmetod

  // Resettera state när modalen stängs
  useEffect(() => {
    if (!isOpen) {
      setLastLoadedId(null);
      setStatusLoaded(false);
    }
  }, [isOpen]);

  const ärKontantmetod = userSettings.bokföringsmetod === "kontantmetoden";

  const harROTRUTArtiklar = formData.artiklar?.some((artikel) => artikel.rotRutTyp) ?? false;
  const rotRutTyp =
    formData.rotRutTyp ||
    (formData.artiklar && formData.artiklar.find((artikel) => artikel.rotRutTyp)?.rotRutTyp);
  const visaHusFilKnapp = (formData.rotRutAktiverat && !!rotRutTyp) || harROTRUTArtiklar;
  const husFilDisabled = !formData.fakturanummer;
  const husFilDisabledInfo = !visaHusFilKnapp
    ? null
    : !formData.fakturanummer
      ? "Spara fakturan först"
      : null;
  const husFilKnappText = "Ladda ner ROT/RUT-fil XML";

  const modalStatus = fakturaStatus.status;
  const ärFakturanSkickadIModal = isStatusSkickad(modalStatus);
  const ärFakturanFärdigIModal = isStatusFardig(modalStatus);
  const ärKundbetalningRegistreradIModal = ärFakturanSkickadIModal && !!fakturaStatus.betaldatum;
  const ärFakturanRedanBokförd = ärFakturanSkickadIModal || ärFakturanFärdigIModal;
  const ärFakturanBokfördOchBetald = ärFakturanFärdigIModal;

  // Analysera fakturan och föreslå bokföringsposter
  const analyseraBokföring = (): { poster: BokforingsPost[]; varningar: string[] } => {
    const varningar: string[] = [];
    const poster: BokforingsPost[] = [];

    // Validera grunddata
    if (!formData.artiklar || formData.artiklar.length === 0) {
      varningar.push("Fakturan saknar artiklar/tjänster");
      return { poster, varningar };
    }

    // Beräkna totalt belopp
    const totalExMoms = formData.artiklar.reduce(
      (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet,
      0
    );

    const totalMoms = formData.artiklar.reduce(
      (sum, artikel) => sum + (artikel.antal * artikel.prisPerEnhet * artikel.moms) / 100,
      0
    );

    const totalInkMoms = totalExMoms + totalMoms;

    if (totalInkMoms <= 0) {
      varningar.push("Fakturans totalbelopp är 0 eller negativt");
      return { poster, varningar };
    }

    const harVaror = formData.artiklar.some((artikel) => artikel.typ === "vara");
    const harTjänster = formData.artiklar.some((artikel) => artikel.typ === "tjänst");
    const harOkändTyp = formData.artiklar.some(
      (artikel) => artikel.typ !== "vara" && artikel.typ !== "tjänst"
    );

    if (harOkändTyp) {
      varningar.push(
        "⚠️ Minst en rad saknar giltig typ (vara/tjänst). Komplettera innan du bokför fakturan."
      );
      return { poster, varningar };
    }

    // KONTROLLERA OM FAKTURAN HAR NÅTT SENARE STATUSSTEG
    if (ärFakturanRedanBokförd) {
      const harRotRutArtiklar = formData.artiklar?.some((artikel) => artikel.rotRutTyp) || false;

      if (!ärFakturanFärdigIModal) {
        const betalningsbelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : totalInkMoms;

        if (ärKundbetalningRegistreradIModal) {
          if (harRotRutArtiklar) {
            varningar.push(
              "💰 Kundens betalning är redan registrerad. Registrera ROT/RUT-betalningen när Skatteverket betalar."
            );
          } else {
            varningar.push("✅ Kundens betalning är redan registrerad.");
          }
          return { poster, varningar };
        }

        poster.push({
          konto: "1930",
          kontoNamn: "Företagskonto/Bankkonto",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: betalningsbelopp,
          kredit: 0,
        });

        poster.push({
          konto: "1510",
          kontoNamn: "Kundfordringar",
          beskrivning: `Betalning faktura ${formData.fakturanummer}`,
          debet: 0,
          kredit: betalningsbelopp,
        });

        if (harRotRutArtiklar) {
          varningar.push(
            "⚠️ Fakturan är redan bokförd. Detta registrerar kundens betalning (50%). ROT/RUT-delen registreras när Skatteverket betalar."
          );
        } else {
          varningar.push("⚠️ Fakturan är redan bokförd. Detta registrerar betalningen.");
        }
      } else {
        varningar.push("✅ Fakturan är redan bokförd och betald.");
        return { poster, varningar };
      }

      return { poster, varningar };
    }

    // NORMAL BOKFÖRING (om ej bokförd)
    let intäktskonto: string;
    let kontoNamn: string;

    if (!harVaror && !harTjänster) {
      varningar.push("Fakturan saknar typinformation för artiklarna och kan inte bokföras.");
      return { poster, varningar };
    }

    if (ärKontantmetod) {
      if (harVaror) {
        intäktskonto = "3001";
        kontoNamn = "Försäljning varor inom Sverige, 25 % moms";
      } else {
        intäktskonto = "3011";
        kontoNamn = "Försäljning tjänster inom Sverige, 25 % moms";
      }
    } else {
      const antalVaror = formData.artiklar.filter((a) => a.typ === "vara").length;
      const antalTjänster = formData.artiklar.filter((a) => a.typ === "tjänst").length;

      if (antalVaror > antalTjänster) {
        intäktskonto = "3001";
        kontoNamn = "Försäljning varor";
      } else {
        // Defaulta till tjänst när lika många av varje typ
        intäktskonto = "3011";
        kontoNamn = "Försäljning tjänster";
      }
    }

    const kundBelopp = totalInkMoms;

    // Kontrollera om fakturan har ROT/RUT-artiklar
    const harROTRUT = formData.artiklar?.some((artikel) => artikel.rotRutTyp) ?? false;

    // Skapa bokföringsposter
    // 1. Kundfordran eller Bank/Kassa beroende på metod
    if (ärKontantmetod) {
      // Kontantmetoden: ingen delning vid bokföring
      poster.push({
        konto: "1930",
        kontoNamn: "Bank/Kassa",
        debet: kundBelopp,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });
    } else if (harROTRUT) {
      // Fakturametoden med ROT/RUT: dela kundfordringen 50/50
      const kundensAndel = Math.round(kundBelopp * 0.5 * 100) / 100; // Kundens 50%
      const skatteverketAndel = Math.round(kundBelopp * 0.5 * 100) / 100; // Skatteverkets 50%

      // Konto 1510: Kundens andel (50%)
      poster.push({
        konto: "1510",
        kontoNamn: "Kundfordringar",
        debet: kundensAndel,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });

      // Konto 1513: Skatteverkets andel (50%)
      poster.push({
        konto: "1513",
        kontoNamn: "Kundfordringar – delad faktura",
        debet: skatteverketAndel,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });
    } else {
      // Fakturametoden utan ROT/RUT: vanlig kundfordran
      poster.push({
        konto: "1510",
        kontoNamn: "Kundfordringar",
        debet: kundBelopp,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });
    }

    // 2. Intäkt (kredit)
    poster.push({
      konto: intäktskonto,
      kontoNamn: kontoNamn,
      debet: 0,
      kredit: totalExMoms,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

    // 3. Utgående moms (kredit) - endast om det finns moms
    if (totalMoms > 0) {
      poster.push({
        konto: "2610",
        kontoNamn: "Utgående moms 25%",
        debet: 0,
        kredit: totalMoms,
        beskrivning: `Moms faktura ${formData.fakturanummer}`,
      });
    }

    return { poster, varningar };
  };

  const hanteraHUSFil = () => {
    if (!visaHusFilKnapp || !rotRutTyp) {
      return;
    }

    const kundOrganisationsnummer = formData.kundorganisationsnummer
      ? formData.kundorganisationsnummer.replace(/\D/g, "")
      : "";

    const personnummer =
      (formData.personnummer && formData.personnummer.trim()) ||
      (formData.artiklar &&
        formData.artiklar.find((artikel) => artikel.rotRutPersonnummer)?.rotRutPersonnummer) ||
      kundOrganisationsnummer ||
      null;

    const rotRutKategori =
      formData.rotRutKategori ||
      (formData.artiklar &&
        formData.artiklar.find((artikel) => artikel.rotRutKategori)?.rotRutKategori) ||
      "Städa";

    if (!formData.fakturanummer || !personnummer) {
      showToast("Fakturanummer och personnummer krävs för ROT/RUT-fil", "error");
      return;
    }

    const totalInkMoms =
      formData.artiklar?.reduce((sum, artikel) => {
        return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
      }, 0) ?? 0;

    const rotRutTjänsterInkMoms =
      formData.artiklar?.reduce((sum, artikel) => {
        if (artikel.typ === "tjänst" && artikel.rotRutTyp && !artikel.rotRutMaterial) {
          return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
        }
        return sum;
      }, 0) ?? 0;

    const rotRutMaterialKostnad =
      formData.artiklar?.reduce((sum, artikel) => {
        if (artikel.rotRutMaterial) {
          return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
        }
        return sum;
      }, 0) ?? 0;

    const totalTimmar =
      formData.artiklar?.reduce((sum, artikel) => {
        if (artikel.typ === "tjänst" && artikel.rotRutTyp && !artikel.rotRutMaterial) {
          return sum + artikel.antal;
        }
        return sum;
      }, 0) ?? 0;

    const begartBelopp = Math.round(rotRutTjänsterInkMoms * 0.5);

    laddaNerHUSFil({
      fakturanummer: formData.fakturanummer,
      kundPersonnummer: personnummer!,
      betalningsdatum: dateToYyyyMmDd(new Date()),
      prisForArbete: Math.round(rotRutTjänsterInkMoms),
      betaltBelopp: Math.round(totalInkMoms),
      begartBelopp: begartBelopp,
      rotRutTyp: rotRutTyp,
      rotRutKategori: rotRutKategori,
      materialKostnad: Math.round(rotRutMaterialKostnad),
      fastighetsbeteckning: formData.fastighetsbeteckning,
      lägenhetsNummer: formData.brfLagenhetsnummer,
      brfOrgNummer: formData.brfOrganisationsnummer,
      antalTimmar: totalTimmar,
    });
  };

  const hanteraBokförModal = async () => {
    setLoading(true);
    try {
      // KOLLA OM FAKTURAN ÄR SPARAD FÖRST
      if (!formData.id) {
        showToast(
          "Fakturan måste sparas innan den kan bokföras!\n\nKlicka 'Spara faktura' först.",
          "error"
        );
        setLoading(false);
        return;
      }

      const totalInkMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
          0
        ) || 0;

      const { poster } = analyseraBokföring();

      const harBankkonto = poster.some((rad) => rad.konto === "1930" || rad.konto === "1910");
      const harKundfordringar = poster.some((rad) => rad.konto === "1510");
      const harRotRutUtbetalning = poster.some((rad) => rad.konto === "2731");
      const ärBetalning =
        harBankkonto &&
        harKundfordringar &&
        poster.length === 2 &&
        poster.every((rad) => rad.konto === "1930" || rad.konto === "1910" || rad.konto === "1510");

      let standardKommentar = `Faktura ${formData.fakturanummer} ${formData.kundnamn}`;
      if (ärBetalning) {
        standardKommentar = `${standardKommentar}, betalning`;
      } else if (harRotRutUtbetalning) {
        standardKommentar = `${standardKommentar}, ROT/RUT-utbetalning`;
      } else if (harKundfordringar) {
        standardKommentar = `${standardKommentar}, kundfordran`;
      } else if (harBankkonto) {
        standardKommentar = `${standardKommentar}, kontantmetod`;
      }

      // Frontend-validering med migerade funktioner
      const fakturaId = formData.id ? parseInt(formData.id) : null;
      if (!fakturaId) {
        showToast("Kunde inte hitta faktura-ID för bokföring", "error");
        setLoading(false);
        return;
      }

      const bokföringsData = {
        fakturaId: fakturaId,
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: standardKommentar,
      };

      const validation = validateBokföringsData(bokföringsData);
      if (!validation.isValid) {
        showToast(validation.error || "Valideringsfel", "error");
        setLoading(false);
        return;
      }

      const result = await bokforFaktura(bokföringsData);

      if (result.success) {
        const message: string =
          "message" in result && result.message ? result.message : "Bokföring genomförd";
        showToast(message, "success");
        if (fakturaId) {
          const uppdateradStatus = await hamtaFakturaStatus(fakturaId);
          setFakturaStatus({
            status: uppdateradStatus.status,
            betaldatum: uppdateradStatus.betaldatum,
          });
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("fakturaStatusUppdaterad", {
                detail: {
                  fakturaId,
                  status: uppdateradStatus.status,
                  betaldatum: uppdateradStatus.betaldatum,
                },
              })
            );
          }
        }
        // Skicka event för att uppdatera fakturaslistan
        window.dispatchEvent(new Event("reloadFakturor"));
        onClose();
      } else {
        showToast(`Bokföringsfel: ${result.error}`, "error");
      }
    } catch (error) {
      console.error("Bokföringsfel:", error);
      showToast("Fel vid bokföring", "error");
    } finally {
      setLoading(false);
    }
  };

  // Beräkna totalbelopp
  const beräknaTotalbelopp = (): number => {
    return (
      formData.artiklar?.reduce(
        (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
        0
      ) || 0
    );
  };

  // Kolumn-definitioner för tabellen
  const getTableColumns = (): ColumnDefinition<BokforingsPost>[] => [
    {
      key: "konto",
      label: "Konto",
    },
    {
      key: "kontoNamn",
      label: "Kontonamn",
    },
    {
      key: "beskrivning",
      label: "Beskrivning",
    },
    {
      key: "debet",
      label: "Debet",
      render: (value: unknown) =>
        typeof value === "number" && value > 0 ? formatCurrency(value) : "",
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value: unknown) =>
        typeof value === "number" && value > 0 ? formatCurrency(value) : "",
    },
  ];

  // Beräkna data för komponenten
  const bokföringsData = analyseraBokföring();
  const poster = bokföringsData.poster;
  const varningar = bokföringsData.varningar;
  const columns = getTableColumns();

  return {
    // State
    loading,
    bokföringsmetod: userSettings.bokföringsmetod,
    fakturaStatus,
    statusLoaded,
    formData,
    poster,
    varningar,
    columns,
    visaHusFilKnapp,
    husFilKnappText,
    husFilDisabled,
    husFilDisabledInfo,
    ärFakturanRedanBokförd,
    ärFakturanBokfördOchBetald,

    // Actions
    hanteraBokför: hanteraBokförModal,
    hanteraHUSFil,
    beräknaTotalbelopp,
  };
}

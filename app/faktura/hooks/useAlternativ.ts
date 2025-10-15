import { useState, useEffect } from "react";
import { dateToYyyyMmDd } from "../../_utils/datum";
import { useFaktura } from "./useFaktura";
import { saveInvoice } from "../actions/fakturaActions";
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

export function useAlternativ() {
  const { formData, updateFormField } = useFaktura();
  const [bokförModalOpen, setBokförModalOpen] = useState(false);
  const [sparaLoading, setSparaLoading] = useState(false);
  const [bokförLoading, setBokförLoading] = useState(false);
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("fakturametoden");
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
    rot_rut_status?: string;
  }>({});

  // Hämta användarens bokföringsmetod när komponenten laddas
  useEffect(() => {
    hamtaBokforingsmetod().then((metod) => {
      const normalized =
        (metod || "").toLowerCase() === "kontantmetoden" ? "kontantmetoden" : "fakturametoden";
      setBokföringsmetod(normalized);
    });
  }, []);

  // Hämta fakturaSTATUS när ID ändras
  useEffect(() => {
    if (formData.id) {
      hamtaFakturaStatus(parseInt(formData.id)).then(setFakturaStatus);
    } else {
      setFakturaStatus({});
    }
  }, [formData.id]);

  const hanteraSpara = async () => {
    console.log("🔍 hanteraSpara kallad!", {
      harKund,
      harArtiklar,
      kundId: formData.kundId,
      artiklar: formData.artiklar,
      sparaLoading,
    });

    if (sparaLoading) return; // Förhindra dubbla sparningar

    setSparaLoading(true);
    const fd = new FormData();
    try {
      fd.append("artiklar", JSON.stringify(formData.artiklar ?? []));
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "artiklar" && v != null) fd.append(k, String(v));
      });

      console.log("🔍 Skickar saveInvoice request...", {
        formDataEntries: Object.fromEntries(fd.entries()),
        rawFormData: {
          fakturanummer: formData.fakturanummer,
          kundId: formData.kundId,
          kundnamn: formData.kundnamn,
          artiklar: formData.artiklar,
        },
      });

      const res = await saveInvoice(fd);

      console.log("🔍 saveInvoice response:", res);

      if (res.success) {
        console.log("✅ Faktura sparad framgångsrikt!");
        showToast("Faktura sparad!", "success");

        // UPPDATERA FORMDATA MED NYTT ID!
        if ("id" in res && res.id) {
          updateFormField("id", res.id.toString());
        }

        // Trigga reload event så Fakturor.tsx uppdaterar sin lista
        window.dispatchEvent(new Event("reloadFakturor"));
      } else {
        console.log("❌ saveInvoice misslyckades:", res);
        const errorMessage = (res as { error?: string }).error;
        showToast(errorMessage || "Kunde inte spara fakturan.", "error");
      }
    } catch (error) {
      console.log("❌ Fel i hanteraSpara:", error);
      showToast("Kunde inte konvertera artiklar", "error");
    } finally {
      console.log("🔍 hanteraSpara avslutar, sätter sparaLoading till false");
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
          fd.append("artiklar", JSON.stringify(formData.artiklar ?? []));
          Object.entries(formData).forEach(([k, v]) => {
            if (k !== "artiklar" && v != null) fd.append(k, String(v));
          });
          const res = await saveInvoice(fd);

          if (res.success && "id" in res && res.id) {
            updateFormField("id", res.id.toString());
            window.dispatchEvent(new Event("reloadFakturor"));
            setBokförModalOpen(true);
          } else {
            const errorMessage = (res as { error?: string }).error;
            showToast(errorMessage || "Kunde inte spara fakturan innan bokföring.", "error");
            return;
          }
        } catch {
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
  const harKund = !!(formData.kundId && formData.kundId.trim() !== "");
  const artiklarLength = formData.artiklar?.length ?? 0;
  const harArtiklar = artiklarLength > 0;
  const ärFakturanBetald = fakturaStatus.status_betalning === "Betald";
  const ärKontantmetod = bokföringsmetod === "kontantmetoden";
  const ärNyFaktura = !formData.id;
  const doljBokförKnapp = false;

  // Knapptexter
  const sparaKnappText = sparaLoading ? "💾 Sparar..." : "💾 Spara";
  const registerButtonLabel = (() => {
    const normalized = (bokföringsmetod || "").toLowerCase();
    return normalized === "kontantmetoden" ? "💰 Markera betald" : "📨 Markera skickad";
  })();
  const bokförKnappText = bokförLoading
    ? "⏳ Registrerar..."
    : ärFakturanBetald
      ? "✅ Redan betald"
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
    doljBokförKnapp,
    sparaKnappText,
    bokförKnappText,
    återställKnappText,
    granskKnappText,
    pdfKnappText,

    // Actions
    setBokförModalOpen,
    hanteraSpara,
    hanteraBokför,
  };
}

export function useBokforFakturaModal(isOpen: boolean, onClose: () => void) {
  const { formData, userSettings, setBokföringsmetod } = useFaktura();
  const [loading, setLoading] = useState(false);
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
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
        console.log("🔍 Hämtar status för faktura ID:", formData.id);
        hamtaFakturaStatus(parseInt(formData.id)).then((status) => {
          console.log("📊 Fakturasstatus:", status);
          setFakturaStatus(status);
          setStatusLoaded(true);
        });
      } else {
        console.log("❌ Inget faktura ID hittades");
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
  const harPersonnummer =
    (formData.personnummer && formData.personnummer.trim() !== "") ||
    (formData.artiklar &&
      formData.artiklar.some(
        (artikel) => artikel.rotRutPersonnummer && artikel.rotRutPersonnummer.trim() !== ""
      ));
  const husFilDisabled = !harPersonnummer || !formData.fakturanummer;
  const husFilDisabledInfo = !visaHusFilKnapp
    ? null
    : !harPersonnummer
      ? "Personnummer saknas för ROT/RUT-fil"
      : !formData.fakturanummer
        ? "Spara fakturan först"
        : null;
  const husFilKnappText = "Ladda ner ROT/RUT-fil XML";

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

    if (ärKontantmetod && harVaror && harTjänster) {
      varningar.push(
        "⚠️ Fakturan innehåller både varor och tjänster. Dela upp den i separata fakturor innan du markerar den som betald."
      );
      return { poster, varningar };
    }

    // KONTROLLERA OM FAKTURAN REDAN ÄR BOKFÖRD
    console.log("🔍 Kollar fakturaStatus:", fakturaStatus);
    if (fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd") {
      // Fakturan är redan bokförd - visa bara betalningsregistrering
      if (fakturaStatus.status_betalning !== "Betald") {
        // Kolla om det finns ROT/RUT-artiklar för att beräkna kundens del
        const harRotRutArtiklar = formData.artiklar?.some((artikel) => artikel.rotRutTyp) || false;
        const betalningsbelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : totalInkMoms; // Endast kundens del för ROT/RUT

        // Om det är "Delvis betald" (ROT/RUT där kunden redan betalat), visa inte betalningsregistrering
        if (fakturaStatus.status_betalning === "Delvis betald") {
          varningar.push(
            "💰 Fakturan är delvis betald. Kunden har betalat sin del. Använd ROT/RUT-betalningsknappen för SKV:s del."
          );
          return { poster, varningar };
        }

        poster.push({
          konto: "1930", // Bank/Kassa
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
            "⚠️ Fakturan är redan bokförd. Detta registrerar KUNDENS betalning (50%). ROT/RUT-delen registreras separat när SKV betalar."
          );
        } else {
          varningar.push("⚠️ Fakturan är redan bokförd. Detta registrerar betalning.");
        }
      } else {
        // Kolla om det finns ROT/RUT-artiklar för att visa rätt meddelande
        const harRotRutArtiklar = formData.artiklar?.some((artikel) => artikel.rotRutTyp) || false;

        if (harRotRutArtiklar) {
          varningar.push("✅ Fakturan är redan bokförd och betald.");
          varningar.push(
            "För ROT/RUT-utbetalning från SKV: ändra ROT/RUT-status till 'Väntar på SKV' och använd sen ROT/RUT-betalningsknappen."
          );
        } else {
          varningar.push("✅ Fakturan är redan bokförd och betald.");
        }
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
      } else if (antalTjänster > antalVaror) {
        intäktskonto = "3011";
        kontoNamn = "Försäljning tjänster";
      } else {
        varningar.push("Oklart om det är varor eller tjänster - lika många av varje typ");
        intäktskonto = "3011"; // Default till tjänster
        kontoNamn = "Försäljning tjänster";
      }
    }

    const kundBelopp = totalInkMoms;

    // Skapa bokföringsposter
    // 1. Kundfordran eller Bank/Kassa beroende på metod
    const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
    const skuld_tillgångsnamn = ärKontantmetod ? "Bank/Kassa" : "Kundfordringar";

    poster.push({
      konto: skuld_tillgångskonto,
      kontoNamn: skuld_tillgångsnamn,
      debet: kundBelopp,
      kredit: 0,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

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
      console.log("🔍 Ingen ROT/RUT-data hittades för ROT/RUT-fil");
      return;
    }

    const personnummer =
      formData.personnummer ||
      (formData.artiklar &&
        formData.artiklar.find((artikel) => artikel.rotRutPersonnummer)?.rotRutPersonnummer);

    const rotRutKategori =
      formData.rotRutKategori ||
      (formData.artiklar &&
        formData.artiklar.find((artikel) => artikel.rotRutKategori)?.rotRutKategori) ||
      "Städa";

    if (!formData.fakturanummer || !personnummer) {
      console.log("🔍 ROT/RUT-fil validering misslyckades:", {
        fakturanummer: formData.fakturanummer,
        personnummer: personnummer,
        rotRutAktiverat: formData.rotRutAktiverat,
        rotRutTyp: rotRutTyp,
        harROTRUTArtiklar,
      });
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
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
      };

      const validation = validateBokföringsData(bokföringsData);
      if (!validation.isValid) {
        showToast(validation.error || "Valideringsfel", "error");
        setLoading(false);
        return;
      }

      const result = await bokforFaktura(bokföringsData);

      console.log("🔥 BOKFÖR DATA:", {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        formDataId: formData.id,
        fakturanummer: formData.fakturanummer,
      });

      if (result.success) {
        const message: string =
          "message" in result && result.message ? result.message : "Bokföring genomförd";
        showToast(message, "success");
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

    // Actions
    hanteraBokför: hanteraBokförModal,
    hanteraHUSFil,
    beräknaTotalbelopp,
  };
}

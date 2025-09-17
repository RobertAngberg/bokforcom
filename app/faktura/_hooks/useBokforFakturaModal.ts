import { useState, useEffect } from "react";
import { useFakturaClient } from "./useFakturaClient";
import { bokförFaktura, hämtaBokföringsmetod, hämtaFakturaStatus } from "../actions";
import { BokforingsPost } from "../_types/types";
import { ColumnDefinition } from "../../_components/Tabell";

// Validation functions - flyttad från komponenten
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

function validateBokföringsData(data: any): { isValid: boolean; error?: string } {
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

function isPaymentRegistration(poster: BokforingsPost[]): boolean {
  const harBankKonto = poster.some((p) => p.konto === "1930" || p.konto === "1910");
  const harKundfordringar = poster.some((p) => p.konto === "1510");
  return harBankKonto && harKundfordringar && poster.length === 2;
}

function isKontantmetod(poster: BokforingsPost[]): boolean {
  const harBankKontantmetod = poster.some((p) => p.konto === "1930");
  const harIngenKundfordringar = !poster.some((p) => p.konto === "1510");
  return harBankKontantmetod && harIngenKundfordringar;
}

export function useBokforFakturaModal(isOpen: boolean, onClose: () => void) {
  const { formData, toastState, setToast, clearToast, userSettings, setBokföringsmetod } =
    useFakturaClient();
  const [loading, setLoading] = useState(false);
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
  }>({});
  const [statusLoaded, setStatusLoaded] = useState(false);

  // Hämta användarens bokföringsmetod och fakturaSTATUS från databasen
  useEffect(() => {
    if (isOpen) {
      setStatusLoaded(false);
      hämtaBokföringsmetod().then(setBokföringsmetod);

      // Hämta fakturaSTATUS om ID finns
      if (formData.id) {
        console.log("🔍 Hämtar status för faktura ID:", formData.id);
        hämtaFakturaStatus(parseInt(formData.id)).then((status) => {
          console.log("📊 Fakturasstatus:", status);
          setFakturaStatus(status);
          setStatusLoaded(true);
        });
      } else {
        console.log("❌ Inget faktura ID hittades");
        setStatusLoaded(true);
      }
    }
  }, [isOpen, formData.id, setBokföringsmetod]);

  const ärKontantmetod = userSettings.bokföringsmetod === "kontantmetoden";

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

    // KONTROLLERA OM FAKTURAN REDAN ÄR BOKFÖRD
    console.log("🔍 Kollar fakturaStatus:", fakturaStatus);
    if (fakturaStatus.status_bokförd && fakturaStatus.status_bokförd !== "Ej bokförd") {
      // Fakturan är redan bokförd - visa bara betalningsregistrering
      if (fakturaStatus.status_betalning !== "Betald") {
        // Kolla om det finns ROT/RUT-artiklar för att beräkna kundens del
        const harRotRutArtiklar =
          formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;
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
        const harRotRutArtiklar =
          formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;

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
    // Avgör om det är vara eller tjänst (majoriteten)
    const varor = formData.artiklar.filter((a) => a.typ === "vara").length;
    const tjänster = formData.artiklar.filter((a) => a.typ === "tjänst").length;

    let intäktskonto: string;
    let kontoNamn: string;

    if (varor > tjänster) {
      intäktskonto = "3001";
      kontoNamn = "Försäljning varor";
    } else if (tjänster > varor) {
      intäktskonto = "3011";
      kontoNamn = "Försäljning tjänster";
    } else {
      varningar.push("Oklart om det är varor eller tjänster - lika många av varje typ");
      intäktskonto = "3011"; // Default till tjänster
      kontoNamn = "Försäljning tjänster";
    }

    // Kolla om det finns ROT/RUT-artiklar
    const harRotRutArtiklar = formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;
    const rotRutBelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : 0; // 50% av totalen
    const kundBelopp = harRotRutArtiklar ? totalInkMoms - rotRutBelopp : totalInkMoms;

    // Skapa bokföringsposter
    // 1. Kundfordran eller Bank/Kassa beroende på metod (kundens del)
    const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
    const skuld_tillgångsnamn = ärKontantmetod ? "Bank/Kassa" : "Kundfordringar";

    poster.push({
      konto: skuld_tillgångskonto,
      kontoNamn: skuld_tillgångsnamn,
      debet: kundBelopp,
      kredit: 0,
      beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
    });

    // 1b. ROT/RUT-fordran (SKV:s del) - om det finns ROT/RUT
    if (harRotRutArtiklar && rotRutBelopp > 0) {
      poster.push({
        konto: "1513",
        kontoNamn: "Kundfordringar – delad faktura",
        debet: rotRutBelopp,
        kredit: 0,
        beskrivning: `ROT/RUT-del faktura ${formData.fakturanummer}`,
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

  const hanteraBokför = async () => {
    setLoading(true);
    try {
      // KOLLA OM FAKTURAN ÄR SPARAD FÖRST
      if (!formData.id) {
        setToast({
          message: "Fakturan måste sparas innan den kan bokföras!\n\nKlicka 'Spara faktura' först.",
          type: "error",
        });
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
      const bokföringsData = {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
      };

      const validation = validateBokföringsData(bokföringsData);
      if (!validation.isValid) {
        setToast({
          message: validation.error || "Valideringsfel",
          type: "error",
        });
        setLoading(false);
        return;
      }

      const result = await bokförFaktura(bokföringsData);

      console.log("🔥 BOKFÖR DATA:", {
        fakturaId: formData.id ? parseInt(formData.id) : undefined,
        formDataId: formData.id,
        fakturanummer: formData.fakturanummer,
      });

      if (result.success) {
        setToast({
          message: result.message || "Bokföring genomförd",
          type: "success",
        });
        // Skicka event för att uppdatera fakturaslistan
        window.dispatchEvent(new Event("reloadFakturor"));
        onClose();
      } else {
        setToast({
          message: `Bokföringsfel: ${result.error}`,
          type: "error",
        });
      }
    } catch (error) {
      console.error("Bokföringsfel:", error);
      setToast({
        message: "Fel vid bokföring",
        type: "error",
      });
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
      render: (value) => (value > 0 ? value.toFixed(2) : ""),
    },
    {
      key: "kredit",
      label: "Kredit",
      render: (value) => (value > 0 ? value.toFixed(2) : ""),
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
    toast: toastState,
    ärKontantmetod,
    formData,
    poster,
    varningar,
    columns,

    // Actions
    setToast,
    hanteraBokför,
    beräknaTotalbelopp,
  };
}

"use client";

import { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../../personal/actions";
import { saveTransaction } from "../_actions/transactionActions";
import { uploadReceiptImage } from "../../_utils/blobUpload";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate } from "../../_utils/trueDatum";
import { formatCurrency, round } from "../../_utils/format";
import { Anstalld } from "../_types/types";
import { useBokforStore } from "../_stores/bokforStore";

export function useSteg3() {
  // Hämta ALL data från Zustand store
  const {
    belopp,
    kommentar,
    setCurrentStep,
    kontonummer,
    kontobeskrivning,
    fil,
    transaktionsdatum,
    valtFörval,
    extrafält,
    leverantör,
    fakturanummer,
    fakturadatum,
    förfallodatum,
    betaldatum,
    bokförSomFaktura,
    kundfakturadatum,
    currentStep,
    levfaktMode,
    utlaggMode,
  } = useBokforStore();

  // Safe defaults för null värden
  const safeBelopp = belopp ?? 0;
  const safeKommentar = kommentar ?? "";
  const safeTransaktionsdatum = transaktionsdatum ?? "";

  const [anstallda, setAnstallda] = useState<Anstalld[]>([]);
  const [anstalldId, setAnstalldId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "error" as "success" | "error" | "info",
    isVisible: false,
  });
  const [konto2890Beskrivning, setKonto2890Beskrivning] = useState<string>("");

  // Hämta anställda för utläggs-mode
  useEffect(() => {
    if (utlaggMode) {
      hämtaAllaAnställda().then((res) => {
        setAnstallda(res);
        if (res.length === 1) setAnstalldId(res[0].id.toString());
      });
    }
  }, [utlaggMode]);

  // Hämta beskrivning för konto 2890 från DB
  useEffect(() => {
    async function fetchKonto2890() {
      try {
        const res = await fetch("/api/konto-beskrivning?kontonummer=2890");
        if (res.ok) {
          const data = await res.json();
          setKonto2890Beskrivning(data.beskrivning || "Övriga kortfristiga skulder");
        } else {
          setKonto2890Beskrivning("Övriga kortfristiga skulder");
        }
      } catch {
        setKonto2890Beskrivning("Övriga kortfristiga skulder");
      }
    }
    if (utlaggMode) fetchKonto2890();
  }, [utlaggMode]);

  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Moms- och beloppsberäkning
  const momsSats = valtFörval?.momssats ?? 0;
  const moms = +(safeBelopp * (momsSats / (1 + momsSats))).toFixed(2);
  const beloppUtanMoms = +(safeBelopp - moms).toFixed(2);

  // Kolla om det är försäljning inom leverantörsfaktura-mode
  const ärFörsäljning =
    levfaktMode &&
    (valtFörval?.namn?.toLowerCase().includes("försäljning") ||
      valtFörval?.typ?.toLowerCase().includes("intäkt") ||
      valtFörval?.kategori?.toLowerCase().includes("försäljning"));

  // Business Logic - Beräkna transaktionsposter
  const calculateBelopp = (kontonummer: string, typ: "debet" | "kredit"): number => {
    const klass = kontonummer[0];

    if (typ === "debet") {
      // Specifikt för 1930 vid försäljning
      if (kontonummer === "1930" && ärFörsäljning) {
        return safeBelopp;
      }
      // Kundfordringar (1510) ska få hela beloppet som debet
      if (kontonummer === "1510") {
        return safeBelopp;
      }
      // Alla andra klass 1-konton får beloppUtanMoms
      if (klass === "1") return beloppUtanMoms;
      if (klass === "2") return moms; // Moms-konton som debet
      if (klass === "3") return 0;
      if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
        return beloppUtanMoms; // Kostnader
      }
      return 0;
    }

    // typ === "kredit"
    // Specifikt för 1930 vid försäljning - ska inte vara kredit
    if (kontonummer === "1930" && ärFörsäljning) {
      return 0;
    }
    // Kundfordringar (1510) ska inte vara kredit
    if (kontonummer === "1510") {
      return 0;
    }
    // Utlägg (2890) ska få hela beloppet som kredit
    if (kontonummer === "2890") {
      return safeBelopp;
    }
    // Leverantörsskulder (2440) ska få hela beloppet som kredit
    if (kontonummer === "2440") {
      return safeBelopp;
    }
    // Alla andra klass 1-konton får belopp som kredit
    if (klass === "1") return safeBelopp;
    if (klass === "2") {
      return moms; // Utgående moms ska vara kredit vid försäljning
    }
    if (klass === "3") return beloppUtanMoms; // Intäktskonton
    if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
      return 0; // Kostnader ska inte vara kredit
    }
    return 0;
  };

  const transformKontonummer = (originalKonto: string): string => {
    // Om utläggs-mode, byt ut 1930 mot 2890
    if (utlaggMode && originalKonto === "1930") {
      return "2890";
    }
    // Om kundfaktura-mode (bokför som faktura), byt ut 1930 mot 1510
    if (bokförSomFaktura && originalKonto === "1930") {
      return "1510";
    }
    // Om leverantörsfaktura-mode (inköp), byt ut 1930 mot 2440
    if (levfaktMode && !ärFörsäljning && originalKonto === "1930") {
      return "2440";
    }
    // Om kundfaktura (försäljning), byt ut 1930 mot 1510
    if (levfaktMode && ärFörsäljning && originalKonto === "1930") {
      return "1510";
    }
    return originalKonto;
  };

  // Beräkna alla transaktionsposter som ska skickas till servern
  const beräknaTransaktionsposter = () => {
    const poster: Array<{ kontonummer: string; debet: number; kredit: number }> = [];

    // Hantera extrafält först
    if (Object.keys(extrafält).length > 0) {
      for (const [nr, data] of Object.entries(extrafält)) {
        let { debet = 0, kredit = 0 } = data;
        const transformedKonto = transformKontonummer(nr);

        // Använd calculateBelopp för att få rätt belopp
        if (debet > 0) {
          debet = calculateBelopp(transformedKonto, "debet");
        }
        if (kredit > 0) {
          kredit = calculateBelopp(transformedKonto, "kredit");
        }

        if (debet === 0 && kredit === 0) continue;

        poster.push({ kontonummer: transformedKonto, debet, kredit });
      }
    }

    // Hantera förvalskonton om inte specialtyp
    if (!valtFörval?.specialtyp && valtFörval?.konton) {
      for (const k of valtFörval.konton) {
        const originalKonto = k.kontonummer?.toString().trim();
        if (!originalKonto) continue;

        const transformedKonto = transformKontonummer(originalKonto);
        const debet = k.debet ? calculateBelopp(transformedKonto, "debet") : 0;
        const kredit = k.kredit ? calculateBelopp(transformedKonto, "kredit") : 0;

        if (debet === 0 && kredit === 0) continue;

        poster.push({ kontonummer: transformedKonto, debet, kredit });
      }
    }

    return poster;
  };

  // Submit form handler
  const handleSubmit = async (formData: FormData) => {
    if (!valtFörval) return;

    // Kontrollera att utlägg har vald anställd
    if (utlaggMode && !anstalldId) {
      showToast("Du måste välja en anställd för utlägget.", "error");
      return;
    }

    setLoading(true);
    try {
      // Beräkna alla transaktionsposter på frontend
      const transaktionsposter = beräknaTransaktionsposter();

      // Lägg till alla nödvändiga fält till FormData
      // För leverantörsfaktura: använd fakturadatum som transaktionsdatum
      const effektivtTransaktionsdatum = levfaktMode ? fakturadatum || "" : transaktionsdatum || "";
      formData.set("transaktionsdatum", effektivtTransaktionsdatum);
      formData.set("kommentar", safeKommentar);
      formData.set("belopp", safeBelopp.toString());
      formData.set("moms", moms.toString());
      formData.set("beloppUtanMoms", beloppUtanMoms.toString());
      formData.set("valtFörval", JSON.stringify(valtFörval));
      formData.set("transaktionsposter", JSON.stringify(transaktionsposter));

      // Lägg till mode-specifika fält
      if (utlaggMode) {
        formData.set("utlaggMode", "true");
        if (anstalldId) formData.set("anstalldId", anstalldId);
      }

      if (levfaktMode) {
        formData.set("levfaktMode", "true");
        if (leverantör?.id) formData.set("leverantorId", leverantör.id.toString());
        if (fakturanummer) formData.set("fakturanummer", fakturanummer);
        if (fakturadatum) formData.set("fakturadatum", fakturadatum);
        if (förfallodatum) formData.set("förfallodatum", förfallodatum);
        if (betaldatum) formData.set("betaldatum", betaldatum);
      }

      // Kundfaktura-specifika fält
      if (bokförSomFaktura) {
        formData.set("bokförSomFaktura", "true");
        if (kundfakturadatum) formData.set("kundfakturadatum", kundfakturadatum);
      }

      // Ladda upp fil till blob storage först (om det finns en fil)
      if (fil) {
        // Skapa beskrivning baserat på kontext
        let beskrivning = "";
        if (leverantör?.namn) {
          beskrivning = leverantör.namn;
        } else if (levfaktMode && fakturanummer) {
          beskrivning = `faktura-${fakturanummer}`;
        } else if (utlaggMode) {
          beskrivning = "utlagg";
        } else if (bokförSomFaktura) {
          beskrivning = "kundfaktura";
        } else {
          beskrivning = "kvitto";
        }

        // Använd fakturadatum om tillgängligt, annars dagens datum
        const datum = fakturadatum || dateTillÅÅÅÅMMDD(new Date());

        const blobResult = await uploadReceiptImage(fil, {
          beskrivning,
          datum,
        });

        if (blobResult.success && blobResult.url) {
          formData.set("bilageUrl", blobResult.url);
        } else {
          console.error("Misslyckades med att ladda upp fil:", blobResult.error);
          // Fortsätt ändå med bokföringen även om fil-upload misslyckades
        }
      }

      const result = await saveTransaction(formData);
      if (result.success) setCurrentStep?.(4);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const form = document.getElementById("bokforingForm") as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
  };

  // Bygg tabellrader
  const fallbackRows =
    valtFörval && valtFörval.specialtyp && Object.keys(extrafält).length > 0
      ? Object.entries(extrafält).map(([konto, val], i) => ({
          key: i,
          konto: konto + " " + (val.label ?? ""),
          debet: round(val.debet),
          kredit: round(val.kredit),
        }))
      : valtFörval
        ? valtFörval.konton.map((rad, i) => {
            let kontoNr = rad.kontonummer?.toString().trim();
            let namn = `${kontoNr} ${rad.beskrivning ?? ""}`;
            let beloppAttVisa = 0;

            // Om utläggs-mode, byt ut 1930 mot 2890
            if (utlaggMode && kontoNr === "1930") {
              kontoNr = "2890";
              namn = `2890 ${konto2890Beskrivning || "Övriga kortfristiga skulder"}`;
              beloppAttVisa = safeBelopp;
            }
            // Om kundfaktura-mode (bokför som faktura), byt ut 1930 mot 1510
            else if (bokförSomFaktura && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
              beloppAttVisa = safeBelopp;
            }
            // Om leverantörsfaktura-mode (inköp), byt ut 1930 mot 2440
            else if (levfaktMode && !ärFörsäljning && kontoNr === "1930") {
              kontoNr = "2440";
              namn = `2440 Leverantörsskulder`;
              beloppAttVisa = safeBelopp;
            }
            // Om kundfaktura (försäljning), byt ut 1930 mot 1510
            else if (levfaktMode && ärFörsäljning && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
              beloppAttVisa = safeBelopp;
            } else if (kontoNr?.startsWith("26")) {
              beloppAttVisa = moms;
            } else if (kontoNr === "1930") {
              // CHECKPOINT FIX 2025-07-31: 1930 ska visa hela beloppet, inte beloppUtanMoms
              beloppAttVisa = safeBelopp;
            } else {
              beloppAttVisa = beloppUtanMoms;
            }

            return {
              key: i,
              konto: namn,
              // För försäljning: vänd om debet/kredit för intäkts- och momskonton
              debet:
                ärFörsäljning && (kontoNr?.startsWith("3") || kontoNr?.startsWith("261"))
                  ? 0
                  : rad.debet
                    ? round(beloppAttVisa)
                    : 0,
              kredit:
                ärFörsäljning && (kontoNr?.startsWith("3") || kontoNr?.startsWith("261"))
                  ? round(beloppAttVisa)
                  : rad.kredit
                    ? round(beloppAttVisa)
                    : 0,
            };
          })
        : [];

  const totalDebet = fallbackRows.reduce((sum, r) => sum + r.debet, 0);
  const totalKredit = fallbackRows.reduce((sum, r) => sum + r.kredit, 0);

  return {
    state: {
      currentStep,
      belopp: safeBelopp,
      kommentar: safeKommentar,
      kontonummer,
      kontobeskrivning,
      fil,
      transaktionsdatum: safeTransaktionsdatum,
      valtFörval,
      extrafält,
      leverantör,
      fakturanummer,
      fakturadatum,
      förfallodatum,
      betaldatum,
      bokförSomFaktura,
      kundfakturadatum,
      levfaktMode,
      utlaggMode,
      anstallda,
      anstalldId,
      loading,
      toast,
      konto2890Beskrivning,
      momsSats,
      moms,
      beloppUtanMoms,
      ärFörsäljning,
      fallbackRows,
      totalDebet,
      totalKredit,
    },
    actions: {
      setCurrentStep,
      setAnstallda,
      setAnstalldId,
      setLoading,
      setToast,
    },
    handlers: {
      showToast,
      hideToast,
      calculateBelopp,
      transformKontonummer,
      beräknaTransaktionsposter,
      handleSubmit,
      handleButtonClick,
    },
  };
}

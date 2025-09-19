"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { registerLocale } from "react-datepicker";
import { sv } from "date-fns/locale/sv";
import { loggaFavoritförval } from "../_actions/actions";
import {
  extractDataFromOCRKundfaktura,
  extractDataFromOCR,
  extractDataFromOCRLevFakt,
} from "../_actions/ocrActions";
import { hämtaAllaAnställda } from "../../personal/_actions/anstalldaActions";
import { saveTransaction } from "../_actions/transactionActions";
import { uploadReceiptImage } from "../../_utils/blobUpload";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate, datePickerOnChange } from "../../_utils/datum";
import { formatCurrency, round } from "../../_utils/format";
import {
  KontoRad,
  Förval,
  Anstalld,
  UseAnstalldDropdownProps,
  UtlaggAnställd,
  UseForhandsgranskningProps,
} from "../_types/types";
import { normalize } from "../../_utils/textUtils";

registerLocale("sv", sv);

export function useBokfor() {
  // ====================================================
  // STATE MANAGEMENT (ersätter Zustand med useState)
  // ====================================================

  // Navigation state
  const [currentStep, setCurrentStep] = useState(1);

  // Data & UI state
  const [favoritFörval, setFavoritFörval] = useState<Förval[]>([]);
  const [allaFörval, setAllaFörval] = useState<Förval[]>([]);
  const [anställda, setAnställda] = useState<UtlaggAnställd[]>([]);
  const [bokföringsmetod, setBokföringsmetod] = useState("standard");
  const [levfaktMode, setLevfaktMode] = useState(false);
  const [utlaggMode, setUtlaggMode] = useState(false);

  // Formulärfält
  const [kontonummer, setKontonummer] = useState("");
  const [kontobeskrivning, setKontobeskrivning] = useState<string | null>(null);
  const [belopp, setBelopp] = useState<number | null>(null);
  const [kommentar, setKommentar] = useState<string | null>(null);
  const [fil, setFil] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [transaktionsdatum, setTransaktionsdatum] = useState<string | null>(null);
  const [valtFörval, setValtFörval] = useState<Förval | null>(null);
  const [extrafält, setExtrafält] = useState<
    Record<string, { label: string; debet: number; kredit: number }>
  >({});

  // Leverantörsfaktura-fält
  const [leverantör, setLeverantör] = useState<any | null>(null);
  const [fakturanummer, setFakturanummer] = useState<string | null>(null);
  const [fakturadatum, setFakturadatum] = useState<string | null>(null);
  const [förfallodatum, setFörfallodatum] = useState<string | null>(null);
  const [betaldatum, setBetaldatum] = useState<string | null>(null);
  const [bokförSomFaktura, setBokförSomFaktura] = useState(false);
  const [kundfakturadatum, setKundfakturadatum] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  // ====================================================
  // BUSINESS LOGIC FUNCTIONS
  // ====================================================

  const resetAllFields = useCallback(() => {
    setCurrentStep(1);
    setKontonummer("");
    setKontobeskrivning(null);
    setBelopp(null);
    setKommentar(null);
    setFil(null);
    setPdfUrl(null);
    setTransaktionsdatum(null);
    setValtFörval(null);
    setExtrafält({});
    setLeverantör(null);
    setFakturanummer(null);
    setFakturadatum(null);
    setFörfallodatum(null);
    setBetaldatum(null);
    setBokförSomFaktura(false);
    setKundfakturadatum(null);
    setLevfaktMode(false);
    setUtlaggMode(false);
  }, []);

  const exitLevfaktMode = useCallback(
    (routerInstance?: any) => {
      setLevfaktMode(false);
      setCurrentStep(1);

      // Rensa leverantörsfaktura-specifika fält
      setLeverantör(null);
      setFakturanummer(null);
      setFakturadatum(null);
      setFörfallodatum(null);
      setBetaldatum(null);
      setBokförSomFaktura(false);

      // Navigera till standard bokföring utan URL-parametrar
      if (routerInstance) {
        routerInstance.push("/bokfor");
      } else if (router) {
        router.push("/bokfor");
      }
    },
    [router]
  );

  const setFavoritFörvalen = useCallback((förvalen: Förval[]) => {
    setFavoritFörval(förvalen);
  }, []);

  // Läs URL-parametrar och sätt state vid mount
  useEffect(() => {
    const isUtlagg = searchParams.get("utlagg") === "true";
    const isLevfakt = searchParams.get("levfakt") === "true";

    if (isUtlagg !== utlaggMode) {
      setUtlaggMode(isUtlagg);
    }
    if (isLevfakt !== levfaktMode) {
      setLevfaktMode(isLevfakt);
    }
  }, [searchParams, utlaggMode, levfaktMode]);

  // ====================================================
  // SOKFORVAL LOGIK (från useSokForval)
  // ====================================================

  // Lokal UI state för sök (från useSokForval)
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<Förval[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Uppdatera results när favoritFörval kommer från store
  useEffect(() => {
    if (searchText.length < 2 && favoritFörval.length > 0) {
      setResults(favoritFörval);
    }
  }, [favoritFörval, searchText]);

  // Läs URL-parametrar och sätt store-state
  useEffect(() => {
    const isUtlagg = searchParams.get("utlagg") === "true";
    const isLevfakt = searchParams.get("levfakt") === "true";

    if (isUtlagg !== utlaggMode) {
      setUtlaggMode(isUtlagg);
    }
    if (isLevfakt !== levfaktMode) {
      setLevfaktMode(isLevfakt);
    }
  }, [searchParams, utlaggMode, levfaktMode, setUtlaggMode, setLevfaktMode]);

  // Sökfunktion (från useSokForval)
  const performSearch = async (inputText: string) => {
    const input = normalize(inputText);

    if (input.length < 2) {
      setResults([]);
      setHighlightedIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const alla = allaFörval;
      const q = input;

      function score(f: Förval): number {
        let poäng = 0;

        const basePointsMapping: Record<string, number> = {
          "Försäljning varor 25% moms": 150,
          "Försäljning tjänster 25% moms": 140,
          "Inköp varor 25% moms": 130,
          "Inköp tjänster 25% moms": 120,
        };

        poäng += basePointsMapping[f.namn] || 0;

        const namn = normalize(f.namn);

        if (namn === q) poäng += 500;
        else if (namn.startsWith(q)) poäng += 300;
        else if (namn.includes(q)) poäng += 100;

        for (const ord of f.sökord || []) {
          const s = normalize(ord);
          if (s === q) poäng += 400;
          else if (s.startsWith(q)) poäng += 200;
          else if (s.includes(q)) poäng += 80;
        }

        const längdBonus = Math.max(0, 50 - namn.length);
        poäng += längdBonus;

        const popularitetsBonus = (f.användningar || 0) * 3;
        poäng += popularitetsBonus;

        const desc = normalize(f.beskrivning);
        if (desc.includes(q)) poäng += 30;

        if (normalize(f.typ).includes(q)) poäng += 20;
        if (normalize(f.kategori).includes(q)) poäng += 20;

        return poäng;
      }

      let träffar = alla
        .map((f) => ({ förval: f, poäng: score(f) }))
        .filter((x) => x.poäng > 0)
        .sort((a, b) => b.poäng - a.poäng)
        .map((x) => x.förval);

      if (levfaktMode) {
        träffar = träffar.filter((f) => {
          const harKostnadskonto = f.konton.some((k: KontoRad) => {
            const kontonummer = k.kontonummer || "";
            return /^[456]/.test(kontonummer);
          });
          return harKostnadskonto;
        });
      }

      if (utlaggMode) {
        träffar = träffar.filter((f) => {
          const harKostnadskonto = f.konton.some((k: KontoRad) => {
            const kontonummer = k.kontonummer || "";
            return /^[45678]/.test(kontonummer);
          });
          return harKostnadskonto;
        });
      }

      setResults(träffar);
      setHighlightedIndex(0);
      setLoading(false);
    } catch (error) {
      console.error("Sökfel:", error);
      setLoading(false);
    }
  };

  const väljFörval = (f: Förval) => {
    loggaFavoritförval(f.id);
    setValtFörval(f);

    const huvudkonto = f.konton.find(
      (k: KontoRad) => k.kontonummer !== "1930" && (k.kredit || k.debet) && !!k.kontonummer
    );

    if (huvudkonto) {
      setKontonummer(huvudkonto.kontonummer ?? "");
      setKontobeskrivning(huvudkonto.beskrivning ?? "");
    } else {
      console.warn("⚠️ Hittade inget huvudkonto i förval:", f);
    }

    setCurrentStep(2);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    }
    if (e.key === "Enter") {
      if (results[highlightedIndex]) {
        väljFörval(results[highlightedIndex]);
      }
    }
    if (e.key === "Escape") {
      setSearchText("");
      setResults(favoritFörval);
      setHighlightedIndex(0);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    performSearch(newValue);
  };

  const getTitle = () => {
    if (utlaggMode) return "Steg 1: Välj förval för utlägg";
    if (levfaktMode) return "Steg 1: Välj förval för leverantörsfaktura";
    return "Steg 1: Sök förval";
  };

  // ====================================================
  // STEG2 LOGIK (flyttad från useSteg2.ts)
  // ====================================================

  // Lokal state för Steg2 (från useSteg2)
  const [ocrText, setOcrText] = useState<string>("");
  const [reprocessFile, setReprocessFile] = useState<(() => Promise<void>) | null>(null);
  const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

  // DEBUG: Logga heuristik-data (från useSteg2)
  useEffect(() => {
    try {
      const kontonData = (valtFörval?.konton || []).map((k) => ({
        kontonummer: k.kontonummer,
        debet: k.debet,
        kredit: k.kredit,
        klass: k.kontonummer ? k.kontonummer[0] : undefined,
      }));

      const extrafaltData = Object.fromEntries(
        Object.entries(extrafält || {}).map(([k, v]) => [k, v])
      );

      // Debug information removed for production
    } catch (err) {
      console.warn("Heuristik debug misslyckades:", err);
    }
  }, [bokföringsmetod, valtFörval, extrafält, utlaggMode]);

  // Kör kundfaktura-AI när OCR-text finns och fakturamoden är aktiv (från useSteg2)
  useEffect(() => {
    if (bokförSomFaktura && ocrText && setBelopp && setFakturadatum) {
      const runKundfakturaAI = async () => {
        try {
          const parsed = await extractDataFromOCRKundfaktura(ocrText);

          if (parsed?.fakturadatum) {
            setFakturadatum(parsed.fakturadatum);
          }
          if (parsed?.belopp && !isNaN(parsed.belopp)) {
            setBelopp(Number(parsed.belopp));
          }
        } catch (error) {
          console.error("❌ Fel vid AI-extraktion för kundfaktura (auto):", error);
        }
      };
      runKundfakturaAI();
    }
  }, [bokförSomFaktura, ocrText, setBelopp, setFakturadatum]);

  // Steg2 callback functions
  const handleOcrTextChange = useCallback((text: string) => {
    setOcrText(text);
  }, []);

  const handleReprocessTrigger = useCallback((reprocessFn: () => Promise<void>) => {
    setReprocessFile(() => reprocessFn);
  }, []);

  const handleCheckboxChange = useCallback(
    async (checked: boolean) => {
      setBokförSomFaktura(checked);

      if (checked && reprocessFile) {
        await reprocessFile();
      }
    },
    [reprocessFile, setBokförSomFaktura]
  );

  const handleLeverantorCheckboxChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        setVisaLeverantorModal(true);
      } else {
        setVisaLeverantorModal(false);
        setLeverantör(null);
      }
    },
    [setLeverantör]
  );

  const handleLeverantorRemove = useCallback(() => {
    setLeverantör(null);
    setVisaLeverantorModal(false);
  }, [setLeverantör]);

  const handleLeverantorSelected = useCallback(
    (leverantörData: any) => {
      setLeverantör(leverantörData);
      setVisaLeverantorModal(false);
    },
    [setLeverantör]
  );

  const handleLeverantorModalClose = useCallback(() => {
    setVisaLeverantorModal(false);
  }, []);

  // ====================================================
  // STEG3 LOGIK (flyttad från useSteg3.ts)
  // ====================================================

  // Safe defaults för null värden (från useSteg3)
  const safeBelopp = belopp ?? 0;
  const safeKommentar = kommentar ?? "";
  const safeTransaktionsdatum = transaktionsdatum ?? "";

  // Lokal state för Steg3 (från useSteg3)
  const [anstallda, setAnstallda] = useState<Anstalld[]>([]);
  const [anstalldId, setAnstalldId] = useState<string>("");
  const [loadingSteg3, setLoadingSteg3] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    type: "error" as "success" | "error" | "info",
    isVisible: false,
  });
  const [konto2890Beskrivning, setKonto2890Beskrivning] = useState<string>(
    "Övriga kortfristiga skulder"
  );

  // Hämta anställda för utläggs-mode (från useSteg3)
  useEffect(() => {
    if (utlaggMode) {
      hämtaAllaAnställda().then((res) => {
        setAnstallda(res);
        if (res.length === 1) setAnstalldId(res[0].id.toString());
      });
    }
  }, [utlaggMode]);

  // Toast handlers (från useSteg3)
  const showToast = (message: string, type: "success" | "error" | "info" = "error") => {
    setToast({ message, type, isVisible: true });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  // Moms- och beloppsberäkning (från useSteg3)
  const momsSats = valtFörval?.momssats ?? 0;
  const moms = +(safeBelopp * (momsSats / (1 + momsSats))).toFixed(2);
  const beloppUtanMoms = +(safeBelopp - moms).toFixed(2);

  // Kolla om det är försäljning inom leverantörsfaktura-mode (från useSteg3)
  const ärFörsäljning =
    levfaktMode &&
    (valtFörval?.namn?.toLowerCase().includes("försäljning") ||
      valtFörval?.typ?.toLowerCase().includes("intäkt") ||
      valtFörval?.kategori?.toLowerCase().includes("försäljning"));

  // Business Logic - Beräkna transaktionsposter (från useSteg3)
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

  // Beräkna alla transaktionsposter som ska skickas till servern (från useSteg3)
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

  // Submit form handler (från useSteg3)
  const handleSubmit = async (formData: FormData) => {
    if (!valtFörval) return;

    // Kontrollera att utlägg har vald anställd
    if (utlaggMode && !anstalldId) {
      showToast("Du måste välja en anställd för utlägget.", "error");
      return;
    }

    setLoadingSteg3(true);
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
      setLoadingSteg3(false);
    }
  };

  const handleButtonClick = () => {
    const form = document.getElementById("bokforingForm") as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
  };

  // Bygg tabellrader (från useSteg3)
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

  // ====================================================
  // STEG4 LOGIK (flyttad från useSteg4.ts)
  // ====================================================

  const handleNewBokforing = () => {
    window.location.reload();
  };

  // ====================================================
  // KOMMENTAR LOGIK (flyttad från useKommentar.ts)
  // ====================================================

  // Callback för att hantera kommentar-ändringar (från useKommentar)
  const handleKommentarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setKommentar(e.target.value);
    },
    [setKommentar]
  );

  // Kommentar helper function med options support (från useKommentar)
  const useKommentarHelper = (options?: {
    kommentar?: string | null;
    setKommentar?: (value: string) => void;
  }) => {
    const kommentarValue = options?.kommentar ?? kommentar;
    const setKommentarFunc = options?.setKommentar ?? setKommentar;

    return {
      kommentar: kommentarValue,
      handleChange: useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
          setKommentarFunc(e.target.value);
        },
        [setKommentarFunc]
      ),
    };
  };

  // ====================================================
  // ====================================================
  // LAYOUT LOGIK (flyttad från useStandardLayout.ts och useLevfaktLayout.ts)
  // ====================================================

  // Standard layout helper function (från useStandardLayout)
  const useStandardLayoutHelper = (onSubmit?: () => void, title?: string) => {
    // Grundläggande validering för standard layout
    const isValid = belopp && belopp > 0 && transaktionsdatum && fil;

    return {
      state: {
        belopp,
        transaktionsdatum,
        kommentar,
        fil,
        pdfUrl,
        isValid,
        title: title || "Standard bokföring",
      },
      handlers: {
        setBelopp,
        setTransaktionsdatum,
        setKommentar,
        setFil,
        setPdfUrl,
        setCurrentStep,
        onSubmit: onSubmit || (() => {}),
      },
    };
  };

  // Leverantörsfaktura layout helper function (från useLevfaktLayout)
  const useLevfaktLayoutHelper = () => {
    // Layout-specifika värden
    const title = "Leverantörsfaktura";

    // Submit-hantering
    const handleSubmit = () => {
      // Leverantörsfaktura bokföring logik
    };

    // Extra validering för leverantörsfaktura-specifika fält
    const leverantörIsValid =
      leverantör &&
      (typeof leverantör === "string"
        ? leverantör.trim() !== ""
        : typeof leverantör === "object" && leverantör.namn && leverantör.namn.trim() !== "");

    const fakturanummerIsValid =
      fakturanummer && typeof fakturanummer === "string" && fakturanummer.trim() !== "";

    const fakturadatumIsValid =
      fakturadatum && typeof fakturadatum === "string" && fakturadatum.trim() !== "";

    // Grundläggande validering
    const grundIsValid = belopp && belopp > 0 && transaktionsdatum && fil;
    const fullIsValid =
      grundIsValid && leverantörIsValid && fakturanummerIsValid && fakturadatumIsValid;

    // Leverantör options
    const leverantörOptions = [
      { label: "Välj leverantör...", value: "" },
      { label: "Telia", value: "telia" },
      { label: "Ellevio", value: "ellevio" },
      { label: "ICA", value: "ica" },
      { label: "Staples", value: "staples" },
      { label: "Office Depot", value: "office_depot" },
    ];

    return {
      // State values
      belopp,
      transaktionsdatum,
      kommentar,
      fil,
      pdfUrl,
      leverantör,
      fakturanummer,
      fakturadatum,
      förfallodatum,

      // Actions
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setFil,
      setPdfUrl,
      setLeverantör,
      setFakturanummer,
      setFakturadatum,
      setFörfallodatum,
      setCurrentStep,

      // Layout
      title,
      onSubmit: handleSubmit,

      // Validering
      leverantörIsValid,
      fakturanummerIsValid,
      fakturadatumIsValid,
      fullIsValid,

      // Options
      leverantörOptions,
    };
  };

  // Layout useEffect för datepicker styling (från useLevfaktLayout)
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });

    const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
    inputEls.forEach((el) => {
      (el as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    });
  }, []);

  // Layout useEffect för default datum (från useLevfaktLayout)
  useEffect(() => {
    if (!fakturadatum) {
      setFakturadatum(datePickerOnChange(new Date()));
    }
    if (!förfallodatum) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
    }
  }, [fakturadatum, förfallodatum, setFakturadatum, setFörfallodatum]);

  // ====================================================
  // SLUT PÅ KONSOLIDERING
  // ====================================================

  // Skapa options för anställd dropdown
  const options = anstallda.map((a) => ({
    label: `${a.förnamn} ${a.efternamn}`,
    value: a.id.toString(),
  }));

  // ForvalKort funktioner
  const formatKontoValue = (value: boolean | string | number | undefined) => {
    if (value === true) return "✓";
    return value ?? "";
  };

  const getCardClassName = (isHighlighted: boolean) =>
    `relative rounded-xl p-4 transition-all duration-200 shadow-md cursor-pointer ${
      isHighlighted
        ? "border-2 border-dashed border-gray-500 bg-slate-800"
        : "border border-gray-700 bg-slate-900"
    }`;

  return {
    state: {
      // SokForval state (nu direkt från denna hook)
      currentStep,
      searchText,
      results,
      highlightedIndex,
      loading,
      favoritFörval,
      allaFörval,
      levfaktMode,
      utlaggMode,

      // Steg2 state (nu direkt från denna hook)
      belopp,
      transaktionsdatum,
      kommentar,
      valtFörval,
      extrafält,
      bokförSomFaktura,
      fil,
      pdfUrl,
      leverantör,
      bokföringsmetod,
      fakturadatum,
      förfallodatum,
      betaldatum,
      kundfakturadatum,
      visaLeverantorModal,

      // Steg3 state (nu direkt från denna hook)
      anstallda,
      anstalldId,
      toast,
      konto2890Beskrivning,
      totalDebet,
      totalKredit,
      momsSats,
      moms,
      beloppUtanMoms,
      ärFörsäljning,
      fallbackRows,
    },
    options,
    formatKontoValue,
    getCardClassName,
    actions: {
      // Steg2 actions (nu direkt från denna hook)
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setExtrafält,
      setBokförSomFaktura,
      setFil,
      setPdfUrl,
      setLeverantör,
      setCurrentStep,
      setFakturadatum,
      setVisaLeverantorModal,

      // Steg3 actions (nu direkt från denna hook)
      setAnstallda,
      setAnstalldId,
      setLoading: setLoadingSteg3,
      setToast,

      // Initial data setters
      setFavoritFörvalen,
      setAllaFörval,
      setBokföringsmetod,
      setAnställda,
    },
    handlers: {
      // SokForval handlers (nu direkt från denna hook)
      handleKeyDown,
      handleSearchChange,
      väljFörval,
      getTitle,

      // Steg2 handlers (nu direkt från denna hook)
      handleOcrTextChange,
      handleReprocessTrigger,
      handleCheckboxChange,
      handleLeverantorCheckboxChange,
      handleLeverantorRemove,
      handleLeverantorSelected,
      handleLeverantorModalClose,

      // Steg3 handlers (nu direkt från denna hook)
      showToast,
      hideToast,
      calculateBelopp,
      transformKontonummer,
      beräknaTransaktionsposter,
      handleSubmit,
      handleButtonClick,

      // Steg4 handlers (nu direkt från denna hook)
      handleNewBokforing,

      // Kommentar handlers (nu direkt från denna hook)
      handleKommentarChange,
      useKommentarHelper,

      // Layout handlers (nu direkt från denna hook)
      useStandardLayoutHelper,
      useLevfaktLayoutHelper,

      // Anställd dropdown helper (nu direkt från denna hook)
      useAnstalldDropdownHelper,

      // Utlägg helper (nu direkt från denna hook)
      useUtlaggHelper,

      // Information helper (nu direkt från denna hook)
      useInformationHelper,

      // Förhandsvisning helper (nu direkt från denna hook)
      useForhandsgranskningHelper,

      // Steg2 Levfakt helper (nu direkt från denna hook)
      useSteg2LevfaktHelper,
    },
  };

  // ====================================================
  // HELPER FUNCTIONS - ANSTÄLLD DROPDOWN
  // ====================================================

  function useAnstalldDropdownHelper({ anstallda, value, onChange }: UseAnstalldDropdownProps) {
    const options = anstallda.map((a) => ({
      label: `${a.förnamn} ${a.efternamn}`,
      value: a.id.toString(),
    }));

    return {
      options,
    };
  }

  // ====================================================
  // HELPER FUNCTIONS - UTLÄGG
  // ====================================================

  function useUtlaggHelper({
    initialValue = false,
    onUtläggChange,
  }: {
    initialValue?: boolean;
    onUtläggChange?: (isUtlägg: boolean, valdaAnställda: number[]) => void;
  }) {
    const [isUtlägg, setIsUtlägg] = useState(initialValue);
    const [valdaAnställda, setValdaAnställda] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const handleUtläggChange = (checked: boolean) => {
      setIsUtlägg(checked);

      if (checked) {
        setLoading(true);
        // TODO: Hämta anställda från API när utlägg aktiveras
        setLoading(false);
      } else {
        setValdaAnställda([]);
      }

      onUtläggChange?.(checked, checked ? valdaAnställda : []);
    };

    const handleAnställdChange = (anställdId: number, checked: boolean) => {
      const nyaValda = checked
        ? [...valdaAnställda, anställdId]
        : valdaAnställda.filter((id) => id !== anställdId);

      setValdaAnställda(nyaValda);
      onUtläggChange?.(isUtlägg, nyaValda);
    };

    return {
      isUtlägg,
      anställda,
      valdaAnställda,
      loading,
      handleUtläggChange,
      handleAnställdChange,
    };
  }

  // ====================================================
  // HELPER FUNCTIONS - INFORMATION
  // ====================================================

  function useInformationHelper() {
    // Använd context-hooks som redan definieras ovan
    // const state = useBokforState(); redan definierat
    // const actions = useBokforActions(); redan definierat

    // Säker beloppvalidering
    const handleBeloppChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = Number(value);

        // Begränsa till rimliga värden
        if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
          return; // Ignorera ogiltiga värden
        }

        setBelopp(numValue);
      },
      [setBelopp]
    );

    // Datepicker setup
    useEffect(() => {
      const datePickerEl = document.querySelector(".react-datepicker-wrapper");
      if (datePickerEl) {
        (datePickerEl as HTMLElement).style.width = "100%";
      }

      const inputEl = document.querySelector(".react-datepicker__input-container input");
      if (inputEl) {
        (inputEl as HTMLElement).className =
          "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
      }

      if (!transaktionsdatum) {
        // Default dagens datum
        setTransaktionsdatum(new Date().toISOString());
      }
    }, [transaktionsdatum, setTransaktionsdatum]);

    const handleTransaktionsdatumChange = useCallback(
      (date: Date | null) => {
        setTransaktionsdatum(date ? date.toISOString() : "");
      },
      [setTransaktionsdatum]
    );

    return {
      belopp,
      transaktionsdatum,
      handleBeloppChange,
      handleTransaktionsdatumChange,
      transaktionsdatumDate: transaktionsdatum ? new Date(transaktionsdatum) : new Date(),
    };
  }

  // ====================================================
  // HELPER FUNCTIONS - FÖRHANDSVISNING
  // ====================================================

  function useForhandsgranskningHelper({ fil, pdfUrl }: UseForhandsgranskningProps) {
    const [showModal, setShowModal] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Memoize blob URL för att förhindra nya URLs varje render
    const blobUrl = useMemo(() => {
      return fil ? URL.createObjectURL(fil) : null;
    }, [fil]);

    // Cleanup blob URL när komponenten unmountar eller fil ändras
    useEffect(() => {
      return () => {
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
      };
    }, [blobUrl]);

    const hasFile = fil || pdfUrl;
    const isImage = fil?.type.startsWith("image/");
    const isPdf = fil?.type === "application/pdf";
    const displayUrl = pdfUrl || blobUrl;

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    const handleFileClick = () => {
      if (fil?.type === "application/pdf") {
        // För PDFs, öppna i ny flik
        if (blobUrl) window.open(blobUrl, "_blank");
      } else if (fil?.type.startsWith("image/")) {
        // För bilder, visa modal som vanligt
        setShowModal(true);
      } else if (pdfUrl) {
        // För andra filer, öppna uploaded URL
        window.open(pdfUrl, "_blank");
      }
    };

    const getButtonText = () => {
      if (fil?.type === "application/pdf" || (!fil?.type.startsWith("image/") && pdfUrl)) {
        return "Öppna i ny flik";
      }
      return "Visa större";
    };

    const handlePdfOpenClick = () => {
      if (blobUrl) window.open(blobUrl, "_blank");
    };

    return {
      state: {
        showModal,
        blobUrl,
        hasFile,
        isImage,
        isPdf,
        displayUrl,
      },
      actions: {
        openModal,
        closeModal,
      },
      handlers: {
        handleFileClick,
        getButtonText,
        handlePdfOpenClick,
      },
      refs: {
        iframeRef,
      },
    };
  }

  // ====================================================
  // HELPER FUNCTIONS - STEG2 LEVFAKT
  // ====================================================

  function useSteg2LevfaktHelper() {
    // Använd context-hooks som redan definieras i början av useBokfor()
    // state och actions är redan tillgängliga i parent scope

    const [visaLeverantorModal, setVisaLeverantorModal] = useState(false);

    // Datepicker styling och default värden
    useEffect(() => {
      const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
      datePickerEls.forEach((el) => {
        (el as HTMLElement).style.width = "100%";
      });

      const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
      inputEls.forEach((el) => {
        (el as HTMLElement).className =
          "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
      });

      // Sätt default datum
      if (!fakturadatum && setFakturadatum) {
        setFakturadatum(datePickerOnChange(new Date()));
      }
      if (!förfallodatum && setFörfallodatum) {
        // Default 30 dagar från idag
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        setFörfallodatum(datePickerOnChange(thirtyDaysFromNow));
      }
      if (!betaldatum && setBetaldatum) {
        // Default betaldatum till idag
        setBetaldatum(datePickerOnChange(new Date()));
      }
    }, [fakturadatum, förfallodatum, betaldatum, setFakturadatum, setFörfallodatum, setBetaldatum]);

    // Callback functions
    const exitLevfaktMode = useCallback(() => {
      setLevfaktMode(false);
    }, [setLevfaktMode]);

    return {
      state: {
        currentStep,
        levfaktMode,
        fakturadatum,
        förfallodatum,
        betaldatum,
        belopp,
        kommentar,
        fil,
        pdfUrl,
        transaktionsdatum,
        valtFörval,
        extrafält,
        leverantör,
        fakturanummer,
        visaLeverantorModal,
      },
      actions: {
        setLevfaktMode,
        setFakturadatum,
        setFörfallodatum,
        setBetaldatum,
        setBelopp,
        setKommentar,
        setCurrentStep,
        setFil,
        setPdfUrl,
        setTransaktionsdatum,
        setExtrafält,
        setLeverantör,
        setFakturanummer,
        setVisaLeverantorModal,
      },
      handlers: {
        exitLevfaktMode,
      },
    };
  }
}

// ====================================================
// INDIVIDUELLA HOOK EXPORTS (från separata filer)
// ====================================================

// Från useInformation.ts
export function useInformation() {
  const store = useBokfor();
  const { belopp, transaktionsdatum } = store.state;
  const { setBelopp, setTransaktionsdatum } = store.actions;

  // Säker beloppvalidering
  const handleBeloppChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numValue = Number(value);

      // Begränsa till rimliga värden
      if (isNaN(numValue) || numValue < 0 || numValue > 999999999) {
        return; // Ignorera ogiltiga värden
      }

      setBelopp(numValue);
    },
    [setBelopp]
  );

  // Datepicker setup
  useEffect(() => {
    const datePickerEl = document.querySelector(".react-datepicker-wrapper");
    if (datePickerEl) {
      (datePickerEl as HTMLElement).style.width = "100%";
    }

    const inputEl = document.querySelector(".react-datepicker__input-container input");
    if (inputEl) {
      (inputEl as HTMLElement).className =
        "w-full p-2 mb-4 rounded text-white bg-slate-900 border border-gray-700";
    }

    if (!transaktionsdatum) {
      // Default dagens datum
      setTransaktionsdatum(new Date().toISOString());
    }
  }, [transaktionsdatum, setTransaktionsdatum]);

  const handleTransaktionsdatumChange = useCallback(
    (date: Date | null) => {
      setTransaktionsdatum(date ? date.toISOString() : "");
    },
    [setTransaktionsdatum]
  );

  return {
    belopp,
    transaktionsdatum,
    handleBeloppChange,
    handleTransaktionsdatumChange,
    transaktionsdatumDate: transaktionsdatum ? new Date(transaktionsdatum) : new Date(),
  };
}

// Från useKommentar.ts
export function useKommentar(options?: {
  kommentar?: string | null;
  setKommentar?: (value: string) => void;
}) {
  const store = useBokfor();
  const { kommentar } = store.state;
  const { setKommentar } = store.actions;

  const finalKommentar = options?.kommentar ?? kommentar;
  const finalSetKommentar = options?.setKommentar ?? setKommentar;

  // Callback för att hantera ändringar
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      finalSetKommentar(e.target.value);
    },
    [finalSetKommentar]
  );

  return {
    kommentar: finalKommentar,
    handleChange,
  };
}

// Från useSokForval.ts
export function useSokForval() {
  const store = useBokfor();
  const {
    currentStep,
    searchText,
    results,
    highlightedIndex,
    loading,
    favoritFörval,
    allaFörval,
    levfaktMode,
    utlaggMode,
  } = store.state;

  const { handleSearchChange, handleKeyDown, väljFörval, getTitle } = store.handlers;

  return {
    state: {
      currentStep,
      searchText,
      results,
      highlightedIndex,
      loading,
      favoritFörval,
      allaFörval,
      levfaktMode,
      utlaggMode,
    },
    handlers: {
      handleSearchChange,
      handleKeyDown,
      väljFörval,
      getTitle,
    },
  };
}

// Från useSteg2.ts
export function useSteg2() {
  const store = useBokfor();
  const {
    currentStep,
    belopp,
    transaktionsdatum,
    kommentar,
    valtFörval,
    extrafält,
    levfaktMode,
    bokförSomFaktura,
    fakturadatum,
    fil,
    pdfUrl,
    leverantör,
    visaLeverantorModal,
  } = store.state;

  const {
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setExtrafält,
    setBokförSomFaktura,
    setFakturadatum,
    setFil,
    setPdfUrl,
    setLeverantör,
    setCurrentStep,
  } = store.actions;

  const {
    handleOcrTextChange,
    handleReprocessTrigger,
    handleCheckboxChange,
    handleLeverantorCheckboxChange,
    handleLeverantorRemove,
    handleLeverantorSelected,
    handleLeverantorModalClose,
  } = store.handlers;

  return {
    state: {
      currentStep,
      belopp,
      transaktionsdatum,
      kommentar,
      valtFörval,
      extrafält,
      levfaktMode,
      bokförSomFaktura,
      fakturadatum,
      fil,
      pdfUrl,
      leverantör,
      visaLeverantorModal,
    },
    actions: {
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setExtrafält,
      setBokförSomFaktura,
      setFakturadatum,
      setFil,
      setPdfUrl,
      setLeverantör,
      setCurrentStep,
    },
    handlers: {
      handleOcrTextChange,
      handleReprocessTrigger,
      handleCheckboxChange,
      handleLeverantorCheckboxChange,
      handleLeverantorRemove,
      handleLeverantorSelected,
      handleLeverantorModalClose,
    },
  };
}

// Från useSteg3.ts
export function useSteg3() {
  const store = useBokfor();
  const {
    currentStep,
    belopp,
    kommentar,
    fil,
    pdfUrl,
    transaktionsdatum,
    valtFörval,
    extrafält,
    bokföringsmetod,
    anstallda,
    anstalldId,
    toast,
    totalDebet,
    totalKredit,
    utlaggMode,
  } = store.state;

  const { setAnstallda, setAnstalldId, setCurrentStep } = store.actions;

  const { showToast, hideToast, handleSubmit } = store.handlers;

  return {
    state: {
      currentStep,
      belopp,
      kommentar,
      fil,
      pdfUrl,
      transaktionsdatum,
      valtFörval,
      extrafält,
      bokföringsmetod,
      anstallda,
      anstalldId,
      toast,
      totalDebet,
      totalKredit,
      utlaggMode,
    },
    actions: {
      setAnstallda,
      setAnstalldId,
      setCurrentStep,
    },
    handlers: {
      showToast,
      hideToast,
      handleSubmit,
    },
  };
}

// Från useSteg4.ts
export function useSteg4() {
  const handleNewBokforing = () => {
    window.location.reload();
  };

  return {
    state: {},
    handlers: {
      handleNewBokforing,
    },
  };
}

// Från useStandardLayout.ts
export function useStandardLayout(onSubmit?: () => void, title?: string) {
  const store = useBokfor();
  const { belopp, transaktionsdatum, kommentar, fil, pdfUrl } = store.state;
  const { setBelopp, setTransaktionsdatum, setKommentar, setFil, setPdfUrl, setCurrentStep } =
    store.actions;

  // Grundläggande validering för standard layout
  const isValid = belopp && belopp > 0 && transaktionsdatum && fil;

  const handleSubmit = useCallback(() => {
    if (onSubmit) {
      onSubmit();
    }
  }, [onSubmit]);

  return {
    state: {
      belopp,
      transaktionsdatum,
      kommentar,
      fil,
      pdfUrl,
      isValid,
      title: title || "Standard bokföring",
    },
    actions: {
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setFil,
      setPdfUrl,
      setCurrentStep,
    },
    handlers: {
      onSubmit: handleSubmit,
    },
  };
}

// Från useLevfaktLayout.ts
export function useLevfaktLayout() {
  const store = useBokfor();
  const {
    belopp,
    transaktionsdatum,
    kommentar,
    fil,
    pdfUrl,
    leverantör,
    fakturadatum,
    förfallodatum,
    betaldatum,
    levfaktMode,
  } = store.state;

  const {
    setBelopp,
    setTransaktionsdatum,
    setKommentar,
    setFil,
    setPdfUrl,
    setLeverantör,
    setFakturadatum,
    setCurrentStep,
  } = store.actions;

  const title = "Leverantörsfaktura";

  const handleSubmit = useCallback(() => {
    console.log("Leverantörsfaktura submit");
  }, []);

  // Validering för leverantörsfaktura
  const leverantörIsValid =
    leverantör &&
    (typeof leverantör === "string"
      ? leverantör.trim() !== ""
      : typeof leverantör === "object" && leverantör.namn && leverantör.namn.trim() !== "");

  const grundIsValid = belopp && belopp > 0 && transaktionsdatum && fil;
  const fullIsValid = grundIsValid && leverantörIsValid;

  const leverantörOptions = [
    { label: "Välj leverantör...", value: "" },
    { label: "Telia", value: "telia" },
    { label: "Ellevio", value: "ellevio" },
    { label: "ICA", value: "ica" },
    { label: "Staples", value: "staples" },
    { label: "Office Depot", value: "office_depot" },
  ];

  return {
    state: {
      belopp,
      transaktionsdatum,
      kommentar,
      fil,
      pdfUrl,
      leverantör,
      fakturadatum,
      förfallodatum,
      betaldatum,
      leverantörIsValid,
      fullIsValid,
      title,
      leverantörOptions,
    },
    actions: {
      setBelopp,
      setTransaktionsdatum,
      setKommentar,
      setFil,
      setPdfUrl,
      setLeverantör,
      setFakturadatum,
      setCurrentStep,
    },
    handlers: {
      onSubmit: handleSubmit,
    },
  };
}

// Från useForhandsgranskning.ts
export function useForhandsgranskning({ fil, pdfUrl }: UseForhandsgranskningProps) {
  const store = useBokfor();
  const helperResult = store.handlers.useForhandsgranskningHelper({ fil, pdfUrl });

  return {
    state: helperResult.state,
    actions: helperResult.actions,
    handlers: helperResult.handlers,
    refs: helperResult.refs,
  };
}

// Från useUtlagg.ts
export function useUtlagg({
  initialValue = false,
  onUtläggChange,
}: {
  initialValue?: boolean;
  onUtläggChange?: (isUtlägg: boolean, valdaAnställda: number[]) => void;
}) {
  const store = useBokfor();
  const helperResult = store.handlers.useUtlaggHelper({ initialValue, onUtläggChange });

  return {
    ...helperResult,
    anställda: store.state.anstallda, // Lägg till anställda från store
  };
}

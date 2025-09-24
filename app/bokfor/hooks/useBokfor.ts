"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { loggaFavoritförval } from "../actions/actions";
import { hämtaAllaAnställda } from "../../personal/actions/anstalldaActions";
import { saveTransaction } from "../actions/transactionActions";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate, datePickerOnChange } from "../../_utils/datum";
import { formatCurrency, round } from "../../_utils/format";
import { showToast } from "../../_components/Toast";
import {
  KontoRad,
  Förval,
  Anstalld,
  UseAnstalldDropdownProps,
  UtlaggAnställd,
  UseForhandsgranskningProps,
} from "../types/types";
import { normalize } from "../../_utils/textUtils";

// Import nya extraherade hooks
import { useForvalSok } from "./useForvalSok";
import { useOCRProcessing } from "./useOCRProcessing";
import { useNavigationSteps } from "./useNavigationSteps";
import { useLeverantorModal } from "./useLeverantorModal";
import { useFormValidation } from "./useFormValidation";

export function useBokfor() {
  // ====================================================
  // STATE MANAGEMENT (ersätter Zustand med useState)
  // ====================================================

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

  // ====================================================
  // EXTRAHERADE HOOKS
  // ====================================================

  // Navigation och steg-logik
  const navigation = useNavigationSteps({
    setKontonummer,
    setKontobeskrivning,
    setBelopp,
    setKommentar,
    setFil: () => {}, // placeholder, kommer från OCR hook
    setPdfUrl: () => {}, // placeholder, kommer från OCR hook
    setTransaktionsdatum,
    setValtFörval,
    setExtrafält,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    setFörfallodatum,
    setBetaldatum,
    setBokförSomFaktura,
    setKundfakturadatum,
    setLevfaktMode,
    setUtlaggMode,
  });

  // OCR och filhantering
  const ocr = useOCRProcessing({
    bokförSomFaktura,
    levfaktMode,
    leverantör,
    fakturanummer,
    fakturadatum,
    utlaggMode,
    setBelopp,
    setFakturadatum,
  });

  // Leverantörsmodal
  const leverantorModal = useLeverantorModal({
    setLeverantör,
  });

  // Förvalsök
  const forvalSok = useForvalSok({
    favoritFörval,
    allaFörval,
    utlaggMode,
    levfaktMode,
    onForvalVald: (valtFörval: Förval) => {
      setValtFörval(valtFörval);
      navigation.goToSecondStep();
    },
  });

  // Formulärvalidering
  const formValidation = useFormValidation({
    belopp,
    transaktionsdatum,
    fakturadatum,
    förfallodatum,
    betaldatum,
    setBelopp,
    setTransaktionsdatum,
    setFakturadatum,
    setFörfallodatum,
    setBetaldatum,
  });

  // ====================================================
  // STEG3 LOGIK - KVARVARANDE AFFÄRSLOGIK
  // ====================================================

  // Safe defaults för null värden
  const safeBelopp = belopp ?? 0;
  const safeKommentar = kommentar ?? "";
  const safeTransaktionsdatum = transaktionsdatum ?? "";

  // Lokal state för Steg3
  const [anstallda, setAnstallda] = useState<Anstalld[]>([]);
  const [anstalldId, setAnstalldId] = useState<string>("");
  const [loadingSteg3, setLoadingSteg3] = useState(false);
  const [konto2890Beskrivning, setKonto2890Beskrivning] = useState<string>(
    "Övriga kortfristiga skulder"
  );

  // Hämta anställda för utläggs-mode
  useEffect(() => {
    if (utlaggMode) {
      hämtaAllaAnställda().then((res) => {
        setAnstallda(res);
        if (res.length === 1) setAnstalldId(res[0].id.toString());
      });
    }
  }, [utlaggMode]);

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

  // ====================================================
  // BERÄKNINGSFUNKTIONER
  // ====================================================

  const calculateBelopp = (kontonummer: string, typ: "debet" | "kredit"): number => {
    const klass = kontonummer[0];

    if (typ === "debet") {
      if (utlaggMode && kontonummer === "2890") {
        return 0; // Utlägg ska inte ha debet på 2890
      }
      if (bokförSomFaktura && kontonummer === "1510") {
        return safeBelopp; // Kundfordringar ska få hela beloppet som debet
      }
      if (levfaktMode && !ärFörsäljning && kontonummer === "2440") {
        return safeBelopp; // Leverantörsskulder ska få hela beloppet som debet
      }
      if (levfaktMode && ärFörsäljning && kontonummer === "1510") {
        return safeBelopp; // Kundfordringar vid försäljning
      }

      if (klass === "1") return 0; // Tillgångar ska inte ha debet
      if (klass === "2") return ärFörsäljning ? 0 : moms; // Ingående moms
      if (klass === "3") return 0; // Intäkter ska inte ha debet
      if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
        return beloppUtanMoms; // Kostnader
      }
      return 0;
    }

    // Kredit
    if (utlaggMode && kontonummer === "2890") {
      return safeBelopp;
    }
    if (klass === "1") return safeBelopp;
    if (klass === "2") {
      return ärFörsäljning ? moms : 0; // Utgående moms vid försäljning
    }
    if (klass === "3") return beloppUtanMoms; // Intäktskonton
    if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
      return 0; // Kostnader ska inte vara kredit
    }
    return 0;
  };

  const transformKontonummer = (originalKonto: string): string => {
    if (utlaggMode && originalKonto === "1930") {
      return "2890";
    }
    if (bokförSomFaktura && originalKonto === "1930") {
      return "1510";
    }
    if (levfaktMode && !ärFörsäljning && originalKonto === "1930") {
      return "2440";
    }
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

  // ====================================================
  // SUBMIT LOGIC
  // ====================================================

  const handleSubmit = async (formData: FormData) => {
    setLoadingSteg3(true);
    try {
      // Lägg till transaktionsposter
      const poster = beräknaTransaktionsposter();
      formData.set("transaktionsposter", JSON.stringify(poster));

      // Lägg till transaktionsdatum från state
      if (transaktionsdatum) {
        formData.set("transaktionsdatum", transaktionsdatum);
      }

      // Lägg till andra fält från state
      if (kommentar) formData.set("kommentar", kommentar);
      if (belopp) formData.set("belopp", belopp.toString());
      if (valtFörval) formData.set("valtFörval", JSON.stringify(valtFörval));
      if (utlaggMode) formData.set("utlaggMode", "true");
      if (levfaktMode) formData.set("levfaktMode", "true");
      if (anstalldId) formData.set("anstalldId", anstalldId.toString());

      // Lägg till kundfaktura-specifika fält
      if (bokförSomFaktura) {
        formData.set("bokförSomFaktura", "true");
        if (kundfakturadatum) formData.set("kundfakturadatum", kundfakturadatum);
      }

      // Ladda upp fil till blob storage först (om det finns en fil)
      if (ocr.fil) {
        const uploadResult = await ocr.uploadFileToBlob(ocr.fil);
        if (uploadResult.success && uploadResult.url) {
          formData.set("bilageUrl", uploadResult.url);
        } else {
          console.error("Misslyckades med att ladda upp fil:", uploadResult.error);
        }
      }

      const result = await saveTransaction(formData);
      if (result.success) navigation.goToFinalStep();
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

  // ====================================================
  // BUSINESS LOGIC FUNCTIONS
  // ====================================================

  const setFavoritFörvalen = useCallback((förvalen: Förval[]) => {
    setFavoritFörval(förvalen);
  }, []);

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

            // Transformera kontonummer baserat på mode
            if (utlaggMode && kontoNr === "1930") {
              kontoNr = "2890";
              namn = `2890 ${konto2890Beskrivning || "Övriga kortfristiga skulder"}`;
              beloppAttVisa = safeBelopp;
            } else if (bokförSomFaktura && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
              beloppAttVisa = safeBelopp;
            } else if (levfaktMode && !ärFörsäljning && kontoNr === "1930") {
              kontoNr = "2440";
              namn = `2440 Leverantörsskulder`;
              beloppAttVisa = safeBelopp;
            } else if (levfaktMode && ärFörsäljning && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
              beloppAttVisa = safeBelopp;
            } else {
              beloppAttVisa = rad.debet
                ? calculateBelopp(kontoNr || "", "debet")
                : calculateBelopp(kontoNr || "", "kredit");
            }

            return {
              key: i,
              konto: namn,
              debet: rad.debet ? round(beloppAttVisa) : 0,
              kredit: rad.kredit ? round(beloppAttVisa) : 0,
            };
          })
        : [];

  // ====================================================
  // RETURN INTERFACE
  // ====================================================

  return {
    // State
    currentStep: navigation.currentStep,
    favoritFörval,
    allaFörval,
    anställda,
    bokföringsmetod,
    levfaktMode,
    utlaggMode,
    kontonummer,
    kontobeskrivning,
    belopp,
    kommentar,
    fil: ocr.fil,
    pdfUrl: ocr.pdfUrl,
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
    ocrText: ocr.ocrText,
    visaLeverantorModal: leverantorModal.visaLeverantorModal,
    anstallda,
    anstalldId,
    loadingSteg3,
    konto2890Beskrivning,

    // Computed values
    safeBelopp,
    safeKommentar,
    safeTransaktionsdatum,
    momsSats,
    moms,
    beloppUtanMoms,
    ärFörsäljning,
    fallbackRows,

    // Actions
    setBokföringsmetod,
    setLevfaktMode,
    setUtlaggMode,
    setKontonummer,
    setKontobeskrivning,
    setBelopp, // Direkt värde-sättning
    handleBeloppChange: formValidation.handleBeloppChange, // Event-handler
    setKommentar,
    setFil: ocr.setFile,
    setPdfUrl: ocr.setPdfUrlValue,
    setTransaktionsdatum, // Direkt string-sättning
    handleTransaktionsdatumChange: formValidation.handleTransaktionsdatumChange, // Date-handler
    setValtFörval,
    setExtrafält,
    setLeverantör,
    setFakturanummer,
    setFakturadatum,
    handleFakturadatumChange: formValidation.handleFakturadatumChange,
    setFörfallodatum: formValidation.handleFörfallodatumChange,
    setBetaldatum: formValidation.handleBetaldatumChange,
    setBokförSomFaktura,
    setKundfakturadatum,
    setCurrentStep: navigation.setCurrentStep,
    setFavoritFörvalen,
    setAllaFörval,
    setAnstallda,
    setAnstalldId,
    showToast,
    setKonto2890Beskrivning,

    // Navigation
    resetAllFields: navigation.resetAllFields,
    exitLevfaktMode: navigation.exitLevfaktMode,
    goToStep: navigation.goToStep,
    nextStep: navigation.nextStep,
    previousStep: navigation.previousStep,

    // OCR Functions
    handleOcrTextChange: ocr.handleOcrTextChange,
    handleReprocessTrigger: ocr.handleReprocessTrigger,
    handleCheckboxChange: ocr.handleCheckboxChange,
    uploadFileToBlob: ocr.uploadFileToBlob,
    extractDataFromOCRKund: ocr.extractDataFromOCRKund,
    extractDataFromOCRGeneral: ocr.extractDataFromOCRGeneral,
    extractDataFromOCRLeverantorsfaktura: ocr.extractDataFromOCRLeverantorsfaktura,

    // Leverantör Modal Functions
    handleLeverantorCheckboxChange: leverantorModal.handleLeverantorCheckboxChange,
    handleLeverantorRemove: leverantorModal.handleLeverantorRemove,
    handleLeverantorSelected: leverantorModal.handleLeverantorSelected,
    handleLeverantorModalClose: leverantorModal.handleLeverantorModalClose,

    // Search Functions
    searchText: forvalSok.searchText,
    handleSearchChange: forvalSok.handleSearchChange,
    results: forvalSok.results,
    highlightedIndex: forvalSok.highlightedIndex,
    loading: forvalSok.loading,
    handleKeyDown: forvalSok.handleKeyDown,
    väljFörval: forvalSok.väljFörval,
    clearSearch: forvalSok.clearSearch,
    getTitle: forvalSok.getTitle,

    // Form Validation
    isFormValid: formValidation.isFormValid,
    beloppError: formValidation.beloppError,
    datumError: formValidation.datumError,
    transaktionsdatumDate: formValidation.transaktionsdatumDate,
    fakturadatumDate: formValidation.fakturadatumDate,
    förfallodatumDate: formValidation.förfallodatumDate,
    betaldatumDate: formValidation.betaldatumDate,

    // Business Logic Functions
    calculateBelopp,
    transformKontonummer,
    beräknaTransaktionsposter,
    handleSubmit,
    handleButtonClick,

    // Router access
    router: navigation.router,
    searchParams: navigation.searchParams,
  };
}

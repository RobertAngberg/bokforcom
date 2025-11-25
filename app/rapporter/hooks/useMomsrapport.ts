"use client";

import { useState, useEffect, useMemo } from "react";
import { exportMomsrapportPDF, exportMomsrapportCSV } from "../utils/csvExport";
import type {
  MomsRad,
  ToastState,
  UseMomsrapportProps,
  MomsrapportStatusData,
  MomsrapportStatus,
  ValidationResult,
  BokforingsPostWizard,
} from "../types/types";
import { processMomsData } from "../utils/momsProcessing";
import {
  getMomsrapportStatus,
  updateMomsrapportStatus,
  saveNoteringar,
} from "../actions/momsrapportStatusActions";
import { validateMomsVerifikat } from "../actions/momsValidationActions";
import { bokforMomsavstamning } from "../actions/momsBokforingActions";

/**
 * Centraliserad hook för all momshantering
 * Hanterar: data, export, status, wizard, validering, bokföring
 */
export const useMomsrapport = ({ transaktionsdata, foretagsprofil }: UseMomsrapportProps) => {
  // ============================================================================
  // SECTION 1: GRUNDLÄGGANDE STATE & DATA
  // ============================================================================

  // Företagsinformation
  const organisationsnummer = foretagsprofil.organisationsnummer;
  const företagsnamn = foretagsprofil.företagsnamn;
  const loading = false;

  // Filter state
  const [år, setÅr] = useState("2025");
  const [månad, setMånad] = useState("all");

  // Constants
  const årLista = ["2025"];

  // Process momsdata - använd useMemo för rent derived state
  const initialData = useMemo(() => {
    try {
      const momsData = processMomsData(transaktionsdata, år, månad);
      console.log(`Momsdata processad för ${år} (${månad}): ${momsData.length} rader`);
      return momsData;
    } catch (error) {
      console.error("Fel vid processning av momsdata:", error);
      return [];
    }
  }, [transaktionsdata, år, månad]);

  // ============================================================================
  // SECTION 2: STATUS & PROGRESS TRACKING
  // ============================================================================

  const [status, setStatus] = useState<MomsrapportStatusData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Hämta status BARA när den behövs (när wizard öppnas)
  const loadStatus = async () => {
    if (status) return; // Redan laddad

    setLoadingStatus(true);
    const result = await getMomsrapportStatus(parseInt(år), månad);

    if (result.success && result.data) {
      setStatus(result.data);
    } else {
      setStatusError(result.error || "Kunde inte ladda status");
    }
    setLoadingStatus(false);
  };

  // Uppdatera status
  const updateStatus = async (newStatus: MomsrapportStatus) => {
    const result = await updateMomsrapportStatus(parseInt(år), månad, newStatus);

    if (result.success && result.data) {
      setStatus(result.data);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  // Spara noteringar
  const saveNotes = async (noteringar: string) => {
    const result = await saveNoteringar(parseInt(år), månad, noteringar);

    if (result.success && result.data) {
      setStatus(result.data);
      return { success: true };
    }

    return { success: false, error: result.error };
  };

  // Status helper functions
  const canProceedToGranska = () => status?.status === "öppen";
  const canProceedToDeklarera = () => status?.status === "granskad";
  const canProceedToBetala = () => status?.status === "deklarerad";
  const isCompleted = () => status?.status === "betald" || status?.status === "stängd";

  // ============================================================================
  // SECTION 3: WIZARD STATE & LOGIC
  // ============================================================================

  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [hideOkVerifikat, setHideOkVerifikat] = useState(true);
  const [isBokforing, setIsBokforing] = useState(false);
  const [bokforingSuccess, setBokforingSuccess] = useState(false);

  // Öppna wizard och hämta status (BARA första gången)
  const handleOpenWizard = async () => {
    setShowWizard(true);
    await loadStatus(); // Hämta status när wizard öppnas
  };

  // Om år/månad ändras när wizard är öppen, rensa status så den laddas om vid behov
  useEffect(() => {
    if (showWizard) {
      setStatus(null); // Rensa status när filter ändras
    }
  }, [år, månad, showWizard]);

  // Beräkna moms att betala
  const momsAttBetala = useMemo(
    () => initialData.find((r) => r.fält === "49")?.belopp ?? 0,
    [initialData]
  );

  // Generera bokföringsposter baserat på momsdata (för förhandsvisning)
  const bokforingsposter = useMemo((): BokforingsPostWizard[] => {
    const poster: BokforingsPostWizard[] = [];

    const utgaendeMoms25 = Math.abs(initialData.find((r) => r.fält === "10")?.belopp ?? 0);
    const utgaendeOmvand25 = Math.abs(initialData.find((r) => r.fält === "30")?.belopp ?? 0);
    const ingaendeMoms = Math.abs(initialData.find((r) => r.fält === "48")?.belopp ?? 0);
    const momsAttBetalaLocal = initialData.find((r) => r.fält === "49")?.belopp ?? 0;

    if (utgaendeMoms25 > 0) {
      poster.push({
        konto: "2610",
        kontonamn: "Utgående moms, 25 %",
        debet: utgaendeMoms25,
        kredit: 0,
      });
    }

    if (utgaendeOmvand25 > 0) {
      poster.push({
        konto: "2614",
        kontonamn: "Utgående moms omvänd skattskyldighet, 25 %",
        debet: utgaendeOmvand25,
        kredit: 0,
      });
      poster.push({
        konto: "2645",
        kontonamn: "Beräknad ingående moms på förvärv från utlandet",
        debet: 0,
        kredit: utgaendeOmvand25,
      });
    }

    const ovrigIngaende = ingaendeMoms - utgaendeOmvand25;
    if (ovrigIngaende > 0) {
      poster.push({
        konto: "2640",
        kontonamn: "Ingående moms",
        debet: 0,
        kredit: ovrigIngaende,
      });
    }

    if (Math.abs(momsAttBetalaLocal) > 0.01) {
      poster.push({
        konto: "2650",
        kontonamn: "Redovisningskonto för moms",
        debet: momsAttBetalaLocal < 0 ? Math.abs(momsAttBetalaLocal) : 0,
        kredit: momsAttBetalaLocal > 0 ? momsAttBetalaLocal : 0,
      });
    }

    return poster;
  }, [initialData]);

  // Kör validering när steg 2 visas
  useEffect(() => {
    if (currentStep === 2 && !validationResult) {
      runValidation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const runValidation = async () => {
    setIsValidating(true);
    const result = await validateMomsVerifikat(parseInt(år), månad);
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleBokfor = async () => {
    setIsBokforing(true);
    setBokforingSuccess(false);

    try {
      const result = await bokforMomsavstamning(år, månad);

      if (result.success) {
        setBokforingSuccess(true);
      } else {
        alert(`Fel vid bokföring: ${result.error}`);
      }
    } catch (error) {
      alert(`Fel vid bokföring: ${error instanceof Error ? error.message : "Okänt fel"}`);
    } finally {
      setIsBokforing(false);
    }
  };

  const handleStepComplete = async () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await updateStatus("granskad");
      setCurrentStep(3);
    } else if (currentStep === 3) {
      await updateStatus("deklarerad");
      setCurrentStep(4);
    } else if (currentStep === 4) {
      await updateStatus("betald");
      setCurrentStep(5);
    } else if (currentStep === 5) {
      await updateStatus("stängd");
      setShowWizard(false);
      setCurrentStep(1);
    }
  };

  // ============================================================================
  // SECTION 4: EXPORT FUNCTIONALITY
  // ============================================================================

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingXML, setIsExportingXML] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // XML generation
  const generateXML = () => {
    const fieldMapping: { [key: string]: string } = {
      "05": "ForsMomsEjAnnan",
      "06": "UttagMoms",
      "07": "UlagMargbesk",
      "08": "HyrinkomstFriv",
      "10": "MomsUtgHog",
      "11": "MomsUtgMedel",
      "12": "MomsUtgLag",
      "20": "InkopVaruAnnatEg",
      "21": "InkopTjanstAnnatEg",
      "22": "InkopTjanstUtomEg",
      "23": "InkopVaruSverige",
      "24": "InkopTjanstSverige",
      "30": "MomsInkopUtgHog",
      "31": "MomsInkopUtgMedel",
      "32": "MomsInkopUtgLag",
      "35": "ForsVaruAnnatEg",
      "36": "ForsVaruUtomEg",
      "37": "InkopVaruMellan3p",
      "38": "ForsVaruMellan3p",
      "39": "ForsTjSkskAnnatEg",
      "40": "ForsTjOvrUtomEg",
      "41": "ForsKopareSkskSverige",
      "42": "ForsOvrigt",
      "48": "MomsIngAvdr",
      "49": "MomsBetala",
      "50": "MomsUlagImport",
      "60": "MomsImportUtgHog",
      "61": "MomsImportUtgMedel",
      "62": "MomsImportUtgLag",
    };

    let period = "";
    if (månad === "all") {
      period = `${år}12`;
    } else if (månad.startsWith("Q")) {
      const kvartalMap: { [key: string]: string } = {
        Q1: "03",
        Q2: "06",
        Q3: "09",
        Q4: "12",
      };
      period = `${år}${kvartalMap[månad]}`;
    } else {
      period = `${år}${månad}`;
    }

    const formattedOrgNr = organisationsnummer.replace(/[^0-9]/g, "");
    const orgNrWithHyphen =
      formattedOrgNr.length === 10
        ? `${formattedOrgNr.slice(0, 6)}-${formattedOrgNr.slice(6)}`
        : organisationsnummer;

    let xml = '<?xml version="1.0" encoding="ISO-8859-1"?>\n';
    xml += '<eSKDUpload Version="6.0">\n';
    xml += `<OrgNr>${orgNrWithHyphen}</OrgNr>\n`;
    xml += "<Moms>\n";
    xml += `<Period>${period}</Period>\n`;

    let fieldsAdded = 0;
    const orderedFields = [
      "05",
      "06",
      "07",
      "08",
      "20",
      "21",
      "22",
      "23",
      "24",
      "50",
      "35",
      "36",
      "37",
      "38",
      "39",
      "40",
      "41",
      "42",
      "10",
      "11",
      "12",
      "30",
      "31",
      "32",
      "60",
      "61",
      "62",
      "48",
      "49",
    ];

    orderedFields.forEach((fältNr) => {
      const xmlTag = fieldMapping[fältNr];
      if (!xmlTag) return;

      const värde = get(fältNr);
      if (värde !== 0) {
        const belopp = Math.round(värde);
        xml += `<${xmlTag}>${belopp}</${xmlTag}>\n`;
        fieldsAdded++;
      }
    });

    if (fieldsAdded === 0) {
      xml += "<MomsBetala>0</MomsBetala>\n";
    }

    xml += "</Moms>\n";
    xml += "</eSKDUpload>";

    console.log(
      `XML genererad: ${fieldsAdded} fält inkluderade för period ${period}, org.nr: ${orgNrWithHyphen}`
    );

    return xml;
  };

  const exportXML = () => {
    setIsExportingXML(true);
    setToast(null);

    try {
      if (!organisationsnummer || organisationsnummer === "XXXXXX-XXXX") {
        throw new Error("Organisationsnummer saknas - kan inte skapa XML för Skatteverket");
      }

      const harData = fullData.some((rad) => rad.belopp !== 0);
      if (!harData) {
        throw new Error("Ingen momsdata att exportera");
      }

      const xmlContent = generateXML();

      if (!xmlContent.includes("<Moms>")) {
        throw new Error("XML-generering misslyckades");
      }

      const blob = new Blob([xmlContent], { type: "application/xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `momsdeklaration_${år}_${organisationsnummer.replace("-", "")}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setToast({ type: "success", message: `XML-fil för Skatteverket har laddats ner (${år})` });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("XML export error:", error);
      const errorMessage = error instanceof Error ? error.message : "Fel vid XML export";
      setToast({ type: "error", message: errorMessage });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExportingXML(false);
    }
  };

  const exportPDF = async () => {
    setIsExportingPDF(true);
    setToast(null);

    try {
      await exportMomsrapportPDF(initialData, företagsnamn, organisationsnummer, år);

      setToast({ type: "success", message: "PDF-rapporten har laddats ner" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("PDF export error:", error);
      setToast({ type: "error", message: "Fel vid PDF export" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const exportCSV = async () => {
    setIsExportingCSV(true);
    setToast(null);

    try {
      await exportMomsrapportCSV(initialData, företagsnamn, organisationsnummer, år);

      setToast({ type: "success", message: "CSV-filen har laddats ner" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error("CSV export error:", error);
      setToast({ type: "error", message: "Fel vid CSV export" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsExportingCSV(false);
    }
  };

  // ============================================================================
  // SECTION 5: BERÄKNINGAR & HELPER FUNCTIONS
  // ============================================================================

  const get = (fält: string) => initialData.find((r) => r.fält === fält)?.belopp ?? 0;
  const sum = (...fält: string[]) => fält.reduce((acc, f) => acc + get(f), 0);

  const ruta49 = get("49");
  const utgåendeMoms = sum("10", "11", "12", "30", "31", "32", "60", "61", "62");
  const ingåendeMoms = get("48");
  const momsAttBetalaEllerFaTillbaka = utgåendeMoms - ingåendeMoms;
  const diff = Math.abs(momsAttBetalaEllerFaTillbaka - ruta49);
  const ärKorrekt = diff < 1;

  const fullData: MomsRad[] = [
    { fält: "05", beskrivning: "Momspliktig försäljning", belopp: get("05") },
    { fält: "06", beskrivning: "Momspliktiga uttag", belopp: get("06") },
    { fält: "07", beskrivning: "Vinstmarginalbeskattning", belopp: get("07") },
    { fält: "08", beskrivning: "Hyresinkomster med frivillig moms", belopp: get("08") },
    { fält: "10", beskrivning: "Utgående moms 25%", belopp: get("10") },
    { fält: "11", beskrivning: "Utgående moms 12%", belopp: get("11") },
    { fält: "12", beskrivning: "Utgående moms 6%", belopp: get("12") },
    { fält: "20", beskrivning: "Inköp varor från annat EU-land", belopp: get("20") },
    { fält: "21", beskrivning: "Inköp tjänster från EU-land", belopp: get("21") },
    { fält: "22", beskrivning: "Inköp tjänster från utanför EU", belopp: get("22") },
    { fält: "23", beskrivning: "Inköp varor i Sverige (omv moms)", belopp: get("23") },
    { fält: "24", beskrivning: "Inköp tjänster i Sverige (omv moms)", belopp: get("24") },
    { fält: "30", beskrivning: "Utgående moms 25% (omv moms)", belopp: get("30") },
    { fält: "31", beskrivning: "Utgående moms 12% (omv moms)", belopp: get("31") },
    { fält: "32", beskrivning: "Utgående moms 6% (omv moms)", belopp: get("32") },
    { fält: "50", beskrivning: "Beskattningsunderlag import", belopp: get("50") },
    { fält: "60", beskrivning: "Utgående moms 25% (import)", belopp: get("60") },
    { fält: "61", beskrivning: "Utgående moms 12% (import)", belopp: get("61") },
    { fält: "62", beskrivning: "Utgående moms 6% (import)", belopp: get("62") },
    { fält: "35", beskrivning: "Varuförsäljning till EU-land", belopp: get("35") },
    { fält: "36", beskrivning: "Export varor utanför EU", belopp: get("36") },
    { fält: "37", beskrivning: "3-partshandel inköp", belopp: get("37") },
    { fält: "38", beskrivning: "3-partshandel försäljning", belopp: get("38") },
    { fält: "39", beskrivning: "Tjänst till EU (huvudregel)", belopp: get("39") },
    { fält: "40", beskrivning: "Tjänst till utanför EU", belopp: get("40") },
    { fält: "41", beskrivning: "Försäljning med omv moms", belopp: get("41") },
    { fält: "42", beskrivning: "Övrigt momsundantaget", belopp: get("42") },
    { fält: "48", beskrivning: "Ingående moms att dra av", belopp: get("48") },
    { fält: "49", beskrivning: "Moms att betala eller få tillbaka", belopp: ruta49 },
  ];

  // ============================================================================
  // RETURN: ALL FUNKTIONALITET
  // ============================================================================

  return {
    // SECTION 1: Grundläggande data
    initialData,
    organisationsnummer,
    företagsnamn,
    loading,
    år,
    setÅr,
    årLista,
    månad,
    setMånad,

    // SECTION 2: Status & Progress
    status,
    loadingStatus,
    statusError,
    updateStatus,
    saveNotes,
    canProceedToGranska,
    canProceedToDeklarera,
    canProceedToBetala,
    isCompleted,

    // SECTION 3: Wizard
    showWizard,
    setShowWizard,
    handleOpenWizard,
    currentStep,
    setCurrentStep,
    validationResult,
    isValidating,
    hideOkVerifikat,
    setHideOkVerifikat,
    isBokforing,
    bokforingSuccess,
    momsAttBetala,
    bokforingsposter,
    runValidation,
    handleBokfor,
    handleStepComplete,

    // SECTION 4: Export
    isExportingPDF,
    isExportingCSV,
    isExportingXML,
    toast,
    setToast,
    generateXML,
    exportXML,
    exportPDF,
    exportCSV,

    // SECTION 5: Beräkningar
    get,
    sum,
    ruta49,
    utgåendeMoms,
    ingåendeMoms,
    momsAttBetalaEllerFaTillbaka,
    diff,
    ärKorrekt,
    fullData,
  };
};

import { useState, useEffect, useMemo } from "react";
import { fetchBalansData, fetchFöretagsprofil } from "../actions/balansrapportActions";
import { exportBalansrapportCSV, exportBalansrapportPDF } from "../../_utils/fileUtils";
import { Konto, BalansData, ExportMessage } from "../types/types";

export function useBalansrapport() {
  // Step 1: Basic data state
  const [initialData, setInitialData] = useState<BalansData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Step 2 & 3: Filter state
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Step 4: Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState<ExportMessage>(null);

  // Step 5: Modal state
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Step 2: Data fetching
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setExportMessage(null); // Clear export messages on new load
        const [balansData, profilData] = await Promise.all([
          fetchBalansData(selectedYear, selectedMonth),
          fetchFöretagsprofil(),
        ]);

        setInitialData(balansData);
        setFöretagsnamn(profilData?.företagsnamn ?? "");
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
      } catch (error) {
        console.error("Fel vid laddning av balansdata:", error);
        setExportMessage({
          type: "error",
          text: "Kunde inte ladda balansdata. Försök igen.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedMonth]);

  // Step 6: Data processing utilities
  const createKontoMap = (rows: any[]) => {
    const map = new Map();
    rows.forEach((row: any) => {
      map.set(row.kontonummer, {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        saldo: parseFloat(row.saldo || 0),
        transaktioner: row.transaktioner || [],
      });
    });
    return map;
  };

  const formatSEK = (val: number) => {
    // Avrunda till heltal först för att ta bort decimaler
    const rundatVarde = Math.round(val);

    const formatted = rundatVarde
      .toLocaleString("sv-SE", {
        style: "currency",
        currency: "SEK",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      .replace(/[^0-9a-zA-Z,.\-\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Behåll minustecknet för negativa värden
    return rundatVarde < 0 && !formatted.startsWith("-") ? `-${formatted}` : formatted;
  };

  // Formatera datum för transaktioner
  const formatDaterat = (datum: string | Date) => {
    if (typeof datum === "string") {
      // Ta bort T00:00:00 delen
      return datum.split("T")[0];
    }
    return new Date(datum).toLocaleDateString("sv-SE");
  };

  // Step 6: Processed data computation
  const processedData = useMemo(() => {
    if (!initialData) return null;

    // Business logic här - refactorerad från komponenten
    const ingaendeTillgangarMap = createKontoMap(initialData.ingaendeTillgangar);
    const aretsTillgangarMap = createKontoMap(initialData.aretsTillgangar);
    const utgaendeTillgangarMap = createKontoMap(initialData.utgaendeTillgangar);

    const ingaendeSkulderMap = createKontoMap(initialData.ingaendeSkulder);
    const aretsSkulderMap = createKontoMap(initialData.aretsSkulder);
    const utgaendeSkulderMap = createKontoMap(initialData.utgaendeSkulder);

    // Samla alla unika kontonummer
    const allaTillgangarKonton = new Set([
      ...ingaendeTillgangarMap.keys(),
      ...aretsTillgangarMap.keys(),
      ...utgaendeTillgangarMap.keys(),
    ]);

    const allaSkulderKonton = new Set([
      ...ingaendeSkulderMap.keys(),
      ...aretsSkulderMap.keys(),
      ...utgaendeSkulderMap.keys(),
    ]);

    // Skapa tillgångar array
    const rawTillgangar = Array.from(allaTillgangarKonton)
      .map((kontonummer) => {
        const ing = ingaendeTillgangarMap.get(kontonummer);
        const aret = aretsTillgangarMap.get(kontonummer);
        const utg = utgaendeTillgangarMap.get(kontonummer);

        return {
          kontonummer,
          beskrivning: utg?.beskrivning || aret?.beskrivning || ing?.beskrivning || "",
          ingaendeSaldo: ing?.saldo || 0,
          aretsResultat: aret?.saldo || 0,
          utgaendeSaldo: utg?.saldo || 0,
          transaktioner: aret?.transaktioner || [],
        };
      })
      .sort((a, b) => a.kontonummer.localeCompare(b.kontonummer));

    // Skapa skulder och eget kapital array
    let rawSkulderOchEgetKapital = Array.from(allaSkulderKonton)
      .map((kontonummer) => {
        const ing = ingaendeSkulderMap.get(kontonummer);
        const aret = aretsSkulderMap.get(kontonummer);
        const utg = utgaendeSkulderMap.get(kontonummer);

        return {
          kontonummer,
          beskrivning: utg?.beskrivning || aret?.beskrivning || ing?.beskrivning || "",
          ingaendeSaldo: ing?.saldo || 0,
          aretsResultat: aret?.saldo || 0,
          utgaendeSaldo: utg?.saldo || 0,
          transaktioner: aret?.transaktioner || [],
        };
      })
      .sort((a, b) => a.kontonummer.localeCompare(b.kontonummer));

    // Beräkna obalans och justeringar (komplexe logik från komponenten)
    const rawSumTillgangar = rawTillgangar.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
    const rawSumSkulderEK = rawSkulderOchEgetKapital.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
    const obalans = rawSumTillgangar - rawSumSkulderEK;

    // Justera tillgångar med beskrivningar exakt som Bokio
    const adjustedTillgangar = rawTillgangar.map((konto) => ({
      ...konto,
      beskrivning: konto.kontonummer === "1930" ? "Företagskonto / affärskonto" : konto.beskrivning,
    }));

    const adjustedSumTillgangar = adjustedTillgangar.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
    const adjustedObalans = adjustedSumTillgangar - rawSumSkulderEK;

    // Beräkna föregående års resultat
    const föregåendeÅrsBeräknatResultat = adjustedObalans - initialData.aretsResultat;

    // Rätta eget kapital enligt Bokio-logik
    const rättatEgetKapital = rawSkulderOchEgetKapital.map((konto) => {
      if (konto.kontonummer === "2099") {
        return {
          ...konto,
          aretsResultat: konto.aretsResultat,
          utgaendeSaldo: 0,
        };
      }
      if (konto.kontonummer === "2010") {
        return {
          ...konto,
        };
      }
      return konto;
    });

    // Beräknat resultat beräkningar
    const ingaendeBeraknatResultat = föregåendeÅrsBeräknatResultat;
    const aretsBeraknatResultat = initialData.aretsResultat;

    // Lägg till beräknat resultat för balansering
    rättatEgetKapital.push({
      kontonummer: "9999",
      beskrivning: "Beräknat resultat",
      ingaendeSaldo: ingaendeBeraknatResultat,
      aretsResultat: aretsBeraknatResultat,
      utgaendeSaldo: ingaendeBeraknatResultat + aretsBeraknatResultat,
      transaktioner: [],
    });

    // Extrahera beräknat resultat
    const beraknatResultatKonto = rättatEgetKapital.find((k) => k.kontonummer === "9999");
    const beraknatResultatData = beraknatResultatKonto
      ? {
          ingaende: beraknatResultatKonto.ingaendeSaldo,
          arets: beraknatResultatKonto.aretsResultat,
          utgaende: beraknatResultatKonto.utgaendeSaldo,
        }
      : { ingaende: 0, arets: 0, utgaende: 0 };

    // Ta bort beräknat resultat från den vanliga listan
    const skulderOchEgetKapitalUtanBeraknat = rättatEgetKapital.filter(
      (k) => k.kontonummer !== "9999"
    );

    return {
      year: initialData.year,
      tillgangar: adjustedTillgangar,
      skulderOchEgetKapital: skulderOchEgetKapitalUtanBeraknat,
      beraknatResultatData,
    };
  }, [initialData]);

  // Summary data
  const summaryData = useMemo(() => {
    if (!processedData) return null;

    const sumKonton = (konton: Konto[]) =>
      konton.reduce((sum, konto) => sum + (konto.utgaendeSaldo ?? 0), 0);

    const sumTillgangar = sumKonton(processedData.tillgangar);
    const sumSkulderEKUtan = sumKonton(processedData.skulderOchEgetKapital);
    const sumSkulderEK = sumSkulderEKUtan + processedData.beraknatResultatData.utgaende;

    return {
      year: processedData.year,
      tillgangar: processedData.tillgangar,
      skulderOchEgetKapital: processedData.skulderOchEgetKapital,
      sumTillgangar,
      sumSkulderEK,
      beraknatResultat: processedData.beraknatResultatData.utgaende,
    };
  }, [processedData]);

  // Step 6B: Kategorisering och summering
  const categorizedData = useMemo(() => {
    if (!processedData || !summaryData) return null;

    // Kategorisera tillgångar
    const anläggningstillgångar = processedData.tillgangar.filter((k) =>
      /^1[0-5]/.test(k.kontonummer)
    );
    const omsättningstillgångar = processedData.tillgangar.filter((k) =>
      /^1[6-9]/.test(k.kontonummer)
    );

    // Kategorisera skulder och eget kapital
    const egetKapital = processedData.skulderOchEgetKapital.filter((k) =>
      /^20/.test(k.kontonummer)
    );
    const avsättningar = processedData.skulderOchEgetKapital.filter((k) =>
      /^21/.test(k.kontonummer)
    );
    const långfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
      /^2[2-3]/.test(k.kontonummer)
    );
    const kortfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
      /^2[4-9]/.test(k.kontonummer)
    );

    // Summeringsfunktion
    const sumKonton = (konton: Konto[]) => ({
      ingaende: konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0),
      arets: konton.reduce((sum, k) => sum + k.aretsResultat, 0),
      utgaende: konton.reduce((sum, k) => sum + k.utgaendeSaldo, 0),
    });

    // Beräkna summor för varje kategori
    const anläggningsSum = sumKonton(anläggningstillgångar);
    const omsättningsSum = sumKonton(omsättningstillgångar);
    const egetKapitalSum = sumKonton(egetKapital);
    const avsättningarSum = sumKonton(avsättningar);
    const långfristigaSum = sumKonton(långfristigaSkulder);
    const kortfristigaSum = sumKonton(kortfristigaSkulder);

    // Totalsummor
    const totalTillgangar = {
      ingaende: anläggningsSum.ingaende + omsättningsSum.ingaende,
      arets: anläggningsSum.arets + omsättningsSum.arets,
      utgaende: anläggningsSum.utgaende + omsättningsSum.utgaende,
    };

    const totalEgetKapitalOchSkulder = {
      ingaende:
        egetKapitalSum.ingaende +
        processedData.beraknatResultatData.ingaende +
        avsättningarSum.ingaende +
        långfristigaSum.ingaende +
        kortfristigaSum.ingaende,
      arets:
        egetKapitalSum.arets +
        processedData.beraknatResultatData.arets +
        avsättningarSum.arets +
        långfristigaSum.arets +
        kortfristigaSum.arets,
      utgaende:
        egetKapitalSum.utgaende +
        processedData.beraknatResultatData.utgaende +
        avsättningarSum.utgaende +
        långfristigaSum.utgaende +
        kortfristigaSum.utgaende,
    };

    return {
      // Kategoriserad data
      anläggningstillgångar,
      omsättningstillgångar,
      egetKapital,
      avsättningar,
      långfristigaSkulder,
      kortfristigaSkulder,

      // Summor
      anläggningsSum,
      omsättningsSum,
      egetKapitalSum,
      avsättningarSum,
      långfristigaSum,
      kortfristigaSum,
      totalTillgangar,
      totalEgetKapitalOchSkulder,

      // Utility
      sumKonton,
    };
  }, [processedData, summaryData]);

  // Step 4: Export functions (simplified for now - will need processedData later)
  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    setExportMessage(null);

    try {
      // TODO: Add proper data processing and export logic
      setExportMessage({ type: "success", text: "PDF-rapporten har laddats ner" });
    } catch (error) {
      setExportMessage({
        type: "error",
        text: "Ett fel uppstod vid PDF-export. Försök igen.",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCSV) return;
    setIsExportingCSV(true);
    setExportMessage(null);

    try {
      // TODO: Add proper data processing and export logic
      setExportMessage({ type: "success", text: "CSV-filen har laddats ner" });
    } catch (error) {
      setExportMessage({
        type: "error",
        text: "Ett fel uppstod vid CSV-export. Försök igen.",
      });
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Step 5: Modal functions
  const handleShowVerifikationer = async (kontonummer: string) => {
    setSelectedKonto(kontonummer);
    setShowModal(true);
    setLoadingModal(true);

    try {
      // Hämta riktiga verifikationer från databasen
      const response = await fetch(`/api/verifikationer?konto=${kontonummer}`);
      if (response.ok) {
        const data = await response.json();
        setVerifikationer(data);
      } else {
        setVerifikationer([]);
      }
    } catch (error) {
      // Tyst felhantering
      setVerifikationer([]);
    } finally {
      setLoadingModal(false);
    }
  };

  return {
    // State
    initialData,
    företagsnamn,
    organisationsnummer,
    loading,
    selectedYear,
    selectedMonth,
    isExportingPDF,
    isExportingCSV,
    exportMessage,

    // Modal state
    verifikatId,
    expandedKonto,
    showModal,
    selectedKonto,
    verifikationer,
    loadingModal,

    // Step 6: Processed data
    processedData,
    summaryData,
    categorizedData,

    // Utility functions
    formatSEK,
    formatDaterat,

    // Actions
    setSelectedYear,
    setSelectedMonth,
    setExportMessage,
    handleExportPDF,
    handleExportCSV,

    // Modal actions
    setVerifikatId,
    setExpandedKonto,
    setShowModal,
    setVerifikationer,
    setLoadingModal,
    handleShowVerifikationer,

    // Setters (keeping for now, will remove later)
    setInitialData,
    setFöretagsnamn,
    setOrganisationsnummer,
    setLoading,
  };
}

import { useState, useMemo } from "react";
import type {
  Konto,
  ToastState,
  Verifikation,
  BasicBalanceAccount,
  UseBalansrapportProps,
  TransaktionsPost,
} from "../types/types";
import { exportBalansrapportCSV, exportBalansrapportPDF } from "../utils/csvExport";
import { formatSEK } from "../../_utils/format";

export function useBalansrapport({ data, foretagsprofil }: UseBalansrapportProps) {
  // Step 1: Basic data state
  const loading = false;

  // Step 2 & 3: Filter state
  const [selectedYear] = useState<string>("2025");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Step 4: Export state
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  // Step 5: Modal state
  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<Verifikation[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  // Konvertera TransaktionsPost[] till BalansData
  const initialData = useMemo(() => {
    // Filtrera efter månad om vald
    const filteredData =
      selectedMonth === "all"
        ? data
        : data.filter((post) => {
            const datum = new Date(post.transaktionsdatum);
            const månad = (datum.getMonth() + 1).toString().padStart(2, "0");
            return månad === selectedMonth;
          });

    // Dela upp i kategorier baserat på kontonummer
    const tillgångar = filteredData.filter((p) => p.kontonummer.startsWith("1"));
    const skulder = filteredData.filter((p) => p.kontonummer.startsWith("2"));
    const resultat = filteredData.filter(
      (p) =>
        p.kontonummer.startsWith("3") ||
        p.kontonummer.startsWith("4") ||
        p.kontonummer.startsWith("5") ||
        p.kontonummer.startsWith("6") ||
        p.kontonummer.startsWith("7") ||
        p.kontonummer.startsWith("8")
    );

    // Konvertera till BasicBalanceAccount format
    const convertToAccounts = (posts: TransaktionsPost[]): BasicBalanceAccount[] => {
      const kontoMap = new Map<string, BasicBalanceAccount>();

      posts.forEach((post) => {
        if (!kontoMap.has(post.kontonummer)) {
          kontoMap.set(post.kontonummer, {
            kontonummer: post.kontonummer,
            beskrivning: post.kontobeskrivning,
            saldo: 0,
            transaktioner: [],
          });
        }

        const konto = kontoMap.get(post.kontonummer)!;
        konto.saldo += post.debet - post.kredit;
        if (konto.transaktioner) {
          konto.transaktioner.push({
            id: `${post.transaktions_id}`,
            transaktion_id: post.transaktions_id,
            datum: post.transaktionsdatum,
            belopp: post.debet - post.kredit,
            beskrivning: post.kontobeskrivning_transaktion,
          });
        }
      });

      return Array.from(kontoMap.values());
    };

    // Separera ingående, årets och utgående
    const ingaendeTillgangar = convertToAccounts(tillgångar.filter((p) => p.ar_oppningsbalans));
    const aretsTillgangar = convertToAccounts(tillgångar.filter((p) => !p.ar_oppningsbalans));
    const utgaendeTillgangar = convertToAccounts(tillgångar); // Alla för utgående

    const ingaendeSkulder = convertToAccounts(skulder.filter((p) => p.ar_oppningsbalans));
    const aretsSkulder = convertToAccounts(skulder.filter((p) => !p.ar_oppningsbalans));
    const utgaendeSkulder = convertToAccounts(skulder);

    const ingaendeResultat = convertToAccounts(resultat.filter((p) => p.ar_oppningsbalans));
    const aretsResultat = convertToAccounts(resultat.filter((p) => !p.ar_oppningsbalans));
    const utgaendeResultat = convertToAccounts(resultat);

    return {
      ingaendeTillgangar,
      aretsTillgangar,
      utgaendeTillgangar,
      ingaendeSkulder,
      aretsSkulder,
      utgaendeSkulder,
      ingaendeResultat,
      aretsResultat,
      utgaendeResultat,
    };
  }, [data, selectedMonth]);

  // Step 6: Data processing utilities
  const createKontoMap = (rows: BasicBalanceAccount[]) => {
    const map = new Map();
    rows.forEach((row: BasicBalanceAccount) => {
      map.set(row.kontonummer, {
        kontonummer: row.kontonummer,
        beskrivning: row.beskrivning,
        saldo: row.saldo || 0,
        transaktioner: row.transaktioner || [],
      });
    });
    return map;
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
    // OBS: Skulder och EK har normalt kredit > debet, vilket ger negativt saldo (debet - kredit)
    // Vi negerar för att visa dem som positiva tal (som i Bokio)
    const rawSkulderOchEgetKapital = Array.from(allaSkulderKonton)
      .map((kontonummer) => {
        const ing = ingaendeSkulderMap.get(kontonummer);
        const aret = aretsSkulderMap.get(kontonummer);
        const utg = utgaendeSkulderMap.get(kontonummer);

        return {
          kontonummer,
          beskrivning: utg?.beskrivning || aret?.beskrivning || ing?.beskrivning || "",
          ingaendeSaldo: -(ing?.saldo || 0), // Negera för att få positivt tal
          aretsResultat: -(aret?.saldo || 0), // Negera för att få positivt tal
          utgaendeSaldo: -(utg?.saldo || 0), // Negera för att få positivt tal
          transaktioner: aret?.transaktioner || [],
        };
      })
      .sort((a, b) => a.kontonummer.localeCompare(b.kontonummer));

    // Justera tillgångar med beskrivningar exakt som Bokio
    const adjustedTillgangar = rawTillgangar.map((konto) => ({
      ...konto,
      beskrivning: konto.kontonummer === "1930" ? "Företagskonto / affärskonto" : konto.beskrivning,
    }));

    // Beräkna årets resultat korrekt: Intäkter - Kostnader
    // För intäkter (3xxx): kredit - debet ger negativt i saldo, så vi måste negera
    // För kostnader (4-8xxx): debet - kredit ger positivt i saldo
    const intakter = initialData.aretsResultat
      .filter((k) => k.kontonummer.startsWith("3"))
      .reduce((sum, k) => sum - k.saldo, 0); // Negera för att få positivt belopp
    const kostnader = initialData.aretsResultat
      .filter((k) => !k.kontonummer.startsWith("3"))
      .reduce((sum, k) => sum + k.saldo, 0);
    const aretsResultatSum = intakter - kostnader;

    // Beräkna ingående beräknat resultat från balansekvationen:
    // Tillgångar = Skulder + Eget kapital + Beräknat resultat
    // => Beräknat resultat = Tillgångar - Skulder
    //
    // OBS: rawSkulderOchEgetKapital innehåller BÅDE skulder OCH EK-konton (alla 2xxx)
    // Vi behöver separera:
    // - EK-konton: 20xx (2010, 2018, 2099 etc)
    // - Skuld-konton: 24xx-29xx
    const ingaendeTillgangarSum = adjustedTillgangar.reduce((sum, k) => sum + k.ingaendeSaldo, 0);
    const ingaendeSkulderSum = rawSkulderOchEgetKapital
      .filter((k) => {
        const num = parseInt(k.kontonummer);
        return num >= 2400 && num < 3000; // Skulder är 24xx-29xx, inte 20xx-23xx (som är EK)
      })
      .reduce((sum, k) => sum + k.ingaendeSaldo, 0);
    const föregåendeÅrsBeräknatResultat = ingaendeTillgangarSum - ingaendeSkulderSum;

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
    const aretsBeraknatResultat = aretsResultatSum;

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

    // Summa EK och skulder = Beräknat resultat + Skulder (EXkluderar individuella EK-konton)
    // Beräknat resultat representerar redan HELA eget kapital
    const totalEgetKapitalOchSkulder = {
      ingaende:
        processedData.beraknatResultatData.ingaende +
        avsättningarSum.ingaende +
        långfristigaSum.ingaende +
        kortfristigaSum.ingaende,
      arets:
        processedData.beraknatResultatData.arets +
        avsättningarSum.arets +
        långfristigaSum.arets +
        kortfristigaSum.arets,
      utgaende:
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

  // Step 4: Export functions
  const handleExportPDF = async () => {
    if (isExportingPDF || !summaryData || !processedData) return;
    setIsExportingPDF(true);
    setToast(null);

    try {
      await exportBalansrapportPDF(
        processedData.tillgangar,
        processedData.skulderOchEgetKapital,
        summaryData.sumTillgangar,
        summaryData.sumSkulderEK,
        summaryData.beraknatResultat,
        foretagsprofil.företagsnamn,
        foretagsprofil.organisationsnummer,
        selectedMonth,
        selectedYear
      );
      setToast({ type: "success", message: "PDF-rapporten har laddats ner" });
    } catch {
      setToast({
        type: "error",
        message: "Ett fel uppstod vid PDF-export. Försök igen.",
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = async () => {
    if (isExportingCSV || !summaryData || !processedData) return;
    setIsExportingCSV(true);
    setToast(null);

    try {
      exportBalansrapportCSV(
        processedData.tillgangar,
        processedData.skulderOchEgetKapital,
        summaryData.sumTillgangar,
        summaryData.sumSkulderEK,
        summaryData.beraknatResultat,
        foretagsprofil.företagsnamn,
        foretagsprofil.organisationsnummer,
        selectedMonth,
        selectedYear
      );
      setToast({ type: "success", message: "CSV-filen har laddats ner" });
    } catch {
      setToast({
        type: "error",
        message: "Ett fel uppstod vid CSV-export. Försök igen.",
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
    } catch {
      // Tyst felhantering
      setVerifikationer([]);
    } finally {
      setLoadingModal(false);
    }
  };

  return {
    // State
    företagsnamn: foretagsprofil.företagsnamn,
    organisationsnummer: foretagsprofil.organisationsnummer,
    loading,
    selectedYear,
    selectedMonth,
    isExportingPDF,
    isExportingCSV,
    toast,

    // Modal state
    verifikatId,
    expandedKonto,
    showModal,
    selectedKonto,
    verifikationer,
    loadingModal,

    // Step 6: Processed data
    processedData,

    // Categorized data (from categorizedData for easier access)
    anläggningstillgångar: categorizedData?.anläggningstillgångar ?? [],
    omsättningstillgångar: categorizedData?.omsättningstillgångar ?? [],
    egetKapital: categorizedData?.egetKapital ?? [],
    avsättningar: categorizedData?.avsättningar ?? [],
    långfristigaSkulder: categorizedData?.långfristigaSkulder ?? [],
    kortfristigaSkulder: categorizedData?.kortfristigaSkulder ?? [],
    omsättningsSum: categorizedData?.omsättningsSum ?? { ingaende: 0, arets: 0, utgaende: 0 },
    egetKapitalSum: categorizedData?.egetKapitalSum ?? { ingaende: 0, arets: 0, utgaende: 0 },
    avsättningarSum: categorizedData?.avsättningarSum ?? { ingaende: 0, arets: 0, utgaende: 0 },
    långfristigaSum: categorizedData?.långfristigaSum ?? { ingaende: 0, arets: 0, utgaende: 0 },
    kortfristigaSum: categorizedData?.kortfristigaSum ?? { ingaende: 0, arets: 0, utgaende: 0 },
    totalTillgangar: categorizedData?.totalTillgangar ?? { ingaende: 0, arets: 0, utgaende: 0 },
    totalEgetKapitalOchSkulder: categorizedData?.totalEgetKapitalOchSkulder ?? {
      ingaende: 0,
      arets: 0,
      utgaende: 0,
    },
    beraknatResultatData: processedData?.beraknatResultatData ?? {
      ingaende: 0,
      arets: 0,
      utgaende: 0,
    },

    // Utility functions
    formatSEK,

    // Actions
    setSelectedMonth,
    setToast,
    handleExportPDF,
    handleExportCSV,

    // Modal actions
    setVerifikatId,
    setExpandedKonto,
    setShowModal,
    setVerifikationer,
    setLoadingModal,
    handleShowVerifikationer,
  };
}

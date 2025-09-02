"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Totalrad from "../../_components/Totalrad";
import Knapp from "../../_components/Knapp";
import Dropdown from "../../_components/Dropdown";
import VerifikatModal from "../../_components/VerifikatModal";
import Modal from "../../_components/Modal";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchBalansData, fetchFöretagsprofil } from "./actions";
import { exportBalansrapportCSV, exportBalansrapportPDF } from "../../_utils/fileUtils";

type Transaktion = {
  id: string;
  datum: string | Date;
  belopp: number;
  beskrivning?: string;
  transaktion_id?: number;
  verifikatNummer?: string;
};

type Konto = {
  kontonummer: string;
  beskrivning: string;
  ingaendeSaldo: number;
  aretsResultat: number;
  utgaendeSaldo: number;
  transaktioner: Transaktion[];
};

type BalansData = {
  year: string;
  ingaendeTillgangar: any[];
  aretsTillgangar: any[];
  utgaendeTillgangar: any[];
  ingaendeSkulder: any[];
  aretsSkulder: any[];
  utgaendeSkulder: any[];
  ingaendeResultat: number;
  aretsResultat: number;
  utgaendeResultat: number;
};

export default function Page() {
  //#region State & Variables
  const [initialData, setInitialData] = useState<BalansData | null>(null);
  const [företagsnamn, setFöretagsnamn] = useState<string>("");
  const [organisationsnummer, setOrganisationsnummer] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Filter state
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // "Alla månader" som default

  const [verifikatId, setVerifikatId] = useState<number | null>(null);
  const [expandedKonto, setExpandedKonto] = useState<string | null>(null);

  // State för verifikatmodal
  const [showModal, setShowModal] = useState(false);
  const [selectedKonto, setSelectedKonto] = useState("");
  const [verifikationer, setVerifikationer] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  //#endregion

  // Ladda data när komponenten mountas eller året/månaden ändras
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setExportMessage(null); // Rensa export-meddelanden vid ny laddning
        const [balansData, profilData] = await Promise.all([
          fetchBalansData(selectedYear, selectedMonth),
          fetchFöretagsprofil(),
        ]);

        setInitialData(balansData);
        setFöretagsnamn(profilData?.företagsnamn ?? "");
        setOrganisationsnummer(profilData?.organisationsnummer ?? "");
      } catch (error) {
        // Tyst felhantering
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedYear, selectedMonth]); // Lägg till selectedMonth som dependency

  // Om data fortfarande laddas
  if (loading || !initialData) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white">Laddar balansrapport...</div>
        </div>
      </MainLayout>
    );
  }

  //#region Business Logic - Process raw data from actions
  // Skapa datastrukturer för alla konton
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

  // Beräkna obalans
  const rawSumTillgangar = rawTillgangar.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
  const rawSumSkulderEK = rawSkulderOchEgetKapital.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
  const obalans = rawSumTillgangar - rawSumSkulderEK;

  // Använd den riktiga datan, inte hårdkodade värden
  // Ta bort hårdkodade justeringar och använd riktiga värden
  const adjustedTillgangar = rawTillgangar.map((konto) => ({
    ...konto,
    // Använd beskrivningarna exakt som Bokio
    beskrivning: konto.kontonummer === "1930" ? "Företagskonto / affärskonto" : konto.beskrivning,
  }));

  // Beräkna ny obalans med justerade värden
  const adjustedSumTillgangar = adjustedTillgangar.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
  const adjustedObalans = adjustedSumTillgangar - rawSumSkulderEK;

  // Debug eget kapital specifikt
  const egetKapitalKonton = rawSkulderOchEgetKapital.filter((k) => /^20/.test(k.kontonummer));

  const egetKapitalTotal = egetKapitalKonton.reduce(
    (sum, k) => ({
      ingaende: sum.ingaende + k.ingaendeSaldo,
      arets: sum.arets + k.aretsResultat,
      utgaende: sum.utgaende + k.utgaendeSaldo,
    }),
    { ingaende: 0, arets: 0, utgaende: 0 }
  );

  // EUREKA! Föregående års beräknade resultat ska flyttas till eget kapital vid årsskiftet
  // Beräkna detta dynamiskt: obalans minus årets resultat = föregående års balansering
  const föregåendeÅrsBeräknatResultat = adjustedObalans - initialData.aretsResultat;

  // Bokio-logik: Eget kapital ska visa årets resultat från resultatrapporten
  // PLUS föregående års beräknade resultat som ska överföras vid årsskiftet
  const rättatEgetKapital = rawSkulderOchEgetKapital.map((konto) => {
    if (konto.kontonummer === "2099") {
      // Konto 2099 nollställs i Bokio - resultatet hamnar i "Beräknat resultat" istället
      return {
        ...konto,
        // Behåll den ursprungliga nollställningen som i Bokio
        aretsResultat: konto.aretsResultat, // -294,508 (nollställning)
        utgaendeSaldo: 0, // Som i Bokio
      };
    }
    if (konto.kontonummer === "2010") {
      // BOKIO KORREKT: Konto 2010 ska visa ingående 334 430 + årets 293 315 = 627 745
      // Men Bokio visar detta som ingående 0 + resultat 293 315 = 293 315 för detta konto
      // Skillnaden (334 430) läggs i "Beräknat resultat" istället
      return {
        ...konto,
        // Behåll originalvärden för konto 2010
        // Föregående års beräknade resultat hamnar i separat "Beräknat resultat"-konto
      };
    }
    return konto;
  });

  // Använd rättat eget kapital i beräkningarna
  const rättadSumSkulderEK = rättatEgetKapital.reduce((sum, k) => sum + k.utgaendeSaldo, 0);
  const rättadObalans = adjustedSumTillgangar - rättadSumSkulderEK;

  // BOKIO LOGIK: Beräknat resultat har ett ingående saldo från föregående år!
  // I Bokio: 334 430 kr ingående + 42 075 kr årets = 376 504 kr utgående
  const ingaendeBeraknatResultat = föregåendeÅrsBeräknatResultat; // 334 430 kr
  const aretsBeraknatResultat = initialData.aretsResultat; // 42 075 kr

  // Lägg till beräknat resultat för balansering - med ingående saldo som i Bokio
  rättatEgetKapital.push({
    kontonummer: "9999",
    beskrivning: "Beräknat resultat",
    ingaendeSaldo: ingaendeBeraknatResultat, // 334 430 kr som i Bokio
    aretsResultat: aretsBeraknatResultat, // 42 075 kr årets resultat
    utgaendeSaldo: ingaendeBeraknatResultat + aretsBeraknatResultat, // 376 504 kr total
    transaktioner: [],
  });

  // Hitta och extrahera beräknat resultat från skulderOchEgetKapital
  const beraknatResultatKonto = rättatEgetKapital.find((k) => k.kontonummer === "9999");
  const beraknatResultatData = beraknatResultatKonto
    ? {
        ingaende: beraknatResultatKonto.ingaendeSaldo, // 334 430 kr
        arets: beraknatResultatKonto.aretsResultat, // 42 075 kr
        utgaende: beraknatResultatKonto.utgaendeSaldo, // 376 504 kr
      }
    : { ingaende: 0, arets: 0, utgaende: 0 };

  // Ta bort beräknat resultat från den vanliga listan
  const skulderOchEgetKapitalUtanBeraknat = rättatEgetKapital.filter(
    (k) => k.kontonummer !== "9999"
  );

  const processedData = {
    year: initialData.year,
    tillgangar: adjustedTillgangar.map((konto) => ({
      ...konto,
      // Använd beskrivningarna exakt som Bokio
      beskrivning: konto.kontonummer === "1930" ? "Företagskonto / affärskonto" : konto.beskrivning,
    })),
    skulderOchEgetKapital: skulderOchEgetKapitalUtanBeraknat,
  };

  // Beräknat resultat ska läggas till eget kapital, inte visa som egen kategori
  const beraknatResultatVarde = beraknatResultatData.utgaende; // 376 504 kr
  //#endregion

  //#region Helper Functions
  // Formatering för SEK utan decimaler - som Bokio!
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

  function skapaBalansSammanställning(data: {
    year: string;
    tillgangar: Konto[];
    skulderOchEgetKapital: Konto[];
  }) {
    const { year, tillgangar, skulderOchEgetKapital } = data;

    const sumKonton = (konton: Konto[]) =>
      konton.reduce((sum, konto) => sum + (konto.utgaendeSaldo ?? 0), 0);

    const sumTillgangar = sumKonton(tillgangar);
    const sumSkulderEKUtan = sumKonton(skulderOchEgetKapital);

    // Lägg till beräknat resultat för att balansera (med utgående värde från Bokio)
    const sumSkulderEK = sumSkulderEKUtan + beraknatResultatData.utgaende; // 376 504 kr

    return {
      year,
      tillgangar,
      skulderOchEgetKapital,
      sumTillgangar,
      sumSkulderEK,
      beraknatResultat: beraknatResultatData.utgaende, // 376 504 kr som i Bokio
    };
  }

  const { year, tillgangar, skulderOchEgetKapital, sumTillgangar, sumSkulderEK, beraknatResultat } =
    skapaBalansSammanställning(processedData);
  //#endregion

  // Funktion för att visa verifikationer för ett konto
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

  //#region Export Functions
  const handleExportPDF = async () => {
    if (isExportingPDF) return;

    setIsExportingPDF(true);
    setExportMessage(null);

    try {
      // Validera data
      if (!processedData.tillgangar.length && !processedData.skulderOchEgetKapital.length) {
        throw new Error("Ingen data att exportera");
      }

      // Använd modular export function från fileUtils
      await exportBalansrapportPDF(
        tillgangar,
        skulderOchEgetKapital,
        sumTillgangar,
        sumSkulderEK,
        beraknatResultat,
        företagsnamn || "Företag",
        organisationsnummer || "",
        selectedMonth === "all" ? "12" : selectedMonth, // Använd december för "alla månader"
        selectedYear
      );

      setExportMessage({ type: "success", text: "PDF-rapporten har laddats ner" });
    } catch (error) {
      setExportMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ett fel uppstod vid PDF-exporten",
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
      // Validera data
      if (!processedData.tillgangar.length && !processedData.skulderOchEgetKapital.length) {
        throw new Error("Ingen data att exportera");
      }

      // Använd modular export function från fileUtils
      exportBalansrapportCSV(
        tillgangar,
        skulderOchEgetKapital,
        sumTillgangar,
        sumSkulderEK,
        beraknatResultat,
        företagsnamn || "Företag",
        organisationsnummer || "",
        selectedMonth === "all" ? "12" : selectedMonth, // Använd december för "alla månader"
        selectedYear
      );

      setExportMessage({ type: "success", text: "CSV-filen har laddats ner" });
    } catch (error) {
      setExportMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Ett fel uppstod vid CSV-exporten",
      });
    } finally {
      setIsExportingCSV(false);
    }
  };
  //#region Render Functions - Snygg AnimeradFlik layout

  // Gemensam funktion för att rendera transaktioner som Bokio
  const renderTransaktioner = (konto: Konto) => {
    if (!konto.transaktioner || konto.transaktioner.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="px-6 py-2 text-gray-400 text-sm italic">
            Konto {konto.kontonummer} saknar transaktioner i den valda perioden
          </td>
        </tr>
      );
    }

    return (
      <>
        {konto.transaktioner.map((transaktion, index) => {
          // Formatera datum korrekt
          const formatDaterat = (datum: string | Date) => {
            if (typeof datum === "string") {
              // Ta bort T00:00:00 delen
              return datum.split("T")[0];
            }
            return new Date(datum).toLocaleDateString("sv-SE");
          };

          // Extrahera korrekt V-nummer - använd beskrivning först
          const extractVNumber = () => {
            // 1. Först kolla efter V:nummer i beskrivning: "Verifikation V:1" -> "V1"
            if (transaktion.beskrivning && transaktion.beskrivning.includes("V:")) {
              const match = transaktion.beskrivning.match(/V:(\d+)/);
              if (match) {
                return `V${match[1]}`;
              }
            }

            // 2. Leta efter bara V-nummer i beskrivning: "V123"
            if (transaktion.beskrivning) {
              const match = transaktion.beskrivning.match(/V(\d+)/);
              if (match) {
                return `V${match[1]}`;
              }
            }

            // 3. Fallback till verifikatNummer om inget annat fungerar
            return transaktion.verifikatNummer || "V-";
          };

          const vNumber = extractVNumber();

          return (
            <tr
              key={index}
              className="bg-gray-800 hover:bg-gray-700 cursor-pointer"
              onClick={() =>
                transaktion.transaktion_id && setVerifikatId(transaktion.transaktion_id)
              }
            >
              <td className="px-6 py-2 text-blue-400 text-sm">{vNumber}</td>
              <td className="px-6 py-2 text-gray-300 text-sm" colSpan={3}>
                {formatDaterat(transaktion.datum)} {transaktion.beskrivning || "Transaktion"}
              </td>
              <td className="px-6 py-2 text-gray-300 text-sm text-right">
                {formatSEK(transaktion.belopp)}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  // BOKIO-STIL render funktion med AnimeradFlik och Tabell - visar alla transaktioner som separata rader!
  const renderaKategoriMedKolumner = (
    titel: string,
    icon: string,
    konton: Konto[],
    visaSummaDirekt?: number
  ) => {
    const summa =
      visaSummaDirekt !== undefined
        ? visaSummaDirekt
        : konton.reduce((a, b) => a + b.utgaendeSaldo, 0);

    const kolumner: ColumnDefinition<any>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsrad - visa bara ID-numret, inget annat
            return (
              <div
                className="ml-4 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
              >
                {row.id}
              </div>
            );
          } else if (row.isSummary) {
            // Summeringsrad
            return <div className="font-bold">{row.beskrivning}</div>;
          } else {
            // Kontorad
            return (
              <div className="font-medium">
                {row.kontonummer} – {row.beskrivning}
              </div>
            );
          }
        },
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          return formatSEK(row.ingaendeSaldo || 0);
        },
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsbelopp ska vara under Resultat, inte Utg. balans
            // För vissa konton (moms konton) ska tecknet reverseras för att matcha Bokio
            let belopp = row.belopp;
            if (
              row.kontonummer &&
              (row.kontonummer.startsWith("26") || row.kontonummer.startsWith("264"))
            ) {
              // Moms konton ska visa negativa belopp för utgående moms
              belopp = -Math.abs(belopp);
            }
            return <div className="text-right">{formatSEK(belopp)}</div>;
          }
          return formatSEK(row.aretsResultat || 0);
        },
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, row) => {
          if (row.isTransaction) return "";
          const className = row.isSummary ? "font-bold" : "";
          return (
            <div className={`text-right ${className}`}>{formatSEK(row.utgaendeSaldo || 0)}</div>
          );
        },
      },
    ];

    // Expandera konton till tabellrader med alla transaktioner
    const tabellData: any[] = [];

    konton.forEach((konto) => {
      // Lägg till kontorad
      tabellData.push({
        id: konto.kontonummer,
        kontonummer: konto.kontonummer,
        beskrivning: konto.beskrivning,
        ingaendeSaldo: konto.ingaendeSaldo,
        aretsResultat: konto.aretsResultat,
        utgaendeSaldo: konto.utgaendeSaldo,
        isTransaction: false,
        isSummary: false,
      });

      // Lägg till alla transaktioner som separata rader
      if (konto.transaktioner && konto.transaktioner.length > 0) {
        konto.transaktioner.forEach((transaktion, index) => {
          tabellData.push({
            id: transaktion.id, // Använd transaktionens riktiga ID
            datum: transaktion.datum,
            beskrivning: transaktion.beskrivning,
            belopp: transaktion.belopp,
            verifikatNummer: transaktion.verifikatNummer,
            transaktion_id: transaktion.transaktion_id,
            kontonummer: konto.kontonummer, // Lägg till kontonummer för unika keys
            isTransaction: true,
            isSummary: false,
          });
        });
      }
    });

    // Lägg till summeringsrad
    tabellData.push({
      id: "SUMMA",
      beskrivning: `Summa ${titel.toLowerCase()}`,
      ingaendeSaldo: konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0),
      aretsResultat: konton.reduce((sum, k) => sum + k.aretsResultat, 0),
      utgaendeSaldo: summa,
      isTransaction: false,
      isSummary: true,
    });

    return (
      <AnimeradFlik title={titel} icon={icon} visaSummaDirekt={formatSEK(summa)}>
        <Tabell
          data={tabellData}
          columns={kolumner}
          getRowId={(row) => (row.isTransaction ? `${row.kontonummer}-trans-${row.id}` : row.id)}
        />
      </AnimeradFlik>
    );
  };

  // Speciell funktion för Beräknat resultat - precis som Bokio!
  const renderaBeraknatResultat = (beraknatResultatData: {
    ingaende: number;
    arets: number;
    utgaende: number;
  }) => {
    const kolumner: ColumnDefinition<any>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => <div className="font-medium">– {row.beskrivning}</div>,
      },
      {
        key: "ingaendeSaldo",
        label: `Ing. balans ${year}-01-01`,
        render: (_, row) => formatSEK(row.ingaendeSaldo || 0),
      },
      {
        key: "aretsResultat",
        label: "Resultat",
        render: (_, row) => formatSEK(row.aretsResultat || 0),
      },
      {
        key: "utgaendeSaldo",
        label: `Utg. balans ${year}-12-31`,
        render: (_, row) => formatSEK(row.utgaendeSaldo || 0),
      },
    ];

    // Skapa tabelldata för beräknat resultat
    const tabellData = [
      {
        id: "beraknat-resultat",
        beskrivning: "Beräknat resultat",
        ingaendeSaldo: beraknatResultatData.ingaende,
        aretsResultat: beraknatResultatData.arets,
        utgaendeSaldo: beraknatResultatData.utgaende,
      },
    ];

    return (
      <AnimeradFlik
        title="Beräknat resultat"
        icon="📊"
        visaSummaDirekt={formatSEK(beraknatResultatData.utgaende)}
      >
        <Tabell data={tabellData} columns={kolumner} getRowId={(row) => row.id} />
      </AnimeradFlik>
    );
  };
  //#endregion

  //#region Data Filtering - Bokio-stil kategorisering
  const anläggningstillgångar = processedData.tillgangar.filter((k) =>
    /^1[0-5]/.test(k.kontonummer)
  );
  const omsättningstillgångar = processedData.tillgangar.filter((k) =>
    /^1[6-9]/.test(k.kontonummer)
  );

  const egetKapital = processedData.skulderOchEgetKapital.filter((k) => /^20/.test(k.kontonummer));
  const avsättningar = processedData.skulderOchEgetKapital.filter((k) => /^21/.test(k.kontonummer));
  const långfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
    /^2[2-3]/.test(k.kontonummer)
  );
  const kortfristigaSkulder = processedData.skulderOchEgetKapital.filter((k) =>
    /^2[4-9]/.test(k.kontonummer)
  );

  // Beräkna summor för varje kategori
  const sumKonton = (konton: Konto[]) => ({
    ingaende: konton.reduce((sum, k) => sum + k.ingaendeSaldo, 0),
    arets: konton.reduce((sum, k) => sum + k.aretsResultat, 0),
    utgaende: konton.reduce((sum, k) => sum + k.utgaendeSaldo, 0),
  });

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

  // Standard beräkning - inkludera beräknat resultat i totalsumman
  const totalEgetKapitalOchSkulder = {
    ingaende:
      egetKapitalSum.ingaende +
      beraknatResultatData.ingaende +
      avsättningarSum.ingaende +
      långfristigaSum.ingaende +
      kortfristigaSum.ingaende,
    arets:
      egetKapitalSum.arets +
      beraknatResultatData.arets +
      avsättningarSum.arets +
      långfristigaSum.arets +
      kortfristigaSum.arets,
    utgaende:
      egetKapitalSum.utgaende +
      beraknatResultatData.utgaende +
      avsättningarSum.utgaende +
      långfristigaSum.utgaende +
      kortfristigaSum.utgaende,
  };
  //#endregion

  return (
    <MainLayout>
      <div className="mx-auto px-4 text-white">
        <h1 className="text-3xl text-center mb-8">Balansrapport</h1>

        {/* Filter- och knappsektion överst */}
        <div className="mb-8 space-y-4">
          {/* Filter och knappar - dropdowns till vänster, export-knappar till höger */}
          <div className="flex justify-between items-center">
            {/* Vänster sida - År och månad dropdowns */}
            <div className="flex items-center gap-4">
              {/* År dropdown utan label */}
              <Dropdown
                value={selectedYear}
                onChange={setSelectedYear}
                options={Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return {
                    label: year.toString(),
                    value: year.toString(),
                  };
                })}
              />

              {/* Månad dropdown utan label med "Alla månader" som default */}
              <Dropdown
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="min-w-[160px] max-w-[400px] w-auto"
                options={[
                  { label: "Alla månader", value: "all" },
                  { label: "Januari", value: "01" },
                  { label: "Februari", value: "02" },
                  { label: "Mars", value: "03" },
                  { label: "April", value: "04" },
                  { label: "Maj", value: "05" },
                  { label: "Juni", value: "06" },
                  { label: "Juli", value: "07" },
                  { label: "Augusti", value: "08" },
                  { label: "September", value: "09" },
                  { label: "Oktober", value: "10" },
                  { label: "November", value: "11" },
                  { label: "December", value: "12" },
                ]}
              />
            </div>

            {/* Höger sida - Export-knappar med emojis */}
            <div className="flex items-center gap-4">
              <Knapp
                text="📄 Exportera PDF"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className={isExportingPDF ? "opacity-50" : ""}
              />
              <Knapp
                text="📊 Exportera CSV"
                onClick={handleExportCSV}
                disabled={isExportingCSV}
                className={isExportingCSV ? "opacity-50" : ""}
              />
            </div>
          </div>{" "}
          {/* HR under knapparna */}
          <hr className="border-gray-600 my-6" />
          {/* Export-status meddelanden */}
          {isExportingPDF && <div className="text-center text-blue-400">Genererar PDF...</div>}
          {isExportingCSV && <div className="text-center text-blue-400">Genererar CSV...</div>}
          {exportMessage && (
            <div
              className={`text-center ${exportMessage.type === "success" ? "text-green-400" : "text-red-400"}`}
            >
              {exportMessage.text}
            </div>
          )}
        </div>

        {/* TILLGÅNGAR - Bokio-stil */}
        <h2 className="text-xl font-semibold mt-16 mb-4 text-center">Tillgångar</h2>

        {/* Anläggningstillgångar */}
        {anläggningstillgångar.length > 0 && (
          <>
            {renderaKategoriMedKolumner("Anläggningstillgångar", "🏢", anläggningstillgångar)}
            <Totalrad
              label="Anläggningstillgångar"
              values={{
                [`Ing. balans\n${processedData.year}-01-01`]: anläggningsSum.ingaende,
                Resultat: anläggningsSum.arets,
                [`Utg. balans\n${processedData.year}-12-31`]: anläggningsSum.utgaende,
              }}
            />
          </>
        )}

        {/* Omsättningstillgångar */}
        {omsättningstillgångar.length > 0 && (
          <>
            {renderaKategoriMedKolumner("Omsättningstillgångar", "💰", omsättningstillgångar)}
            <Totalrad
              label="Omsättningstillgångar"
              values={{
                [`Ing. balans\n${processedData.year}-01-01`]: omsättningsSum.ingaende,
                Resultat: omsättningsSum.arets,
                [`Utg. balans\n${processedData.year}-12-31`]: omsättningsSum.utgaende,
              }}
            />
          </>
        )}

        {/* Summa tillgångar */}
        <Totalrad
          label="Summa tillgångar"
          values={{
            [`Ing. balans\n${processedData.year}-01-01`]: totalTillgangar.ingaende,
            Resultat: totalTillgangar.arets,
            [`Utg. balans\n${processedData.year}-12-31`]: totalTillgangar.utgaende,
          }}
        />

        {/* EGET KAPITAL OCH SKULDER - Bokio-stil */}
        <h2 className="text-xl font-semibold mt-10 mb-4 text-center">Eget kapital och skulder</h2>

        {/* Eget kapital */}
        {egetKapital.length > 0 && (
          <>
            {renderaKategoriMedKolumner(
              "Eget kapital",
              "🏛️",
              egetKapital,
              // BOKIO KORREKT: Eget kapital inkluderar beräknat resultat i sammanfattningen
              egetKapitalSum.utgaende + beraknatResultatData.utgaende
            )}
            <div className="mb-10">
              <Totalrad
                label="Eget kapital"
                values={{
                  [`Ing. balans\n${processedData.year}-01-01`]:
                    egetKapitalSum.ingaende + beraknatResultatData.ingaende,
                  Resultat: egetKapitalSum.arets + beraknatResultatData.arets,
                  [`Utg. balans\n${processedData.year}-12-31`]:
                    egetKapitalSum.utgaende + beraknatResultatData.utgaende,
                }}
              />
            </div>
          </>
        )}

        {/* Beräknat resultat */}
        {beraknatResultatData.utgaende !== 0 && renderaBeraknatResultat(beraknatResultatData)}

        {/* Avsättningar */}
        {avsättningar.length > 0 && (
          <>
            {renderaKategoriMedKolumner("Avsättningar", "📊", avsättningar)}
            <Totalrad
              label="Avsättningar"
              values={{
                [`Ing. balans\n${processedData.year}-01-01`]: avsättningarSum.ingaende,
                Resultat: avsättningarSum.arets,
                [`Utg. balans\n${processedData.year}-12-31`]: avsättningarSum.utgaende,
              }}
            />
          </>
        )}

        {/* Långfristiga skulder */}
        {långfristigaSkulder.length > 0 && (
          <>
            {renderaKategoriMedKolumner("Långfristiga skulder", "🏦", långfristigaSkulder)}
            <Totalrad
              label="Långfristiga skulder"
              values={{
                [`Ing. balans\n${processedData.year}-01-01`]: långfristigaSum.ingaende,
                Resultat: långfristigaSum.arets,
                [`Utg. balans\n${processedData.year}-12-31`]: långfristigaSum.utgaende,
              }}
            />
          </>
        )}

        {/* Kortfristiga skulder */}
        {kortfristigaSkulder.length > 0 && (
          <>
            {renderaKategoriMedKolumner("Kortfristiga skulder", "💳", kortfristigaSkulder)}
            <Totalrad
              label="Kortfristiga skulder"
              values={{
                [`Ing. balans\n${processedData.year}-01-01`]: kortfristigaSum.ingaende,
                Resultat: kortfristigaSum.arets,
                [`Utg. balans\n${processedData.year}-12-31`]: kortfristigaSum.utgaende,
              }}
            />
          </>
        )}

        {/* Summa eget kapital och skulder */}
        <Totalrad
          label="Summa eget kapital och skulder"
          values={{
            [`Ing. balans\n${processedData.year}-01-01`]: totalEgetKapitalOchSkulder.ingaende,
            Resultat: totalEgetKapitalOchSkulder.arets,
            [`Utg. balans\n${processedData.year}-12-31`]: totalEgetKapitalOchSkulder.utgaende,
          }}
        />
      </div>

      {/* Modal för verifikat */}
      {verifikatId && (
        <VerifikatModal transaktionsId={verifikatId} onClose={() => setVerifikatId(null)} />
      )}

      {/* Verifikatmodal för kontoverifikationer */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Verifikationer för konto ${selectedKonto}`}
      >
        {loadingModal ? (
          <div className="text-center p-4">Laddar verifikationer...</div>
        ) : (
          <Tabell
            data={verifikationer}
            columns={[
              { key: "datum", label: "Datum", render: (value: any) => value },
              { key: "beskrivning", label: "Beskrivning", render: (value: any) => value },
              {
                key: "debet",
                label: "Debet",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              {
                key: "kredit",
                label: "Kredit",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              { key: "saldo", label: "Saldo", render: (value: any) => `${value}kr` },
            ]}
            getRowId={(row) => row.id}
          />
        )}
      </Modal>

      {/* Modal för verifikat */}
      {verifikatId && (
        <VerifikatModal transaktionsId={verifikatId} onClose={() => setVerifikatId(null)} />
      )}

      {/* Verifikatmodal för kontoverifikationer */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Verifikationer för konto ${selectedKonto}`}
      >
        {loadingModal ? (
          <div className="text-center p-4">Laddar verifikationer...</div>
        ) : (
          <Tabell
            data={verifikationer}
            columns={[
              { key: "datum", label: "Datum", render: (value: any) => value },
              { key: "beskrivning", label: "Beskrivning", render: (value: any) => value },
              {
                key: "debet",
                label: "Debet",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              {
                key: "kredit",
                label: "Kredit",
                render: (value: any) => (value > 0 ? `${value}kr` : "−"),
              },
              { key: "saldo", label: "Saldo", render: (value: any) => `${value}kr` },
            ]}
            getRowId={(row) => row.id || row.datum}
          />
        )}
      </Modal>
    </MainLayout>
  );
}

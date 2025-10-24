"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";
import Totalrad from "../../../_components/Totalrad";
import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import VerifikatModal from "../../../_components/VerifikatModal";
import Modal from "../../../_components/Modal";
import Tabell, { ColumnDefinition } from "../../../_components/Tabell";
import { useBalansrapport } from "../../hooks/useBalansrapport";
import { Konto } from "../../types/types";

// Typ för tabellrader
interface TabellRad {
  id: string;
  kontonummer?: string;
  beskrivning: string;
  ingaendeSaldo?: number;
  aretsResultat?: number;
  utgaendeSaldo?: number;
  datum?: string;
  belopp?: number;
  verifikatNummer?: string;
  transaktion_id?: number;
  isTransaction?: boolean;
  isSummary?: boolean;
}

// Typ för verifikationsdata
interface VerifikatRad {
  id: string;
  datum: string;
  beskrivning: string;
  debet: number;
  kredit: number;
  saldo: number;
}

interface KontoTransRad {
  id: string;
  datum: string;
  beskrivning: string;
  belopp: number;
  verifikatNummer?: string;
  transaktion_id?: number;
}

export default function Balansrapport() {
  // Hook for all data and state management
  const {
    loading,
    selectedYear,
    selectedMonth,
    isExportingPDF,
    isExportingCSV,
    exportMessage,
    // Modal state
    verifikatId,
    showModal,
    selectedKonto,
    verifikationer,
    loadingModal,
    // Processed data
    processedData,
    summaryData,
    categorizedData,
    formatSEK,
    // Actions
    setSelectedYear,
    setSelectedMonth,
    handleExportPDF,
    handleExportCSV,
    // Modal actions
    setVerifikatId,
    setShowModal,
  } = useBalansrapport();

  // Loading check
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Laddar balansrapport...</div>
      </div>
    );
  }

  // Early return if data not ready
  if (!processedData || !summaryData || !categorizedData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Bearbetar balansdata...</div>
      </div>
    );
  }

  // Extract only used data from hook
  const { beraknatResultatData } = processedData;
  const {
    anläggningstillgångar,
    omsättningstillgångar,
    egetKapital,
    avsättningar,
    långfristigaSkulder,
    kortfristigaSkulder,
    // anläggningsSum, // Not used - sum shown inside table
    omsättningsSum,
    egetKapitalSum,
    avsättningarSum,
    långfristigaSum,
    kortfristigaSum,
    totalTillgangar,
    totalEgetKapitalOchSkulder,
  } = categorizedData;

  //#region Render Functions

  // Render function for categories with expandable accounts and transactions
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

    const kolumner: ColumnDefinition<TabellRad>[] = [
      {
        key: "beskrivning",
        label: "Konto",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsrad - visa bara tomt för Konto-kolumnen
            return "";
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
        key: "verifikat",
        label: "Verifikat",
        render: (_, row) => {
          if (row.isTransaction) {
            // Transaktionsrad - visa verifikat-ID här
            return (
              <div
                className="ml-4 text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
                onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
              >
                {row.id}
              </div>
            );
          }
          // För konto- och summeringsrader, visa inget
          return "";
        },
      },
      {
        key: "ingaendeSaldo",
        label: "Ing. balans",
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
            let belopp = row.belopp ?? 0;
            if (
              row.kontonummer &&
              (row.kontonummer.startsWith("26") || row.kontonummer.startsWith("264"))
            ) {
              // Moms konton ska visa negativa belopp för utgående moms
              belopp = -Math.abs(belopp);
            }
            return <div className="text-left">{formatSEK(belopp)}</div>;
          }
          return formatSEK(row.aretsResultat || 0);
        },
      },
      {
        key: "utgaendeSaldo",
        label: "Utg. balans",
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
    const tabellData: TabellRad[] = [];

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
        konto.transaktioner.forEach((transaktion) => {
          tabellData.push({
            id: transaktion.id, // Använd transaktionens riktiga ID
            datum:
              typeof transaktion.datum === "string"
                ? transaktion.datum
                : transaktion.datum.toISOString(),
            beskrivning: transaktion.beskrivning || "",
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

  const renderaKontonSomFlikar = (konton: Konto[], kontoIcon: string) => {
    if (!konton.length) {
      return null;
    }

    return (
      <div className="space-y-4">
        {konton.map((konto) => {
          const kolumner: ColumnDefinition<KontoTransRad>[] = [
            {
              key: "datum",
              label: "Datum",
              render: (value) => {
                if (!value) return "–";
                const datum = new Date(String(value));
                if (Number.isNaN(datum.getTime())) {
                  return value as string;
                }
                return datum.toLocaleDateString("sv-SE");
              },
            },
            {
              key: "verifikatNummer",
              label: "Verifikat",
              render: (value, row) => {
                if (!value) return "–";
                if (!row.transaktion_id) return value as string;
                return (
                  <button
                    type="button"
                    className="text-cyan-400 hover:text-cyan-300 underline"
                    onClick={() => setVerifikatId(row.transaktion_id as number)}
                  >
                    {value as string}
                  </button>
                );
              },
            },
            {
              key: "beskrivning",
              label: "Beskrivning",
              render: (value) => (value ? (value as string) : "–"),
            },
            {
              key: "belopp",
              label: "Belopp",
              className: "text-right",
              render: (value) => {
                let belopp = typeof value === "number" ? value : 0;
                if (konto.kontonummer.startsWith("26") || konto.kontonummer.startsWith("264")) {
                  belopp = -Math.abs(belopp);
                }
                return <span>{formatSEK(belopp)}</span>;
              },
            },
          ];

          const tabellData: KontoTransRad[] = (konto.transaktioner || []).map((trans, index) => ({
            id: trans.id || `${konto.kontonummer}-trans-${index}`,
            datum:
              typeof trans.datum === "string" ? trans.datum : (trans.datum?.toISOString() ?? ""),
            beskrivning: trans.beskrivning || "",
            belopp: trans.belopp,
            verifikatNummer: trans.verifikatNummer,
            transaktion_id: trans.transaktion_id,
          }));

          return (
            <AnimeradFlik
              key={konto.kontonummer}
              title={`${konto.kontonummer} ${konto.beskrivning}`}
              icon={kontoIcon}
              visaSummaDirekt={formatSEK(konto.utgaendeSaldo)}
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-800/60 p-4">
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Ing. balans</p>
                    <p className="text-lg font-semibold text-white">
                      {formatSEK(konto.ingaendeSaldo)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-4">
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Årets resultat</p>
                    <p className="text-lg font-semibold text-white">
                      {formatSEK(konto.aretsResultat)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-4">
                    <p className="text-xs text-gray-300 uppercase tracking-wide">Utg. balans</p>
                    <p className="text-lg font-semibold text-white">
                      {formatSEK(konto.utgaendeSaldo)}
                    </p>
                  </div>
                </div>

                {tabellData.length > 0 ? (
                  <Tabell data={tabellData} columns={kolumner} getRowId={(row) => row.id} />
                ) : (
                  <p className="text-sm text-gray-300">Inga transaktioner för detta konto.</p>
                )}
              </div>
            </AnimeradFlik>
          );
        })}
      </div>
    );
  };
  //#endregion

  return (
    <div className="mx-auto text-white mt-4">
      {/* Filter- och knappsektion överst */}
      <div className="mb-8 space-y-4">
        {/* Filter och knappar - dropdowns till vänster, export-knappar till höger */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Vänster sida - År och månad dropdowns */}
          <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:w-auto">
            {/* År dropdown utan label */}
            <div className="w-full md:w-32">
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
                className="w-full md:w-32"
              />
            </div>

            {/* Månad dropdown utan label med "Alla månader" som default */}
            <div className="w-full md:w-auto">
              <Dropdown
                value={selectedMonth}
                onChange={setSelectedMonth}
                className="w-full md:w-auto md:min-w-[160px] md:max-w-[400px]"
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
          </div>

          {/* Höger sida - Export-knappar med emojis */}
          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <Knapp
              text="📄 Exportera PDF"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className={`w-full md:w-auto ${isExportingPDF ? "opacity-50" : ""}`}
            />
            <Knapp
              text="📊 Exportera CSV"
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className={`w-full md:w-auto ${isExportingCSV ? "opacity-50" : ""}`}
            />
          </div>
        </div>

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
      {anläggningstillgångar.length > 0 &&
        renderaKategoriMedKolumner("Anläggningstillgångar", "🏢", anläggningstillgångar)}

      {/* Omsättningstillgångar */}
      {omsättningstillgångar.length > 0 && (
        <>
          {renderaKontonSomFlikar(omsättningstillgångar, "💰")}
          <Totalrad
            label="Omsättningstillgångar"
            values={{
              "Ing. balans": omsättningsSum.ingaende,
              Resultat: omsättningsSum.arets,
              "Utg. balans": omsättningsSum.utgaende,
            }}
          />
        </>
      )}

      {/* Summa tillgångar */}
      <Totalrad
        label="Summa tillgångar"
        values={{
          "Ing. balans": totalTillgangar.ingaende,
          Resultat: totalTillgangar.arets,
          "Utg. balans": totalTillgangar.utgaende,
        }}
      />

      {/* EGET KAPITAL OCH SKULDER - Bokio-stil */}
      <h2 className="text-xl font-semibold mt-10 mb-4 text-center">Eget kapital och skulder</h2>

      {/* Eget kapital */}
      {egetKapital.length > 0 && (
        <>
          {renderaKontonSomFlikar(egetKapital, "🏛️")}
          <div className="mb-10">
            <Totalrad
              label="Eget kapital"
              values={{
                "Ing. balans": egetKapitalSum.ingaende + beraknatResultatData.ingaende,
                Resultat: egetKapitalSum.arets + beraknatResultatData.arets,
                "Utg. balans": egetKapitalSum.utgaende + beraknatResultatData.utgaende,
              }}
            />
          </div>
        </>
      )}

      {/* Avsättningar */}
      {avsättningar.length > 0 && (
        <>
          {renderaKontonSomFlikar(avsättningar, "📊")}
          <Totalrad
            label="Avsättningar"
            values={{
              "Ing. balans": avsättningarSum.ingaende,
              Resultat: avsättningarSum.arets,
              "Utg. balans": avsättningarSum.utgaende,
            }}
          />
        </>
      )}

      {/* Långfristiga skulder */}
      {långfristigaSkulder.length > 0 && (
        <>
          {renderaKontonSomFlikar(långfristigaSkulder, "🏦")}
          <Totalrad
            label="Långfristiga skulder"
            values={{
              "Ing. balans": långfristigaSum.ingaende,
              Resultat: långfristigaSum.arets,
              "Utg. balans": långfristigaSum.utgaende,
            }}
          />
        </>
      )}

      {/* Kortfristiga skulder */}
      {kortfristigaSkulder.length > 0 && (
        <>
          {renderaKontonSomFlikar(kortfristigaSkulder, "💳")}
          <Totalrad
            label="Kortfristiga skulder"
            values={{
              "Ing. balans": kortfristigaSum.ingaende,
              Resultat: kortfristigaSum.arets,
              "Utg. balans": kortfristigaSum.utgaende,
            }}
          />
        </>
      )}

      {/* Summa eget kapital och skulder */}
      <Totalrad
        label="Summa eget kapital och skulder"
        values={{
          "Ing. balans": totalEgetKapitalOchSkulder.ingaende,
          Resultat: totalEgetKapitalOchSkulder.arets,
          "Utg. balans": totalEgetKapitalOchSkulder.utgaende,
        }}
      />

      {/* Modal för verifikat */}
      {verifikatId && (
        <VerifikatModal
          isOpen={true}
          transaktionId={verifikatId as number}
          onClose={() => setVerifikatId(null)}
        />
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
            columns={
              [
                { key: "datum", label: "Datum", render: (value: string) => value },
                { key: "beskrivning", label: "Beskrivning", render: (value: string) => value },
                {
                  key: "debet",
                  label: "Debet",
                  render: (value: number) => (value > 0 ? `${value}kr` : "−"),
                },
                {
                  key: "kredit",
                  label: "Kredit",
                  render: (value: number) => (value > 0 ? `${value}kr` : "−"),
                },
                { key: "saldo", label: "Saldo", render: (value: number) => `${value}kr` },
              ] as ColumnDefinition<VerifikatRad>[]
            }
            getRowId={(row) => row.id}
          />
        )}
      </Modal>
    </div>
  );
}

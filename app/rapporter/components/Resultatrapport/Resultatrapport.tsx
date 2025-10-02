"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";

import Totalrad from "../../../_components/Totalrad";
import Tabell, { ColumnDefinition } from "../../../_components/Tabell";
import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import VerifikatModal from "../../../_components/VerifikatModal";
import Modal from "../../../_components/Modal";
import { formatSEK } from "../../../_utils/format";
import { useResultatrapport } from "../../hooks/useResultatrapport";
import { KontoRad } from "../../types/types";
import { useSession } from "../../../_lib/auth-client";

type ResultatRad = {
  id: string | number;
  kontonummer: string;
  beskrivning: string;
  transaktion_id: number | null;
  verifikatNummer?: string | null;
  isKonto?: boolean;
  isTransaction?: boolean;
  isTotal?: boolean;
  isSumma?: boolean;
  forandring?: number;
  totalBelopp?: number;
  [key: string]: string | number | boolean | null | undefined;
};

export default function Resultatrapport() {
  const { data: sessionData, isPending } = useSession();

  // Använd hook för all state management
  const {
    selectedYear,
    setSelectedYear,
    initialData,
    loading,
    verifikatId,
    setVerifikatId,
    showModal,
    setShowModal,
    selectedKonto,
    verifikationer,
    loadingModal,
    isExportingPDF,
    isExportingCSV,
    exportMessage,
    data,
    years,
    currentYear,
    previousYear,
    intaktsSum,
    rorelsensSum,
    finansiellaIntakterSum,
    finansiellaKostnaderSum,
    handleExportPDF,
    handleExportCSV,
  } = useResultatrapport();

  // Session loading
  if (isPending) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Resultatrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Verifierar session...</p>
        </div>
      </div>
    );
  }

  // Session check
  if (!sessionData?.user) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Resultatrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Du behöver vara inloggad för att se denna sida.</p>
        </div>
      </div>
    );
  }

  // Data loading
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Resultatrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Laddar data...</p>
        </div>
      </div>
    );
  }

  // No data check
  if (!initialData || !data || data.ar.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 text-white">
        <h1 className="mb-6 text-3xl text-center">Resultatrapport</h1>
        <div className="flex h-40 items-center justify-center">
          <p>Ingen data tillgänglig</p>
        </div>
      </div>
    );
  }

  // Calculated values for display
  const rorelsensResultat: Record<string, number> = {};
  data.ar.forEach((year) => {
    rorelsensResultat[year] = (intaktsSum[year] ?? 0) - (rorelsensSum[year] ?? 0);
  });

  const resultatEfterFinansiella: Record<string, number> = {};
  data.ar.forEach((year) => {
    resultatEfterFinansiella[year] =
      (rorelsensResultat[year] ?? 0) +
      (finansiellaIntakterSum[year] ?? 0) -
      (finansiellaKostnaderSum[year] ?? 0);
  });

  const aretsSummare: Record<string, number> = {};
  data.ar.forEach((year) => {
    aretsSummare[year] = resultatEfterFinansiella[year] ?? 0;
  });

  // Helper function for rendering tables
  const renderTabell = (grupperingar: KontoRad[], isIntakt: boolean = false) => {
    // Safety check - return empty array if no data or invalid years
    if (
      !grupperingar ||
      !Array.isArray(grupperingar) ||
      !years ||
      years.length === 0 ||
      !currentYear ||
      !previousYear
    ) {
      return [];
    }

    return grupperingar
      .map((grupp) => {
        // Safety check for individual group
        if (!grupp || !grupp.konton || !Array.isArray(grupp.konton)) {
          return null;
        }

        // Dynamiska kolumner baserat på tillgängliga år
        const availableYears = years.filter((year) => year); // Filtrera bort undefined/null

        const kolumner: ColumnDefinition<ResultatRad>[] = [
          {
            label: "Konto",
            key: "kontonummer",
            render: (value: unknown, row: ResultatRad) => {
              if (row.isTotal) {
                return (
                  <span className="cursor-pointer text-blue-400 hover:text-blue-300 hover:underline">
                    {typeof value === "string" ? value : ""}
                  </span>
                );
              }
              if (row.isTransaction) {
                return (
                  <button
                    onClick={() => setVerifikatId(row.transaktion_id as number)}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {typeof row.verifikatNummer === "string" ? row.verifikatNummer : ""}
                  </button>
                );
              }
              // För vanliga kontorader, visa kontonumret
              return typeof value === "string" ? value : "";
            },
          },
          {
            label: "Benämning",
            key: "beskrivning",
            render: (value: unknown, row: ResultatRad) => {
              const textValue = typeof value === "string" ? value : "";
              if (row.isTotal) {
                return (
                  <button
                    onClick={() =>
                      row.transaktion_id && setVerifikatId(row.transaktion_id as number)
                    }
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {textValue}
                  </button>
                );
              }
              if (row.isTransaction) {
                return (
                  <button
                    onClick={() =>
                      row.transaktion_id && setVerifikatId(row.transaktion_id as number)
                    }
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {textValue}
                  </button>
                );
              }
              // För vanliga kontorader, visa beskrivningen
              return textValue;
            },
          },
          // Dynamiska årkolumner baserat på tillgänglig data
          ...availableYears.map((year) => ({
            label: year,
            key: year,
            render: (value: unknown) => {
              const numValue = typeof value === "number" ? value : 0;
              return formatSEK(isIntakt ? -numValue : numValue);
            },
          })),
          // Visa endast förändring om vi har minst 2 år
          ...(availableYears.length >= 2
            ? [
                {
                  label: "Förändring",
                  key: "forandring",
                  render: (_value: unknown, row: ResultatRad) => {
                    if (!row || availableYears.length < 2) {
                      return formatSEK(0);
                    }
                    const currentValue = (row[availableYears[0]] as number) || 0;
                    const previousValue = (row[availableYears[1]] as number) || 0;
                    const change = currentValue - previousValue;
                    return formatSEK(isIntakt ? -change : change);
                  },
                },
              ]
            : []),
        ];

        const tabellData: ResultatRad[] = [
          ...grupp.konton.reduce<ResultatRad[]>((acc, konto) => {
            // Skapa yearData
            const yearData = availableYears.reduce(
              (acc, year) => {
                const kontoValue = (konto as Record<string, unknown>)[year];
                acc[year] = typeof kontoValue === "number" ? kontoValue : 0;
                return acc;
              },
              {} as Record<string, number>
            );

            // Beräkna förändring om vi har minst 2 år
            const forandring =
              availableYears.length >= 2
                ? (yearData[availableYears[0]] || 0) - (yearData[availableYears[1]] || 0)
                : 0;

            const kontorRad: ResultatRad = {
              id: konto.kontonummer,
              kontonummer: String(konto.kontonummer ?? ""),
              beskrivning: konto.beskrivning,
              isKonto: true,
              transaktion_id: null,
              forandring,
              ...yearData,
            };

            // Lägg till kontoraden
            acc.push(kontorRad);

            // Lägg till transaktioner för detta konto (om de finns)
            if (konto.transaktioner && konto.transaktioner.length > 0) {
              konto.transaktioner.forEach((transaktion) => {
                const transaktionsRad: ResultatRad = {
                  id: `${konto.kontonummer}-trans-${transaktion.id}`,
                  kontonummer: "",
                  beskrivning: transaktion.beskrivning,
                  isTransaction: true,
                  transaktion_id: transaktion.transaktion_id,
                  verifikatNummer: transaktion.verifikatNummer,
                  [availableYears[0] || currentYear]: transaktion.belopp,
                  ...(availableYears[1] ? { [availableYears[1]]: 0 } : {}),
                };
                acc.push(transaktionsRad);
              });
            }

            return acc;
          }, [] as ResultatRad[]),
          // Lägg till summeringsrad
          {
            id: `${grupp.namn}-summa`,
            kontonummer: "",
            beskrivning: `Summa ${grupp.namn.toLowerCase()}`,
            isSumma: true,
            transaktion_id: null,
            forandring:
              availableYears.length >= 2
                ? (grupp.summering?.[availableYears[0]] || 0) -
                  (grupp.summering?.[availableYears[1]] || 0)
                : 0,
            ...availableYears.reduce(
              (acc, year) => {
                acc[year] = grupp.summering?.[year] || 0;
                return acc;
              },
              {} as Record<string, number>
            ),
            totalBelopp: isIntakt
              ? -(grupp.summering?.[availableYears[0]] || 0)
              : grupp.summering?.[availableYears[0]] || 0,
          },
        ];

        return (
          <AnimeradFlik key={grupp.namn} title={grupp.namn} icon="📊">
            <Tabell
              data={tabellData}
              columns={kolumner}
              getRowId={(row) =>
                row.isTransaction ? `${row.kontonummer}-trans-${String(row.id)}` : String(row.id)
              }
            />
          </AnimeradFlik>
        );
      })
      .filter(Boolean); // Filter out null values
  };

  return (
    <div className="mx-auto px-4 text-white">
      <div className="mb-6">
        <h1 className="text-3xl text-center mb-4">Resultatrapport</h1>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Dropdown
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              options={years.map((year) => ({ value: year, label: year }))}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-3">
            <Knapp
              text={isExportingPDF ? "Exporterar..." : "Exportera PDF"}
              onClick={handleExportPDF}
              disabled={isExportingPDF}
            />

            <Knapp
              text={isExportingCSV ? "Exporterar..." : "Exportera CSV"}
              onClick={handleExportCSV}
              disabled={isExportingCSV}
            />
          </div>
        </div>
      </div>

      {exportMessage && (
        <div className="mb-4 rounded bg-blue-600 p-3 text-white">{exportMessage}</div>
      )}

      <div id="resultatrapport-print-area" className="space-y-6">
        {/* Intäkter */}
        {data.intakter && data.intakter.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Rörelsens intäkter</h2>
            {renderTabell(data.intakter, true)}
            <Totalrad
              label="Summa rörelsens intäkter"
              values={{ [currentYear]: intaktsSum[currentYear] ?? 0 }}
            />
          </div>
        )}

        {/* Kostnader */}
        {data.rorelsensKostnader && data.rorelsensKostnader.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Rörelsens kostnader</h2>
            {renderTabell(data.rorelsensKostnader)}
            <Totalrad
              label="Summa rörelsens kostnader"
              values={{ [currentYear]: rorelsensSum[currentYear] ?? 0 }}
            />
          </div>
        )}

        {/* Rörelseresultat */}
        <Totalrad
          label="Rörelseresultat"
          values={{ [currentYear]: rorelsensResultat[currentYear] ?? 0 }}
        />

        {/* Finansiella intäkter */}
        {data.finansiellaIntakter && data.finansiellaIntakter.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Finansiella intäkter</h2>
            {renderTabell(data.finansiellaIntakter)}
            <Totalrad
              label="Summa finansiella intäkter"
              values={{ [currentYear]: finansiellaIntakterSum[currentYear] ?? 0 }}
            />
          </div>
        )}

        {/* Finansiella kostnader */}
        {data.finansiellaKostnader && data.finansiellaKostnader.length > 0 && (
          <div>
            <h2 className="mb-4 text-xl font-semibold">Finansiella kostnader</h2>
            {renderTabell(data.finansiellaKostnader)}
            <Totalrad
              label="Summa finansiella kostnader"
              values={{ [currentYear]: finansiellaKostnaderSum[currentYear] ?? 0 }}
            />
          </div>
        )}

        {/* Resultat efter finansiella poster */}
        <Totalrad
          label="Resultat efter finansiella poster"
          values={{ [currentYear]: resultatEfterFinansiella[currentYear] ?? 0 }}
        />

        {/* Årets resultat */}
        <Totalrad
          label="Årets resultat"
          values={{ [currentYear]: aretsSummare[currentYear] ?? 0 }}
        />

        {/* Modals */}
        {verifikatId && (
          <VerifikatModal
            isOpen={!!verifikatId}
            transaktionId={verifikatId as number}
            onClose={() => setVerifikatId(null)}
          />
        )}

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Verifikationer för konto ${selectedKonto}`}
        >
          {loadingModal ? (
            <p>Laddar verifikationer...</p>
          ) : (
            <Tabell
              data={verifikationer}
              columns={[
                { label: "Datum", key: "datum" },
                { label: "Beskrivning", key: "beskrivning" },
                {
                  label: "Belopp",
                  key: "belopp",
                  render: (value: unknown) => formatSEK(typeof value === "number" ? value : 0),
                },
              ]}
              getRowId={(row) => row.id}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}

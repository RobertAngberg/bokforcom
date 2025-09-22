"use client";

import React from "react";
import { useSession } from "next-auth/react";
import AnimeradFlik from "../../../_components/AnimeradFlik";

import Totalrad from "../../../_components/Totalrad";
import Tabell, { ColumnDefinition } from "../../../_components/Tabell";
import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import VerifikatModal from "../../../_components/VerifikatModal";
import Modal from "../../../_components/Modal";
import { formatSEK } from "../../../_utils/format";
import { useResultatrapport } from "../../hooks/useResultatrapport";
import { ResultatData, KontoRad, ResultatKonto } from "../../types/types";

export default function Resultatrapport() {
  const { data: sessionData, status: sessionStatus } = useSession();

  // Använd hook för all state management
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    initialData,
    företagsnamn,
    organisationsnummer,
    loading,
    verifikatId,
    setVerifikatId,
    showModal,
    setShowModal,
    selectedKonto,
    verifikationer,
    loadingModal,
    handleShowVerifikationer,
    isExportingPDF,
    setIsExportingPDF,
    isExportingCSV,
    setIsExportingCSV,
    exportMessage,
    setExportMessage,
    data,
    years,
    currentYear,
    previousYear,
    summering,
    intaktsSum,
    rorelsensSum,
    finansiellaIntakterSum,
    finansiellaKostnaderSum,
    formatSEKforPDF,
    handleExportPDF,
    handleExportCSV,
  } = useResultatrapport();

  // Session loading
  if (sessionStatus === "loading") {
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
    // Debug logging
    console.log("renderTabell called with:", {
      grupperingar: grupperingar?.length,
      years: years?.length,
      currentYear,
      previousYear,
      isIntakt,
    });

    // Safety check - return empty array if no data or invalid years
    if (
      !grupperingar ||
      !Array.isArray(grupperingar) ||
      !years ||
      years.length === 0 ||
      !currentYear ||
      !previousYear
    ) {
      console.log("Early return due to missing data");
      return [];
    }

    return grupperingar
      .map((grupp) => {
        // Safety check for individual group
        if (!grupp || !grupp.konton || !Array.isArray(grupp.konton)) {
          console.log("Skipping invalid group:", grupp);
          return null;
        }

        const kolumner: ColumnDefinition<any>[] = [
          {
            label: "Konto",
            key: "kontonummer",
            render: (row) => {
              if (row.isTotal) {
                return (
                  <span className="cursor-pointer text-blue-400 hover:text-blue-300 hover:underline">
                    {row.kontonummer}
                  </span>
                );
              }
              if (row.isTransaction) {
                return (
                  <button
                    onClick={() => setVerifikatId(row.transaktion_id)}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {row.verifikatNummer}
                  </button>
                );
              }
              // För konto- och summeringsrader, visa inget
              return null;
            },
          },
          {
            label: "Benämning",
            key: "beskrivning",
            render: (row) => {
              if (row.isTotal) {
                return (
                  <button
                    onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {row.beskrivning}
                  </button>
                );
              }
              if (row.isTransaction) {
                return (
                  <button
                    onClick={() => row.transaktion_id && setVerifikatId(row.transaktion_id)}
                    className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {row.beskrivning}
                  </button>
                );
              }
              return row.beskrivning;
            },
          },
          {
            label: `Ingående balans`,
            key: "ingaende_balans",
            render: () => formatSEK(0), // Resultatrapport har alltid 0 i ingående balans
          },
          {
            label: `${previousYear}`,
            key: previousYear,
            render: (row) => {
              if (!row || !previousYear) {
                console.log("Missing row or previousYear:", { row, previousYear });
                return formatSEK(0);
              }
              const value = row[previousYear] || 0;
              return formatSEK(isIntakt ? -value : value);
            },
          },
          {
            label: `${currentYear}`,
            key: currentYear,
            render: (row) => {
              if (!row || !currentYear) {
                console.log("Missing row or currentYear:", { row, currentYear });
                return formatSEK(0);
              }
              const value = row[currentYear] || 0;
              return formatSEK(isIntakt ? -value : value);
            },
          },
          {
            label: "Förändring",
            key: "forandring",
            render: (row) => {
              if (!row || !currentYear || !previousYear) {
                console.log("Missing data for change calculation:", {
                  row,
                  currentYear,
                  previousYear,
                });
                return formatSEK(0);
              }
              const currentYearValue = row[currentYear] || 0;
              const previousYearValue = row[previousYear] || 0;
              const change = currentYearValue - previousYearValue;
              return formatSEK(isIntakt ? -change : change);
            },
          },
        ];

        const tabellData = [
          ...grupp.konton.reduce((acc, konto) => {
            // Lägg till kontoraden
            acc.push({
              id: konto.kontonummer,
              kontonummer: konto.kontonummer,
              beskrivning: konto.beskrivning,
              isKonto: true,
              transaktion_id: null,
              ...years.reduce(
                (acc, year) => {
                  acc[year] = (konto as any).summering?.[year] || 0;
                  return acc;
                },
                {} as Record<string, number>
              ),
            });

            // Lägg till transaktioner för detta konto (om de finns)
            if (konto.transaktioner && konto.transaktioner.length > 0) {
              konto.transaktioner.forEach((transaktion) => {
                acc.push({
                  id: `${konto.kontonummer}-trans-${transaktion.id}`,
                  kontonummer: "",
                  beskrivning: transaktion.beskrivning,
                  isTransaction: true,
                  transaktion_id: transaktion.transaktion_id,
                  verifikatNummer: transaktion.verifikatNummer,
                  [currentYear]: transaktion.belopp,
                  [previousYear]: 0,
                });
              });
            }

            return acc;
          }, [] as any[]),
          // Lägg till summeringsrad
          {
            id: `${grupp.namn}-summa`,
            kontonummer: "",
            beskrivning: `Summa ${grupp.namn.toLowerCase()}`,
            isSumma: true,
            transaktion_id: null,
            ...years.reduce(
              (acc, year) => {
                acc[year] = grupp.summering?.[year] || 0;
                return acc;
              },
              {} as Record<string, number>
            ),
            totalBelopp: isIntakt
              ? -(grupp.summering?.[years[0]] || 0)
              : grupp.summering?.[years[0]] || 0,
          },
        ];

        return (
          <AnimeradFlik key={grupp.namn} title={grupp.namn} icon="📊">
            <Tabell
              data={tabellData}
              columns={kolumner}
              getRowId={(row) =>
                row.isTransaction ? `${row.kontonummer}-trans-${row.id}` : row.id
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

            <Dropdown
              value={selectedMonth}
              onChange={(value) => setSelectedMonth(value)}
              options={[
                { value: "all", label: "Alla månader" },
                { value: "01", label: "Januari" },
                { value: "02", label: "Februari" },
                { value: "03", label: "Mars" },
                { value: "04", label: "April" },
                { value: "05", label: "Maj" },
                { value: "06", label: "Juni" },
                { value: "07", label: "Juli" },
                { value: "08", label: "Augusti" },
                { value: "09", label: "September" },
                { value: "10", label: "Oktober" },
                { value: "11", label: "November" },
                { value: "12", label: "December" },
              ]}
              className="w-40"
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
                { label: "Belopp", key: "belopp", render: (row) => formatSEK(row.belopp) },
              ]}
              getRowId={(row) => row.id}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}

"use client";

import AnimeradFlik from "../../../_components/AnimeradFlik";

import Totalrad from "../../../_components/Totalrad";
import Tabell from "../../../_components/Tabell";
import Knapp from "../../../_components/Knapp";
import Dropdown from "../../../_components/Dropdown";
import VerifikatModal from "../../../_components/VerifikatModal";
import Modal from "../../../_components/Modal";
import { formatSEK } from "../../../_utils/format";
import { useResultatrapport } from "../../hooks/useResultatrapport";
import { KontoRad, ResultatTransaktion } from "../../types/types";
import { useSession } from "../../../_lib/auth-client";

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
    verifikatMeta,
    setVerifikatMeta,
    isExportingPDF,
    isExportingCSV,
    exportMessage,
    data,
    years,
    currentYear,
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

  const resolvedPrimaryYear = selectedYear?.trim() ? selectedYear : currentYear;
  const parsedPrimaryYear = Number.parseInt(resolvedPrimaryYear, 10);
  const numericPrimaryYear = Number.isNaN(parsedPrimaryYear)
    ? Number.parseInt(currentYear, 10)
    : parsedPrimaryYear;

  const yearsToDisplay = [
    resolvedPrimaryYear,
    (numericPrimaryYear - 1).toString(),
    (numericPrimaryYear - 2).toString(),
  ].filter((year, index, arr) => Boolean(year) && arr.indexOf(year) === index);

  const ensureValuesForYears = (values: Record<string, number | undefined>) =>
    yearsToDisplay.reduce<Record<string, number>>((acc, year) => {
      const numeric = typeof values[year] === "number" ? (values[year] as number) : 0;
      acc[year] = numeric;
      return acc;
    }, {});

  const prepareVerifikatMeta = (trans: ResultatTransaktion) => {
    const description = trans.beskrivning?.trim();
    const verifikatNummer = trans.verifikatNummer?.trim();

    const leverantorName =
      description || (verifikatNummer ? `Verifikat ${verifikatNummer}` : undefined);

    setVerifikatMeta({
      leverantor: leverantorName,
      fakturanummer: verifikatNummer,
    });
  };

  // Helper function for rendering tables
  const renderTabell = (grupperingar: KontoRad[], isIntakt: boolean = false) => {
    // Safety check - return empty array if no data or invalid years
    if (!grupperingar || !Array.isArray(grupperingar) || yearsToDisplay.length === 0) {
      return [];
    }

    const availableYears = yearsToDisplay;

    const adjustValue = (value: number) => (isIntakt ? -value : value);

    const formatValue = (value: number) => formatSEK(adjustValue(value));

    const formatTransaktionsDatum = (datum: string) => {
      if (!datum) return "–";
      const parsed = new Date(datum);
      return Number.isNaN(parsed.getTime()) ? datum : parsed.toLocaleDateString("sv-SE");
    };

    return grupperingar
      .map((grupp) => {
        if (!grupp || !Array.isArray(grupp.konton)) {
          return null;
        }

        const kontoFlikar = grupp.konton.map((konto) => {
          const yearRow = (
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-sm text-slate-200 sm:text-base">
              {availableYears.map((year) => {
                const rawValue = (konto as Record<string, unknown>)[year];
                const numericValue = typeof rawValue === "number" ? rawValue : 0;

                return (
                  <div key={`${konto.kontonummer}-${year}`} className="flex items-baseline gap-2">
                    <span className="text-slate-400">{year}</span>
                    <span className="font-semibold text-white">{formatValue(numericValue)}</span>
                  </div>
                );
              })}
            </div>
          );

          const transaktioner = konto.transaktioner ?? [];

          return (
            <AnimeradFlik
              key={konto.kontonummer}
              title={`${konto.kontonummer} ${konto.beskrivning}`}
              icon="📄"
            >
              <div className="space-y-4">
                <div className="space-y-2">{yearRow}</div>

                {transaktioner.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900/60">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-800 text-left text-slate-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Datum</th>
                          <th className="px-4 py-3 font-semibold">Verifikat</th>
                          <th className="px-4 py-3 font-semibold">Beskrivning</th>
                          <th className="px-4 py-3 text-right font-semibold">Belopp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaktioner.map((trans) => (
                          <tr key={trans.id} className="text-slate-200">
                            <td className="px-4 py-2">{formatTransaktionsDatum(trans.datum)}</td>
                            <td className="px-4 py-2">
                              {trans.verifikatNummer ? (
                                <button
                                  type="button"
                                  className="text-cyan-400 hover:text-cyan-300 underline"
                                  onClick={() => {
                                    if (trans.transaktion_id) {
                                      prepareVerifikatMeta(trans);
                                      setVerifikatId(trans.transaktion_id);
                                    }
                                  }}
                                >
                                  {trans.verifikatNummer}
                                </button>
                              ) : (
                                "–"
                              )}
                            </td>
                            <td className="px-4 py-2">{trans.beskrivning || "–"}</td>
                            <td className="px-4 py-2 text-right font-semibold text-white">
                              {formatValue(trans.belopp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-300">Inga transaktioner registrerade.</p>
                )}
              </div>
            </AnimeradFlik>
          );
        });

        return (
          <AnimeradFlik key={grupp.namn} title={grupp.namn} icon="📊">
            <div className="space-y-5">
              {kontoFlikar.length > 0 ? (
                <div className="space-y-3">{kontoFlikar}</div>
              ) : (
                <p className="text-sm text-slate-300">Inga konton i den här kategorin.</p>
              )}
            </div>
          </AnimeradFlik>
        );
      })
      .filter(Boolean);
  };

  return (
    <div className="mx-auto text-white mt-4">
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:w-auto">
            <div className="w-full md:w-24">
              <Dropdown
                value={selectedYear}
                onChange={(value) => setSelectedYear(value)}
                options={years.map((year) => ({ value: year, label: year }))}
                className="w-full md:w-24"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:gap-4">
            <Knapp
              text={isExportingPDF ? "Exporterar..." : "Exportera PDF"}
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className={`w-full md:w-auto ${isExportingPDF ? "opacity-50" : ""}`}
            />

            <Knapp
              text={isExportingCSV ? "Exporterar..." : "Exportera CSV"}
              onClick={handleExportCSV}
              disabled={isExportingCSV}
              className={`w-full md:w-auto ${isExportingCSV ? "opacity-50" : ""}`}
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
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Rörelsens intäkter</h2>
            {renderTabell(data.intakter, true)}
            <Totalrad label="Summa rörelsens intäkter" values={ensureValuesForYears(intaktsSum)} />
          </div>
        )}

        <hr />

        {/* Kostnader */}
        {data.rorelsensKostnader && data.rorelsensKostnader.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Rörelsens kostnader</h2>
            {renderTabell(data.rorelsensKostnader)}
            <Totalrad
              label="Summa rörelsens kostnader"
              values={ensureValuesForYears(rorelsensSum)}
            />
          </div>
        )}

        <hr />

        {/* Rörelseresultat */}
        <div className="mb-8">
          <Totalrad label="Rörelseresultat" values={ensureValuesForYears(rorelsensResultat)} />
        </div>

        {/* Finansiella intäkter */}
        {data.finansiellaIntakter && data.finansiellaIntakter.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Finansiella intäkter</h2>
            {renderTabell(data.finansiellaIntakter)}
            <Totalrad
              label="Summa finansiella intäkter"
              values={ensureValuesForYears(finansiellaIntakterSum)}
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
              values={ensureValuesForYears(finansiellaKostnaderSum)}
            />
          </div>
        )}

        {/* Resultat efter finansiella poster */}
        <Totalrad
          label="Resultat efter finansiella poster"
          values={ensureValuesForYears(resultatEfterFinansiella)}
        />

        {/* Årets resultat */}
        <Totalrad label="Årets resultat" values={ensureValuesForYears(aretsSummare)} />

        {/* Modals */}
        {verifikatId && (
          <VerifikatModal
            isOpen={!!verifikatId}
            transaktionId={verifikatId as number}
            leverantör={verifikatMeta?.leverantor}
            fakturanummer={verifikatMeta?.fakturanummer}
            onClose={() => {
              setVerifikatId(null);
              setVerifikatMeta(null);
            }}
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

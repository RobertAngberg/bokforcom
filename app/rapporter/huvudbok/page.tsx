"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "../../_components/MainLayout";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import Dropdown from "../../_components/Dropdown";
import VerifikatModal from "../../_components/VerifikatModal";
import { formatSEK } from "../../_utils/format";
import { fetchHuvudbokMedAllaTransaktioner, fetchFöretagsprofil } from "./actions";

type TransaktionData = {
  transaktion_id: number;
  datum: string;
  beskrivning: string;
  debet: number | null;
  kredit: number | null;
  verifikatNummer: string;
  belopp: number;
  lopande_saldo: number;
  sort_priority: number;
};

type HuvudboksKontoMedTransaktioner = {
  kontonummer: string;
  beskrivning: string;
  ingaendeBalans: number;
  utgaendeBalans: number;
  transaktioner: TransaktionData[];
};

export default function Page() {
  const [huvudboksdata, setHuvudboksdata] = useState<HuvudboksKontoMedTransaktioner[]>([]);
  const [företagsnamn, setFöretagsnamn] = useState("");
  const [organisationsnummer, setOrganisationsnummer] = useState("");
  const [loading, setLoading] = useState(true);

  // State för årval
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  // State för VerifikatModal
  const [showVerifikatModal, setShowVerifikatModal] = useState(false);
  const [selectedTransaktionsId, setSelectedTransaktionsId] = useState<number | null>(null);

  // Ladda data
  useEffect(() => {
    const loadData = async () => {
      try {
        const huvudbokResult = await fetchHuvudbokMedAllaTransaktioner();
        setHuvudboksdata(huvudbokResult);

        // Försök ladda företagsprofil (behöver userId från session)
        // För nu skippar vi detta tills vi har session management
        setFöretagsnamn("");
        setOrganisationsnummer("");
      } catch (error) {
        console.error("Fel vid laddning av huvudboksdata:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Åralternativ från 2020 till nu
  const yearOptions = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const year = 2020 + i;
    return { value: year.toString(), label: year.toString() };
  });

  // Funktion för att visa enskilt verifikat
  const handleShowVerifikat = (transaktionsId: number) => {
    console.log("🔍 Visar verifikat för transaktion:", transaktionsId);
    setSelectedTransaktionsId(transaktionsId);
    setShowVerifikatModal(true);
  };

  // Formatering för SEK med behållet minustecken
  const formatSEKLocal = (val: number): string => {
    if (val === 0) return "0kr";

    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString("sv-SE") + "kr";
    return isNegative ? `−${formatted}` : formatted;
  };

  // Kategorisera konton enligt BAS-kontoplan
  const kategoriseraKonton = (konton: HuvudboksKontoMedTransaktioner[]) => {
    const kategorier = [
      { namn: "Tillgångar", pattern: /^1/, konton: [] as HuvudboksKontoMedTransaktioner[] },
      {
        namn: "Eget kapital och skulder",
        pattern: /^2/,
        konton: [] as HuvudboksKontoMedTransaktioner[],
      },
      { namn: "Intäkter", pattern: /^3/, konton: [] as HuvudboksKontoMedTransaktioner[] },
      { namn: "Kostnader", pattern: /^[4-8]/, konton: [] as HuvudboksKontoMedTransaktioner[] },
    ];

    konton.forEach((konto) => {
      const kategori = kategorier.find((k) => k.pattern.test(konto.kontonummer));
      if (kategori) {
        kategori.konton.push(konto);
      }
    });

    return kategorier.filter((k) => k.konton.length > 0);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-white">Laddar huvudbok...</div>
        </div>
      </MainLayout>
    );
  }

  const kategoriseradeKonton = kategoriseraKonton(huvudboksdata);

  return (
    <MainLayout>
      <div className="mx-auto px-4 text-white">
        <h1 className="text-3xl text-center mb-8">Huvudbok</h1>

        {/* Årval dropdown */}
        <div className="flex justify-center mb-6">
          <div className="w-32">
            <Dropdown value={selectedYear} onChange={setSelectedYear} options={yearOptions} />
          </div>
        </div>

        <div className="space-y-6">
          {kategoriseradeKonton.map((kategori) => {
            // Beräkna totalsumma för kategorin
            const totalSumma = kategori.konton.reduce(
              (sum, konto) => sum + konto.utgaendeBalans,
              0
            );

            return (
              <AnimeradFlik
                key={kategori.namn}
                title={kategori.namn}
                icon={
                  kategori.namn === "Tillgångar"
                    ? "🏗️"
                    : kategori.namn === "Eget kapital och skulder"
                      ? "💰"
                      : kategori.namn === "Intäkter"
                        ? "💵"
                        : "💸"
                }
                visaSummaDirekt={formatSEKLocal(totalSumma)}
                forcedOpen={true}
              >
                <div className="space-y-8">
                  {kategori.konton.map((konto) => (
                    <div
                      key={konto.kontonummer}
                      className="bg-slate-700/30 rounded-lg p-6 border border-slate-600"
                    >
                      {/* Kontohuvud - exakt som Bokio */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {konto.kontonummer} {konto.beskrivning}
                          </h3>
                          <div className="text-right">
                            <div className="text-sm text-gray-300">Utgående balans</div>
                            <div className="text-xl font-bold text-white">
                              {formatSEKLocal(konto.utgaendeBalans)}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-300">
                          Ingående balans: {formatSEKLocal(konto.ingaendeBalans)}
                        </div>
                      </div>

                      {/* Transaktionstabell - som Bokio */}
                      <div className="bg-slate-800 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-700 border-b border-slate-600">
                              <th className="text-left p-3 text-sm font-semibold text-gray-200">
                                Datum
                              </th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-200">
                                Verifikat
                              </th>
                              <th className="text-left p-3 text-sm font-semibold text-gray-200">
                                Beskrivning
                              </th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-200">
                                Debet
                              </th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-200">
                                Kredit
                              </th>
                              <th className="text-right p-3 text-sm font-semibold text-gray-200">
                                Saldo
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {konto.transaktioner.map((trans, index) => (
                              <tr
                                key={trans.transaktion_id}
                                className={`border-b border-slate-700 ${
                                  index % 2 === 0 ? "bg-slate-800" : "bg-slate-750"
                                } hover:bg-slate-600 transition-colors`}
                              >
                                <td className="p-3 text-sm text-gray-300">
                                  {trans.sort_priority === 1
                                    ? ""
                                    : new Date(trans.datum).toLocaleDateString("sv-SE")}
                                </td>
                                <td className="p-3 text-sm">
                                  {trans.verifikatNummer === "Ingående balans" ? (
                                    <span className="text-blue-400 font-semibold">
                                      {trans.verifikatNummer}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleShowVerifikat(trans.transaktion_id)}
                                      className="text-cyan-400 hover:text-cyan-300 underline bg-transparent border-none cursor-pointer font-medium"
                                    >
                                      {trans.verifikatNummer}
                                    </button>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-gray-300">{trans.beskrivning}</td>
                                <td className="p-3 text-sm text-right text-white">
                                  {trans.debet ? formatSEKLocal(trans.debet) : "−"}
                                </td>
                                <td className="p-3 text-sm text-right text-white">
                                  {trans.kredit ? formatSEKLocal(trans.kredit) : "−"}
                                </td>
                                <td className="p-3 text-sm text-right font-semibold text-white">
                                  {formatSEKLocal(trans.lopande_saldo)}
                                </td>
                              </tr>
                            ))}
                            {/* Utgående balans rad */}
                            <tr className="bg-slate-600 border-t-2 border-slate-500">
                              <td className="p-3 text-sm text-gray-300"></td>
                              <td className="p-3 text-sm font-semibold text-blue-400">
                                Utgående balans
                              </td>
                              <td className="p-3 text-sm text-gray-300"></td>
                              <td className="p-3 text-sm text-right text-white">−</td>
                              <td className="p-3 text-sm text-right text-white">−</td>
                              <td className="p-3 text-sm text-right font-bold text-white">
                                {formatSEKLocal(konto.utgaendeBalans)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </AnimeradFlik>
            );
          })}
        </div>
      </div>

      {/* VerifikatModal för enskilda verifikat */}
      {showVerifikatModal && selectedTransaktionsId && (
        <VerifikatModal
          transaktionsId={selectedTransaktionsId}
          onClose={() => {
            setShowVerifikatModal(false);
            setSelectedTransaktionsId(null);
          }}
        />
      )}
    </MainLayout>
  );
}

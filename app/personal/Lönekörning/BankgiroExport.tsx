"use client";

import { useState } from "react";
import Knapp from "../../_components/Knapp";

interface BankgiroExportProps {
  anställda: any[];
  utbetalningsdatum: Date | null;
  lönespecar: Record<string, any>;
}

export default function BankgiroExport({
  anställda,
  utbetalningsdatum,
  lönespecar,
}: BankgiroExportProps) {
  const [visaModal, setVisaModal] = useState(false);
  const [kundnummer, setKundnummer] = useState("123456");
  const [bankgironummer, setBankgironummer] = useState("123-1234");

  // Beräkna totaler
  const anställdaMedLönespec = anställda.filter((a) => lönespecar[a.id]);
  const totalBelopp = anställdaMedLönespec.reduce((sum, anställd) => {
    const lönespec = lönespecar[anställd.id];
    return sum + parseFloat(lönespec?.nettolön || 0);
  }, 0);

  const genereraBankgirofil = () => {
    if (!utbetalningsdatum) return;

    const datum = utbetalningsdatum.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const bankgiroClean = bankgironummer.replace("-", "").padStart(10, "0");

    let fil = "";

    // Header (01-post)
    const header = `01${datum}  LÖN${" ".repeat(46)}SEK${kundnummer.padStart(6, "0")}0001${bankgiroClean}  \n`;
    fil += header;

    // Betalningsposter (35-post) för varje anställd
    anställdaMedLönespec.forEach((anställd) => {
      const lönespec = lönespecar[anställd.id];
      const nettolön = Math.round(parseFloat(lönespec?.nettolön || 0) * 100); // Öre
      const clearingPadded = (anställd.clearingnummer || "0000").padStart(4, "0");
      const kontoPadded = (anställd.bankkonto || "0").padStart(10, "0");
      const beloppPadded = nettolön.toString().padStart(12, "0");
      const namn = `Lön ${anställd.förnamn} ${anställd.efternamn}`.substring(0, 12);

      const betalning = `35${datum}    ${clearingPadded}${kontoPadded}${beloppPadded}${" ".repeat(18)}${kontoPadded}${namn.padEnd(12, " ")}\n`;
      fil += betalning;
    });

    // Slutpost (09-post)
    const totalÖre = Math.round(totalBelopp * 100);
    const antalPoster = anställdaMedLönespec.length.toString().padStart(8, "0");
    const totalBeloppPadded = totalÖre.toString().padStart(12, "0");

    const slutpost = `09${datum}${" ".repeat(20)}${totalBeloppPadded}${antalPoster}${" ".repeat(40)}\n`;
    fil += slutpost;

    // Ladda ner filen
    const blob = new Blob([fil], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loner_${datum}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setVisaModal(false);
  };

  if (anställdaMedLönespec.length === 0) {
    return null; // Ingen knapp om inga lönespecar
  }

  return (
    <>
      <Knapp text="💳 Hämta Bankgirofil" onClick={() => setVisaModal(true)} />

      {visaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Hämta Bankgirofil</h2>
              <p className="text-sm text-gray-300 mt-1">
                Bankgiro-filer kan användas för att snabbt ladda upp flera betalningar till din
                bank. Men du måste köpa den extratjänsten från din bank innan det fungerar.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 text-black">
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Välj filformat</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <span className="font-medium text-blue-800">Löner</span>
                </div>
              </div>

              {/* Inställningar */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kundnummer för Bankgiromax <span className="text-gray-500">6 tecken</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={kundnummer}
                    onChange={(e) => setKundnummer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bankgironummer <span className="text-gray-500">max 10 tecken</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={bankgironummer}
                    onChange={(e) => setBankgironummer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Förhandsvisning */}
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-3 py-2 text-left">Namn</th>
                        <th className="border border-gray-300 px-3 py-2 text-left">
                          Clearingnummer
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left">Bankkonto</th>
                        <th className="border border-gray-300 px-3 py-2 text-right">Belopp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anställdaMedLönespec.map((anställd) => {
                        const lönespec = lönespecar[anställd.id];
                        const nettolön = parseFloat(lönespec?.nettolön || 0);

                        return (
                          <tr key={anställd.id}>
                            <td className="border border-gray-300 px-3 py-2">
                              {anställd.förnamn} {anställd.efternamn}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {anställd.clearingnummer}
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {anställd.bankkonto}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-right">
                              {nettolön.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sammanfattning */}
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
                <p className="text-green-800">
                  <strong>
                    Inkludera {anställdaMedLönespec.length} betalningar på totalt{" "}
                    {totalBelopp.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr
                  </strong>
                </p>
              </div>

              {/* Knappar */}
              <div className="flex gap-3 justify-end">
                <Knapp text="Avbryt" onClick={() => setVisaModal(false)} />
                <Knapp text="💾 Skapa fil" onClick={genereraBankgirofil} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

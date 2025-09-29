"use client";

import { useBankgiroExport } from "../../../hooks/useBankgiroExport";
import Knapp from "../../../../_components/Knapp";
import TextFalt from "../../../../_components/TextFalt";
import { BankgiroExportProps } from "../../../types/types";

export default function BankgiroExport({
  anställda,
  utbetalningsdatum,
  lönespecar,
  open,
  onClose,
  onExportComplete,
  showButton = true, // Default till true för bakåtkompatibilitet
  direktNedladdning = false, // Default till false
}: BankgiroExportProps) {
  const {
    visaModal,
    kundnummer,
    setKundnummer,
    bankgironummer,
    setBankgironummer,
    anställdaMedLönespec,
    totalBelopp,
    kanGenerera,
    genereraBankgirofil,
    laddarNerDirekt,
    öppnaModal,
    stängModal,
  } = useBankgiroExport({
    anställda,
    utbetalningsdatum,
    lönespecar,
    onExportComplete,
    onClose,
  });

  // Modal state: styrs av prop om satt, annars lokalt
  const showModal = open !== undefined ? open : visaModal;

  // Om direkt nedladdning är aktiverat, kör nedladdning direkt när komponenten används
  if (direktNedladdning && anställdaMedLönespec.length > 0) {
    laddarNerDirekt();
    return null; // Visa inget UI
  }

  if (!kanGenerera) {
    return null; // Ingen knapp om inga lönespecar eller inget datum
  }

  return (
    <>
      {showButton && <Knapp text="💳 Hämta Bankgirofil" onClick={öppnaModal} />}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">Hämta Bankgirofil</h2>
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
                  <TextFalt
                    label="Kundnummer för Bankgiromax (6 tecken)"
                    name="kundnummer"
                    type="text"
                    value={kundnummer}
                    onChange={(e) => setKundnummer(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <div>
                  <TextFalt
                    label="Bankgironummer (max 10 tecken)"
                    name="bankgironummer"
                    type="text"
                    value={bankgironummer}
                    onChange={(e) => setBankgironummer(e.target.value)}
                    maxLength={11}
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
                <Knapp text="Avbryt" onClick={stängModal} />
                <Knapp text="💾 Skapa fil" onClick={genereraBankgirofil} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

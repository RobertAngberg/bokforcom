"use client";

import Modal from "../../../../_components/Modal";
import { RotRutBetalningModalProps } from "../../../types/types";
import { useRotRut } from "../../../hooks/useRotRut";

export default function RotRutBetalningModal({
  isOpen,
  onClose,
  fakturaId,
  fakturanummer,
  kundnamn,
  totalBelopp,
  bokföringsmetod,
  onSuccess,
}: RotRutBetalningModalProps) {
  const { loading, rotRutBelopp, handleRegistrering } = useRotRut({
    fakturaId,
    totalBelopp,
    bokföringsmetod,
    onSuccess: onSuccess || (() => {}),
    onClose,
  });

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💰 Registrera utbetalning från Skatteverket"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Fakturauppgifter */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">📋 Fakturauppgifter</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Fakturanummer:</span>
              <div className="text-white font-medium">{fakturanummer}</div>
            </div>
            <div>
              <span className="text-slate-400">Kund:</span>
              <div className="text-white font-medium">{kundnamn}</div>
            </div>
            <div>
              <span className="text-slate-400">Totalt belopp:</span>
              <div className="text-white font-medium">{totalBelopp.toLocaleString("sv-SE")} kr</div>
            </div>
            <div>
              <span className="text-slate-400">ROT/RUT-belopp (50%):</span>
              <div className="text-green-400 font-bold text-lg">
                {rotRutBelopp.toLocaleString("sv-SE")} kr
              </div>
            </div>
          </div>
        </div>

        {/* Bokföringsposter */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">📚 Föreslagna bokföringsposter</h3>
          <div className="overflow-hidden rounded-lg border border-slate-600">
            <table className="w-full text-sm">
              <thead className="bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-300">Konto</th>
                  <th className="px-4 py-2 text-left text-slate-300">Kontonamn</th>
                  <th className="px-4 py-2 text-left text-slate-300">Beskrivning</th>
                  <th className="px-4 py-2 text-right text-slate-300">Debet</th>
                  <th className="px-4 py-2 text-right text-slate-300">Kredit</th>
                </tr>
              </thead>
              <tbody className="bg-slate-800">
                <tr className="border-t border-slate-600">
                  <td className="px-4 py-2 text-white font-mono">1930</td>
                  <td className="px-4 py-2 text-white">Bank/Kassa</td>
                  <td className="px-4 py-2 text-slate-300">ROT/RUT-betalning från SKV</td>
                  <td className="px-4 py-2 text-right text-green-400 font-bold">
                    {rotRutBelopp.toLocaleString("sv-SE")}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-400">-</td>
                </tr>
                <tr className="border-t border-slate-600">
                  <td className="px-4 py-2 text-white font-mono">1513</td>
                  <td className="px-4 py-2 text-white">Kundfordringar – delad faktura</td>
                  <td className="px-4 py-2 text-slate-300">ROT/RUT-del nollställd</td>
                  <td className="px-4 py-2 text-right text-slate-400">-</td>
                  <td className="px-4 py-2 text-right text-red-400 font-bold">
                    {rotRutBelopp.toLocaleString("sv-SE")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Information */}
        <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">💡</div>
            <div>
              <h4 className="text-blue-300 font-semibold mb-1">Vad händer när du registrerar:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>
                  • {rotRutBelopp.toLocaleString("sv-SE")} kr bokförs som inkommande betalning från
                  Skatteverket
                </li>
                <li>• ROT/RUT-fordran ({rotRutBelopp.toLocaleString("sv-SE")} kr) nollställs</li>
                <li>• Fakturas betalningsstatus uppdateras till Betald</li>
                <li>• ROT/RUT-status uppdateras till Godkänd</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Knappar */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Avbryt
          </button>
          <button
            onClick={handleRegistrering}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Registrerar...
              </>
            ) : (
              <>💰 Registrera ROT/RUT-betalning</>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

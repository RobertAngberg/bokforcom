"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface SkatteBokforingModalProps {
  skatteModalOpen: boolean;
  setSkatteModalOpen: (open: boolean) => void;
  valdaSpecar: any[];
  skatteData: any;
  utbetalningsdatum: string | null;
  skatteDatum: Date | null;
  setSkatteDatum: (date: Date | null) => void;
  hanteraBokförSkatter: () => void;
  skatteBokförPågår: boolean;
}

export default function SkatteBokforingModal({
  skatteModalOpen,
  setSkatteModalOpen,
  valdaSpecar,
  skatteData,
  utbetalningsdatum,
  skatteDatum,
  setSkatteDatum,
  hanteraBokförSkatter,
  skatteBokförPågår,
}: SkatteBokforingModalProps) {
  if (!skatteModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950 bg-opacity-95 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-white font-bold">💰 Bokför skatter</h2>
          <button
            onClick={() => setSkatteModalOpen(false)}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Info text */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-300">
              När dragningen/återbäringen av skatter syns på ditt skattekonto kan du bokföra dessa
              här. Du kan inte bokföra det tidigare för du kan inte bokföra i framtiden.
            </p>
          </div>

          {/* Sammanfattning */}
          {valdaSpecar && valdaSpecar.length > 0 && (
            <div className="bg-slate-600 border border-slate-500 rounded-lg p-4">
              <h3 className="text-lg text-white font-semibold mb-3">
                📊 Sammanfattning för {valdaSpecar.length} lönespec
                {valdaSpecar.length !== 1 ? "ar" : ""}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-cyan-400">
                    {skatteData.socialaAvgifter.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kr
                  </div>
                  <div className="text-sm text-gray-300">Sociala avgifter</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {skatteData.personalskatt.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kr
                  </div>
                  <div className="text-sm text-gray-300">Personalskatt</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {skatteData.totaltSkatter.toLocaleString("sv-SE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    kr
                  </div>
                  <div className="text-sm text-gray-300">Totalt skatter</div>
                </div>
              </div>
            </div>
          )}

          {/* Sociala avgifter sektion */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-4">
              {utbetalningsdatum
                ? new Date(utbetalningsdatum).toLocaleDateString("sv-SE")
                : "2025-08-19"}{" "}
              - Sociala avgifter
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left p-2 text-gray-300">Konto</th>
                    <th className="text-right p-2 text-gray-300">Debet</th>
                    <th className="text-right p-2 text-gray-300">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-600">
                    <td className="p-2 text-gray-200">
                      2012 Avräkning för skatter och avgifter (skattekonto)
                    </td>
                    <td className="p-2 text-right text-gray-200">0,00 kr</td>
                    <td className="p-2 text-right text-gray-200">
                      {skatteData.socialaAvgifter.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                  </tr>
                  <tr className="border-b border-slate-600">
                    <td className="p-2 text-gray-200">
                      2731 Avräkning lagstadgade sociala avgifter
                    </td>
                    <td className="p-2 text-right text-gray-200">
                      {skatteData.socialaAvgifter.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                    <td className="p-2 text-right text-gray-200">0,00 kr</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Inkomstskatter sektion */}
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-4">
              {utbetalningsdatum
                ? new Date(utbetalningsdatum).toLocaleDateString("sv-SE")
                : "2025-08-19"}{" "}
              - Inkomstskatter
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="text-left p-2 text-gray-300">Konto</th>
                    <th className="text-right p-2 text-gray-300">Debet</th>
                    <th className="text-right p-2 text-gray-300">Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-600">
                    <td className="p-2 text-gray-200">
                      2012 Avräkning för skatter och avgifter (skattekonto)
                    </td>
                    <td className="p-2 text-right text-gray-200">0,00 kr</td>
                    <td className="p-2 text-right text-gray-200">
                      {skatteData.personalskatt.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 text-gray-200">2710 Personalskatt</td>
                    <td className="p-2 text-right text-gray-200">
                      {skatteData.personalskatt.toLocaleString("sv-SE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      kr
                    </td>
                    <td className="p-2 text-right text-gray-200">0,00 kr</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-gray-300 font-medium mb-2">
                Datum skatterna drogs från Skattekontot
              </label>
              <DatePicker
                selected={
                  skatteDatum ||
                  (utbetalningsdatum ? new Date(utbetalningsdatum) : new Date("2025-08-19"))
                }
                onChange={(date) => setSkatteDatum(date)}
                dateFormat="yyyy-MM-dd"
                className="bg-slate-800 text-white border border-slate-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-700 w-full"
                calendarClassName="bg-slate-900 text-white"
                dayClassName={(date) => "text-cyan-400"}
                placeholderText="Välj datum"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-600">
            <button
              onClick={() => setSkatteModalOpen(false)}
              className="px-4 py-2 bg-slate-700 text-white border border-slate-600 rounded hover:bg-slate-600"
            >
              Stäng
            </button>
            <button
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={hanteraBokförSkatter}
              disabled={
                skatteBokförPågår ||
                (skatteData.socialaAvgifter === 0 && skatteData.personalskatt === 0)
              }
            >
              {skatteBokförPågår ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Bokför...
                </>
              ) : (
                "Bokför transaktioner"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

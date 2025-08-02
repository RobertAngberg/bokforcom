"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../_components/Modal";

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
  return (
    <Modal
      isOpen={skatteModalOpen}
      onClose={() => setSkatteModalOpen(false)}
      title="💰 Bokför skatter"
      maxWidth="4xl"
    >
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
            - Sociala avgifter ({skatteData.socialaAvgifter.toFixed(2)} kr)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-600 p-3 rounded">
              <span className="text-gray-300">5010 - Löner</span>
              <span className="text-white font-mono">
                {skatteData.socialaAvgifter.toFixed(2)} kr (kredit)
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-600 p-3 rounded">
              <span className="text-gray-300">2730 - Avräkning sociala avgifter</span>
              <span className="text-white font-mono">
                {skatteData.socialaAvgifter.toFixed(2)} kr (debet)
              </span>
            </div>
          </div>
        </div>

        {/* Personalskatt sektion */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="text-lg text-white font-semibold mb-4">
            Personalskatt ({skatteData.personalskatt.toFixed(2)} kr)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-600 p-3 rounded">
              <span className="text-gray-300">5410 - Avräkning personalskatt</span>
              <span className="text-white font-mono">
                {skatteData.personalskatt.toFixed(2)} kr (debet)
              </span>
            </div>
            <div className="flex justify-between items-center bg-slate-600 p-3 rounded">
              <span className="text-gray-300">1930 - Företagskonto</span>
              <span className="text-white font-mono">
                {skatteData.personalskatt.toFixed(2)} kr (kredit)
              </span>
            </div>
          </div>
        </div>

        {/* Totalsumma */}
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-white">
              Total dragning från skattekonto:
            </span>
            <span className="text-xl font-bold text-yellow-400">
              {skatteData.totaltSkatter.toFixed(2)} kr
            </span>
          </div>
        </div>

        {/* Datum sektion */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="text-lg text-white font-semibold mb-4">Bokföringsdatum</h3>
          <div className="text-sm text-gray-300 mb-3">
            Välj det datum när dragningen faktiskt syns på ditt skattekonto (inte tidigare än
            betalningen skedde):
          </div>
          <div className="w-full">
            <DatePicker
              selected={skatteDatum}
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
    </Modal>
  );
}

"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../_components/Modal";
import Tabell, { ColumnDefinition } from "../../_components/Tabell";

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
  onHämtaBankgiro?: () => void; // Ny prop för bankgiro
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
  onHämtaBankgiro,
}: SkatteBokforingModalProps) {
  return (
    <Modal
      isOpen={skatteModalOpen}
      onClose={() => setSkatteModalOpen(false)}
      title="💰 Bokför skatter"
      maxWidth="4xl"
    >
      <div className="mb-8"></div>
      <div className="space-y-6">
        {/* Sammanfattning */}
        {valdaSpecar && valdaSpecar.length > 0 && (
          <div className="bg-slate-600 border border-slate-500 rounded-lg p-4">
            <h3 className="text-lg text-white font-semibold mb-3">
              📊 Sammanfattning för {valdaSpecar.length} lönespec
              {valdaSpecar.length !== 1 ? "ar" : ""}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-white">
                  {skatteData.socialaAvgifter.toLocaleString("sv-SE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  kr
                </div>
                <div className="text-sm text-gray-300">Sociala avgifter</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {skatteData.personalskatt.toLocaleString("sv-SE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  kr
                </div>
                <div className="text-sm text-gray-300">Personalskatt</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
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

        {/* Bokföringsposter */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="text-lg text-white font-semibold mb-4">
            {utbetalningsdatum
              ? new Date(utbetalningsdatum).toLocaleDateString("sv-SE")
              : "2025-08-19"}{" "}
            - Bokföringsposter för skatter
          </h3>
          <Tabell
            data={[
              {
                id: "2731",
                konto: "2731",
                beskrivning: "Avräkning sociala avgifter",
                debet: skatteData.socialaAvgifter.toFixed(2).replace(".", ",") + " kr",
                kredit: "",
              },
              {
                id: "2710",
                konto: "2710",
                beskrivning: "Personalskatt",
                debet: skatteData.personalskatt.toFixed(2).replace(".", ",") + " kr",
                kredit: "",
              },
              {
                id: "1930",
                konto: "1930",
                beskrivning: "Företagskonto",
                debet: "",
                kredit: skatteData.totaltSkatter.toFixed(2).replace(".", ",") + " kr",
              },
            ]}
            columns={[
              { key: "konto", label: "Konto" },
              { key: "beskrivning", label: "Beskrivning" },
              { key: "debet", label: "Debet", className: "text-right" },
              { key: "kredit", label: "Kredit", className: "text-right" },
            ]}
            getRowId={(item) => item.id}
          />
        </div>

        {/* Datum sektion */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <h3 className="text-lg text-white font-semibold mb-4">Bokföringsdatum</h3>
          <div className="text-sm text-gray-300 mb-3">
            När dragningen av dessa skatter syns på ditt skattekonto kan du bokföra dessa här, inte
            innan.
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
        <div className="flex justify-between items-center pt-4 border-t border-slate-600">
          {/* Vänster sida: Bankgiro */}
          <div>
            {onHämtaBankgiro && (
              <button
                onClick={onHämtaBankgiro}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🏦 Bankgirofil (Frivilligt)
              </button>
            )}
          </div>

          {/* Höger sida: Huvudknappar */}
          <div className="flex gap-4">
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
    </Modal>
  );
}

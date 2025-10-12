"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../../../_components/Modal";
import Tabell from "../../../../_components/Tabell";
import { SkatteBokforingModalProps } from "../../../types/types";

export default function SkatteBokforingModal({
  skatteModalOpen,
  setSkatteModalOpen,
  skatteData,
  skatteDatum,
  setSkatteDatum,
  hanteraBokförSkatter,
  skatteBokförPågår,
  onHämtaBankgiro,
}: SkatteBokforingModalProps) {
  const { socialaAvgifter = 0, personalskatt = 0, totaltSkatter = 0 } = skatteData;
  const totalBelopp = Math.round((socialaAvgifter + personalskatt) * 100) / 100;

  const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString("sv-SE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Modal
      isOpen={skatteModalOpen}
      onClose={() => setSkatteModalOpen(false)}
      title="💰 Bokför skatter"
      maxWidth="4xl"
    >
      <div className="mb-8"></div>
      <div className="space-y-6">
        {/* Sammanfattning - REMOVED */}

        {/* Bokföringsposter */}
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
          <Tabell
            data={[
              {
                id: "2731",
                konto: "2731",
                beskrivning: "Avräkning sociala avgifter",
                debet: `${formatCurrency(socialaAvgifter)} kr`,
                kredit: "",
              },
              {
                id: "2710",
                konto: "2710",
                beskrivning: "Personalskatt",
                debet: `${formatCurrency(personalskatt)} kr`,
                kredit: "",
              },
              {
                id: "1930",
                konto: "1930",
                beskrivning: "Företagskonto",
                debet: "",
                kredit: `${formatCurrency(totalBelopp || totaltSkatter)} kr`,
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
              dayClassName={() => "text-cyan-400"}
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
                className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                🏦 Ladda ner bankgirofil (Frivilligt)
              </button>
            )}
          </div>

          {/* Höger sida: Huvudknappar */}
          <div className="flex gap-4">
            <button
              onClick={() => setSkatteModalOpen(false)}
              className="px-4 py-2 bg-cyan-600 text-white border border-cyan-500 rounded hover:bg-cyan-700"
            >
              ❌ Stäng
            </button>
            <button
              className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              onClick={hanteraBokförSkatter}
              disabled={skatteBokförPågår || (socialaAvgifter === 0 && personalskatt === 0)}
            >
              {skatteBokförPågår ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  💰 Bokför...
                </>
              ) : (
                "💰 Bokför transaktioner"
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

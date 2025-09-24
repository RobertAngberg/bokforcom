"use client";

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Modal from "../../../../_components/Modal";
import Knapp from "../../../../_components/Knapp";
import { NyLonekorningModalProps } from "../../../types/types";
import { useLonekorning } from "../../../hooks/useLonekorning";

export default function NyLonekorningModal({
  isOpen,
  onClose,
  onLonekorningCreated,
}: NyLonekorningModalProps) {
  const {
    newLonekorningUtbetalningsdatum: utbetalningsdatum,
    setNewLonekorningUtbetalningsdatum: setUtbetalningsdatum,
    newLonekorningLoading: loading,
    anstallda: anställda,
    newLonekorningValdaAnstallda: valdaAnställda,
    newLonekorningSteg: steg,
    newLonekorningCanProceed: canProceed,
    handleNewLonekorningCreate: handleCreate,
    handleNewLonekorningAnstalldToggle: handleAnställdToggle,
    handleNewLonekorningBack: handleBack,
    setNyLonekorningModalOpen,
  } = useLonekorning({
    enableNewLonekorningModal: true,
    onLonekorningCreated,
  });

  const handleClose = () => {
    setNyLonekorningModalOpen(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Skapa ny lönekörning" maxWidth="md">
      <div className="space-y-4">
        {steg === "datum" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Utbetalningsdatum
              </label>
              <DatePicker
                selected={utbetalningsdatum}
                onChange={(date) => setUtbetalningsdatum(date)}
                dateFormat="yyyy-MM-dd"
                className="bg-slate-800 text-white px-4 py-3 rounded-lg w-full border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-700"
                disabled={loading}
                placeholderText="Välj utbetalningsdatum"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50"
              >
                Avbryt
              </button>
              <Knapp
                text="Nästa"
                onClick={handleCreate}
                disabled={!canProceed || loading}
                className="flex-1"
              />
            </div>
          </>
        )}

        {steg === "anställda" && (
          <>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Välj anställda</h3>
              <p className="text-slate-300 text-sm mb-4">
                Välj vilka anställda som ska få lönespecifikationer för denna lönekörning.
              </p>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {anställda.map((anställd) => (
                  <div
                    key={anställd.id}
                    className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-600"
                  >
                    <input
                      type="checkbox"
                      id={`anställd-${anställd.id}`}
                      checked={valdaAnställda.includes(anställd.id)}
                      onChange={() => handleAnställdToggle(anställd.id)}
                      className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500"
                    />
                    <label
                      htmlFor={`anställd-${anställd.id}`}
                      className="flex-1 text-white cursor-pointer"
                    >
                      <div className="font-medium">
                        {anställd.förnamn} {anställd.efternamn}
                      </div>
                      <div className="text-sm text-slate-400">
                        {anställd.jobbtitel} • {anställd.kompensation?.toLocaleString("sv-SE")}{" "}
                        kr/mån
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {anställda.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>Inga anställda hittades</p>
                  <p className="text-sm">
                    Lägg till anställda först innan du skapar en lönekörning
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50"
              >
                Tillbaka
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 disabled:opacity-50"
              >
                Avbryt
              </button>
              <Knapp
                text={loading ? "Skapar..." : `Skapa lönekörning (${valdaAnställda.length})`}
                onClick={handleCreate}
                disabled={!canProceed || loading}
                className="flex-1"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

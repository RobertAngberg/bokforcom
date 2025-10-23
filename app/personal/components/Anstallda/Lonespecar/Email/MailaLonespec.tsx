"use client";

import { useMailaLonespec } from "../../../../hooks/useMailaLonespec";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import Knapp from "../../../../../_components/Knapp";
import type { MailaLonespecProps } from "../../../../types/types";

export default function MailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  open,
  onClose,
  onMailComplete,
}: MailaLonespecProps) {
  // Använd hooken för ALL affärslogik
  const { loading, sent, error, showModal, handleMaila, openModal, closeModal } = useMailaLonespec({
    lönespec,
    anställd,
    företagsprofil,
    extrarader,
    beräknadeVärden,
    open,
    onClose,
    onMailComplete,
    ForhandsgranskningComponent: Forhandsgranskning,
  });

  return (
    <>
      <Knapp text="✉️ Maila lönespec" onClick={openModal} disabled={loading} />
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full p-6 relative border border-slate-700">
            <button
              className="absolute top-2 right-2 text-2xl text-slate-300 hover:text-white"
              onClick={closeModal}
              disabled={loading}
              aria-label="Stäng"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-white">Maila lönespecifikation</h2>
            <div className="mb-4 text-slate-200">
              En PDF av lönespecen kommer att skickas till:
              <br />
              <span className="font-semibold text-white">
                {anställd?.mail || anställd?.epost || anställd?.email || "Ingen e-post"}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Knapp
                text="✉️ Skicka lönespec"
                onClick={handleMaila}
                disabled={loading || sent}
                loading={loading}
                loadingText="Skickar..."
              />
              <Knapp text="Avbryt" onClick={closeModal} disabled={loading} />
            </div>
            {error && <div className="text-red-400 mt-3">{error}</div>}
            {sent && <div className="text-green-400 mt-3">Lönespec skickad!</div>}
          </div>
        </div>
      )}
    </>
  );
}

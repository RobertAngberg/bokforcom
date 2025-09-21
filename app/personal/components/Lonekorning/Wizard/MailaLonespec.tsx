import { useMailaLonespec } from "../../../hooks/useMailaLonespec";
import Forhandsgranskning from "../../Anstallda/Lonespecar/Forhandsgranskning/Forhandsgranskning";
import Knapp from "../../../../_components/Knapp";
import Toast from "../../../../_components/Toast";
import type { MailaLonespecProps } from "../../../types/types";

export default function MailaLonespec({
  lönespec,
  anställd,
  företagsprofil,
  extrarader = [],
  beräknadeVärden = {},
  batch = [],
  batchMode = false,
  open,
  onClose,
  onMailComplete,
}: MailaLonespecProps) {
  const {
    loading,
    sent,
    error,
    visaModal,
    toast,
    setToast,
    lönespecList,
    handleBatchMaila,
    handleMaila,
    closeModal,
    openModal,
  } = useMailaLonespec({
    lönespec,
    anställd,
    företagsprofil,
    extrarader,
    beräknadeVärden,
    batch,
    batchMode,
    onMailComplete,
    onClose,
  });

  const showModal = open !== undefined ? open : visaModal;

  // Wrapper functions to pass Forhandsgranskning component
  const handleBatchMailaWithComponent = () => handleBatchMaila(Forhandsgranskning);
  const handleMailaWithComponent = () => handleMaila(Forhandsgranskning);

  return (
    <>
      {!batchMode && <Knapp text="✉️ Maila lönespec" onClick={openModal} disabled={loading} />}
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
            <h2 className="text-xl font-bold mb-4 text-white">
              {batchMode ? "Maila lönespecifikationer" : "Maila lönespecifikation"}
            </h2>
            {batchMode ? (
              <>
                <div className="mb-2 text-slate-200 max-h-40 overflow-y-auto">
                  <ul className="list-disc pl-5">
                    {lönespecList.map((item, i) => (
                      <li key={i} className="mb-1">
                        {item.anställd?.förnamn} {item.anställd?.efternamn} –{" "}
                        {item.anställd?.mail || item.anställd?.epost || item.anställd?.email}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4 text-slate-200">
                  {lönespecList.length} lönespecifikationer kommer att skickas ut till respektive
                  anställd.
                </div>
              </>
            ) : (
              <div className="mb-4 text-slate-200">
                En PDF av lönespecen kommer att skickas till:
                <br />
                <span className="font-semibold text-white">
                  {anställd.mail || anställd.epost || anställd.email}
                </span>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {batchMode ? (
                <Knapp
                  text="✉️ Maila lönespecar"
                  onClick={handleBatchMailaWithComponent}
                  disabled={loading || sent}
                  loading={loading}
                  loadingText="Skickar..."
                />
              ) : (
                <Knapp
                  text="✉️ Skicka lönespec"
                  onClick={handleMailaWithComponent}
                  disabled={loading || sent}
                  loading={loading}
                  loadingText="Skickar..."
                />
              )}
              <Knapp text="Avbryt" onClick={closeModal} disabled={loading} />
            </div>
            {error && <div className="text-red-400 mt-3">{error}</div>}
            {sent && (
              <div className="text-green-400 mt-3">
                {batchMode ? "Alla lönespecar skickades!" : "Lönespec skickad!"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast för mail-bekräftelse */}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </>
  );
}

//#region Huvud
import Knapp from "../../../../_components/Knapp";
import Toast from "../../../../_components/Toast";
import { useLonespecUtlagg } from "../../../hooks/useLonespecUtlagg";
import type { UtläggProps } from "../../../types/types";

export default function Utlägg({
  lönespecUtlägg,
  getStatusBadge,
  lönespecId,
  onUtläggAdded,
  extrarader = [],
  anställdId,
}: UtläggProps) {
  //#endregion

  const {
    synkroniseradeUtlägg,
    läggerTillUtlägg,
    toast,
    setToast,
    väntandeUtlägg,
    inkluderadeUtlägg,
    handleLäggTillUtlägg,
  } = useLonespecUtlagg(lönespecUtlägg, lönespecId, extrarader, anställdId, onUtläggAdded);

  if (synkroniseradeUtlägg.length === 0) return null;

  // Visa komponenten om det finns utlägg (väntande eller inkluderade)
  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        💰 Väntande utlägg
      </h4>
      {/* Lägg till utlägg knapp i mitten */}
      {väntandeUtlägg.length > 0 && (
        <div className="flex justify-center mb-4">
          <Knapp
            text="💰 Lägg till väntande utlägg"
            onClick={handleLäggTillUtlägg}
            loading={läggerTillUtlägg}
            loadingText="Lägger till utlägg..."
            disabled={läggerTillUtlägg}
          />
        </div>
      )}
      <div className="space-y-3">
        {synkroniseradeUtlägg.map((utläggItem) => (
          <div key={utläggItem.id} className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="text-white font-medium">{utläggItem.beskrivning}</h5>
                <p className="text-gray-400 text-sm">
                  {new Date(utläggItem.datum).toLocaleDateString("sv-SE")}
                  {utläggItem.kategori && ` • ${utläggItem.kategori}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  {utläggItem.belopp.toLocaleString("sv-SE")} kr
                </div>
                {getStatusBadge(utläggItem.status)}
              </div>
            </div>

            {utläggItem.kommentar && (
              <div className="text-gray-400 text-sm mb-2">{utläggItem.kommentar}</div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>ID: #{utläggItem.id}</span>
              {utläggItem.kvitto_url ? (
                <Knapp
                  text="Visa kvitto"
                  onClick={() =>
                    window.open(utläggItem.kvitto_url, "_blank", "noopener,noreferrer")
                  }
                />
              ) : utläggItem.kvitto_fil ? (
                <span className="text-gray-400">Kvitto ej tillgängligt</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
}

"use client";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import Lonespecar from "../Lonespecar/Lonespecar";
import Forhandsgranskning from "../Lonespecar/Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import { useLonekorning } from "../_hooks/useLonekorning";

export default function AnställdaLista({
  anställda,
  loading,
  utbetalningsdatum,
  onLonespecarChange,
}: {
  anställda: any[];
  loading: boolean;
  utbetalningsdatum: Date | null;
  onLonespecarChange?: (specar: Record<string, any>) => void;
}) {
  // Hook-API för logik och UI-state (hooken initierar internt)
  const lonekorning = useLonekorning({ anställda, utbetalningsdatum, onLonespecarChange });

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-white font-semibold">
          Lönekörning {utbetalningsdatum?.toLocaleDateString("sv-SE")} ({anställda.length}{" "}
          anställda)
        </h5>
        {/* Batch action buttons removed from header area to avoid duplication */}
      </div>
      {loading || lonekorning.laddaLönespecar ? (
        <div className="text-gray-300 text-center py-4">Laddar anställda och lönespecar...</div>
      ) : anställda.length === 0 ? (
        <div className="text-gray-300 text-center py-4">Inga anställda hittades</div>
      ) : (
        <div className="space-y-4">
          {anställda.map((anställd) => (
            <div key={anställd.id} className="space-y-2">
              <AnimeradFlik
                title={`${anställd.förnamn} ${anställd.efternamn}`}
                icon="👤"
                visaSummaDirekt={`${parseFloat(anställd.kompensation || 0).toLocaleString("sv-SE")} kr`}
              >
                <div className="space-y-4">
                  {lonekorning.harLönespec(anställd.id) ? (
                    <>
                      <Lonespecar
                        anställd={anställd}
                        specificLönespec={lonekorning.getLönespec(anställd.id)}
                        ingenAnimering={true}
                        visaExtraRader={true}
                      />
                      <div className="flex gap-2 mt-2 justify-between items-center">
                        <Knapp
                          text="👁️ Förhandsgranska/PDF"
                          onClick={() => lonekorning.openFörhandsgranskning(anställd)}
                        />
                        <div className="flex-1" />
                        <Knapp
                          text="🗑️ Ta bort lönespec"
                          loading={lonekorning.taBort[anställd.id]}
                          onClick={() => lonekorning.taBortLönespec(anställd)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Knapp
                          text="✚ Skapa ny lönespec"
                          loading={lonekorning.sparar[anställd.id]}
                          loadingText="⏳ Skapar..."
                          onClick={() => lonekorning.skapaNyLönespec(anställd)}
                        />
                      </div>
                      <div className="text-gray-400 text-center py-4">
                        Ingen lönespec för{" "}
                        {lonekorning.löneperiod
                          ? `${lonekorning.löneperiod.månad}/${lonekorning.löneperiod.år}`
                          : ""}
                      </div>
                    </div>
                  )}
                </div>
              </AnimeradFlik>
            </div>
          ))}
        </div>
      )}
      {/* Förhandsgranskning-modal */}
      {lonekorning.förhandsgranskaId && lonekorning.förhandsgranskaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-black"
              onClick={() => lonekorning.closeFörhandsgranskning()}
              aria-label="Stäng"
            >
              ×
            </button>
            <Forhandsgranskning
              lönespec={lonekorning.förhandsgranskaData.lönespec}
              anställd={lonekorning.förhandsgranskaData.anställd}
              företagsprofil={lonekorning.förhandsgranskaData.företagsprofil}
              extrarader={lonekorning.förhandsgranskaData.extrarader}
              beräknadeVärden={lonekorning.förhandsgranskaData.beräknadeVärden}
              onStäng={() => lonekorning.closeFörhandsgranskning()}
            />
          </div>
        </div>
      )}
      {/* Batch-knappar under listan borttagna! */}
      {lonekorning.toast && (
        <Toast
          type={lonekorning.toast.type}
          message={lonekorning.toast.message}
          isVisible={true}
          onClose={lonekorning.clearToast}
        />
      )}
    </>
  );
}

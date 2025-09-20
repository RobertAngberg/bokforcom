"use client";
import AnimeradFlik from "../../../_components/AnimeradFlik";
import Knapp from "../../../_components/Knapp";
import Toast from "../../../_components/Toast";
import Lonespecar from "../Lonespecar/Lonespecar";
import Forhandsgranskning from "../Lonespecar/Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import { useLonekorning } from "../../hooks/useLonekorning";

export default function AnställdaLista() {
  const { state, handlers } = useLonekorning();

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-white font-semibold">
          Lönekörning {state.utbetalningsdatum?.toLocaleDateString("sv-SE")} (
          {state.anställda.length} anställda)
        </h5>
      </div>
      {state.anställda.length === 0 ? (
        <div className="text-gray-300 text-center py-4">Inga anställda hittades</div>
      ) : (
        <div className="space-y-4">
          {state.anställda.map((anställd) => {
            const förnamn = (anställd as any).förnamn || anställd.namn?.split(" ")[0] || "";
            const efternamn =
              (anställd as any).efternamn || anställd.namn?.split(" ").slice(1).join(" ") || "";
            const komp = parseFloat(((anställd as any).kompensation || 0) as any) || 0;
            return (
              <div key={anställd.id} className="space-y-2">
                <AnimeradFlik
                  title={`${förnamn} ${efternamn}`.trim() || anställd.namn}
                  icon="👤"
                  visaSummaDirekt={`${komp.toLocaleString("sv-SE")} kr`}
                >
                  <div className="space-y-4">
                    {state.harLönespec(anställd.id) ? (
                      <>
                        <Lonespecar
                          anställd={anställd as any}
                          specificLönespec={state.getLönespec(anställd.id)}
                          ingenAnimering={true}
                          visaExtraRader={true}
                        />
                        <div className="flex gap-2 mt-2 justify-between items-center">
                          <Knapp
                            text="👁️ Förhandsgranska/PDF"
                            onClick={() => handlers.openFörhandsgranskning(anställd)}
                          />
                          <div className="flex-1" />
                          <Knapp
                            text="🗑️ Ta bort lönespec"
                            loading={state.taBort[anställd.id]}
                            onClick={() => handlers.taBortLönespec(anställd)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Knapp
                            text="✚ Skapa ny lönespec"
                            loading={state.sparar[anställd.id]}
                            loadingText="⏳ Skapar..."
                            onClick={() => handlers.skapaNyLönespec(anställd)}
                          />
                        </div>
                        <div className="text-gray-400 text-center py-4">
                          Ingen lönespec för{" "}
                          {state.löneperiod
                            ? `${state.löneperiod.månad}/${state.löneperiod.år}`
                            : ""}
                        </div>
                      </div>
                    )}
                  </div>
                </AnimeradFlik>
              </div>
            );
          })}
        </div>
      )}
      {state.förhandsgranskaId && state.förhandsgranskaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-black"
              onClick={handlers.closeFörhandsgranskning}
              aria-label="Stäng"
            >
              ×
            </button>
            <Forhandsgranskning
              lönespec={state.förhandsgranskaData.lönespec}
              anställd={state.förhandsgranskaData.anställd}
              företagsprofil={state.förhandsgranskaData.företagsprofil}
              extrarader={state.förhandsgranskaData.extrarader}
              beräknadeVärden={state.förhandsgranskaData.beräknadeVärden}
              onStäng={handlers.closeFörhandsgranskning}
            />
          </div>
        </div>
      )}
      {state.toast && (
        <Toast
          type={state.toast.type}
          message={state.toast.message}
          isVisible={true}
          onClose={handlers.clearToast}
        />
      )}
    </>
  );
}

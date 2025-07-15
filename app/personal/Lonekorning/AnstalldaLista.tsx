"use client";

import { useState, useEffect, useCallback } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import Lonespecar from "../Lonespecar/Lonespecar";
import { skapaNyLönespec, taBortLönespec, hämtaLönespecifikationer } from "../actions";
import { useLonespecContext } from "../Lonespecar/LonespecContext";
import Forhandsgranskning from "../Lonespecar/Forhandsgranskning/Forhandsgranskning/Forhandsgranskning";
import MailaLonespec from "../Lonespecar/MailaLonespec";

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
  const { setLonespecar } = useLonespecContext();
  const [sparar, setSparar] = useState<Record<string, boolean>>({});
  const [taBort, setTaBort] = useState<Record<string, boolean>>({});
  const [befintligaLönespecar, setBefintligaLönespecar] = useState<Record<string, any>>({});
  const [nyaLönespecar, setNyaLönespecar] = useState<Record<string, any>>({});
  const [laddaLönespecar, setLaddaLönespecar] = useState(false);
  const [förhandsgranskaId, setFörhandsgranskaId] = useState<string | null>(null);
  const [förhandsgranskaData, setFörhandsgranskaData] = useState<any | null>(null);
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);

  // Beräkna månad/år från utbetalningsdatum
  const getLöneperiod = useCallback(() => {
    if (!utbetalningsdatum) return null;

    const utbetalning = new Date(utbetalningsdatum);
    const månad = utbetalning.getMonth() + 1; // 1-12
    const år = utbetalning.getFullYear();

    // Använd samma månad som valt datum
    return { månad: månad, år: år };
  }, [utbetalningsdatum]);

  // Ladda befintliga lönespecar för vald period
  useEffect(() => {
    const laddaBefintligaLönespecar = async () => {
      if (!utbetalningsdatum || anställda.length === 0) return;

      const löneperiod = getLöneperiod();
      if (!löneperiod) return;

      try {
        setLaddaLönespecar(true);
        const befintliga: Record<string, any> = {};

        for (const anställd of anställda) {
          const lönespecar = await hämtaLönespecifikationer(anställd.id);
          const befintligLönespec = lönespecar.find(
            (spec: any) => spec.månad === löneperiod.månad && spec.år === löneperiod.år
          );

          if (befintligLönespec) {
            befintliga[anställd.id] = befintligLönespec;
          }
        }

        setBefintligaLönespecar(befintliga);
        setLonespecar(Object.values(befintliga));
        onLonespecarChange?.(befintliga);
      } catch (error) {
        console.error("❌ Fel vid laddning av lönespecar:", error);
      } finally {
        setLaddaLönespecar(false);
      }
    };

    laddaBefintligaLönespecar();
  }, [anställda, utbetalningsdatum, getLöneperiod, setLonespecar, onLonespecarChange]);

  const handleSkapaNyLönespec = async (anställd: any) => {
    if (!utbetalningsdatum) return;

    const löneperiod = getLöneperiod();
    if (!löneperiod) return;

    try {
      setSparar((prev) => ({ ...prev, [anställd.id]: true }));

      const periodStart = new Date(löneperiod.år, löneperiod.månad - 1, 1);
      const periodSlut = new Date(löneperiod.år, löneperiod.månad, 0);

      const nyLönespec = await skapaNyLönespec({
        anställd_id: anställd.id,
        månad: löneperiod.månad,
        år: löneperiod.år,
        period_start: periodStart.toISOString().split("T")[0],
        period_slut: periodSlut.toISOString().split("T")[0],
      });

      setNyaLönespecar((prev) => ({
        ...prev,
        [anställd.id]: nyLönespec,
      }));

      // 🏖️ Visa semesterinformation om det lades till
      if (nyLönespec.semesterInfo?.success && nyLönespec.semesterInfo?.dagar > 0) {
        alert(`✅ Lönespec skapad!\n🏖️ Semester: ${nyLönespec.semesterInfo.message}`);
      } else {
        alert("✅ Lönespec skapad!");
      }
    } catch (error) {
      console.error("Fel vid skapande av lönespec:", error);
      alert("❌ Kunde inte skapa lönespec");
    } finally {
      setSparar((prev) => ({ ...prev, [anställd.id]: false }));
    }
  };

  const handleTaBortLönespec = async (anställd: any) => {
    const lönespec = nyaLönespecar[anställd.id] || befintligaLönespecar[anställd.id];
    if (!lönespec) return;

    if (!confirm("Är du säker på att du vill ta bort denna lönespec?")) {
      return;
    }

    try {
      setTaBort((prev) => ({ ...prev, [anställd.id]: true }));

      await taBortLönespec(lönespec.id);

      setNyaLönespecar((prev) => {
        const nya = { ...prev };
        delete nya[anställd.id];
        return nya;
      });

      setBefintligaLönespecar((prev) => {
        const nya = { ...prev };
        delete nya[anställd.id];
        return nya;
      });
    } catch (error) {
      console.error("Fel vid borttagning av lönespec:", error);
      alert("❌ Kunde inte ta bort lönespec");
    } finally {
      setTaBort((prev) => ({ ...prev, [anställd.id]: false }));
    }
  };

  const harLönespec = (anställdId: string) => {
    return !!befintligaLönespecar[anställdId] || !!nyaLönespecar[anställdId];
  };

  const getLönespec = (anställdId: string) => {
    return nyaLönespecar[anställdId] || befintligaLönespecar[anställdId];
  };

  const löneperiod = getLöneperiod();

  // Helper to build batch data for modal
  const batchLönespecList = Object.values({ ...befintligaLönespecar, ...nyaLönespecar })
    .map((lönespec: any) => {
      const anst = anställda.find(
        (a) =>
          a.id === lönespec.anställd_id ||
          a.id === lönespec.anstalld_id ||
          a.id === lönespec.anställd?.id
      );
      return {
        lönespec,
        anställd: anst,
        företagsprofil: {},
        extrarader: [],
        beräknadeVärden: {},
      };
    })
    .filter((item) => item.lönespec && item.anställd);

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-white font-semibold">
          Lönekörning {utbetalningsdatum?.toLocaleDateString("sv-SE")} ({anställda.length}{" "}
          anställda)
        </h5>
        {/* Batch action buttons removed from header area to avoid duplication */}
      </div>
      {loading || laddaLönespecar ? (
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
                  {harLönespec(anställd.id) ? (
                    <>
                      <Lonespecar
                        anställd={anställd}
                        specificLönespec={getLönespec(anställd.id)}
                        ingenAnimering={true}
                        visaExtraRader={true}
                      />
                      <div className="flex gap-2 mt-2 justify-between items-center">
                        <Knapp
                          text="👁️ Förhandsgranska/PDF"
                          onClick={() => {
                            setFörhandsgranskaId(anställd.id);
                            setFörhandsgranskaData({
                              lönespec: getLönespec(anställd.id),
                              anställd,
                              företagsprofil: {},
                              extrarader: [],
                              beräknadeVärden: {},
                            });
                          }}
                        />
                        <div className="flex-1" />
                        <Knapp
                          text="🗑️ Ta bort lönespec"
                          loading={taBort[anställd.id]}
                          onClick={() => handleTaBortLönespec(anställd)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Knapp
                          text="✚ Skapa ny lönespec"
                          loading={sparar[anställd.id]}
                          loadingText="⏳ Skapar..."
                          onClick={() => handleSkapaNyLönespec(anställd)}
                        />
                      </div>
                      <div className="text-gray-400 text-center py-4">
                        Ingen lönespec för{" "}
                        {löneperiod ? `${löneperiod.månad}/${löneperiod.år}` : ""}
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
      {förhandsgranskaId && förhandsgranskaData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-black"
              onClick={() => setFörhandsgranskaId(null)}
              aria-label="Stäng"
            >
              ×
            </button>
            <Forhandsgranskning
              lönespec={förhandsgranskaData.lönespec}
              anställd={förhandsgranskaData.anställd}
              företagsprofil={förhandsgranskaData.företagsprofil}
              extrarader={förhandsgranskaData.extrarader}
              beräknadeVärden={förhandsgranskaData.beräknadeVärden}
              onStäng={() => setFörhandsgranskaId(null)}
            />
          </div>
        </div>
      )}
      {/* Batch-knappar under listan borttagna! */}
    </>
  );
}

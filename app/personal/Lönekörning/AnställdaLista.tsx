"use client";

import { useState, useEffect, useCallback } from "react";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import Lönespecar from "../Lönespecar/Lönespecar";
import { skapaNyLönespec, taBortLönespec, hämtaLönespecifikationer } from "../actions";

interface AnställdaListaProps {
  anställda: any[];
  loading: boolean;
  utbetalningsdatum: Date | null;
  onLönespecarChange?: (lönespecar: Record<string, any>) => void;
}

export default function AnställdaLista({
  anställda,
  loading,
  utbetalningsdatum,
  onLönespecarChange,
}: AnställdaListaProps) {
  const [sparar, setSparar] = useState<Record<string, boolean>>({});
  const [taBort, setTaBort] = useState<Record<string, boolean>>({});
  const [befintligaLönespecar, setBefintligaLönespecar] = useState<Record<string, any>>({});
  const [nyaLönespecar, setNyaLönespecar] = useState<Record<string, any>>({});
  const [laddaLönespecar, setLaddaLönespecar] = useState(false);

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
      } catch (error) {
        console.error("❌ Fel vid laddning av lönespecar:", error);
      } finally {
        setLaddaLönespecar(false);
      }
    };

    laddaBefintligaLönespecar();
  }, [anställda, utbetalningsdatum, getLöneperiod]);

  // ✅ Skicka upp lönespecar till föräldrakomponent
  useEffect(() => {
    if (onLönespecarChange) {
      const allaLönespecar = { ...befintligaLönespecar, ...nyaLönespecar };
      onLönespecarChange(allaLönespecar);
    }
  }, [befintligaLönespecar, nyaLönespecar, onLönespecarChange]);

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
        alert(
          `✅ Lönespec skapad!\n🏖️ Semester: ${nyLönespec.semesterInfo.message}`
        );
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

  return (
    <>
      <div className="flex justify-between items-center mb-3">
        <h5 className="text-white font-semibold">
          Lönekörning {utbetalningsdatum?.toLocaleDateString("sv-SE")} ({anställda.length}{" "}
          anställda)
        </h5>
        {/* ❌ BankgiroExport borttaget härifrån */}
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
                    <Lönespecar
                      anställd={anställd}
                      specificLönespec={getLönespec(anställd.id)}
                      ingenAnimering={true}
                      onTaBortLönespec={() => handleTaBortLönespec(anställd)}
                      taBortLoading={taBort[anställd.id]}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Knapp
                          text="➕ Skapa ny lönespec"
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
    </>
  );
}

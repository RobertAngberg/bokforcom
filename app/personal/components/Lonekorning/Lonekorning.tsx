//#region Imports
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Toast from "../../../_components/Toast";
import {
  hämtaAllaLönespecarFörUser,
  markeraBankgiroExporterad,
  markeraMailad,
  markeraBokförd,
  markeraAGIGenererad,
  markeraSkatternaBokförda,
} from "../../actions/lonespecarActions";
import { hämtaAllaAnställda, hämtaFöretagsprofil } from "../../actions/anstalldaActions";
import { hämtaUtlägg } from "../../actions/utlaggActions";
import { bokförLöneskatter, bokförLöneutbetalning } from "../../actions/bokforingActions";
import { Lönekörning } from "../../types/types";
import {
  hämtaLönespecifikationerFörLönekörning,
  uppdateraLönekörningSteg,
  taBortLönekörning,
} from "../../actions/lonekorningActions";
import BankgiroExport from "./BankgiroExport";
import BokforLoner from "../Anstallda/Lonespecar/BokforLoner";
import MailaLonespec from "../Anstallda/Lonespecar/MailaLonespec";
import Knapp from "../../../_components/Knapp";
import TillbakaPil from "../../../_components/TillbakaPil";
import { useLonespec } from "../../hooks/useLonespecar";
import LoadingSpinner from "../../../_components/LoadingSpinner";
import SkatteBokforingModal from "./SkatteBokforingModal";
import NySpecModal from "./NySpecModal";
import NyLonekorningModal from "./NyLonekorningModal";
import LonekorningLista from "./LonekorningLista";
import UtbetalningsdatumValjare from "./UtbetalningsdatumValjare";
import LonespecLista from "./LonespecLista";
import AGIGenerator from "./AGIGenerator";
import SkatteManager from "./SkatteManager";
import LonespecManager from "./LonespecManager";
//#endregion

//#region Types
interface LonekorningProps {
  anställda?: any[];
  anställdaLoading?: boolean;
  onAnställdaRefresh?: () => void;
}
//#endregion

//#region Component
export default function Lonekorning({
  anställda: propsAnställda,
  anställdaLoading: propsAnställdaLoading,
  onAnställdaRefresh,
}: LonekorningProps = {}) {
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nyLonekorningModalOpen, setNyLonekorningModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const [valdLonekorning, setValdLonekorning] = useState<Lönekörning | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lönekörningSpecar, setLönekörningSpecar] = useState<any[]>([]);
  const [taBortLoading, setTaBortLoading] = useState(false);
  const { extrarader, beräknadeVärden } = useLonespec();
  //#endregion

  //#region State
  const [loading, setLoading] = useState(!propsAnställda); // Only start loading if no props
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<string | null>(null);
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [specarPerDatum, setSpecarPerDatum] = useState<Record<string, any[]>>({});
  const [datumLista, setDatumLista] = useState<string[]>([]);
  const [valdaSpecar, setValdaSpecar] = useState<any[]>([]);
  const [localAnställda, setLocalAnställda] = useState<any[]>([]);
  const [utlaggMap, setUlaggMap] = useState<Record<number, any[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);
  const [skatteDatum, setSkatteDatum] = useState<Date | null>(null);
  const [skatteBokförPågår, setSkatteBokförPågår] = useState(false);

  // Use props anställda if available, otherwise fall back to local state
  const anstallda = propsAnställda || localAnställda;
  const anställdaLoading = propsAnställdaLoading || loading;
  //#endregion

  //#region Skatteberäkningar
  const skatteManager = SkatteManager({
    valdaSpecar: lönekörningSpecar, // Använd lönekörningSpecar
    beräknadeVärden,
    skatteDatum,
    setSkatteBokförPågår,
    setSkatteModalOpen,
    bokförLöneskatter,
    onSkatteComplete: async () => {
      // Markera alla lönespecar som skatter-bokförda
      for (const spec of lönekörningSpecar) {
        // Använd lönekörningSpecar
        if (!spec.skatter_bokförda) {
          await markeraSkatternaBokförda(spec.id);
        }
      }
      // Refresha data för att visa uppdaterade knappar
      await loadLönekörningSpecar(); // Ladda om lönekörningspecar istället
    },
  });

  const lonespecManager = LonespecManager({
    valdaSpecar,
    setValdaSpecar,
    specarPerDatum,
    setSpecarPerDatum,
    datumLista,
    setDatumLista,
    utbetalningsdatum,
    setUtbetalningsdatum,
  });

  const skatteData = skatteManager.beräknaSkatteData();
  //#endregion

  //#region Effects
  useEffect(() => {
    // Only fetch data if no props are provided (fallback behavior)
    if (!propsAnställda) {
      // Hämta och gruppera alla lönespecar per utbetalningsdatum
      const fetchData = async () => {
        setLoading(true);
        try {
          const [specar, anstallda] = await Promise.all([
            hämtaAllaLönespecarFörUser(),
            hämtaAllaAnställda(),
          ]);
          setLocalAnställda(anstallda);
          // Hämta utlägg för varje anställd parallellt
          const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
          const utlaggResults = await Promise.all(utlaggPromises);
          const utlaggMap: Record<number, any[]> = {};
          anstallda.forEach((a, idx) => {
            utlaggMap[a.id] = utlaggResults[idx];
          });
          setUlaggMap(utlaggMap);
          // Gruppera per utbetalningsdatum och ta bort tomma datum
          const grupperat: Record<string, any[]> = {};
          specar.forEach((spec) => {
            if (spec.utbetalningsdatum) {
              if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
              grupperat[spec.utbetalningsdatum].push(spec);
            }
          });
          // Ta bort datum med 0 lönespecar
          const grupperatUtanTomma = Object.fromEntries(
            Object.entries(grupperat).filter(([_, list]) => list.length > 0)
          );
          const datumSort = Object.keys(grupperatUtanTomma).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
          );
          setDatumLista(datumSort);
          setSpecarPerDatum(grupperatUtanTomma);
          // Förvalt: visa lönespecar för senaste datum
          if (datumSort.length > 0) {
            setUtbetalningsdatum(datumSort[0]);
            setValdaSpecar(grupperatUtanTomma[datumSort[0]]);
          } else {
            setUtbetalningsdatum(null);
            setValdaSpecar([]);
          }
        } catch (error) {
          console.error("❌ Fel vid laddning av lönekörning:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [propsAnställda]);

  useEffect(() => {
    // Uppdatera valda lönespecar när datum ändras
    if (utbetalningsdatum && specarPerDatum[utbetalningsdatum]) {
      setValdaSpecar(specarPerDatum[utbetalningsdatum]);
    }
  }, [utbetalningsdatum, specarPerDatum]);

  // Ladda lönespecar för vald lönekörning
  useEffect(() => {
    if (valdLonekorning) {
      loadLönekörningSpecar();
    }
  }, [valdLonekorning]);

  const loadLönekörningSpecar = async () => {
    if (!valdLonekorning) return;

    try {
      setLoading(true);
      const result = await hämtaLönespecifikationerFörLönekörning(valdLonekorning.id);

      if (result.success && result.data) {
        setLönekörningSpecar(result.data);
      } else {
        console.error("❌ Fel vid laddning av lönespecar:", result.error);
        setLönekörningSpecar([]);
      }
    } catch (error) {
      console.error("❌ Fel vid laddning av lönespecar:", error);
      setLönekörningSpecar([]);
    } finally {
      setLoading(false);
    }
  };

  // Funktion för att ta bort lönekörning
  const handleTaBortLönekörning = async () => {
    if (!valdLonekorning) return;

    const bekräfta = confirm(
      `Är du säker på att du vill ta bort lönekörningen för ${valdLonekorning.period}?\n\nDetta kommer att:\n- Ta bort alla lönespecifikationer\n- Ta bort all workflow-data\n- Detta kan INTE ångras!`
    );

    if (!bekräfta) return;

    try {
      setTaBortLoading(true);
      const result = await taBortLönekörning(valdLonekorning.id);

      if (result.success) {
        // Gå tillbaka till listan och refresha
        setValdLonekorning(null);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        alert(`Fel vid borttagning: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönekörning:", error);
      alert("Ett oväntat fel uppstod vid borttagning");
    } finally {
      setTaBortLoading(false);
    }
  };
  //#endregion

  // Refresh-funktion för att ladda om data efter statusuppdateringar
  const refreshData = async () => {
    // If props are provided, use the refresh callback
    if (propsAnställda && onAnställdaRefresh) {
      onAnställdaRefresh();
      return;
    }

    // Otherwise, refresh local data
    try {
      const [specar, anstallda] = await Promise.all([
        hämtaAllaLönespecarFörUser(),
        hämtaAllaAnställda(),
      ]);
      setLocalAnställda(anstallda);

      // Hämta utlägg för varje anställd parallellt
      const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
      const utlaggResults = await Promise.all(utlaggPromises);
      const utlaggMap: Record<number, any[]> = {};
      anstallda.forEach((a, idx) => {
        utlaggMap[a.id] = utlaggResults[idx];
      });
      setUlaggMap(utlaggMap);

      // Gruppera per utbetalningsdatum och ta bort tomma datum
      const grupperat: Record<string, any[]> = {};
      specar.forEach((spec) => {
        if (spec.utbetalningsdatum) {
          if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
          grupperat[spec.utbetalningsdatum].push(spec);
        }
      });
      const grupperatUtanTomma = Object.fromEntries(
        Object.entries(grupperat).filter(([_, list]) => list.length > 0)
      );
      const datumSort = Object.keys(grupperatUtanTomma).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      setDatumLista(datumSort);
      setSpecarPerDatum(grupperatUtanTomma);

      // Uppdatera valda lönespecar för aktuellt datum
      if (utbetalningsdatum && grupperatUtanTomma[utbetalningsdatum]) {
        setValdaSpecar(grupperatUtanTomma[utbetalningsdatum]);
      }
    } catch (error) {
      console.error("❌ Fel vid refresh av data:", error);
    }
  };

  const { data: session } = useSession();

  const agiGenerator = AGIGenerator({
    valdaSpecar,
    anstallda,
    beräknadeVärden,
    extrarader,
    utbetalningsdatum,
    session,
    hämtaFöretagsprofil,
    onAGIComplete: async () => {
      // Markera alla lönespecar som AGI-genererade
      for (const spec of valdaSpecar) {
        if (!spec.agi_genererad) {
          await markeraAGIGenererad(spec.id);
        }
      }
      // Refresha data för att visa uppdaterade knappar
      await refreshData();
    },
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header med knappar */}
      <div className="flex justify-end items-center">
        <div className="flex gap-3">
          {!valdLonekorning && ( // Visa bara när ingen lönekörning är vald
            <Knapp text="Ny lönekörning" onClick={() => setNyLonekorningModalOpen(true)} />
          )}
          {valdLonekorning && ( // Visa bara när en lönekörning är vald
            <Knapp
              text={taBortLoading ? "🗑️ Tar bort..." : "🗑️ Ta bort lönekörning"}
              onClick={handleTaBortLönekörning}
              disabled={taBortLoading}
            />
          )}
        </div>
      </div>

      {/* Lönekörnings-lista - bara när ingen är vald */}
      {!valdLonekorning && (
        <LonekorningLista
          onValjLonekorning={(lonekorning: Lönekörning) => setValdLonekorning(lonekorning)}
          valdLonekorning={valdLonekorning}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Nya modaler */}
      <NyLonekorningModal
        isOpen={nyLonekorningModalOpen}
        onClose={() => setNyLonekorningModalOpen(false)}
        onLonekorningCreated={async (nyLonekorning: any) => {
          setRefreshTrigger((prev) => prev + 1); // Trigga refresh
          setValdLonekorning(nyLonekorning); // Välj den nya lönekörningen automatiskt
          setNyLonekorningModalOpen(false);
          // Ladda lönespecifikationer för den nya lönekörningen automatiskt
          setTimeout(() => {
            loadLönekörningSpecar();
          }, 100); // Kort delay för att säkerställa att valdLonekorning är satt
        }}
      />

      {/* UI som visas när lönekörning är vald */}
      {valdLonekorning && (
        <>
          <NySpecModal
            isOpen={nySpecModalOpen}
            onClose={() => setNySpecModalOpen(false)}
            nySpecDatum={nySpecDatum}
            setNySpecDatum={setNySpecDatum}
            anstallda={anstallda}
            onSpecCreated={async () => {
              // Refresh data using the centralized function
              await refreshData();
            }}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <LonespecLista
              valdaSpecar={lönekörningSpecar}
              anstallda={anstallda}
              utlaggMap={utlaggMap}
              lönekörning={valdLonekorning} // Skicka hela lönekörning-objektet
              onTaBortSpec={lonespecManager.hanteraTaBortSpec}
              onHämtaBankgiro={() => setBankgiroModalOpen(true)}
              onMailaSpecar={async () => {
                console.log("📧 onMailaSpecar anropad!");

                // Uppdatera UI FÖRST för smidig UX
                if (valdLonekorning?.id) {
                  setValdLonekorning((prev) =>
                    prev
                      ? {
                          ...prev,
                          aktuellt_steg: 2,
                          mailade_datum: new Date(),
                        }
                      : prev
                  );

                  // Spara till DB i bakgrunden
                  uppdateraLönekörningSteg(valdLonekorning.id, 2).then((result) => {
                    if (result.success) {
                      console.log("✅ Lönekörning uppdaterad till steg 2");
                    } else {
                      console.error("❌ Fel vid uppdatering:", result.error);
                      // Återställ vid fel
                      setValdLonekorning((prev) =>
                        prev
                          ? {
                              ...prev,
                              aktuellt_steg: 1,
                              mailade_datum: undefined,
                            }
                          : prev
                      );
                    }
                  });
                }

                setBatchMailModalOpen(true);
              }}
              onBokför={async () => {
                console.log("🔥 onBokför anropad från LonespecLista!");

                // Uppdatera UI FÖRST för smidig UX
                if (valdLonekorning?.id) {
                  setValdLonekorning((prev) =>
                    prev
                      ? {
                          ...prev,
                          aktuellt_steg: 3,
                          bokford_datum: new Date(),
                        }
                      : prev
                  );

                  // Spara till DB i bakgrunden
                  uppdateraLönekörningSteg(valdLonekorning.id, 3).then((result) => {
                    if (result.success) {
                      console.log("✅ Lönekörning uppdaterad till steg 3");
                    } else {
                      console.error("❌ Fel vid uppdatering:", result.error);
                      // Återställ vid fel
                      setValdLonekorning((prev) =>
                        prev
                          ? {
                              ...prev,
                              aktuellt_steg: 2,
                              bokford_datum: undefined,
                            }
                          : prev
                      );
                    }
                  });
                }

                setBokforModalOpen(true);
              }}
              onGenereraAGI={async () => {
                console.log("📊 onGenereraAGI anropad!");

                // Uppdatera UI FÖRST för smidig UX
                if (valdLonekorning?.id) {
                  setValdLonekorning((prev) =>
                    prev
                      ? {
                          ...prev,
                          aktuellt_steg: 4,
                          agi_genererad_datum: new Date(),
                        }
                      : prev
                  );

                  // Kör AGI i bakgrunden
                  agiGenerator.hanteraAGI();

                  // Spara till DB i bakgrunden
                  uppdateraLönekörningSteg(valdLonekorning.id, 4).then((result) => {
                    if (result.success) {
                      console.log("✅ Lönekörning uppdaterad till steg 4");
                    } else {
                      console.error("❌ Fel vid uppdatering:", result.error);
                      // Återställ vid fel
                      setValdLonekorning((prev) =>
                        prev
                          ? {
                              ...prev,
                              aktuellt_steg: 3,
                              agi_genererad_datum: undefined,
                            }
                          : prev
                      );
                    }
                  });
                }
              }}
              onBokförSkatter={async () => {
                console.log("💰 onBokförSkatter anropad!");

                // Uppdatera UI FÖRST för smidig UX
                if (valdLonekorning?.id) {
                  setValdLonekorning((prev) =>
                    prev
                      ? {
                          ...prev,
                          aktuellt_steg: 5,
                          skatter_bokforda_datum: new Date(),
                          status: "avslutad" as const,
                          avslutad_datum: new Date(),
                        }
                      : prev
                  );

                  // Spara till DB i bakgrunden
                  uppdateraLönekörningSteg(valdLonekorning.id, 5).then((result) => {
                    if (result.success) {
                      console.log("✅ Lönekörning uppdaterad till steg 5 (KOMPLETT!)");
                    } else {
                      console.error("❌ Fel vid uppdatering:", result.error);
                      // Återställ vid fel
                      setValdLonekorning((prev) =>
                        prev
                          ? {
                              ...prev,
                              aktuellt_steg: 4,
                              skatter_bokforda_datum: undefined,
                              status: "pågående" as const,
                              avslutad_datum: undefined,
                            }
                          : prev
                      );
                    }
                  });
                }

                setSkatteModalOpen(true);
              }}
              onRefreshData={async () => {
                await loadLönekörningSpecar();
                // Force re-render genom att sätta loading kort
                setLoading(true);
                setTimeout(() => setLoading(false), 10);
              }}
            />
          )}

          {bankgiroModalOpen && (
            <BankgiroExport
              anställda={anstallda}
              utbetalningsdatum={utbetalningsdatum ? new Date(utbetalningsdatum) : null}
              lönespecar={Object.fromEntries(valdaSpecar.map((spec) => [spec.anställd_id, spec]))}
              open={true}
              showButton={false}
              onClose={() => setBankgiroModalOpen(false)}
              onExportComplete={async () => {
                // Markera alla lönespecar som bankgiro-exporterade
                for (const spec of valdaSpecar) {
                  if (!spec.bankgiro_exporterad) {
                    await markeraBankgiroExporterad(spec.id);
                  }
                }
                // Refresha data för att visa uppdaterade knappar
                await refreshData();
                setBankgiroModalOpen(false);
              }}
            />
          )}

          {batchMailModalOpen && (
            <MailaLonespec
              batch={lönekörningSpecar.map((spec) => ({
                lönespec: spec,
                anställd: anstallda.find((a) => a.id === spec.anställd_id),
                företagsprofil: undefined,
                extrarader: [],
                beräknadeVärden: {},
              }))}
              batchMode={true}
              open={true}
              onClose={() => setBatchMailModalOpen(false)}
              onMailComplete={async () => {
                // Markera alla lönespecar som mailade
                for (const spec of lönekörningSpecar) {
                  if (!spec.mailad) {
                    await markeraMailad(spec.id);
                  }
                }
                // Refresha data för att visa uppdaterade knappar
                await loadLönekörningSpecar();
                // Force re-render genom att sätta loading kort
                setLoading(true);
                setTimeout(() => setLoading(false), 10);
                setBatchMailModalOpen(false);
              }}
            />
          )}

          {bokforModalOpen && lönekörningSpecar.length > 0 && (
            <BokforLoner
              lönespec={{
                ...lönekörningSpecar[0], // Använd första som bas
                // Summera alla värden från alla lönespecar
                bruttolön: (() => {
                  console.log("🔍 lönekörningSpecar för bokföring:", lönekörningSpecar);
                  const totalBrutto = lönekörningSpecar.reduce((sum, spec) => {
                    const brutto = parseFloat(spec.bruttolön) || 0;
                    console.log(`💰 Spec ${spec.id}: bruttolön=${brutto}`);
                    return sum + brutto;
                  }, 0);
                  console.log(`📊 TOTAL BRUTTOLÖN: ${totalBrutto}`);
                  return totalBrutto;
                })(),
                sociala_avgifter: (() => {
                  const totalSociala = lönekörningSpecar.reduce((sum, spec) => {
                    const sociala = parseFloat(spec.sociala_avgifter) || 0;
                    console.log(`🏛️ Spec ${spec.id}: sociala_avgifter=${sociala}`);
                    return sum + sociala;
                  }, 0);
                  console.log(`📊 TOTAL SOCIALA AVGIFTER: ${totalSociala}`);
                  return totalSociala;
                })(),
                skatt: (() => {
                  const totalSkatt = lönekörningSpecar.reduce((sum, spec) => {
                    const skatt = parseFloat(spec.skatt) || 0;
                    console.log(`💸 Spec ${spec.id}: skatt=${skatt}`);
                    return sum + skatt;
                  }, 0);
                  console.log(`📊 TOTAL SKATT: ${totalSkatt}`);
                  return totalSkatt;
                })(),
                nettolön: (() => {
                  const totalNetto = lönekörningSpecar.reduce((sum, spec) => {
                    const netto = parseFloat(spec.nettolön) || 0;
                    console.log(`💵 Spec ${spec.id}: nettolön=${netto}`);
                    return sum + netto;
                  }, 0);
                  console.log(`📊 TOTAL NETTOLÖN: ${totalNetto}`);
                  return totalNetto;
                })(),
                lönekostnad: (() => {
                  const totalKostnad = lönekörningSpecar.reduce((sum, spec) => {
                    const kostnad = parseFloat(spec.lönekostnad) || 0;
                    console.log(`🏪 Spec ${spec.id}: lönekostnad=${kostnad}`);
                    return sum + kostnad;
                  }, 0);
                  console.log(`📊 TOTAL LÖNEKOSTNAD: ${totalKostnad}`);
                  return totalKostnad;
                })(),
              }}
              extrarader={lönekörningSpecar.flatMap((spec) => extrarader[spec.id] || [])} // Kombinera alla extrarader
              beräknadeVärden={{
                bruttolön: lönekörningSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.bruttolön || parseFloat(spec.bruttolön) || 0),
                  0
                ),
                socialaAvgifter: lönekörningSpecar.reduce(
                  (sum, spec) =>
                    sum +
                    (beräknadeVärden[spec.id]?.socialaAvgifter ||
                      parseFloat(spec.sociala_avgifter) ||
                      0),
                  0
                ),
                skatt: lönekörningSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.skatt || parseFloat(spec.skatt) || 0),
                  0
                ),
                nettolön: lönekörningSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.nettolön || parseFloat(spec.nettolön) || 0),
                  0
                ),
                lönekostnad: lönekörningSpecar.reduce(
                  (sum, spec) =>
                    sum +
                    (beräknadeVärden[spec.id]?.lönekostnad || parseFloat(spec.lönekostnad) || 0),
                  0
                ),
              }}
              anställdNamn={`Batch-bokföring (${lönekörningSpecar.length} anställda)`}
              isOpen={true}
              onClose={() => setBokforModalOpen(false)}
              onBokfört={async () => {
                // Bokför alla lönespecar
                for (const spec of valdaSpecar) {
                  if (!spec.bokförd) {
                    const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
                    const anställdNamn =
                      `${anstalld?.förnamn || ""} ${anstalld?.efternamn || ""}`.trim();

                    try {
                      await bokförLöneutbetalning({
                        lönespecId: spec.id,
                        utbetalningsdatum:
                          utbetalningsdatum || new Date().toISOString().split("T")[0],
                        period:
                          utbetalningsdatum ||
                          new Date().toISOString().split("T")[0].substring(0, 7),
                        anställdNamn: anställdNamn,
                        extrarader: extrarader[spec.id] || [],
                        beräknadeVärden: beräknadeVärden[spec.id] || {},
                        kommentar: `Löneutbetalning ${anställdNamn}, period ${utbetalningsdatum}`,
                      });
                    } catch (error) {
                      console.error(`Fel vid bokföring av ${anställdNamn}:`, error);
                    }
                  }
                }
                await refreshData();
                setBokforModalOpen(false);
              }}
            />
          )}

          <SkatteBokforingModal
            skatteModalOpen={skatteModalOpen}
            setSkatteModalOpen={setSkatteModalOpen}
            valdaSpecar={lönekörningSpecar} // Använd lönekörningSpecar istället för valdaSpecar
            skatteData={skatteData}
            utbetalningsdatum={utbetalningsdatum}
            skatteDatum={skatteDatum}
            setSkatteDatum={setSkatteDatum}
            hanteraBokförSkatter={skatteManager.hanteraBokförSkatter}
            skatteBokförPågår={skatteBokförPågår}
            onHämtaBankgiro={() => {
              // Direkt nedladdning av bankgirofil
              const specarAttAnvända = valdLonekorning ? lönekörningSpecar : valdaSpecar;

              if (specarAttAnvända.length === 0) {
                alert("Inga lönespecifikationer att exportera!");
                return;
              }

              if (!utbetalningsdatum) {
                alert("Utbetalningsdatum saknas!");
                return;
              }

              const datum = new Date(utbetalningsdatum)
                .toISOString()
                .slice(2, 10)
                .replace(/-/g, "");

              let fil = "";

              // Header
              const header = `01${datum}  LÖN${" ".repeat(46)}SEK1234560001123456789   \n`;
              fil += header;

              // Betalningsposter
              specarAttAnvända.forEach((spec) => {
                const anställd = anstallda.find((a) => a.id === spec.anställd_id);
                if (!anställd) return;

                const nettolön = Math.round(parseFloat(spec.nettolön || 0) * 100);
                const clearingPadded = (anställd.clearingnummer || "0000").padStart(4, "0");
                const kontoPadded = (anställd.bankkonto || "0").padStart(10, "0");
                const beloppPadded = nettolön.toString().padStart(12, "0");
                const namn = `Lön ${anställd.förnamn} ${anställd.efternamn}`.substring(0, 12);

                const betalning = `35${datum}    ${clearingPadded}${kontoPadded}${beloppPadded}${" ".repeat(18)}${kontoPadded}${namn.padEnd(12, " ")}\n`;
                fil += betalning;
              });

              // Slutpost
              const totalBelopp = specarAttAnvända.reduce(
                (sum, spec) => sum + parseFloat(spec.nettolön || 0),
                0
              );
              const totalÖre = Math.round(totalBelopp * 100);
              const antalPoster = specarAttAnvända.length.toString().padStart(8, "0");
              const totalBeloppPadded = totalÖre.toString().padStart(12, "0");

              const slutpost = `09${datum}${" ".repeat(20)}${totalBeloppPadded}${antalPoster}${" ".repeat(40)}\n`;
              fil += slutpost;

              // Ladda ner filen
              const blob = new Blob([fil], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `loner_${datum}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} // Lägg till bankgiro-funktionen
          />
        </>
      )}

      {/* Toast för skatte-bokföring */}
      {skatteManager.toast && (
        <Toast
          message={skatteManager.toast.message}
          type={skatteManager.toast.type}
          onClose={() => skatteManager.setToast(null)}
        />
      )}
    </div>
  );
}

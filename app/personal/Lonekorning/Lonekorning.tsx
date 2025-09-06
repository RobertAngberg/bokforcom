//#region Imports
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  hämtaAllaLönespecarFörUser,
  hämtaAllaAnställda,
  hämtaUtlägg,
  hämtaFöretagsprofil,
  bokförLöneskatter,
  bokförLöneutbetalning,
  markeraBankgiroExporterad,
  markeraMailad,
  markeraBokförd,
  markeraAGIGenererad,
  markeraSkatternaBokförda,
} from "../actions";
import BankgiroExport from "./BankgiroExport";
import BokforLoner from "../Lonespecar/BokforLoner";
import MailaLonespec from "../Lonespecar/MailaLonespec";
import Knapp from "../../_components/Knapp";
import { useLonespecContext } from "../Lonespecar/LonespecContext";
import LoadingSpinner from "../../_components/LoadingSpinner";
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

//#region Component
export default function Lonekorning() {
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nyLonekorningModalOpen, setNyLonekorningModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const [valdLonekorning, setValdLonekorning] = useState<any>(null);
  const { extrarader, beräknadeVärden } = useLonespecContext();
  //#endregion

  //#region State
  const [loading, setLoading] = useState(true);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<string | null>(null);
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
  const [specarPerDatum, setSpecarPerDatum] = useState<Record<string, any[]>>({});
  const [datumLista, setDatumLista] = useState<string[]>([]);
  const [valdaSpecar, setValdaSpecar] = useState<any[]>([]);
  const [anstallda, setAnstallda] = useState<any[]>([]);
  const [utlaggMap, setUlaggMap] = useState<Record<number, any[]>>({});
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [bankgiroModalOpen, setBankgiroModalOpen] = useState(false);
  const [skatteModalOpen, setSkatteModalOpen] = useState(false);
  const [skatteDatum, setSkatteDatum] = useState<Date | null>(null);
  const [skatteBokförPågår, setSkatteBokförPågår] = useState(false);
  //#endregion

  //#region Skatteberäkningar
  const skatteManager = SkatteManager({
    valdaSpecar,
    beräknadeVärden,
    skatteDatum,
    setSkatteBokförPågår,
    setSkatteModalOpen,
    bokförLöneskatter,
    onSkatteComplete: async () => {
      // Markera alla lönespecar som skatter-bokförda
      for (const spec of valdaSpecar) {
        if (!spec.skatter_bokförda) {
          await markeraSkatternaBokförda(spec.id);
        }
      }
      // Refresha data för att visa uppdaterade knappar
      await refreshData();
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
    // Hämta och gruppera alla lönespecar per utbetalningsdatum
    const fetchData = async () => {
      setLoading(true);
      try {
        const [specar, anstallda] = await Promise.all([
          hämtaAllaLönespecarFörUser(),
          hämtaAllaAnställda(),
        ]);
        setAnstallda(anstallda);
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
  }, []);

  useEffect(() => {
    // Uppdatera valda lönespecar när datum ändras
    if (utbetalningsdatum && specarPerDatum[utbetalningsdatum]) {
      setValdaSpecar(specarPerDatum[utbetalningsdatum]);
    }
  }, [utbetalningsdatum, specarPerDatum]);
  //#endregion

  // Refresh-funktion för att ladda om data efter statusuppdateringar
  const refreshData = async () => {
    try {
      const [specar, anstallda] = await Promise.all([
        hämtaAllaLönespecarFörUser(),
        hämtaAllaAnställda(),
      ]);
      setAnstallda(anstallda);

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Lönekörningar</h2>
        <div className="flex gap-3">
          <Knapp text="🏗️ Ny lönekörning" onClick={() => setNyLonekorningModalOpen(true)} />
          {valdLonekorning && (
            <Knapp text="👤 Lägg till anställd" onClick={() => setNySpecModalOpen(true)} />
          )}
        </div>
      </div>

      {/* Lönekörnings-lista */}
      <LonekorningLista onValjLonekorning={setValdLonekorning} valdLonekorning={valdLonekorning} />

      {/* Nya modaler */}
      <NyLonekorningModal
        isOpen={nyLonekorningModalOpen}
        onClose={() => setNyLonekorningModalOpen(false)}
        onLonekorningCreated={() => {
          console.log("Lönekörning skapad!");
          // TODO: Refresha lönekörningar
        }}
      />

      {/* Info när ingen lönekörning är vald */}
      {!valdLonekorning && (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <div className="text-gray-400">
            <span className="text-4xl mb-4 block">🏗️</span>
            <h3 className="text-lg font-semibold text-white mb-2">
              Välj eller skapa en lönekörning
            </h3>
            <p className="text-sm">
              Skapa en ny lönekörning för att börja hantera löner för en period.
            </p>
          </div>
        </div>
      )}

      {/* Gamla UI som visas när lönekörning är vald */}
      {valdLonekorning && (
        <>
          <div className="bg-slate-700 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Lönekörning: {valdLonekorning.period}</h3>
            <p className="text-gray-300 text-sm">
              Status: {valdLonekorning.status} • Startad:{" "}
              {valdLonekorning.startad_datum?.toLocaleDateString?.("sv-SE") || "Okänt datum"}
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <Knapp text="📝 Skapa ny lönespecifikation" onClick={() => setNySpecModalOpen(true)} />
          </div>

          <NySpecModal
            isOpen={nySpecModalOpen}
            onClose={() => setNySpecModalOpen(false)}
            nySpecDatum={nySpecDatum}
            setNySpecDatum={setNySpecDatum}
            anstallda={anstallda}
            onSpecCreated={async () => {
              // Refresh lönespecar
              const [specar, anstallda] = await Promise.all([
                hämtaAllaLönespecarFörUser(),
                hämtaAllaAnställda(),
              ]);
              setAnstallda(anstallda);
              const utlaggPromises = anstallda.map((a) => hämtaUtlägg(a.id));
              const utlaggResults = await Promise.all(utlaggPromises);
              const utlaggMap: Record<number, any[]> = {};
              anstallda.forEach((a, idx) => {
                utlaggMap[a.id] = utlaggResults[idx];
              });
              setUlaggMap(utlaggMap);
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
              if (datumSort.length > 0) {
                setUtbetalningsdatum(datumSort[0]);
                setValdaSpecar(grupperatUtanTomma[datumSort[0]]);
              } else {
                setUtbetalningsdatum(null);
                setValdaSpecar([]);
              }
            }}
          />

          <UtbetalningsdatumValjare
            datumLista={datumLista}
            utbetalningsdatum={utbetalningsdatum}
            setUtbetalningsdatum={setUtbetalningsdatum}
            specarPerDatum={specarPerDatum}
          />

          {utbetalningsdatum && (
            <LonespecLista
              valdaSpecar={valdaSpecar}
              anstallda={anstallda}
              utlaggMap={utlaggMap}
              onTaBortSpec={lonespecManager.hanteraTaBortSpec}
              onHämtaBankgiro={() => setBankgiroModalOpen(true)}
              onMailaSpecar={() => setBatchMailModalOpen(true)}
              onBokför={() => setBokforModalOpen(true)}
              onGenereraAGI={agiGenerator.hanteraAGI}
              onBokförSkatter={() => setSkatteModalOpen(true)}
              onRefreshData={refreshData}
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
              batch={valdaSpecar.map((spec) => ({
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
                for (const spec of valdaSpecar) {
                  if (!spec.mailad) {
                    await markeraMailad(spec.id);
                  }
                }
                // Refresha data för att visa uppdaterade knappar
                await refreshData();
                setBatchMailModalOpen(false);
              }}
            />
          )}

          {bokforModalOpen && valdaSpecar.length > 0 && (
            <BokforLoner
              lönespec={{
                ...valdaSpecar[0], // Använd första som bas
                // Summera alla värden från alla lönespecar
                bruttolön: valdaSpecar.reduce(
                  (sum, spec) => sum + (parseFloat(spec.bruttolön) || 0),
                  0
                ),
                sociala_avgifter: valdaSpecar.reduce(
                  (sum, spec) => sum + (parseFloat(spec.sociala_avgifter) || 0),
                  0
                ),
                skatt: valdaSpecar.reduce((sum, spec) => sum + (parseFloat(spec.skatt) || 0), 0),
                nettolön: valdaSpecar.reduce(
                  (sum, spec) => sum + (parseFloat(spec.nettolön) || 0),
                  0
                ),
                lönekostnad: valdaSpecar.reduce(
                  (sum, spec) => sum + (parseFloat(spec.lönekostnad) || 0),
                  0
                ),
              }}
              extrarader={valdaSpecar.flatMap((spec) => extrarader[spec.id] || [])} // Kombinera alla extrarader
              beräknadeVärden={{
                bruttolön: valdaSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.bruttolön || parseFloat(spec.bruttolön) || 0),
                  0
                ),
                socialaAvgifter: valdaSpecar.reduce(
                  (sum, spec) =>
                    sum +
                    (beräknadeVärden[spec.id]?.socialaAvgifter ||
                      parseFloat(spec.sociala_avgifter) ||
                      0),
                  0
                ),
                skatt: valdaSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.skatt || parseFloat(spec.skatt) || 0),
                  0
                ),
                nettolön: valdaSpecar.reduce(
                  (sum, spec) =>
                    sum + (beräknadeVärden[spec.id]?.nettolön || parseFloat(spec.nettolön) || 0),
                  0
                ),
                lönekostnad: valdaSpecar.reduce(
                  (sum, spec) =>
                    sum +
                    (beräknadeVärden[spec.id]?.lönekostnad || parseFloat(spec.lönekostnad) || 0),
                  0
                ),
              }}
              anställdNamn={`Batch-bokföring (${valdaSpecar.length} anställda)`}
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
            valdaSpecar={valdaSpecar}
            skatteData={skatteData}
            utbetalningsdatum={utbetalningsdatum}
            skatteDatum={skatteDatum}
            setSkatteDatum={setSkatteDatum}
            hanteraBokförSkatter={skatteManager.hanteraBokförSkatter}
            skatteBokförPågår={skatteBokförPågår}
          />
        </>
      )}
    </div>
  );
}

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
import AGIDebugModal from "./AGIDebugModal";
import NySpecModal from "./NySpecModal";
import UtbetalningsdatumValjare from "./UtbetalningsdatumValjare";
import LonespecLista from "./LonespecLista";
import AGIGenerator from "./AGIGenerator";
import SkatteManager from "./SkatteManager";
import LonespecManager from "./LonespecManager";
//#endregion

//#region Component
export default function Lonekorning() {
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
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
  const [agiDebugData, setAgiDebugData] = useState<any>(null);
  const [visaDebug, setVisaDebug] = useState(false);
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
    setAgiDebugData,
    setVisaDebug,
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

      {bokforModalOpen && (
        <BokforLoner
          lönespec={valdaSpecar[0]}
          extrarader={valdaSpecar[0] ? extrarader[valdaSpecar[0].id] || [] : []}
          beräknadeVärden={valdaSpecar[0] ? beräknadeVärden[valdaSpecar[0].id] || {} : {}}
          anställdNamn={
            valdaSpecar[0]
              ? (anstallda.find((a) => a.id === valdaSpecar[0].anställd_id)?.förnamn || "") +
                " " +
                (anstallda.find((a) => a.id === valdaSpecar[0].anställd_id)?.efternamn || "")
              : ""
          }
          isOpen={true}
          onClose={() => setBokforModalOpen(false)}
          onBokfört={async () => {
            // Markera alla lönespecar som bokförda
            for (const spec of valdaSpecar) {
              if (!spec.bokförd) {
                await markeraBokförd(spec.id);
              }
            }
            // Refresha data för att visa uppdaterade knappar
            await refreshData();
            setBokforModalOpen(false);
          }}
        />
      )}

      <AGIDebugModal
        visaDebug={visaDebug}
        setVisaDebug={setVisaDebug}
        agiDebugData={agiDebugData}
      />

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
    </div>
  );
}

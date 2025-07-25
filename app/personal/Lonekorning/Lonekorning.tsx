//#region Imports
"use client";

import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { hämtaAllaLönespecarFörUser, hämtaAllaAnställda, hämtaUtlägg } from "../actions";
// import { useLonespecContext } from "../Lonespecar/LonespecContext";
import LönespecView from "../Lonespecar/LonespecView";
import AnstolldaLista from "./AnstalldaLista";
import BankgiroExport from "./BankgiroExport";
import BokforLoner from "../Lonespecar/BokforLoner";
import MailaLonespec from "../Lonespecar/MailaLonespec";
import BokforKnappOchModal from "./BokforKnappOchModal";
import Knapp from "../../_components/Knapp";
import { useLonespecContext } from "../Lonespecar/LonespecContext";
//#endregion

//#region Component
export default function Lonekorning() {
  const [nySpecModalOpen, setNySpecModalOpen] = useState(false);
  const [nySpecDatum, setNySpecDatum] = useState<Date | null>(null);
  const { extrarader, beräknadeVärden } = useLonespecContext();
  //#endregion

  //#region State
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
  //#endregion

  //#region Effects
  useEffect(() => {
    // Hämta och gruppera alla lönespecar per utbetalningsdatum
    const fetchData = async () => {
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

  //#region Render
  // Helper to build batch data for modal
  // ...existing code...
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Knapp text="📝 Skapa ny lönespecifikation" onClick={() => setNySpecModalOpen(true)} />
      </div>
      {nySpecModalOpen && (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-cyan-950 rounded-2xl p-8 shadow-lg min-w-[340px] border border-cyan-800 text-slate-100">
            <h2 className="text-xl font-bold text-cyan-300 mb-6 tracking-wide">
              Välj utbetalningsdatum
            </h2>
            <div className="mb-6">
              <DatePicker
                selected={nySpecDatum}
                onChange={(date) => setNySpecDatum(date)}
                dateFormat="yyyy-MM-dd"
                className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-700"
                placeholderText="Välj datum"
                calendarClassName="bg-slate-900 text-white"
                dayClassName={(date) => "text-cyan-400"}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                className="px-5 py-2 bg-slate-700 text-gray-200 rounded-lg hover:bg-slate-600 transition font-semibold"
                onClick={() => setNySpecModalOpen(false)}
              >
                Avbryt
              </button>
              <button
                className="px-5 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold shadow"
                onClick={async () => {
                  if (!nySpecDatum) {
                    alert("Välj ett datum först!");
                    return;
                  }
                  if (anstallda.length === 0) {
                    alert("Ingen anställd hittades.");
                    return;
                  }
                  let utbetalningsdatum = null;
                  if (nySpecDatum instanceof Date && !isNaN(nySpecDatum.getTime())) {
                    utbetalningsdatum = nySpecDatum.toISOString().slice(0, 10);
                  }
                  if (!utbetalningsdatum) {
                    alert("Fel: utbetalningsdatum saknas eller är ogiltigt!");
                    return;
                  }
                  const res = await import("../actions").then((mod) =>
                    mod.skapaNyLönespec({
                      anställd_id: anstallda[0].id,
                      utbetalningsdatum,
                    })
                  );
                  if (res?.success === false) {
                    alert("Fel: " + (res.error || "Misslyckades att skapa lönespecifikation."));
                  } else {
                    alert("Ny lönespecifikation skapad!");
                    setNySpecModalOpen(false);
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
                        if (!grupperat[spec.utbetalningsdatum])
                          grupperat[spec.utbetalningsdatum] = [];
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
                  }
                }}
              >
                Skapa
              </button>
            </div>
          </div>
        </div>
      )}
      {datumLista.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-2">Välj utbetalningsdatum:</h2>
          <div className="flex flex-col gap-2">
            {datumLista.map((datum) => (
              <a
                key={datum}
                href="#"
                className={`px-3 py-1 rounded bg-slate-700 text-white hover:bg-cyan-600 w-fit ${datum === utbetalningsdatum ? "ring-2 ring-cyan-400" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setUtbetalningsdatum(datum);
                }}
              >
                {new Date(datum).toLocaleDateString("sv-SE")} ({specarPerDatum[datum]?.length ?? 0}{" "}
                lönespecar)
              </a>
            ))}
          </div>
        </div>
      )}
      {utbetalningsdatum && valdaSpecar.length > 0 && (
        <div className="space-y-2">
          {/* ...lönespecar... */}
          <>
            {valdaSpecar.map((spec) => {
              const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
              const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];
              const handleTaBortLönespec = async () => {
                if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) return;
                setTaBortLaddning((prev) => ({ ...prev, [spec.id]: true }));
                try {
                  // Importera taBortLönespec från actions om det behövs
                  const { taBortLönespec } = await import("../actions");
                  const resultat = await taBortLönespec(spec.id);
                  if (resultat.success) {
                    alert("✅ Lönespecifikation borttagen!");
                    // Ta bort från state
                    setValdaSpecar((prev) => prev.filter((s) => s.id !== spec.id));
                    setSpecarPerDatum((prev) => {
                      const updated = { ...prev };
                      if (utbetalningsdatum && updated[utbetalningsdatum]) {
                        updated[utbetalningsdatum] = updated[utbetalningsdatum].filter(
                          (s) => s.id !== spec.id
                        );
                        // If no lönespecar left for this date, remove the date
                        if (updated[utbetalningsdatum].length === 0) {
                          delete updated[utbetalningsdatum];
                        }
                      }
                      return updated;
                    });
                    setDatumLista((prev) => {
                      const filtered = prev.filter((d) => {
                        // Only keep dates that still have lönespecar
                        return (
                          specarPerDatum[d] &&
                          specarPerDatum[d].filter((s) => s.id !== spec.id).length > 0
                        );
                      });
                      // If current utbetalningsdatum is now empty, clear selection
                      if (filtered.indexOf(utbetalningsdatum) === -1) {
                        setUtbetalningsdatum(filtered[0] || null);
                      }
                      return filtered;
                    });
                  } else {
                    alert(`❌ Kunde inte ta bort lönespec: ${resultat.message}`);
                  }
                } catch (error) {
                  console.error("❌ Fel vid borttagning av lönespec:", error);
                  alert("❌ Kunde inte ta bort lönespec");
                } finally {
                  setTaBortLaddning((prev) => ({ ...prev, [spec.id]: false }));
                }
              };
              return (
                <LönespecView
                  key={spec.id}
                  lönespec={spec}
                  anställd={anstalld}
                  utlägg={utlagg}
                  ingenAnimering={false}
                  taBortLoading={taBortLaddning[spec.id] || false}
                  visaExtraRader={true}
                  onTaBortLönespec={handleTaBortLönespec}
                />
              );
            })}
            <div className="flex gap-4 mt-8">
              <Knapp text="🏦 Hämta bankgirofil" onClick={() => setBankgiroModalOpen(true)} />
              <Knapp text="✉️ Maila lönespecar" onClick={() => setBatchMailModalOpen(true)} />
              <Knapp text="📖 Bokför" onClick={() => setBokforModalOpen(true)} />
            </div>
          </>
        </div>
      )}
      {/* EXPORT & BOKFÖRING - LÄNGST NER */}
      {/* Batch mail och bokföring kan implementeras här om du vill, men nu är all gammal state och props borttagen. */}
      {/* Bankgiro modal */}
      {bankgiroModalOpen && (
        <BankgiroExport
          anställda={anstallda}
          utbetalningsdatum={utbetalningsdatum ? new Date(utbetalningsdatum) : null}
          lönespecar={Object.fromEntries(valdaSpecar.map((spec) => [spec.anställd_id, spec]))}
          open={true}
          onClose={() => setBankgiroModalOpen(false)}
        />
      )}
      {/* Batch mail modal */}
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
        />
      )}
      {/* Bokför modal */}
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
        />
      )}
    </div>
  );
  //#endregion
}

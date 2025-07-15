//#region Imports
"use client";

import { useState, useEffect } from "react";
import { hämtaAllaLönespecarFörUser, hämtaAllaAnställda, hämtaUtlogg } from "../actions";
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
      const utlaggPromises = anstallda.map((a) => hämtaUtlogg(a.id));
      const utlaggResults = await Promise.all(utlaggPromises);
      const utlaggMap: Record<number, any[]> = {};
      anstallda.forEach((a, idx) => {
        utlaggMap[a.id] = utlaggResults[idx];
      });
      setUlaggMap(utlaggMap);
      // Gruppera per utbetalningsdatum
      const grupperat: Record<string, any[]> = {};
      specar.forEach((spec) => {
        if (spec.utbetalningsdatum) {
          if (!grupperat[spec.utbetalningsdatum]) grupperat[spec.utbetalningsdatum] = [];
          grupperat[spec.utbetalningsdatum].push(spec);
        }
      });
      // Sortera datumen fallande
      const datumSort = Object.keys(grupperat).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      setDatumLista(datumSort);
      setSpecarPerDatum(grupperat);
      // Förvalt: visa lönespecar för senaste datum
      if (datumSort.length > 0) {
        setUtbetalningsdatum(datumSort[0]);
        setValdaSpecar(grupperat[datumSort[0]]);
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
      {utbetalningsdatum && (
        <div className="space-y-2">
          {valdaSpecar.length === 0 ? (
            <div className="text-gray-400">Inga lönespecar för detta datum.</div>
          ) : (
            <>
              {valdaSpecar.map((spec) => {
                const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
                const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];
                const handleTaBortLönespec = async () => {
                  if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?"))
                    return;
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
                        }
                        return updated;
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
          )}
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

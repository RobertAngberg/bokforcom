//#region Imports
"use client";

import { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../actions";
import Lönedatum from "./Lönedatum";
import AnställdaLista from "./AnställdaLista";
import BankgiroExport from "./BankgiroExport";
import BokförKnappOchModal from "./BokförKnappOchModal";
import MailaLönespec from "../Lönespecar/MailaLönespec";
import Förhandsgranskning from "../Lönespecar/Förhandsgranskning/Förhandsgranskning";
import Knapp from "../../_components/Knapp";
//#endregion

//#region Component
export default function Lönekörning() {
  //#endregion

  //#region State
  const [anställda, setAnställda] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [lönespecar, setLönespecar] = useState<Record<string, any>>({});
  const [visaFörhandsgranskning, setVisaFörhandsgranskning] = useState(false);
  const [taBortLoading, setTaBortLoading] = useState(false);
  //#endregion

  //#region Effects
  useEffect(() => {
    // Bara ladda anställda när datum är valt
    if (!utbetalningsdatum) {
      setAnställda([]);
      return;
    }

    const laddaAnställda = async () => {
      try {
        setLoading(true);
        const data = await hämtaAllaAnställda();
        setAnställda(data);
      } catch (error) {
        console.error("❌ Fel vid laddning av anställda:", error);
      } finally {
        setLoading(false);
      }
    };

    laddaAnställda();
  }, [utbetalningsdatum]);
  //#endregion

  //#region Render
  // Hämta första lönespec och anställd (eller välj logik själv)
  const förstaLönespecId = Object.keys(lönespecar)[0];
  const förstaLönespec = lönespecar[förstaLönespecId];
  const förstaAnställd = anställda.find((a) => a.id === förstaLönespecId) || anställda[0];

  // Dummy extrarader och företagsprofil (anpassa vid behov)
  const extrarader = förstaLönespec?.extrarader || [];
  const företagsprofil = {};
  const beräknadeVärden = {};

  // Ta bort-funktion (lägg till riktig logik om du vill ta bort lönespec)
  const handleTaBortLönespec = async () => {
    if (!window.confirm("Är du säker på att du vill ta bort lönespecen?")) return;
    setTaBortLoading(true);
    // TODO: Lägg till riktig borttagningslogik
    setTimeout(() => setTaBortLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <Lönedatum
        utbetalningsdatum={utbetalningsdatum}
        setUtbetalningsdatum={setUtbetalningsdatum}
      />

      {utbetalningsdatum && (
        <AnställdaLista
          anställda={anställda}
          loading={loading}
          utbetalningsdatum={utbetalningsdatum}
          onLönespecarChange={setLönespecar}
        />
      )}

      {/* EXPORT & BOKFÖRING - LÄNGST NER */}
      {utbetalningsdatum && Object.keys(lönespecar).length > 0 && (
        <div className="flex justify-center gap-4 mt-2">
          <Knapp text="👁️ Förhandsgranska" onClick={() => setVisaFörhandsgranskning(true)} />
          <MailaLönespec
            lönespec={förstaLönespec}
            anställd={förstaAnställd}
            företagsprofil={företagsprofil}
            extrarader={extrarader}
            beräknadeVärden={{}}
          />
          {/* <BankgiroExport
            anställda={anställda}
            utbetalningsdatum={utbetalningsdatum}
            lönespecar={lönespecar}
          /> */}
          <BokförKnappOchModal
            anställda={anställda}
            utbetalningsdatum={utbetalningsdatum}
            lönespecar={lönespecar}
          />
          <Knapp
            text="🗑️ Ta bort lönespec"
            onClick={handleTaBortLönespec}
            loading={taBortLoading}
          />
          {visaFörhandsgranskning && förstaLönespec && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto p-6 relative">
                <button
                  className="absolute top-2 right-2 text-2xl text-gray-400 hover:text-black"
                  onClick={() => setVisaFörhandsgranskning(false)}
                  aria-label="Stäng"
                >
                  ×
                </button>
                <Förhandsgranskning
                  lönespec={förstaLönespec}
                  anställd={förstaAnställd}
                  företagsprofil={företagsprofil}
                  extrarader={extrarader}
                  beräknadeVärden={{}}
                  onStäng={() => setVisaFörhandsgranskning(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
  //#endregion
}

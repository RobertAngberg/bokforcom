//#region Imports
"use client";

import { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../actions";
import Lönedatum from "./Lönedatum";
import AnställdaLista from "./AnställdaLista";
import BankgiroExport from "./BankgiroExport";
import BokförKnappOchModal from "./BokförKnappOchModal";
//#endregion

//#region Component
export default function Lönekörning() {
  //#endregion

  //#region State
  const [anställda, setAnställda] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [lönespecar, setLönespecar] = useState<Record<string, any>>({});
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
        <div className="flex justify-center gap-4 pt-4 border-t border-gray-700">
          <BankgiroExport
            anställda={anställda}
            utbetalningsdatum={utbetalningsdatum}
            lönespecar={lönespecar}
          />
          <BokförKnappOchModal
            anställda={anställda}
            utbetalningsdatum={utbetalningsdatum}
            lönespecar={lönespecar}
          />
        </div>
      )}
    </div>
  );
  //#endregion
}

//#region Imports
"use client";

import { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../actions";
import Lonedatum from "./Lonedatum";
import AnstolldaLista from "./AnstolldaLista";
import BankgiroExport from "./BankgiroExport";
import BokforKnappOchModal from "./BokforKnappOchModal";
//#endregion

//#region Component
export default function Lonekorning() {
  //#endregion

  //#region State
  const [anställda, setAnställda] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [lönespecar, setLonespecar] = useState<Record<string, any>>({});
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
      <Lonedatum
        utbetalningsdatum={utbetalningsdatum}
        setUtbetalningsdatum={setUtbetalningsdatum}
      />

      {utbetalningsdatum && (
        <AnstolldaLista
          anställda={anställda}
          loading={loading}
          utbetalningsdatum={utbetalningsdatum}
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
          <BokforKnappOchModal
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

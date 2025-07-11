//#region Imports
"use client";

import { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../actions";
import Lonedatum from "./Lonedatum";
import AnstolldaLista from "./AnstolldaLista";
import BankgiroExport from "./BankgiroExport";
import BokforLoner from "../Lonespecar/BokforLoner";
import MailaLonespec from "../Lonespecar/MailaLonespec";
import BokforKnappOchModal from "./BokforKnappOchModal";
import Knapp from "../../_components/Knapp";
//#endregion

//#region Component
export default function Lonekorning() {
  //#endregion

  //#region State
  const [anställda, setAnställda] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [utbetalningsdatum, setUtbetalningsdatum] = useState<Date | null>(null);
  const [lönespecar, setLonespecar] = useState<Record<string, any>>({});
  const [batchMailModalOpen, setBatchMailModalOpen] = useState(false);
  const [bokforModalOpen, setBokforModalOpen] = useState(false);
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
  // Helper to build batch data for modal
  const batchLonespecList = Object.values(lönespecar)
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
          onLonespecarChange={setLonespecar}
        />
      )}

      {/* EXPORT & BOKFÖRING - LÄNGST NER */}
      {utbetalningsdatum && Object.keys(lönespecar).length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-gray-700">
          <Knapp text="✉️ Maila lönespecar" onClick={() => setBatchMailModalOpen(true)} />
          <BankgiroExport
            anställda={anställda}
            utbetalningsdatum={utbetalningsdatum}
            lönespecar={lönespecar}
          />
          {/* Endast EN Bokför-knapp, som öppnar modalen */}
          <Knapp text="📊 Bokför" onClick={() => setBokforModalOpen(true)} />
        </div>
      )}
      {/* Batch mail modal */}
      {batchMailModalOpen && (
        <MailaLonespec
          batch={batchLonespecList}
          batchMode={true}
          open={true}
          onClose={() => setBatchMailModalOpen(false)}
        />
      )}
      {/* Bokför modal */}
      {bokforModalOpen && utbetalningsdatum && (
        <BokforKnappOchModal
          anställda={anställda}
          utbetalningsdatum={utbetalningsdatum as Date}
          lönespecar={lönespecar}
          onClose={() => setBokforModalOpen(false)}
        />
      )}
    </div>
  );
  //#endregion
}

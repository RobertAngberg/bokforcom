"use client";

import { useEffect, useMemo, useRef } from "react";
import { useBankgiroExport } from "../../../hooks/useBankgiroExport";
import Knapp from "../../../../_components/Knapp";
import TextFalt from "../../../../_components/TextFalt";
import Tabell from "../../../../_components/Tabell";
import Modal from "../../../../_components/Modal";
import type { BankgiroExportProps } from "../../../types/types";

export default function BankgiroExport({
  anställda,
  utbetalningsdatum,
  lönespecar,
  open,
  onClose,
  onExportComplete,
  showButton = true, // Default till true för bakåtkompatibilitet
  direktNedladdning = false, // Default till false
}: BankgiroExportProps) {
  const {
    visaModal,
    kundnummer,
    setKundnummer,
    bankgironummer,
    setBankgironummer,
    anställdaMedLönespec,
    totalBelopp,
    kanGenerera,
    genereraBankgirofil,
    laddarNerDirekt,
    öppnaModal,
    stängModal,
  } = useBankgiroExport({
    anställda,
    utbetalningsdatum,
    lönespecar,
    onExportComplete,
    onClose,
  });

  // Modal state: styrs av prop om satt, annars lokalt
  const showModal = open !== undefined ? open : visaModal;

  const tabellData = useMemo(
    () =>
      anställdaMedLönespec.map((anställd) => {
        const lönespec = lönespecar[anställd.id];
        const nettolön = Number(lönespec?.nettolön ?? 0);

        return {
          id: anställd.id,
          namn: `${anställd.förnamn} ${anställd.efternamn}`.trim(),
          clearingnummer: anställd.clearingnummer || "–",
          bankkonto: anställd.bankkonto || "–",
          belopp: nettolön,
        };
      }),
    [anställdaMedLönespec, lönespecar]
  );

  const kanVisaModal = kanGenerera && tabellData.length > 0;

  const laddarNerDirektRef = useRef(laddarNerDirekt);
  useEffect(() => {
    laddarNerDirektRef.current = laddarNerDirekt;
  }, [laddarNerDirekt]);

  useEffect(() => {
    if (!direktNedladdning || !kanVisaModal) {
      return;
    }
    laddarNerDirektRef.current();
  }, [direktNedladdning, kanVisaModal]);

  if (direktNedladdning) {
    return null;
  }

  return (
    <>
      {showButton && kanVisaModal && <Knapp text="💳 Hämta Bankgirofil" onClick={öppnaModal} />}

      <Modal
        isOpen={Boolean(showModal && kanVisaModal)}
        onClose={stängModal}
        title="🏦 Ladda ner bankgirofil"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Inställningar</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <TextFalt
                label="Kundnummer för Bankgiromax (6 tecken)"
                name="kundnummer"
                type="text"
                value={kundnummer}
                onChange={(e) => setKundnummer(e.target.value)}
                maxLength={6}
              />
              <TextFalt
                label="Bankgironummer (max 10 tecken)"
                name="bankgironummer"
                type="text"
                value={bankgironummer}
                onChange={(e) => setBankgironummer(e.target.value)}
                maxLength={11}
              />
            </div>
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Förhandsgranskning</h3>
            <Tabell
              data={tabellData}
              columns={[
                { key: "namn", label: "Namn" },
                { key: "clearingnummer", label: "Clearingnummer" },
                { key: "bankkonto", label: "Bankkonto" },
                {
                  key: "belopp",
                  label: "Belopp",
                  className: "text-right",
                  render: (value) =>
                    `${Number(value || 0).toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`,
                },
              ]}
              getRowId={(item) => String(item.id)}
            />
          </div>

          <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-cyan-200">
              <strong className="text-white">{anställdaMedLönespec.length} betalningar</strong> på
              totalt
              <strong className="text-white">
                {` ${totalBelopp.toLocaleString("sv-SE", { minimumFractionDigits: 2 })} kr`}
              </strong>
            </div>
            <div className="flex gap-3 justify-end">
              <Knapp
                text="Avbryt"
                onClick={stängModal}
                className="!bg-slate-600 hover:!bg-slate-500"
              />
              <Knapp
                text="💾 Skapa fil"
                onClick={genereraBankgirofil}
                className="!bg-cyan-600 hover:!bg-cyan-700"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

// #region Imports och types
"use client";

import React, { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../personal/actions";
import AnstalldDropdown, { Anstalld } from "./AnstalldDropdown";
import { saveTransaction } from "./actions";
import KnappFullWidth from "../_components/KnappFullWidth";
import BakåtPil from "../_components/BakåtPil";
import { formatSEK, round } from "../_utils/format";

type KontoRad = {
  kontonummer?: string;
  beskrivning?: string;
  debet?: boolean;
  kredit?: boolean;
};

type ExtrafältRad = {
  label?: string;
  debet: number;
  kredit: number;
};

type Förval = {
  id: number;
  namn: string;
  beskrivning: string;
  typ: string;
  kategori: string;
  konton: KontoRad[];
  momssats?: number;
  specialtyp?: string | null;
};

interface Step3Props {
  kontonummer?: string;
  kontobeskrivning?: string;
  fil?: File | null;
  belopp?: number;
  transaktionsdatum: string;
  kommentar?: string;
  valtFörval?: Förval | null;
  setCurrentStep?: (step: number) => void;
  extrafält?: Record<string, ExtrafältRad>;
  utlaggMode?: boolean;
  levfaktMode?: boolean;
}
// #endregion

export default function Steg3({
  kontonummer = "",
  kontobeskrivning = "",
  fil,
  belopp = 0,
  transaktionsdatum,
  kommentar = "",
  valtFörval = null,
  setCurrentStep,
  extrafält = {},
  utlaggMode = false,
  levfaktMode = false,
}: Step3Props) {
  // State för anställda och vald anställd
  const [anstallda, setAnstallda] = useState<Anstalld[]>([]);
  const [anstalldId, setAnstalldId] = useState<string>("");

  useEffect(() => {
    if (utlaggMode) {
      hämtaAllaAnställda().then((res) => {
        setAnstallda(res);
        if (res.length === 1) setAnstalldId(res[0].id.toString());
      });
    }
  }, [utlaggMode]);
  // #region Moms- och beloppsberäkning
  const momsSats = valtFörval?.momssats ?? 0;
  const moms = +(belopp * (momsSats / (1 + momsSats))).toFixed(2);
  const beloppUtanMoms = +(belopp - moms).toFixed(2);
  // #endregion

  // #region Hämta beskrivning för konto 2890 från DB
  const [konto2890Beskrivning, setKonto2890Beskrivning] = React.useState<string>("");
  React.useEffect(() => {
    async function fetchKonto2890() {
      try {
        const res = await fetch("/api/konto-beskrivning?kontonummer=2890");
        if (res.ok) {
          const data = await res.json();
          setKonto2890Beskrivning(data.beskrivning || "Övriga kortfristiga skulder");
        } else {
          setKonto2890Beskrivning("Övriga kortfristiga skulder");
        }
      } catch {
        setKonto2890Beskrivning("Övriga kortfristiga skulder");
      }
    }
    if (utlaggMode) fetchKonto2890();
  }, [utlaggMode]);
  // #endregion

  // #region Submitta form
  const handleSubmit = async (formData: FormData) => {
    if (!valtFörval || !setCurrentStep) return;

    if (fil) formData.set("fil", fil);
    formData.set("valtFörval", JSON.stringify(valtFörval));
    formData.set("extrafält", JSON.stringify(extrafält));
    formData.set("transaktionsdatum", transaktionsdatum);
    formData.set("kommentar", kommentar);
    formData.set("kontonummer", kontonummer);
    formData.set("kontobeskrivning", kontobeskrivning);
    formData.set("belopp", belopp.toString());
    formData.set("moms", moms.toString());
    formData.set("beloppUtanMoms", beloppUtanMoms.toString());
    formData.set("utlaggMode", utlaggMode ? "true" : "false");
    formData.set("levfaktMode", levfaktMode ? "true" : "false");
    if (utlaggMode && anstalldId) formData.set("anstalldId", anstalldId);

    const result = await saveTransaction(formData);
    if (result.success) setCurrentStep(4);
  };
  // #endregion

  // #region Bygg tabellrader
  const fallbackRows =
    valtFörval && valtFörval.specialtyp && Object.keys(extrafält).length > 0
      ? Object.entries(extrafält).map(([konto, val], i) => ({
          key: i,
          konto: konto + " " + (val.label ?? ""),
          debet: round(val.debet),
          kredit: round(val.kredit),
        }))
      : valtFörval
        ? valtFörval.konton.map((rad, i) => {
            let kontoNr = rad.kontonummer?.toString().trim();
            let namn = `${kontoNr} ${rad.beskrivning ?? ""}`;
            let beloppAttVisa = 0;

            // Om utläggs-mode, byt ut 1930 mot 2890
            if (utlaggMode && kontoNr === "1930") {
              kontoNr = "2890";
              namn = `2890 ${konto2890Beskrivning || "Övriga kortfristiga skulder"}`;
              beloppAttVisa = belopp;
            }
            // Om leverantörsfaktura-mode, byt ut 1930 mot 2440
            else if (levfaktMode && kontoNr === "1930") {
              kontoNr = "2440";
              namn = `2440 Leverantörsskulder`;
              beloppAttVisa = belopp;
            } else if (kontoNr?.startsWith("26")) {
              beloppAttVisa = moms;
            } else if (kontoNr === "1930") {
              // CHECKPOINT FIX 2025-07-31: 1930 ska visa hela beloppet, inte beloppUtanMoms
              beloppAttVisa = belopp;
            } else {
              beloppAttVisa = beloppUtanMoms;
            }

            return {
              key: i,
              konto: namn,
              debet: rad.debet ? round(beloppAttVisa) : 0,
              kredit: rad.kredit ? round(beloppAttVisa) : 0,
            };
          })
        : [];

  const totalDebet = fallbackRows.reduce((sum, r) => sum + r.debet, 0);
  const totalKredit = fallbackRows.reduce((sum, r) => sum + r.kredit, 0);
  // #endregion

  return (
    <div className="relative">
      <BakåtPil onClick={() => setCurrentStep?.(2)} />

      <h1 className="text-3xl mb-4 text-center">
        {levfaktMode
          ? "Steg 3: Leverantörsfaktura - Kontrollera och slutför"
          : "Steg 3: Kontrollera och slutför"}
      </h1>
      <p className="text-center font-bold text-xl mb-1">{valtFörval ? valtFörval.namn : ""}</p>
      <p className="text-center text-gray-300 mb-8">
        {transaktionsdatum ? new Date(transaktionsdatum).toLocaleDateString("sv-SE") : ""}
      </p>
      {levfaktMode && (
        <div className="mb-6 flex items-center px-4 py-3 bg-purple-900 text-purple-100 rounded-lg text-base">
          <span className="mr-3 flex items-center justify-center w-7 h-7 rounded-full bg-purple-700 text-white text-lg font-bold">
            📋
          </span>
          <div className="flex-1 text-center">
            <strong>Leverantörsfaktura bokförs på skuldsidan (2440).</strong>
            <br />
            När du senare betalar fakturan kommer skulden att kvittas mot ditt företagskonto.
          </div>
        </div>
      )}
      {utlaggMode && (
        <>
          <div className="mb-6 flex items-center px-4 py-3 bg-blue-900 text-blue-100 rounded-lg text-base">
            <span className="mr-3 flex items-center justify-center w-7 h-7 rounded-full bg-blue-700 text-white text-lg font-bold">
              i
            </span>
            <div className="flex-1 text-center">
              <strong>Utlägg bokförs här på 2890.</strong>
              <br />
              När du sedan betalar ut lönen kommer detta att kvittas mot ditt företagskonto.
            </div>
          </div>
          <div className="mb-6 flex flex-col items-center">
            <div className="w-full max-w-md mx-auto flex flex-col items-center">
              <span className="block text-base font-medium text-white mb-2 text-center">
                Välj anställd att knyta till utlägget:
              </span>
              <AnstalldDropdown anstallda={anstallda} value={anstalldId} onChange={setAnstalldId} />
            </div>
          </div>
        </>
      )}
      {kommentar && <p className="text-center text-gray-400 mb-4 italic">{kommentar}</p>}

      <form action={handleSubmit}>
        <table className="w-full text-left border border-gray-700 text-sm md:text-base bg-slate-900 rounded-xl overflow-hidden">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="p-4 border-b border-gray-700">Konto</th>
              <th className="p-4 border-b border-gray-700 text-center">Debet</th>
              <th className="p-4 border-b border-gray-700 text-center">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {fallbackRows.map((r) => (
              <tr key={r.key}>
                <td className="p-4 border-b border-gray-700">{r.konto}</td>
                <td className="p-4 text-center border-b border-gray-700">
                  {r.debet > 0 ? formatSEK(r.debet) : ""}
                </td>
                <td className="p-4 text-center border-b border-gray-700">
                  {r.kredit > 0 ? formatSEK(r.kredit) : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-cyan-900 text-white">
              <td className="p-4 text-left">Totalt</td>
              <td className="p-4 text-center">{formatSEK(totalDebet)}</td>
              <td className="p-4 text-center">{formatSEK(totalKredit)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 flex justify-center">
          <button
            type="submit"
            className="w-full max-w-lg px-8 py-6 bg-cyan-700 hover:bg-cyan-800 text-white rounded font-bold text-lg shadow"
          >
            Bokför
          </button>
        </div>
      </form>
    </div>
  );
}

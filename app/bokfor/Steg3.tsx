// #region Imports och types
"use client";

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
  isUtlägg?: boolean; // ← LÄGG TILL
  valdaAnställda?: number[]; // ← LÄGG TILL
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
  isUtlägg = false, // ← LÄGG TILL
  valdaAnställda = [], // ← LÄGG TILL
}: Step3Props) {
  // #region Moms- och beloppsberäkning
  const momsSats = valtFörval?.momssats ?? 0;
  const moms = +(belopp * (momsSats / (1 + momsSats))).toFixed(2);
  const beloppUtanMoms = +(belopp - moms).toFixed(2);
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
    formData.set("isUtlägg", isUtlägg ? "true" : "false");
    formData.set("valdaAnställda", JSON.stringify(valdaAnställda));
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
            const kontoNr = rad.kontonummer?.toString().trim();
            let namn = `${kontoNr} ${rad.beskrivning ?? ""}`;
            let beloppAttVisa = 0;

            if (kontoNr?.startsWith("26")) {
              beloppAttVisa = moms;
            } else if (kontoNr === "1930") {
              // Om det är utlägg, visa 2890 istället för 1930
              if (isUtlägg && valdaAnställda.length > 0) {
                namn = `2890 Övriga kortfristiga skulder`;
              }
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

      <h1 className="text-3xl mb-4 text-center">Steg 3: Kontrollera och slutför</h1>
      <p className="text-center font-bold text-xl mb-1">{valtFörval ? valtFörval.namn : ""}</p>
      <p className="text-center text-gray-300 mb-8">
        {transaktionsdatum ? new Date(transaktionsdatum).toLocaleDateString("sv-SE") : ""}
      </p>
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

        <div className="mt-8">
          <KnappFullWidth text="Bokför" />
        </div>
      </form>
    </div>
  );
}

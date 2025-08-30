// #region Imports och types
"use client";

import React, { useState, useEffect } from "react";
import { hämtaAllaAnställda } from "../personal/actions";
import AnstalldDropdown, { Anstalld } from "./AnstalldDropdown";
import { saveTransaction } from "./actions";
import { uploadReceiptImage } from "../_utils/blobUpload";
import Knapp from "../_components/Knapp";
import TillbakaPil from "../_components/TillbakaPil";
import { formatSEK, formatCurrency, round } from "../_utils/format";
import { type Leverantör } from "../faktura/actions";
import { dateTillÅÅÅÅMMDD, ÅÅÅÅMMDDTillDate } from "../_utils/trueDatum";

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
  // Leverantörsfaktura-specifika props
  leverantör?: Leverantör | null;
  fakturanummer?: string | null;
  fakturadatum?: string | null;
  förfallodatum?: string | null;
  betaldatum?: string | null;
  // Kundfaktura-specifika props
  bokförSomFaktura?: boolean;
  kundfakturadatum?: string | null;
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
  // Leverantörsfaktura-specifika props
  leverantör = null,
  fakturanummer = null,
  fakturadatum = null,
  förfallodatum = null,
  betaldatum = null,
  // Kundfaktura-specifika props
  bokförSomFaktura = false,
  kundfakturadatum = null,
}: Step3Props) {
  // State för anställda och vald anställd
  const [anstallda, setAnstallda] = useState<Anstalld[]>([]);
  const [anstalldId, setAnstalldId] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

  // #region Business Logic - Beräkna transaktionsposter
  const calculateBelopp = (kontonummer: string, typ: "debet" | "kredit"): number => {
    const klass = kontonummer[0];

    if (typ === "debet") {
      // Specifikt för 1930 vid försäljning
      if (kontonummer === "1930" && ärFörsäljning) {
        return belopp;
      }
      // Kundfordringar (1510) ska få hela beloppet som debet
      if (kontonummer === "1510") {
        return belopp;
      }
      // Alla andra klass 1-konton får beloppUtanMoms
      if (klass === "1") return beloppUtanMoms;
      if (klass === "2") return moms; // Moms-konton som debet
      if (klass === "3") return 0;
      if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
        return beloppUtanMoms; // Kostnader
      }
      return 0;
    }

    // typ === "kredit"
    // Specifikt för 1930 vid försäljning - ska inte vara kredit
    if (kontonummer === "1930" && ärFörsäljning) {
      return 0;
    }
    // Kundfordringar (1510) ska inte vara kredit
    if (kontonummer === "1510") {
      return 0;
    }
    // Utlägg (2890) ska få hela beloppet som kredit
    if (kontonummer === "2890") {
      return belopp;
    }
    // Leverantörsskulder (2440) ska få hela beloppet som kredit
    if (kontonummer === "2440") {
      return belopp;
    }
    // Alla andra klass 1-konton får belopp som kredit
    if (klass === "1") return belopp;
    if (klass === "2") {
      return moms; // Utgående moms ska vara kredit vid försäljning
    }
    if (klass === "3") return beloppUtanMoms; // Intäktskonton
    if (klass === "4" || klass === "5" || klass === "6" || klass === "7" || klass === "8") {
      return 0; // Kostnader ska inte vara kredit
    }
    return 0;
  };

  const transformKontonummer = (originalKonto: string): string => {
    // Om utläggs-mode, byt ut 1930 mot 2890
    if (utlaggMode && originalKonto === "1930") {
      return "2890";
    }
    // Om kundfaktura-mode (bokför som faktura), byt ut 1930 mot 1510
    if (bokförSomFaktura && originalKonto === "1930") {
      return "1510";
    }
    // Om leverantörsfaktura-mode (inköp), byt ut 1930 mot 2440
    if (levfaktMode && !ärFörsäljning && originalKonto === "1930") {
      return "2440";
    }
    // Om kundfaktura (försäljning), byt ut 1930 mot 1510
    if (levfaktMode && ärFörsäljning && originalKonto === "1930") {
      return "1510";
    }
    return originalKonto;
  };

  // Beräkna alla transaktionsposter som ska skickas till servern
  const beräknaTransaktionsposter = () => {
    const poster: Array<{ kontonummer: string; debet: number; kredit: number }> = [];

    // Hantera extrafält först
    if (Object.keys(extrafält).length > 0) {
      for (const [nr, data] of Object.entries(extrafält)) {
        let { debet = 0, kredit = 0 } = data;
        const transformedKonto = transformKontonummer(nr);

        // Använd calculateBelopp för att få rätt belopp
        if (debet > 0) {
          debet = calculateBelopp(transformedKonto, "debet");
        }
        if (kredit > 0) {
          kredit = calculateBelopp(transformedKonto, "kredit");
        }

        if (debet === 0 && kredit === 0) continue;

        poster.push({ kontonummer: transformedKonto, debet, kredit });
      }
    }

    // Hantera förvalskonton om inte specialtyp
    if (!valtFörval?.specialtyp && valtFörval?.konton) {
      for (const k of valtFörval.konton) {
        const originalKonto = k.kontonummer?.toString().trim();
        if (!originalKonto) continue;

        const transformedKonto = transformKontonummer(originalKonto);
        const debet = k.debet ? calculateBelopp(transformedKonto, "debet") : 0;
        const kredit = k.kredit ? calculateBelopp(transformedKonto, "kredit") : 0;

        if (debet === 0 && kredit === 0) continue;

        poster.push({ kontonummer: transformedKonto, debet, kredit });
      }
    }

    return poster;
  };
  // #endregion

  // Kolla om det är försäljning inom leverantörsfaktura-mode
  const ärFörsäljning =
    levfaktMode &&
    (valtFörval?.namn?.toLowerCase().includes("försäljning") ||
      valtFörval?.typ?.toLowerCase().includes("intäkt") ||
      valtFörval?.kategori?.toLowerCase().includes("försäljning"));
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
    if (!valtFörval) return;

    // Kontrollera att utlägg har vald anställd
    if (utlaggMode && !anstalldId) {
      alert("Du måste välja en anställd för utlägget.");
      return;
    }

    setLoading(true);
    try {
      // Beräkna alla transaktionsposter på frontend
      const transaktionsposter = beräknaTransaktionsposter();

      // Lägg till alla nödvändiga fält till FormData
      formData.set("transaktionsdatum", transaktionsdatum);
      formData.set("kommentar", kommentar);
      formData.set("belopp", belopp.toString());
      formData.set("moms", moms.toString());
      formData.set("beloppUtanMoms", beloppUtanMoms.toString());
      formData.set("valtFörval", JSON.stringify(valtFörval));
      formData.set("transaktionsposter", JSON.stringify(transaktionsposter));

      // Lägg till mode-specifika fält
      if (utlaggMode) {
        formData.set("utlaggMode", "true");
        if (anstalldId) formData.set("anstalldId", anstalldId);
      }

      if (levfaktMode) {
        formData.set("levfaktMode", "true");
        if (leverantör?.id) formData.set("leverantorId", leverantör.id.toString());
        if (fakturanummer) formData.set("fakturanummer", fakturanummer);
        if (fakturadatum) formData.set("fakturadatum", fakturadatum);
        if (förfallodatum) formData.set("förfallodatum", förfallodatum);
        if (betaldatum) formData.set("betaldatum", betaldatum);
      }

      // Kundfaktura-specifika fält
      if (bokförSomFaktura) {
        formData.set("bokförSomFaktura", "true");
        if (kundfakturadatum) formData.set("kundfakturadatum", kundfakturadatum);
      }

      // Ladda upp fil till blob storage först (om det finns en fil)
      if (fil) {
        console.log("Laddar upp fil till blob storage:", fil.name);

        // Skapa beskrivning baserat på kontext
        let beskrivning = "";
        if (leverantör?.namn) {
          beskrivning = leverantör.namn;
        } else if (levfaktMode && fakturanummer) {
          beskrivning = `faktura-${fakturanummer}`;
        } else if (utlaggMode) {
          beskrivning = "utlagg";
        } else if (bokförSomFaktura) {
          beskrivning = "kundfaktura";
        } else {
          beskrivning = "kvitto";
        }

        // Använd fakturadatum om tillgängligt, annars dagens datum
        const datum = fakturadatum || dateTillÅÅÅÅMMDD(new Date());

        const blobResult = await uploadReceiptImage(fil, {
          beskrivning,
          datum,
        });

        if (blobResult.success && blobResult.url) {
          formData.set("bilageUrl", blobResult.url);
          console.log("Fil uppladdad:", blobResult.url);
        } else {
          console.error("Misslyckades med att ladda upp fil:", blobResult.error);
          // Fortsätt ändå med bokföringen även om fil-upload misslyckades
        }
      }

      const result = await saveTransaction(formData);
      if (result.success) setCurrentStep?.(4);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    const form = document.getElementById("bokforingForm") as HTMLFormElement;
    if (form) {
      const formData = new FormData(form);
      handleSubmit(formData);
    }
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
            // Om kundfaktura-mode (bokför som faktura), byt ut 1930 mot 1510
            else if (bokförSomFaktura && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
              beloppAttVisa = belopp;
            }
            // Om leverantörsfaktura-mode (inköp), byt ut 1930 mot 2440
            else if (levfaktMode && !ärFörsäljning && kontoNr === "1930") {
              kontoNr = "2440";
              namn = `2440 Leverantörsskulder`;
              beloppAttVisa = belopp;
            }
            // Om kundfaktura (försäljning), byt ut 1930 mot 1510
            else if (levfaktMode && ärFörsäljning && kontoNr === "1930") {
              kontoNr = "1510";
              namn = `1510 Kundfordringar`;
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
              // För försäljning: vänd om debet/kredit för intäkts- och momskonton
              debet:
                ärFörsäljning && (kontoNr?.startsWith("3") || kontoNr?.startsWith("261"))
                  ? 0
                  : rad.debet
                    ? round(beloppAttVisa)
                    : 0,
              kredit:
                ärFörsäljning && (kontoNr?.startsWith("3") || kontoNr?.startsWith("261"))
                  ? round(beloppAttVisa)
                  : rad.kredit
                    ? round(beloppAttVisa)
                    : 0,
            };
          })
        : [];

  const totalDebet = fallbackRows.reduce((sum, r) => sum + r.debet, 0);
  const totalKredit = fallbackRows.reduce((sum, r) => sum + r.kredit, 0);
  // #endregion

  return (
    <div className="relative">
      <TillbakaPil onClick={() => setCurrentStep?.(2)} />

      <h1 className="text-3xl mb-4 text-center">
        {levfaktMode
          ? ärFörsäljning
            ? "Steg 3: Kundfaktura - Kontrollera och slutför"
            : "Steg 3: Leverantörsfaktura - Kontrollera och slutför"
          : "Steg 3: Kontrollera och slutför"}
      </h1>
      <p className="text-center font-bold text-xl mb-1">{valtFörval ? valtFörval.namn : ""}</p>
      <p className="text-center text-gray-300 mb-2">
        {transaktionsdatum ? dateTillÅÅÅÅMMDD(ÅÅÅÅMMDDTillDate(transaktionsdatum)) : ""}
      </p>
      {levfaktMode && leverantör && (
        <div className="text-center mb-6">
          <div className="inline-flex items-center bg-slate-800 border border-slate-600 rounded-lg px-4 py-2">
            <span className="text-gray-400 text-sm mr-2">Leverantör:</span>
            <span className="text-white font-medium">{leverantör.namn}</span>
            {leverantör.organisationsnummer && (
              <span className="text-gray-400 text-sm ml-2">({leverantör.organisationsnummer})</span>
            )}
          </div>
        </div>
      )}
      {levfaktMode && ärFörsäljning && (
        <div className="mb-6 flex items-center px-4 py-3 bg-green-900 text-green-100 rounded-lg text-base">
          <span className="mr-3 flex items-center justify-center w-7 h-7 rounded-full bg-green-700 text-white text-lg font-bold">
            💰
          </span>
          <div className="flex-1 text-center">
            <strong>Kundfaktura bokförs som fordran (1510).</strong>
            <br />
            När kunden betalar fakturan kommer fordran att kvittas mot ditt företagskonto.
          </div>
        </div>
      )}
      {levfaktMode && !ärFörsäljning && (
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

      <form id="bokforingForm">
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
                  {r.debet > 0 ? formatCurrency(r.debet) : ""}
                </td>
                <td className="p-4 text-center border-b border-gray-700">
                  {r.kredit > 0 ? formatCurrency(r.kredit) : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-cyan-900 text-white">
              <td className="p-4 text-left">Totalt</td>
              <td className="p-4 text-center">{formatCurrency(totalDebet)}</td>
              <td className="p-4 text-center">{formatCurrency(totalKredit)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-8 flex justify-center">
          <Knapp
            text="Bokför"
            loadingText="Bokför..."
            onClick={handleButtonClick}
            loading={loading}
            disabled={loading}
            className="w-full max-w-lg px-8 py-6 text-lg font-bold shadow"
          />
        </div>
      </form>
    </div>
  );
}

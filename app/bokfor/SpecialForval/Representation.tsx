// #region Huvud
"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import { type Leverantör } from "../../faktura/actions";
import TextFalt from "../../_components/TextFalt";

type RepresentationsTyp = "maltid_alkohol" | "enklare_fortaring";

// Schablon beräkning enligt Skatteverket
function beräknaSchablon(antalPersoner: number, typ: RepresentationsTyp, totalBelopp: number) {
  let schablon: number;

  // Bokio verkar använda samma beräkning för båda typerna
  schablon = antalPersoner * 46; // kr per person för båda typerna

  // Avdragsgill del = minimum av faktisk kostnad och schablon
  const avdragsgillDel = Math.min(totalBelopp, schablon);
  const ejAvdragsgillDel = totalBelopp - avdragsgillDel;

  return {
    schablon,
    avdragsgillDel,
    ejAvdragsgillDel,
    procent: totalBelopp > 0 ? (avdragsgillDel / totalBelopp) * 100 : 0,
  };
}

interface Props {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
  belopp?: number | null;
  setBelopp: (val: number | null) => void;
  transaktionsdatum?: string | null;
  setTransaktionsdatum: (val: string) => void;
  kommentar?: string | null;
  setKommentar?: (val: string | null) => void;
  setCurrentStep?: (val: number) => void;
  fil: File | null;
  setFil: (val: File | null) => void;
  pdfUrl: string | null;
  setPdfUrl: (val: string) => void;
  extrafält: Record<string, { label: string; debet: number; kredit: number }>;
  setExtrafält?: (fält: Record<string, { label: string; debet: number; kredit: number }>) => void;

  // Levfakt-specifika props (optional)
  leverantör?: string;
  setLeverantör?: (val: string | Leverantör | null) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
}
// #endregion

export default function Representation({
  mode,
  renderMode = "standard",
  belopp = null,
  setBelopp,
  transaktionsdatum = "",
  setTransaktionsdatum,
  kommentar = "",
  setKommentar,
  setCurrentStep,
  fil,
  setFil,
  pdfUrl,
  setPdfUrl,
  extrafält,
  setExtrafält,
  leverantör,
  setLeverantör,
  fakturanummer,
  setFakturanummer,
  fakturadatum,
  setFakturadatum,
  förfallodatum,
  setFörfallodatum,
}: Props) {
  const [antalPersoner, setAntalPersoner] = useState("");
  const [representationstyp, setRepresentationstyp] =
    useState<RepresentationsTyp>("maltid_alkohol");

  // Använd totalt belopp för beräkningar
  const totalBelopp = belopp ?? 0;

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp && !!transaktionsdatum && !!leverantör && !!fakturanummer && !!fakturadatum
      : !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    // Beräkna schablon och bestäm avdragsgillhet
    const schablon = beräknaSchablon(parseInt(antalPersoner) || 1, representationstyp, totalBelopp);

    // Bokio-logik: Schablon på exkl-moms basis, sedan beräkna moms
    const exklMoms = totalBelopp / 1.25; // Totalt exkl moms
    const maxAvdragsgillExklMoms = Math.min(schablon.schablon, exklMoms); // Schablon begränsat till exkl moms
    const avdragsgillMomsbelopp = maxAvdragsgillExklMoms * 0.25; // 25% moms på avdragsgill del
    const kostnadEjAvdragsgill = totalBelopp - avdragsgillMomsbelopp; // Välj konto baserat på typ
    const konto = representationstyp === "enklare_fortaring" ? "6071" : "6072";
    const kontoBeskrivning =
      representationstyp === "enklare_fortaring"
        ? "Representation, avdragsgill"
        : "Representation, ej avdragsgill";

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj: Record<string, { label: string; debet: number; kredit: number }> = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: avdragsgillMomsbelopp, kredit: 0 },
        [konto]: { label: kontoBeskrivning, debet: kostnadEjAvdragsgill, kredit: 0 },
      };

      setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj: Record<string, { label: string; debet: number; kredit: number }> = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: avdragsgillMomsbelopp, kredit: 0 },
        [konto]: { label: kontoBeskrivning, debet: kostnadEjAvdragsgill, kredit: 0 },
      };

      setExtrafält?.(extrafältObj);
    }
    setCurrentStep?.(3);
  }
  const Layout = renderMode === "levfakt" ? LevfaktLayout : StandardLayout;

  if (mode === "steg2") {
    return (
      <Layout
        belopp={belopp}
        setBelopp={setBelopp}
        transaktionsdatum={transaktionsdatum}
        setTransaktionsdatum={setTransaktionsdatum}
        kommentar={kommentar}
        setKommentar={setKommentar}
        fil={fil}
        setFil={setFil}
        pdfUrl={pdfUrl}
        setPdfUrl={setPdfUrl}
        isValid={giltigt}
        onSubmit={gåTillSteg3}
        setCurrentStep={setCurrentStep}
        leverantör={leverantör}
        setLeverantör={setLeverantör}
        fakturanummer={fakturanummer}
        setFakturanummer={setFakturanummer}
        fakturadatum={fakturadatum}
        setFakturadatum={setFakturadatum}
        förfallodatum={förfallodatum}
        setFörfallodatum={setFörfallodatum}
        title="Representation"
      >
        {/* Representation-specifika fält - Bokio-design */}
        <div className="space-y-4">
          {/* Typ av representation */}
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-300 mb-3">Typ:</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="representationstyp"
                  value="maltid_alkohol"
                  checked={representationstyp === "maltid_alkohol"}
                  onChange={(e) => setRepresentationstyp(e.target.value as RepresentationsTyp)}
                  className="text-blue-500"
                />
                <span className="text-white">Måltid</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="representationstyp"
                  value="enklare_fortaring"
                  checked={representationstyp === "enklare_fortaring"}
                  onChange={(e) => setRepresentationstyp(e.target.value as RepresentationsTyp)}
                  className="text-blue-500"
                />
                <span className="text-white">Enklare förtäring</span>
              </label>
            </div>
          </div>

          {/* Antal personer (för båda typerna) */}
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <TextFalt
              label="Antal personer"
              name="antalPersoner"
              value={antalPersoner}
              onChange={(e) => setAntalPersoner(e.target.value)}
              type="number"
              placeholder="Ange antal personer"
              required
            />
          </div>

          {/* Info om representation */}
          <div className="mb-3 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-sm text-blue-200 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p>Dokumentera vilka som deltog på kvittot eller i kommentaren.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (mode === "steg3") {
    // Bestäm konto baserat på typ
    const konto = representationstyp === "enklare_fortaring" ? "6071" : "6072";
    const kontoBeskrivning =
      representationstyp === "enklare_fortaring"
        ? "Representation, avdragsgill"
        : "Representation, ej avdragsgill";

    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(2)} />
        <Steg3
          kontonummer={konto}
          kontobeskrivning={kontoBeskrivning}
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={{
            id: 0,
            namn: "Representation",
            beskrivning: "",
            typ: "",
            kategori: "",
            konton: [],
            momssats: 0.25,
            specialtyp: "Representation",
              sökord: [],
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

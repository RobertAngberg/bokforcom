// #region Huvud
"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import BakåtPil from "../../_components/BakåtPil";
import TextFält from "../../_components/TextFält";

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
  setLeverantör?: (val: string) => void;
  fakturanummer?: string;
  setFakturanummer?: (val: string) => void;
  fakturadatum?: string;
  setFakturadatum?: (val: string) => void;
  förfallodatum?: string;
  setFörfallodatum?: (val: string) => void;
}
// #endregion

export default function Importmoms({
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
  const [tull, setTull] = useState("");
  const [fiktiv, setFiktiv] = useState("");
  const [ovrigt, setOvrigt] = useState("");

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp && !!transaktionsdatum && !!leverantör && !!fakturanummer && !!fakturadatum
      : !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: belopp ?? 0 },
        "2615": {
          label: "Utgående moms import av varor, 25%",
          debet: 0,
          kredit: parseFloat(fiktiv || "0"),
        },
        "2640": { label: "Ingående moms", debet: parseFloat(tull || "0") * 0.2, kredit: 0 },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: parseFloat(fiktiv || "0"),
          kredit: 0,
        },
        "4545": {
          label: "Import av varor, 25 % moms",
          debet: parseFloat(fiktiv || "0") * 4,
          kredit: 0,
        },
        "4549": {
          label: "Motkonto beskattningsunderlag import",
          debet: 0,
          kredit: parseFloat(fiktiv || "0") * 4,
        },
        "5720": {
          label: "Tull- och speditionskostnader m.m.",
          debet: parseFloat(tull || "0") * 0.8 + parseFloat(ovrigt || "0"),
          kredit: 0,
        },
      };
      setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
        "2615": {
          label: "Utgående moms import av varor, 25%",
          debet: 0,
          kredit: parseFloat(fiktiv || "0"),
        },
        "2640": { label: "Ingående moms", debet: parseFloat(tull || "0") * 0.2, kredit: 0 },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: parseFloat(fiktiv || "0"),
          kredit: 0,
        },
        "4545": {
          label: "Import av varor, 25 % moms",
          debet: parseFloat(fiktiv || "0") * 4,
          kredit: 0,
        },
        "4549": {
          label: "Motkonto beskattningsunderlag import",
          debet: 0,
          kredit: parseFloat(fiktiv || "0") * 4,
        },
        "5720": {
          label: "Tull- och speditionskostnader m.m.",
          debet: parseFloat(tull || "0") * 0.8 + parseFloat(ovrigt || "0"),
          kredit: 0,
        },
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
        title="Importmoms"
      >
        {/* Importmoms-specifika fält */}
        <div className="mb-4 p-4 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong>💡 Importmoms steg-för-steg:</strong>
            <br />
            <br />
            1️ - Du köper varor utanför EU (ex. 20 000 kr) - ingen moms betalas till säljaren
            <br />
            <br />
            2 - Transportföretaget skickar tullfaktura (ex. 300 kr totalt)
            <br />
            <br />3 - Fyll i: Total tullfaktura (300), Tull/frakt inkl. moms (100), Fiktiv moms 25%
            av varans värde (5000), Övriga kostnader utan moms (200)
          </p>
        </div>

        <div className="space-y-4 mb-4">
          <TextFält
            label="Tull och spedition m.m. inkl. moms"
            name="tull"
            type="number"
            value={tull}
            onChange={(e) => setTull(e.target.value)}
            required={false}
          />

          <TextFält
            label="Ingående fiktiv moms på förvärv från utlandet"
            name="fiktiv"
            type="number"
            value={fiktiv}
            onChange={(e) => setFiktiv(e.target.value)}
            required={false}
          />

          <TextFält
            label="Övriga kostnader utan moms"
            name="ovrigt"
            type="number"
            value={ovrigt}
            onChange={(e) => setOvrigt(e.target.value)}
            required={false}
          />
        </div>
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <BakåtPil onClick={() => setCurrentStep?.(2)} />
        <Steg3
          kontonummer="4545"
          kontobeskrivning="Importmoms"
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={{
            id: 0,
            namn: "Importmoms",
            beskrivning: "",
            typ: "",
            kategori: "",
            konton: [],
            momssats: 0.25,
            specialtyp: "Importmoms",
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

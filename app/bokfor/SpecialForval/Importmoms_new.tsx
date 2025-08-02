// #region Huvud
"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../_components/TillbakaPil";
import TextFalt from "../../_components/TextFalt";

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
        <div className="space-y-4 mb-4">
          <TextFalt
            label="Tull inkl. moms (kr)"
            name="tull"
            type="number"
            value={tull}
            onChange={(e) => setTull(e.target.value)}
            required={false}
          />

          <TextFalt
            label="Fiktiv moms (kr)"
            name="fiktiv"
            type="number"
            value={fiktiv}
            onChange={(e) => setFiktiv(e.target.value)}
            required={false}
          />

          <TextFalt
            label="Övriga kostnader utan moms (kr)"
            name="ovrigt"
            type="number"
            value={ovrigt}
            onChange={(e) => setOvrigt(e.target.value)}
            required={false}
          />
        </div>

        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-900 mb-2">Importmoms - Komplicerat! 😅</h3>
          <p className="text-sm text-red-700 mb-2">
            <strong>Exempel:</strong> Vara värd 5000 kr, tull 1250 kr (inkl moms), övriga kostnader
            200 kr
          </p>
          <p className="text-sm text-red-700 mb-2">
            <strong>Fiktiv moms:</strong> moms 25% av varans värde (1250 kr)
          </p>
          <p className="text-sm text-red-700">
            <strong>Resultat:</strong> Varor (5000), Tull utan moms (1000), Moms på tull (250),
            Fiktiv moms (1250), Övriga (200)
          </p>
        </div>
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(2)} />
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

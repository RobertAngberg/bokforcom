// #region Huvud
"use client";

import Steg3 from "../Steg3";
import { formatSEK } from "../../_utils/format";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../_components/TillbakaPil";

interface Props {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt"; // NY!
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
  setExtrafält?: (val: Record<string, { label: string; debet: number; kredit: number }>) => void;

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

export default function Hyrbil({
  mode,
  renderMode = "standard",
  belopp,
  setBelopp,
  transaktionsdatum,
  setTransaktionsdatum,
  kommentar,
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
  // #region Beräkningar
  const moms = +(Number(belopp ?? 0) * 0.25 * 0.5).toFixed(2);
  const netto = +(Number(belopp ?? 0) - moms).toFixed(2);

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp && !!transaktionsdatum && !!leverantör && !!fakturanummer && !!fakturadatum
      : !!belopp && !!transaktionsdatum;

  const gåTillSteg3 = () => {
    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      setExtrafält?.({
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: belopp ?? 0 },
        "5820": { label: "Hyrbilskostnader", debet: netto, kredit: 0 },
        "2640": { label: "Ingående moms", debet: moms, kredit: 0 },
      });
    } else {
      // Standard: Direkt betalning från företagskonto
      setExtrafält?.({
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
        "5820": { label: "Hyrbilskostnader", debet: netto, kredit: 0 },
        "2640": { label: "Ingående moms", debet: moms, kredit: 0 },
      });
    }
    setCurrentStep?.(3);
  };

  const Layout = renderMode === "levfakt" ? LevfaktLayout : StandardLayout;
  // #endregion

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
        title="Hyrbil"
      >
        {/* Hyrbil-specifikt innehåll */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Hyrbil - Momsberäkning</h3>
          <p className="text-sm text-blue-700 mb-2">
            Avdragbar moms (25% × 50%): {formatSEK(moms)} kr
          </p>
          <p className="text-sm text-blue-700">Nettokostnad: {formatSEK(netto)} kr</p>
        </div>
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <TillbakaPil onClick={() => setCurrentStep?.(2)} />
          <Steg3
            kontonummer="5820"
            kontobeskrivning="Hyrbil"
            belopp={belopp ?? 0}
            transaktionsdatum={transaktionsdatum ?? ""}
            kommentar={kommentar ?? ""}
            valtFörval={{
              id: 0,
              namn: "Hyrbil",
              beskrivning: "",
              typ: "",
              kategori: "",
              konton: [],
              momssats: 0.25,
              specialtyp: "hyrbil",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}

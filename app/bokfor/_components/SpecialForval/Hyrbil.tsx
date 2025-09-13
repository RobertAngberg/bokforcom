// #region Huvud
"use client";

import Steg3 from "../Steg/Steg3";
import { formatSEK } from "../../../_utils/format";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../../_components/TillbakaPil";
import { HyrbilProps } from "../../_types/types";
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
}: HyrbilProps) {
  // #region Beräkningar
  // Beräkna korrekt för hyrbil: 50% av momsen är avdragsgill
  const totalBelopp = Number(belopp ?? 0);
  const fullMoms = (totalBelopp / 1.25) * 0.25; // Full moms (25%)
  const moms = +(fullMoms * 0.5).toFixed(2); // Endast 50% avdragsgill
  const netto = +(totalBelopp - moms).toFixed(2); // Resterande blir kostnad

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
      ></Layout>
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
              sökord: [],
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}

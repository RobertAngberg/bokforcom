"use client";

import Steg3 from "../Steg3";
import StandardLayout from "./layouts/StandardLayout";
import LevfaktLayout from "./layouts/LevfaktLayout";
import { useBokforContext } from "../../../context/BokforContextProvider";

export default function Hyrbil({
  mode,
  renderMode = "standard",
}: {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
}) {
  const { state, actions } = useBokforContext();
  // Beräkna korrekt för hyrbil: 50% av momsen är avdragsgill
  const totalBelopp = Number(state.belopp ?? 0);
  const fullMoms = (totalBelopp / 1.25) * 0.25; // Full moms (25%)
  const moms = +(fullMoms * 0.5).toFixed(2); // Endast 50% avdragsgill
  const netto = +(totalBelopp - moms).toFixed(2); // Resterande blir kostnad

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!state.belopp &&
        !!state.transaktionsdatum &&
        !!state.leverantör &&
        !!state.fakturanummer &&
        !!state.fakturadatum
      : !!state.belopp && !!state.transaktionsdatum;

  const gåTillSteg3 = () => {
    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      actions.setExtrafält?.({
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: state.belopp ?? 0 },
        "5820": { label: "Hyrbilskostnader", debet: netto, kredit: 0 },
        "2640": { label: "Ingående moms", debet: moms, kredit: 0 },
      });
    } else {
      // Standard: Direkt betalning från företagskonto
      actions.setExtrafält?.({
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: state.belopp ?? 0 },
        "5820": { label: "Hyrbilskostnader", debet: netto, kredit: 0 },
        "2640": { label: "Ingående moms", debet: moms, kredit: 0 },
      });
    }
    actions.setCurrentStep?.(3);
  };

  const Layout = renderMode === "levfakt" ? LevfaktLayout : StandardLayout;

  if (mode === "steg2") {
    return (
      <Layout
        belopp={state.belopp}
        setBelopp={actions.setBelopp}
        transaktionsdatum={state.transaktionsdatum}
        setTransaktionsdatum={actions.setTransaktionsdatum}
        kommentar={state.kommentar}
        setKommentar={actions.setKommentar}
        fil={state.fil}
        setFil={actions.setFil}
        pdfUrl={state.pdfUrl}
        setPdfUrl={actions.setPdfUrl}
        isValid={giltigt}
        onSubmit={gåTillSteg3}
        setCurrentStep={actions.setCurrentStep}
        leverantör={state.leverantör}
        setLeverantör={actions.setLeverantör}
        fakturanummer={state.fakturanummer || undefined}
        setFakturanummer={actions.setFakturanummer}
        fakturadatum={state.fakturadatum || undefined}
        setFakturadatum={actions.setFakturadatum}
        förfallodatum={state.förfallodatum || undefined}
        setFörfallodatum={actions.setFörfallodatum}
        title="Hyrbil"
      ></Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <Steg3 />
        </div>
      </>
    );
  }
}

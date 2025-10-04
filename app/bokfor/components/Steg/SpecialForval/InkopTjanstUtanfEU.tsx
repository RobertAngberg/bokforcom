"use client";

import Steg3 from "../Steg3";
import StandardLayout from "./layouts/StandardLayout";
import LevfaktLayout from "./layouts/LevfaktLayout";
import { useBokforContext } from "../../../context/BokforContextProvider";

interface InkopTjanstUtanfEUProps {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
}

export default function InkopTjanstUtanfEU({
  mode,
  renderMode = "standard",
}: InkopTjanstUtanfEUProps) {
  const { state, actions } = useBokforContext();

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!state.belopp &&
        !!state.transaktionsdatum &&
        !!state.leverantör &&
        !!state.fakturanummer &&
        !!state.fakturadatum
      : !!state.belopp && !!state.transaktionsdatum;

  function gåTillSteg3() {
    const moms = (state.belopp ?? 0) * 0.25;

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: state.belopp ?? 0 },
        "2614": {
          label: "Utgående moms omvänd skattskyldighet, 25 %",
          debet: 0,
          kredit: moms,
        },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4531": {
          label: "Import tjänster land utanför EU, 25% moms",
          debet: state.belopp ?? 0,
          kredit: 0,
        },
      };
      actions.setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: state.belopp ?? 0 },
        "2614": {
          label: "Utgående moms omvänd skattskyldighet, 25 %",
          debet: 0,
          kredit: moms,
        },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4531": {
          label: "Import tjänster land utanför EU, 25% moms",
          debet: state.belopp ?? 0,
          kredit: 0,
        },
      };
      actions.setExtrafält?.(extrafältObj);
    }

    actions.setCurrentStep?.(3);
  }

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
        fakturanummer={state.fakturanummer ?? undefined}
        setFakturanummer={actions.setFakturanummer}
        fakturadatum={state.fakturadatum ?? undefined}
        setFakturadatum={actions.setFakturadatum}
        förfallodatum={state.förfallodatum ?? undefined}
        setFörfallodatum={actions.setFörfallodatum}
        title="Inköp tjänst utanför EU"
      >
        {/* InkopTjanstUtanfEU-specifikt innehåll */}
      </Layout>
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

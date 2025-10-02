"use client";

import Steg3 from "../Steg3";
import StandardLayout from "./layouts/StandardLayout";
import LevfaktLayout from "./layouts/LevfaktLayout";
import { useBokforContext } from "../../BokforProvider";

export default function ITtjansterEU({
  mode,
  renderMode = "standard",
}: {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
}) {
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
        "2614": { label: "Utgående moms omvänd skattskyldighet, 25 %", debet: 0, kredit: moms },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4535": {
          label: "Inköp av tjänster från annat EU-land, 25 %",
          debet: state.belopp ?? 0,
          kredit: 0,
        },
        "4598": {
          label: "Justering, omvänd moms",
          debet: 0,
          kredit: state.belopp ?? 0,
        },
        "6540": {
          label: "IT-tjänster",
          debet: state.belopp ?? 0,
          kredit: 0,
        },
      };
      actions.setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: state.belopp ?? 0 },
        "2614": { label: "Utgående moms omvänd skattskyldighet, 25 %", debet: 0, kredit: moms },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4535": {
          label: "Inköp av tjänster från annat EU-land, 25 %",
          debet: state.belopp ?? 0,
          kredit: 0,
        },
        "4598": {
          label: "Justering, omvänd moms",
          debet: 0,
          kredit: state.belopp ?? 0,
        },
        "6540": {
          label: "IT-tjänster",
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
        fakturanummer={state.fakturanummer || undefined}
        setFakturanummer={actions.setFakturanummer}
        fakturadatum={state.fakturadatum || undefined}
        setFakturadatum={actions.setFakturadatum}
        förfallodatum={state.förfallodatum || undefined}
        setFörfallodatum={actions.setFörfallodatum}
        title="IT-tjänster EU"
      >
        {/* ITtjansterEU-specifikt innehåll */}
        <div className="mb-4 p-4 bg-slate-800 rounded-lg">
          <h3 className="font-medium text-gray-400 mb-2">IT-tjänster från EU</h3>
          <p className="text-sm text-gray-400 mb-2">
            <strong>Omvänd skattskyldighet:</strong> Du betalar momsen i Sverige istället för i
            leverantörens land.
          </p>
          <p className="text-sm text-gray-400 mb-2">
            <strong>Momshantering:</strong> 25% utgående moms + 25% ingående moms (kvittar varandra)
          </p>
          <p className="text-sm text-gray-400">
            <strong>Bokföring:</strong> IT-tjänster (6540) + EU-inköp (4535) med justeringspost
            (4598)
          </p>
        </div>
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

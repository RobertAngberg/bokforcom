"use client";

import Steg3 from "../Steg3";
import StandardLayout from "./layouts/StandardLayout";
import LevfaktLayout from "./layouts/LevfaktLayout";
import TillbakaPil from "../../../../_components/TillbakaPil";
import InfoTooltip from "../../../../_components/InfoTooltip";
import { ITtjansterEUProps } from "../../../types/types";

export default function ITtjansterEU({
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
}: ITtjansterEUProps) {
  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp && !!transaktionsdatum && !!leverantör && !!fakturanummer && !!fakturadatum
      : !!belopp && !!transaktionsdatum;

  function gåTillSteg3() {
    const moms = (belopp ?? 0) * 0.25;

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: belopp ?? 0 },
        "2614": { label: "Utgående moms omvänd skattskyldighet, 25 %", debet: 0, kredit: moms },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4535": {
          label: "Inköp av tjänster från annat EU-land, 25 %",
          debet: belopp ?? 0,
          kredit: 0,
        },
        "4598": {
          label: "Justering, omvänd moms",
          debet: 0,
          kredit: belopp ?? 0,
        },
        "6540": {
          label: "IT-tjänster",
          debet: belopp ?? 0,
          kredit: 0,
        },
      };
      setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
        "2614": { label: "Utgående moms omvänd skattskyldighet, 25 %", debet: 0, kredit: moms },
        "2645": {
          label: "Beräknad ingående moms på förvärv från utlandet",
          debet: moms,
          kredit: 0,
        },
        "4535": {
          label: "Inköp av tjänster från annat EU-land, 25 %",
          debet: belopp ?? 0,
          kredit: 0,
        },
        "4598": {
          label: "Justering, omvänd moms",
          debet: 0,
          kredit: belopp ?? 0,
        },
        "6540": {
          label: "IT-tjänster",
          debet: belopp ?? 0,
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
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(2)} />
        <Steg3
          kontonummer="6540"
          kontobeskrivning="IT-tjänster EU"
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={{
            id: 0,
            namn: "IT-tjänster EU",
            beskrivning: "",
            typ: "",
            kategori: "",
            konton: [],
            momssats: 0.25,
            specialtyp: "ITtjansterEU",
            sökord: [],
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

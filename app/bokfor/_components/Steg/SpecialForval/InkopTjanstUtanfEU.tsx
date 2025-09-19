"use client";

import Steg3 from "../Steg3";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../../../_components/TillbakaPil";
import { InkopTjanstUtanfEUProps } from "../../../_types/types";

export default function InkopTjanstUtanfEU({
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
}: InkopTjanstUtanfEUProps) {
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
          debet: belopp ?? 0,
          kredit: 0,
        },
      };
      setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: belopp ?? 0 },
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
        title="Inköp tjänst utanför EU"
      >
        {/* InkopTjanstUtanfEU-specifikt innehåll */}
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(2)} />
        <Steg3
          kontonummer="4531"
          kontobeskrivning="Inköp tjänst utanför EU"
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={{
            id: 0,
            namn: "Inköp tjänst utanför EU",
            beskrivning: "",
            typ: "",
            kategori: "",
            konton: [],
            momssats: 0.25,
            specialtyp: "InkopTjanstUtanfEU",
            sökord: [],
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

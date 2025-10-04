"use client";

import { useState } from "react";
import Steg3 from "../Steg3";
import StandardLayout from "./layouts/StandardLayout";
import LevfaktLayout from "./layouts/LevfaktLayout";
import TillbakaPil from "../../../../_components/TillbakaPil";
import TextFalt from "../../../../_components/TextFalt";
import { useBokforContext } from "../../../context/BokforContextProvider";

export default function Importmoms({
  mode,
  renderMode = "standard",
}: {
  mode: "steg2" | "steg3";
  renderMode?: "standard" | "levfakt";
}) {
  const { state, actions } = useBokforContext();
  const [tull, setTull] = useState("");
  const [fiktiv, setFiktiv] = useState("");
  const [ovrigt, setOvrigt] = useState("");

  function gåTillSteg3() {
    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      const extrafältObj = {
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: state.belopp ?? 0 },
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
      actions.setExtrafält?.(extrafältObj);
    } else {
      // Standard: Direkt betalning från företagskonto
      const extrafältObj = {
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: state.belopp ?? 0 },
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
      actions.setExtrafält?.(extrafältObj);
    }

    actions.setCurrentStep?.(3);
  }

  const Layout = renderMode === "levfakt" ? LevfaktLayout : StandardLayout;

  if (mode === "steg2") {
    return (
      <Layout title="Importmoms" onSubmit={gåTillSteg3}>
        {/* Importmoms-specifika fält */}
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
          <p>Beloppet ovan ska vara = summan av de två beloppen nedan.</p>
        </div>

        <div className="space-y-2 mb-4">
          <TextFalt
            label="Tull och spedition m.m. inkl. moms"
            name="tull"
            type="number"
            value={tull}
            onChange={(e) => setTull(e.target.value)}
            required={false}
          />

          <TextFalt
            label="Övriga kostnader utan moms"
            name="ovrigt"
            type="number"
            value={ovrigt}
            onChange={(e) => setOvrigt(e.target.value)}
            required={false}
          />

          {/* Separator */}
          <div className="py-4">
            <hr className="border-gray-600" />
          </div>

          <TextFalt
            label="Ingående fiktiv moms på förvärv från utlandet"
            name="fiktiv"
            type="number"
            value={fiktiv}
            onChange={(e) => setFiktiv(e.target.value)}
            required={false}
          />

          <div className="mt-2 p-2 bg-blue-900/20 border border-blue-600/30 rounded text-sm text-blue-200 flex items-start gap-2">
            <svg
              className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
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
              <p>
                Fiktiv moms innebär att du bokför moms på utländska inköp som om köpet skett i
                Sverige.
              </p>
              <p>
                Ingen moms betalas i verkligheten eftersom beloppen kvittas mot varandra i
                bokföringen.
              </p>
              <p>Exempel: Import av varor för 1000kr - fiktiv moms ska anges som 250kr.</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => actions.setCurrentStep?.(2)} />
        <Steg3 />
      </div>
    );
  }
}

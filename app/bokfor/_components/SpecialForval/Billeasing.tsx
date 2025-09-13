// #region Huvud
"use client";

import Steg3 from "../Steg/Steg3";
import { useState } from "react";
import StandardLayout from "./_layouts/StandardLayout";
import LevfaktLayout from "./_layouts/LevfaktLayout";
import TillbakaPil from "../../../_components/TillbakaPil";
import TextFalt from "../../../_components/TextFalt";
import { BilleasingProps } from "../../_types/types";
// #endregion

export default function Billeasing({
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
}: BilleasingProps) {
  // Förenklade fält - moms beräknas automatiskt
  const [leasingavgiftInklMoms, setLeasingavgiftInklMoms] = useState<number>(0);
  const [forsakringOchSkatter, setForsakringOchSkatter] = useState<number>(0);
  const [adminAvgiftInklMoms, setAdminAvgiftInklMoms] = useState<number>(0);
  const [forhojdAvgiftInklMoms, setForhojdAvgiftInklMoms] = useState<number>(0);

  // Automatisk momsberäkning (25%)
  const leasingavgiftExklMoms = leasingavgiftInklMoms / 1.25;
  const momsLeasingavgift = leasingavgiftInklMoms - leasingavgiftExklMoms;
  const adminExklMoms = adminAvgiftInklMoms / 1.25;
  const momsAdminAvgift = adminAvgiftInklMoms - adminExklMoms;
  const forsakringExklMoms = forsakringOchSkatter / 1.25;
  const momsForsakring = forsakringOchSkatter - forsakringExklMoms;

  // Beräkna totalsumma för validering
  const totalBeraknad =
    leasingavgiftInklMoms + forsakringOchSkatter + adminAvgiftInklMoms + forhojdAvgiftInklMoms;

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp &&
        !!transaktionsdatum &&
        !!leverantör &&
        !!fakturanummer &&
        !!fakturadatum &&
        Math.abs(totalBeraknad - (belopp ?? 0)) < 1 // Måste stämma med totalsumman
      : (belopp ?? 0) > 0 && !!transaktionsdatum && Math.abs(totalBeraknad - (belopp ?? 0)) < 1;

  function gåTillSteg3() {
    // Bokios exakta beräkningar baserat på ditt exempel
    const totalBelopp = belopp ?? 0;

    // Förhöjd avgift: räkna ut exkl moms och moms
    const forhojdExklMoms = forhojdAvgiftInklMoms / 1.25;
    const momsForhojd = forhojdAvgiftInklMoms - forhojdExklMoms;

    // Bokios logik för 2640: 50% av leasing+admin moms + hela förhöjd moms
    const totalAvdragsgillMoms = (momsLeasingavgift + momsAdminAvgift) * 0.5 + momsForhojd;

    // Bokios logik för 5615: leasingavgift + 50% ej avdragsgill leasingmoms
    const leasing5615 = leasingavgiftExklMoms + momsLeasingavgift * 0.5;

    // Bokios logik för 6990: bara admin exkl moms
    const admin6990 = adminExklMoms;

    // Bokios logik för 5612: försäkring rakt av (momsfritt i Bokios exempel)
    const forsakring5612 = forsakringOchSkatter;

    // Bokios logik för 1720: förhöjd exkl moms + 50% ej avdragsgill adminmoms
    const forhojd1720 = forhojdExklMoms + momsAdminAvgift * 0.5;

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      setExtrafält?.({
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: totalAvdragsgillMoms, kredit: 0 },
        "5612": { label: "Försäkring och skatt för personbilar", debet: forsakring5612, kredit: 0 },
        "5615": { label: "Leasing av personbilar", debet: leasing5615, kredit: 0 },
        "6990": { label: "Övriga externa kostnader", debet: admin6990, kredit: 0 },
        "1720": { label: "Förutbetalda leasingavgifter", debet: forhojd1720, kredit: 0 },
      });
    } else {
      // Standard: Direkt betalning från företagskonto
      setExtrafält?.({
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: totalBelopp },
        "2640": { label: "Ingående moms", debet: totalAvdragsgillMoms, kredit: 0 },
        "5612": { label: "Försäkring och skatt för personbilar", debet: forsakring5612, kredit: 0 },
        "5615": { label: "Leasing av personbilar", debet: leasing5615, kredit: 0 },
        "6990": { label: "Övriga externa kostnader", debet: admin6990, kredit: 0 },
        "1720": { label: "Förutbetalda leasingavgifter", debet: forhojd1720, kredit: 0 },
      });
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
        title="Billeasing"
      >
        {/* Billeasing-specifika fält - förenklat */}
        <div className="space-y-4 mb-4">
          <TextFalt
            label="Leasingavgift (inkl. moms)"
            name="leasingavgiftInklMoms"
            type="number"
            value={leasingavgiftInklMoms || ""}
            onChange={(e) => setLeasingavgiftInklMoms(Number(e.target.value) || 0)}
            placeholder="Fyll i nu"
          />

          <TextFalt
            label="Försäkringspremier & skatter (momsfritt)"
            name="forsakringOchSkatter"
            type="number"
            value={forsakringOchSkatter || ""}
            onChange={(e) => setForsakringOchSkatter(Number(e.target.value) || 0)}
            placeholder="Fyll i nu"
          />

          <TextFalt
            label="Administrativa avgifter (inkl. moms)"
            name="adminAvgiftInklMoms"
            type="number"
            value={adminAvgiftInklMoms || ""}
            onChange={(e) => setAdminAvgiftInklMoms(Number(e.target.value) || 0)}
            placeholder="Fyll i nu"
          />

          <TextFalt
            label="Förhöjd avgift (inkl. moms)"
            name="forhojdAvgiftInklMoms"
            type="number"
            value={forhojdAvgiftInklMoms || ""}
            onChange={(e) => setForhojdAvgiftInklMoms(Number(e.target.value) || 0)}
            placeholder="Fyll i nu"
          />
        </div>

        {/* Visa automatisk momsberäkning */}
        {(leasingavgiftInklMoms > 0 || adminAvgiftInklMoms > 0) && (
          <div className="mb-4 p-3 bg-gray-900/20 border border-gray-600/30 rounded-lg">
            <h4 className="text-sm font-medium text-gray-200 mb-2">
              Automatisk momsberäkning (25%)
            </h4>
            <div className="text-sm text-gray-300 space-y-1">
              {leasingavgiftInklMoms > 0 && (
                <div>Moms leasingavgift: {momsLeasingavgift.toFixed(2)} kr</div>
              )}
              {adminAvgiftInklMoms > 0 && (
                <div>Moms administrativa avgifter: {momsAdminAvgift.toFixed(2)} kr</div>
              )}
              {forsakringOchSkatter > 0 && (
                <div className="text-gray-400">Försäkring & skatter: momsfritt</div>
              )}
            </div>
          </div>
        )}
      </Layout>
    );
  }

  if (mode === "steg3") {
    return (
      <div className="max-w-5xl mx-auto px-4 relative">
        <TillbakaPil onClick={() => setCurrentStep?.(2)} />
        <Steg3
          kontonummer="5615"
          kontobeskrivning="Billeasing"
          belopp={belopp ?? 0}
          transaktionsdatum={transaktionsdatum ?? ""}
          kommentar={kommentar ?? ""}
          valtFörval={{
            id: 0,
            namn: "Billeasing",
            beskrivning: "",
            typ: "",
            kategori: "",
            konton: [],
            momssats: 0.25,
            specialtyp: "Billeasing",
            sökord: [],
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

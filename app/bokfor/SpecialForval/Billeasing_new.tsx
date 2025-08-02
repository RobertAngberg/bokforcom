// #region Huvud
"use client";

import Steg3 from "../Steg3";
import { useState } from "react";
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
}: Props) {
  const [forsakring, setForsakring] = useState<number>(0);
  const [admin, setAdmin] = useState<number>(0);
  const [forhojd, setForhojd] = useState<number>(0);

  // Olika valideringslogik beroende på renderMode
  const giltigt =
    renderMode === "levfakt"
      ? !!belopp && !!transaktionsdatum && !!leverantör && !!fakturanummer && !!fakturadatum
      : (belopp ?? 0) > 0 && !!transaktionsdatum;

  function gåTillSteg3() {
    const leasing = belopp ?? 0;
    const adminAvg = admin ?? 0;
    const forsakringBelopp = forsakring ?? 0;
    const forhojdBelopp = forhojd ?? 0;

    // Moms på leasing och admin
    const momsLeasing = leasing * 0.25;
    const momsAdmin = adminAvg * 0.25;

    // Avdragsgill moms (50%)
    const momsLeasingAdminAvdr = (momsLeasing + momsAdmin) * 0.5;

    // Ej avdragsgill moms (50%)
    const momsLeasingAdminEjAvdr = (momsLeasing + momsAdmin) * 0.5;

    // Förhöjd avgift: räkna ut exkl moms och momsdel
    const forhojdExklMoms = forhojdBelopp / 1.25;
    const momsForhojd = forhojdBelopp - forhojdExklMoms;
    const momsForhojdAvdr = momsForhojd * 0.5;
    const momsForhojdEjAvdr = momsForhojd * 0.5;

    // 5615: Leasing exkl moms + ej avdragsgill moms på leasing/admin + ej avdragsgill moms på förhöjd avgift
    const total5615 = leasing + momsLeasingAdminEjAvdr + momsForhojdEjAvdr;

    // 6990: Admin exkl moms
    const total6990 = adminAvg;

    // 5612: Försäkring
    const total5612 = forsakringBelopp;

    // 1720: Förhöjd avgift exkl moms
    const total1720 = forhojdExklMoms;

    // 2640: Avdragsgill moms (leasing, admin, förhöjd)
    const totalMoms = momsLeasingAdminAvdr + momsForhojdAvdr;

    // Total
    const total = leasing + momsLeasing + adminAvg + momsAdmin + forsakringBelopp + forhojdBelopp;

    if (renderMode === "levfakt") {
      // Leverantörsfaktura: Skuld mot leverantör
      setExtrafält?.({
        "2440": { label: "Leverantörsskulder", debet: 0, kredit: total },
        "2640": { label: "Ingående moms", debet: totalMoms, kredit: 0 },
        "5612": { label: "Försäkring och skatt för personbilar", debet: total5612, kredit: 0 },
        "5615": { label: "Leasing av personbilar", debet: total5615, kredit: 0 },
        "6990": { label: "Övriga externa kostnader", debet: total6990, kredit: 0 },
        "1720": { label: "Förutbetalda leasingavgifter", debet: total1720, kredit: 0 },
      });
    } else {
      // Standard: Direkt betalning från företagskonto
      setExtrafält?.({
        "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
        "2640": { label: "Ingående moms", debet: totalMoms, kredit: 0 },
        "5612": { label: "Försäkring och skatt för personbilar", debet: total5612, kredit: 0 },
        "5615": { label: "Leasing av personbilar", debet: total5615, kredit: 0 },
        "6990": { label: "Övriga externa kostnader", debet: total6990, kredit: 0 },
        "1720": { label: "Förutbetalda leasingavgifter", debet: total1720, kredit: 0 },
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
        {/* Billeasing-specifika fält */}
        <div className="space-y-4 mb-4">
          <TextFalt
            label="Försäkring (kr)"
            name="forsakring"
            type="number"
            value={forsakring || ""}
            onChange={(e) => setForsakring(Number(e.target.value) || 0)}
          />

          <TextFalt
            label="Administrationsavgift (kr)"
            name="admin"
            type="number"
            value={admin || ""}
            onChange={(e) => setAdmin(Number(e.target.value) || 0)}
          />

          <TextFalt
            label="Förhöjd avgift inkl. moms (kr)"
            name="forhojd"
            type="number"
            value={forhojd || ""}
            onChange={(e) => setForhojd(Number(e.target.value) || 0)}
          />
        </div>

        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Billeasing - Beräkningar</h3>
          <p className="text-sm text-blue-700 mb-1">
            Avdragsgill moms (50% av 25%):{" "}
            {((((belopp ?? 0) + admin) * 0.25 + (forhojd / 1.25) * 0.25) * 0.5).toFixed(2)} kr
          </p>
          <p className="text-sm text-blue-700">
            Fördelning: Leasing, Administration, Försäkring och Förhöjd avgift
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
          }}
          setCurrentStep={setCurrentStep}
          extrafält={extrafält}
        />
      </div>
    );
  }
}

// #region Huvud
"use client";

import TextFält from "../../_components/TextFält";
import KnappFullWidth from "../../_components/KnappFullWidth";
import LaddaUppFil from "../LaddaUppFil";
import Forhandsgranskning from "../Förhandsgranskning";
import DatePicker from "react-datepicker";
import Steg3 from "../Steg3";
import { useState } from "react";
import BakåtPil from "../../_components/BakåtPil";

interface Props {
  mode: "steg2" | "steg3";
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
}
// #endregion

export default function Billeasing({
  mode,
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
}: Props) {
  const [forsakring, setForsakring] = useState<number>(0);
  const [admin, setAdmin] = useState<number>(0);
  const [forhojd, setForhojd] = useState<number>(0);

  const giltigt = (belopp ?? 0) > 0 && !!transaktionsdatum;

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

    // 1930: Kredit, hela fakturan
    const total = leasing + momsLeasing + adminAvg + momsAdmin + forsakringBelopp + forhojdBelopp;

    setExtrafält?.({
      "1930": { label: "Företagskonto / affärskonto", debet: 0, kredit: total },
      "2640": { label: "Ingående moms", debet: totalMoms, kredit: 0 },
      "5612": { label: "Försäkring och skatt för personbilar", debet: total5612, kredit: 0 },
      "5615": { label: "Leasing av personbilar", debet: total5615, kredit: 0 },
      "6990": { label: "Övriga externa kostnader", debet: total6990, kredit: 0 },
      "1720": { label: "Förutbetalda leasingavgifter", debet: total1720, kredit: 0 },
    });

    setBelopp(total);
    setCurrentStep?.(3);
  }

  if (mode === "steg2") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <BakåtPil onClick={() => setCurrentStep?.(1)} />

          <h1 className="mb-6 text-3xl text-center">Steg 2: Billeasing</h1>
          <div className="flex flex-col-reverse justify-between max-w-5xl mx-auto px-4 md:flex-row">
            <div className="w-full md:w-[40%] bg-slate-900 border border-gray-700 rounded-xl p-6">
              <LaddaUppFil
                fil={fil}
                setFil={setFil}
                setPdfUrl={setPdfUrl}
                setTransaktionsdatum={setTransaktionsdatum}
                setBelopp={setBelopp}
              />

              <TextFält
                label="Leasingavgift (exkl. moms)"
                name="leasing"
                value={belopp ?? ""}
                onChange={(e) => setBelopp(Number(e.target.value))}
                required
              />

              <TextFält
                label="Försäkring + skatt"
                name="forsakring"
                value={forsakring}
                onChange={(e) => setForsakring(Number(e.target.value))}
                required
              />

              <TextFält
                label="Adminavgifter (exkl. moms)"
                name="admin"
                value={admin}
                onChange={(e) => setAdmin(Number(e.target.value))}
                required
              />

              <TextFält
                label="Förhöjd avgift (inkl. moms)"
                name="forhojd"
                value={forhojd}
                onChange={(e) => setForhojd(Number(e.target.value))}
                required={false}
              />

              <label className="block text-sm font-medium text-white mb-2">Betaldatum</label>
              <DatePicker
                className="w-full p-2 mb-4 rounded bg-slate-900 text-white border border-gray-700"
                selected={transaktionsdatum ? new Date(transaktionsdatum) : null}
                onChange={(d) => setTransaktionsdatum(d ? d.toISOString().split("T")[0] : "")}
                dateFormat="yyyy-MM-dd"
                locale="sv"
                required
              />

              <TextFält
                label="Kommentar"
                name="kommentar"
                value={kommentar ?? ""}
                onChange={(e) => setKommentar?.(e.target.value)}
                required={false}
              />

              <KnappFullWidth text="Gå vidare" onClick={gåTillSteg3} disabled={!giltigt} />
            </div>

            <Forhandsgranskning fil={fil ?? null} pdfUrl={pdfUrl ?? null} />
          </div>
        </div>
      </>
    );
  }

  if (mode === "steg3") {
    return (
      <>
        <div className="max-w-5xl mx-auto px-4 relative">
          <BakåtPil onClick={() => setCurrentStep?.(2)} />
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
              specialtyp: "billeasing",
            }}
            setCurrentStep={setCurrentStep}
            extrafält={extrafält}
          />
        </div>
      </>
    );
  }
}

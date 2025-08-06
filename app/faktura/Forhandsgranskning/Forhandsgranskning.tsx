//#region
/* eslint-disable @next/next/no-img-element */
"use client";

import { useFakturaContext } from "../FakturaProvider";
import { useSession } from "next-auth/react";
import { useState } from "react";
import BetalningsInfo from "./BetalningsInfo";
import RotRutInfo from "./RotRutInfo";
import ArtiklarLista from "./ArtiklarLista";
import Logotyp from "./Logotyp";
import Fot from "./Fot";
import AvsändMottag from "./AvsandMottag";
import TotalerInfo from "./TotalerInfo";
//#endregion

export default function Forhandsgranskning() {
  const { formData, setFormData } = useFakturaContext();
  const { data: session } = useSession();
  const rows = formData.artiklar || [];

  // Logotypstorlek-slider (endast i preview)
  const initialSlider = (((formData.logoWidth ?? 200) - 50) / 150) * 100;
  const [logoSliderValue, setLogoSliderValue] = useState(initialSlider);

  const handleLogoSliderChange = (value: number) => {
    setLogoSliderValue(value);
    const calculated = 50 + (value / 100) * 150;
    setFormData((prev) => ({ ...prev, logoWidth: calculated }));
    localStorage.setItem("company_logoWidth", calculated.toString());
  };

  const logoSize = formData.logoWidth ?? 200;

  // Summeringsberäkningar
  const sumExkl = rows.reduce(
    (acc, rad) =>
      acc + parseFloat(String(rad.antal) || "0") * parseFloat(String(rad.prisPerEnhet) || "0"),
    0
  );

  const totalMoms = rows.reduce((acc, rad) => {
    const antal = parseFloat(String(rad.antal) || "0");
    const pris = parseFloat(String(rad.prisPerEnhet) || "0");
    const moms = parseFloat(String(rad.moms) || "0");
    return acc + antal * pris * (moms / 100);
  }, 0);

  // ROT/RUT-avdrag enligt Skatteverket: 30% av arbetskostnad inkl moms
  const arbetskostnadInklMoms = sumExkl + totalMoms;
  const rotRutAvdrag =
    formData.rotRutAktiverat && formData.rotRutTyp === "ROT"
      ? 0.3 * arbetskostnadInklMoms
      : formData.rotRutAktiverat && formData.rotRutTyp === "RUT"
        ? 0.5 * arbetskostnadInklMoms
        : 0;

  const totalSum = arbetskostnadInklMoms - rotRutAvdrag;
  const summaAttBetala = Math.max(totalSum, 0);

  return (
    <>
      <div
        id="print-area"
        className="relative bg-white text-black w-[210mm] h-[297mm] p-10 text-[11pt] leading-relaxed overflow-hidden flex flex-col"
        style={{ backgroundColor: "#ffffff", minHeight: "297mm" }}
      >
        <Logotyp
          logo={formData.logo}
          logoSize={logoSize}
          logoSliderValue={logoSliderValue}
          setLogoSliderValue={handleLogoSliderChange}
          showSlider={true}
        />

        {/* Wrapper, ej fot */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h1 className="text-4xl font-bold mb-16">Faktura</h1>

          <AvsändMottag formData={formData} />

          <BetalningsInfo formData={formData} summaAttBetala={summaAttBetala} />

          <RotRutInfo formData={formData} />

          <ArtiklarLista rows={rows} />

          <TotalerInfo
            sumExkl={sumExkl}
            totalMoms={totalMoms}
            rotRutAvdrag={rotRutAvdrag}
            summaAttBetala={summaAttBetala}
            valuta={rows[0]?.valuta ?? "SEK"}
            rotRutTyp={formData.rotRutTyp}
          />
        </div>

        <Fot formData={formData} session={session} />
      </div>
    </>
  );
}

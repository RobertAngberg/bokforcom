//#region
/* eslint-disable @next/next/no-img-element */
"use client";

import { useFaktura } from "../../../hooks/useFaktura";
import { useForhandsgranskning } from "../../../hooks/useForhandsgranskning";
import { useSession } from "../../../../_lib/auth-client";
import BetalningsInfo from "./BetalningsInfo";
import RotRutInfo from "./RotRutInfo";
import ArtiklarLista from "./ArtiklarLista";
import Logotyp from "./Logotyp";
import Fot from "./Fot";
import AvsändMottag from "./AvsandMottag";
import TotalerInfo from "./TotalerInfo";
//#endregion

export default function Forhandsgranskning() {
  const { formData } = useFaktura();
  const { data: session } = useSession();
  const rows = formData.artiklar || [];

  // Alla beräkningar från useForhandsgranskning hooken
  const forhandsgranskningCalcs = useForhandsgranskning().getForhandsgranskningCalculations();
  const {
    sumExkl,
    totalMoms,
    rotRutAvdrag,
    summaAttBetala,
    logoSize,
    logoSliderValue,
    handleLogoSliderChange,
  } = forhandsgranskningCalcs;

  return (
    <div className="w-full overflow-auto">
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print { #print-area { width: 210mm !important; min-height: 297mm !important; } }`,
        }}
      />
      <div
        id="print-area"
        className="relative mx-auto flex min-h-[297mm] w-full max-w-[210mm] flex-col overflow-hidden bg-white p-6 text-[11pt] leading-relaxed text-black sm:p-10"
        style={{
          backgroundColor: "#ffffff",
        }}
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

          <RotRutInfo formData={formData} beraknatAvdrag={rotRutAvdrag} />

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
    </div>
  );
}

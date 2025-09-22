//#region Huvud
"use client";

import { AvsändMottagProps } from "../../../types/types";
//#endregion

export default function AvsändMottag({ formData }: AvsändMottagProps) {
  return (
    <div className="grid grid-cols-2 gap-6 mb-20">
      <div>
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {formData.företagsnamn}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{formData.adress}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {formData.postnummer} {formData.stad}
        </p>
      </div>
      <div>
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {formData.kundnamn}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{formData.kundadress}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {formData.kundpostnummer} {formData.kundstad}
        </p>
      </div>
    </div>
  );
}

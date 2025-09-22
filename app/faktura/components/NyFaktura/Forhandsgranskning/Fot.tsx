//#region Huvud
"use client";

import { FotProps } from "../types/types";
//#endregion

export default function Fot({ formData, session }: FotProps) {
  return (
    <div
      className="grid grid-cols-2 mt-10 pt-6 text-[10pt]"
      style={{ borderTop: "1px solid #ccc" }}
    >
      <div className="space-y-1">
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Namn
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{formData.adress || "—"}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          {formData.postnummer || "—"} {formData.stad || "—"}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Org.nr: {formData.organisationsnummer || "—"}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Moms.nr: {formData.momsregistreringsnummer || "—"}
        </p>
      </div>
      <div className="text-right space-y-1">
        <p className="font-bold" style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Kontaktuppgifter
        </p>
        {/* Ej rätt????????????? Session */}
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>{formData.företagsnamn || "—"}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>
          Telefon: {formData.telefonnummer || "—"}
        </p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>E-post: {formData.epost || "—"}</p>
        <p style={{ lineHeight: 1.22, margin: "0 0 2px 0" }}>Webb: {formData.webbplats || "—"}</p>
      </div>
    </div>
  );
}

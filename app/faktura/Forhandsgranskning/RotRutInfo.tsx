// RotRutInfo.tsx
import React from "react";

interface RotRutInfoProps {
  formData: any;
}

export default function RotRutInfo({ formData }: RotRutInfoProps) {
  if (!formData.rotRutAktiverat || (formData.rotRutTyp !== "ROT" && formData.rotRutTyp !== "RUT")) {
    return null;
  }

  return (
    <div className="mb-8 p-4 rounded bg-yellow-50 border border-yellow-200 text-[10pt] text-black">
      <div className="font-bold mb-2">
        {formData.rotRutTyp === "ROT" ? "ROT-avdrag" : "RUT-avdrag"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div>
            <span className="font-semibold">Arbetskostnad exkl. moms:</span>{" "}
            {formData.arbetskostnadExMoms
              ? Number(formData.arbetskostnadExMoms).toLocaleString("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                })
              : "—"}
          </div>
          <div>
            <span className="font-semibold">Avdrag (%):</span>{" "}
            {formData.avdragProcent ? `${formData.avdragProcent}%` : "—"}
          </div>
          <div>
            <span className="font-semibold">Beräknat avdrag:</span>{" "}
            {formData.avdragBelopp !== undefined
              ? Number(formData.avdragBelopp).toLocaleString("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                })
              : "—"}
          </div>
        </div>
        <div>
          {formData.rotRutTyp === "ROT" && (
            <>
              <div>
                <span className="font-semibold">Personnummer:</span> {formData.personnummer || "—"}
              </div>
              {formData.rotBoendeTyp === "brf" ? (
                <>
                  <div>
                    <span className="font-semibold">Organisationsnummer (BRF):</span>{" "}
                    {formData.brfOrganisationsnummer || "—"}
                  </div>
                  <div>
                    <span className="font-semibold">Lägenhetsnummer:</span>{" "}
                    {formData.brfLagenhetsnummer || "—"}
                  </div>
                </>
              ) : (
                <div>
                  <span className="font-semibold">Fastighetsbeteckning:</span>{" "}
                  {formData.fastighetsbeteckning || "—"}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

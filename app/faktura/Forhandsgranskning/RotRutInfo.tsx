// RotRutInfo.tsx
import React from "react";

interface RotRutInfoProps {
  formData: any;
}

export default function RotRutInfo({ formData }: RotRutInfoProps) {
  // Visa ROT/RUT-info om typ är vald (oavsett rotRutAktiverat status)
  if (!formData.rotRutTyp || (formData.rotRutTyp !== "ROT" && formData.rotRutTyp !== "RUT")) {
    return null;
  }

  return (
    <div className="mb-8 p-4 rounded bg-gray-50 border border-gray-200 text-[10pt] text-black">
      <div className="font-bold mb-2">
        {formData.rotRutTyp === "ROT" ? "ROT-avdrag" : "RUT-avdrag"}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {/* Visa information från ROT/RUT-artiklar */}
          {formData.artiklar && formData.artiklar.some((a: any) => a.rotRutTyp) ? (
            (() => {
              const rotRutArtiklar = formData.artiklar.filter((a: any) => a.rotRutTyp);
              const totalAntal = rotRutArtiklar.reduce(
                (sum: number, a: any) => sum + (a.antal || 0),
                0
              );
              const genomsnittsPris =
                rotRutArtiklar.length > 0
                  ? rotRutArtiklar.reduce((sum: number, a: any) => sum + (a.prisPerEnhet || 0), 0) /
                    rotRutArtiklar.length
                  : 0;

              return (
                <>
                  <div>
                    <span className="font-semibold">Antal timmar:</span> {totalAntal} h
                  </div>
                  <div>
                    <span className="font-semibold">Genomsnittligt pris per timme exkl. moms:</span>{" "}
                    {genomsnittsPris.toLocaleString("sv-SE", {
                      style: "currency",
                      currency: "SEK",
                    })}
                  </div>
                </>
              );
            })()
          ) : (
            <div>
              <span className="font-semibold">Arbetskostnad exkl. moms:</span>{" "}
              {formData.arbetskostnadExMoms
                ? Number(formData.arbetskostnadExMoms).toLocaleString("sv-SE", {
                    style: "currency",
                    currency: "SEK",
                  })
                : "—"}
            </div>
          )}
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

      {/* Beskrivning och period för arbetet */}
      {(formData.rotRutBeskrivning || formData.rotRutStartdatum || formData.rotRutSlutdatum) && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="font-bold mb-2">Arbetets beskrivning och period</div>
          {formData.rotRutBeskrivning && (
            <div className="mb-2">
              <span className="font-semibold">Beskrivning:</span> {formData.rotRutBeskrivning}
            </div>
          )}
          {(formData.rotRutStartdatum || formData.rotRutSlutdatum) && (
            <div>
              <span className="font-semibold">Period:</span>
              {formData.rotRutStartdatum && (
                <span> {new Date(formData.rotRutStartdatum).toLocaleDateString("sv-SE")}</span>
              )}
              {formData.rotRutStartdatum && formData.rotRutSlutdatum && " – "}
              {formData.rotRutSlutdatum && (
                <span>{new Date(formData.rotRutSlutdatum).toLocaleDateString("sv-SE")}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

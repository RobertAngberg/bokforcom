// RotRutInfo.tsx
import React from "react";

interface RotRutInfoProps {
  formData: any;
  beraknatAvdrag?: number;
}

export default function RotRutInfo({ formData, beraknatAvdrag = 0 }: RotRutInfoProps) {
  // Kolla om ROT/RUT är aktiverat på formulärnivå ELLER om det finns ROT/RUT-artiklar
  const harROTRUTArtiklar =
    formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
  const rotRutTyp =
    formData.rotRutTyp ||
    (harROTRUTArtiklar &&
      (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

  // Hämta personnummer från formData eller artiklar
  const personnummer =
    formData.personnummer ||
    (formData.artiklar &&
      (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutPersonnummer)
        ?.rotRutPersonnummer);

  // Visa ROT/RUT-info endast om ROT/RUT är aktiverat ELLER om det finns ROT/RUT-artiklar
  if (
    (!formData.rotRutAktiverat && !harROTRUTArtiklar) ||
    !rotRutTyp ||
    (rotRutTyp !== "ROT" && rotRutTyp !== "RUT")
  ) {
    return null;
  }

  return (
    <div className="mb-8 p-4 rounded bg-gray-50 border border-gray-200 text-[10pt] text-black">
      <div className="font-bold mb-2">{rotRutTyp === "ROT" ? "ROT-avdrag" : "RUT-avdrag"}</div>
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
            {rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—"}
          </div>
          <div>
            <span className="font-semibold">Beräknat avdrag:</span>{" "}
            {beraknatAvdrag > 0
              ? beraknatAvdrag.toLocaleString("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                })
              : "—"}
          </div>
        </div>
        <div>
          {rotRutTyp === "ROT" && (
            <>
              <div>
                <span className="font-semibold">Personnummer:</span> {personnummer || "—"}
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
              {formData.rotRutStartdatum && formData.rotRutStartdatum !== "" && (
                <span> {new Date(formData.rotRutStartdatum).toLocaleDateString("sv-SE")}</span>
              )}
              {formData.rotRutStartdatum && formData.rotRutSlutdatum && " – "}
              {formData.rotRutSlutdatum && formData.rotRutSlutdatum !== "" && (
                <span>{new Date(formData.rotRutSlutdatum).toLocaleDateString("sv-SE")}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

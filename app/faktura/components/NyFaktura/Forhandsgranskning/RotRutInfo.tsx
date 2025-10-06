import { formatCurrency, parseNumberSafe } from "../../../../_utils/format";
import { useForhandsgranskning } from "../../../hooks/useForhandsgranskning";
import { RotRutInfoProps } from "../../../types/types";

export default function RotRutInfo({ formData, beraknatAvdrag = 0 }: RotRutInfoProps) {
  const forhandsgranskningCalcs = useForhandsgranskning().getForhandsgranskningCalculations();
  const {
    shouldShowRotRut,
    rotRutTyp,
    harROTRUTArtiklar,
    rotRutPersonnummer,
    rotRutTotalTimmar,
    rotRutGenomsnittsPris,
    rotRutAvdragProcent,
  } = forhandsgranskningCalcs;

  if (!shouldShowRotRut) {
    return null;
  }

  return (
    <div className="mb-8 p-4 rounded bg-gray-50 border border-gray-200 text-[10pt] text-black">
      <div className="font-bold mb-2">{rotRutTyp === "ROT" ? "ROT-avdrag" : "RUT-avdrag"}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {/* Visa information från ROT/RUT-artiklar */}
          {harROTRUTArtiklar ? (
            <>
              <div>
                <span className="font-semibold">Antal timmar:</span> {rotRutTotalTimmar} h
              </div>
              <div>
                <span className="font-semibold">Genomsnittligt pris per timme exkl. moms:</span>{" "}
                {formatCurrency(rotRutGenomsnittsPris)}
              </div>
            </>
          ) : (
            <div>
              <span className="font-semibold">Arbetskostnad exkl. moms:</span>{" "}
              {formData.arbetskostnadExMoms
                ? formatCurrency(parseNumberSafe(formData.arbetskostnadExMoms))
                : "—"}
            </div>
          )}
          <div>
            <span className="font-semibold">Avdrag (%):</span> {rotRutAvdragProcent}
          </div>
          <div>
            <span className="font-semibold">Beräknat avdrag:</span>{" "}
            {beraknatAvdrag > 0 ? formatCurrency(beraknatAvdrag) : "—"}
          </div>
        </div>
        <div>
          {rotRutTyp === "ROT" && (
            <>
              <div>
                <span className="font-semibold">Personnummer:</span> {rotRutPersonnummer || "—"}
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

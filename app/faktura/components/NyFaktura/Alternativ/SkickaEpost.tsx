//#region Huvud
"use client";
import Knapp from "../../../../_components/Knapp";
import TextFalt from "../../../../_components/TextFalt";
import { useSkickaEpost } from "../../../hooks/useSkickaEpost";
import { SkickaEpostProps } from "../../../types/types";
//#endregion

export default function SkickaEpost({ onSuccess, onError }: SkickaEpostProps) {
  const {
    isSending,
    mottagareEmail,
    setMottagareEmail,
    egetMeddelande,
    setEgetMeddelande,
    skickaEpost,
    isEpostButtonDisabled,
    epostButtonText,
    epostStatusMessage,
  } = useSkickaEpost();

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow mt-4">
      <h3 className="text-white text-xl mb-6">E-posta fakturan med bifogad PDF</h3>

      <div>
        {/* E-postadress fält */}
        <TextFalt
          label="Mottagarens e-postadress *"
          name="mottagare-email"
          type="email"
          value={mottagareEmail}
          onChange={(e) => setMottagareEmail(e.target.value)}
          placeholder="kundnamn@exempel.se"
          disabled={isSending}
          required={true}
        />

        {/* Eget meddelande */}
        <TextFalt
          label="Eget meddelande (valfritt)"
          name="eget-meddelande"
          type="textarea"
          value={egetMeddelande}
          onChange={(e) => setEgetMeddelande(e.target.value)}
          placeholder="Skriv ett personligt meddelande som läggs till i e-postmeddelandet..."
          disabled={isSending}
          required={false}
        />

        {/* Skicka-knapp */}
        <div className="flex justify-between items-center pt-0.5">
          <div className="flex-1">
            {epostStatusMessage.type === "warning" && (
              <p className="text-orange-400 text-sm">⚠️ {epostStatusMessage.text}</p>
            )}
          </div>

          <Knapp
            onClick={() => skickaEpost({ onSuccess, onError })}
            text={epostButtonText}
            disabled={isEpostButtonDisabled}
          />
        </div>
      </div>
    </div>
  );
}

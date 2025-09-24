//#region Huvud
"use client";
import Knapp from "../../../../_components/Knapp";
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
    hasCustomerEmail,
  } = useSkickaEpost();

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow mt-4">
      <h3 className="text-white text-xl mb-6">E-posta fakturan med bifogad PDF</h3>

      <div className="space-y-4">
        {/* E-postadress fält */}
        <div>
          <label
            htmlFor="mottagare-email"
            className="block text-slate-300 text-sm font-medium mb-2"
          >
            Mottagarens e-postadress <span className="text-red-400">*</span>
          </label>
          <input
            id="mottagare-email"
            type="email"
            value={mottagareEmail}
            onChange={(e) => setMottagareEmail(e.target.value)}
            placeholder="kundnamn@exempel.se"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          {hasCustomerEmail && (
            <p className="text-slate-400 text-xs mt-1">💡 Förifylld med kundens e-postadress</p>
          )}
        </div>

        {/* Eget meddelande */}
        <div>
          <label
            htmlFor="eget-meddelande"
            className="block text-slate-300 text-sm font-medium mb-2"
          >
            Eget meddelande (valfritt)
          </label>
          <textarea
            id="eget-meddelande"
            value={egetMeddelande}
            onChange={(e) => setEgetMeddelande(e.target.value)}
            placeholder="Skriv ett personligt meddelande som läggs till i e-postmeddelandet..."
            rows={4}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            disabled={isSending}
          />
          <p className="text-slate-400 text-xs mt-1">
            Detta meddelande visas i e-postmeddelandet före fakturainformationen
          </p>
        </div>

        {/* Skicka-knapp */}
        <div className="flex justify-between items-center pt-4">
          <div className="flex-1">
            <p className="text-slate-400 text-sm">
              {epostStatusMessage.type === "warning" ? (
                <span className="text-orange-400">⚠️ {epostStatusMessage.text}</span>
              ) : (
                <>
                  E-posten skickas till{" "}
                  <code className="bg-slate-700 px-1 py-0.5 rounded">
                    {mottagareEmail || "ingen e-post angiven"}
                  </code>
                </>
              )}
            </p>
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

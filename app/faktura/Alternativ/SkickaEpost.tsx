//#region Huvud
"use client";
import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import { useFakturaContext } from "../FakturaProvider";
import { generatePDFAsBase64 } from "../../_utils/pdfGenerator";

interface Props {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}
//#endregion

export default function SkickaEpost({ onSuccess, onError }: Props) {
  //#region State
  const [isSending, setIsSending] = useState(false);
  const { formData, setFormData } = useFakturaContext();
  const [mottagareEmail, setMottagareEmail] = useState("");
  const [egetMeddelande, setEgetMeddelande] = useState("");
  //#endregion

  // Uppdatera mottagarens e-post när kundens e-post ändras
  useEffect(() => {
    if (formData.kundemail && formData.kundemail.trim()) {
      setMottagareEmail(formData.kundemail);
    }
  }, [formData.kundemail]);

  const skickaTestmail = async () => {
    // Validering
    if (!mottagareEmail.trim()) {
      alert("❌ Ange mottagarens e-postadress");
      return;
    }

    if (!mottagareEmail.includes("@")) {
      alert("❌ Ange en giltig e-postadress");
      return;
    }

    setIsSending(true);

    try {
      // Generera PDF med den delade funktionen
      const pdfBase64 = await generatePDFAsBase64();

      // Skapa fakturanummer med nollutfyllnad
      const fakturaNr = formData.fakturanummer
        ? formData.fakturanummer.toString().padStart(4, "0")
        : "faktura";

      // Skicka e-post med PDF-bilaga och eget meddelande
      const response = await fetch("/api/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          faktura: {
            ...formData,
            kundemail: mottagareEmail, // Använd det angivna e-postfältet
          },
          pdfAttachment: pdfBase64,
          filename: `Faktura-${fakturaNr}.pdf`,
          customMessage: egetMeddelande.trim(), // Skicka med det egna meddelandet
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunde inte skicka e-post");
      }

      alert("✅ Faktura skickad! Kolla din inbox.");
      onSuccess?.();
    } catch (error) {
      console.error("❌ E-postfel:", error);
      const errorMessage = error instanceof Error ? error.message : "Okänt fel";
      alert(`❌ Kunde inte skicka faktura: ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

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
          {formData.kundemail && formData.kundemail.trim() && (
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
              E-posten skickas till{" "}
              <code className="bg-slate-700 px-1 py-0.5 rounded">
                {mottagareEmail || "ingen e-post angiven"}
              </code>
            </p>
          </div>

          <Knapp
            onClick={skickaTestmail}
            text={isSending ? "📤 Skickar..." : "📧 Skicka faktura"}
            disabled={isSending || !formData.fakturanummer || !mottagareEmail.trim()}
          />
        </div>
      </div>
    </div>
  );
}

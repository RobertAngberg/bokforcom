//#region Huvud
"use client";

import Knapp from "../../_components/Knapp";
import ExporteraPDFKnapp from "./ExporteraPDFKnapp";
import SkickaEpost from "./SkickaEpost";
import { saveInvoice, hämtaSparadeFakturor } from "../actions";
import { useFakturaContext } from "../FakturaProvider";

interface Props {
  onReload: () => void;
  onPreview: () => void;
  // ❌ Tog bort: onSave: () => void;
  // ❌ Tog bort: onPrint: () => void; (används inte)
}
//#endregion

export default function Alternativ({ onReload, onPreview }: Props) {
  const { formData } = useFakturaContext();

  const hanteraSpara = async () => {
    const fd = new FormData();
    try {
      fd.append("artiklar", JSON.stringify(formData.artiklar ?? []));
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "artiklar" && v != null) fd.append(k, String(v));
      });
      const res = await saveInvoice(fd);

      if (res.success) {
        alert("✅ Faktura sparad!");
        // Trigga reload event så Fakturor.tsx uppdaterar sin lista
        window.dispatchEvent(new Event("reloadFakturor"));
      } else {
        alert("❌ Kunde inte spara fakturan.");
      }
    } catch {
      alert("❌ Kunde inte konvertera artiklar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Knapp onClick={hanteraSpara} text="💾 Spara faktura" />
        <Knapp onClick={onPreview} text="👁️ Förhandsgranska" />
        <Knapp onClick={onReload} text="🔄 Återställ" />
        <ExporteraPDFKnapp />
      </div>

      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />
    </div>
  );
}

//#region Huvud
"use client";

import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import ExporteraPDFKnapp from "./ExporteraPDFKnapp";
import SkickaEpost from "./SkickaEpost";
import BokförFakturaModal from "./BokförFakturaModal";
import {
  saveInvoice,
  hämtaSparadeFakturor,
  hämtaFakturaStatus,
  bokförFaktura,
  hämtaBokföringsmetod,
} from "../actions";
import { useFakturaContext } from "../FakturaProvider";

interface Props {
  onReload: () => void;
  onPreview: () => void;
  // ❌ Tog bort: onSave: () => void;
  // ❌ Tog bort: onPrint: () => void; (används inte)
}
//#endregion

export default function Alternativ({ onReload, onPreview }: Props) {
  const { formData, setFormData } = useFakturaContext();
  const [sparadeFakturor, setSparadeFakturor] = useState<any[]>([]);
  const [bokförModalOpen, setBokförModalOpen] = useState(false);
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
  }>({});

  // Hämta fakturasstatus när formData.id ändras
  useEffect(() => {
    if (formData.id) {
      hämtaFakturaStatus(parseInt(formData.id)).then((status) => {
        setFakturaStatus(status);
      });
    } else {
      setFakturaStatus({});
    }
  }, [formData.id]);

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

        // UPPDATERA FORMDATA MED NYTT ID!
        if (res.id) {
          setFormData((prev) => ({
            ...prev,
            id: res.id.toString(),
          }));
        }

        // Trigga reload event så Fakturor.tsx uppdaterar sin lista
        window.dispatchEvent(new Event("reloadFakturor"));
      } else {
        alert("❌ Kunde inte spara fakturan.");
      }
    } catch {
      alert("❌ Kunde inte konvertera artiklar");
    }
  };

  const hanteraBokför = async () => {
    // Om fakturan inte är sparad, spara den först
    if (!formData.id) {
      // SPARA FÖRST
      const fd = new FormData();
      try {
        fd.append("artiklar", JSON.stringify(formData.artiklar ?? []));
        Object.entries(formData).forEach(([k, v]) => {
          if (k !== "artiklar" && v != null) fd.append(k, String(v));
        });
        const res = await saveInvoice(fd);

        if (res.success && res.id) {
          // UPPDATERA FORMDATA MED NYTT ID!
          setFormData((prev) => ({
            ...prev,
            id: res.id.toString(),
          }));
          // Trigga reload event så Fakturor.tsx uppdaterar sin lista
          window.dispatchEvent(new Event("reloadFakturor"));

          // NU BOKFÖR AUTOMATISKT
          await genomförBokföring(res.id.toString());
        } else {
          alert("❌ Kunde inte spara fakturan innan bokföring.");
          return;
        }
      } catch {
        alert("❌ Kunde inte spara fakturan innan bokföring.");
        return;
      }
    } else {
      // Fakturan är redan sparad, öppna bara modalen
      setBokförModalOpen(true);
    }
  };

  // Hjälpfunktion för att genomföra bokföringen
  const genomförBokföring = async (fakturaId: string) => {
    try {
      // Hämta bokföringsmetod
      const bokföringsmetod = await hämtaBokföringsmetod();
      const ärKontantmetod = bokföringsmetod === "kontantmetoden";

      // Beräkna totalt belopp
      const totalInkMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
          0
        ) || 0;

      // Skapa bokföringsposter (samma logik som i modalen)
      const poster = [];

      // Avgör om det är vara eller tjänst
      const varor = formData.artiklar?.filter((a) => a.typ === "vara").length || 0;
      const tjänster = formData.artiklar?.filter((a) => a.typ === "tjänst").length || 0;

      const intäktskonto = varor > tjänster ? "3001" : "3011";
      const kontoNamn = varor > tjänster ? "Försäljning varor" : "Försäljning tjänster";

      // Beräkna belopp
      const totalExMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet,
          0
        ) || 0;

      const totalMoms =
        formData.artiklar?.reduce(
          (sum, artikel) => sum + (artikel.antal * artikel.prisPerEnhet * artikel.moms) / 100,
          0
        ) || 0;

      // 1. Kundfordran eller Bank/Kassa
      const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
      poster.push({
        konto: skuld_tillgångskonto,
        kontoNamn: ärKontantmetod ? "Bank/Kassa" : "Kundfordringar",
        debet: totalInkMoms,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });

      // 2. Intäkt
      poster.push({
        konto: intäktskonto,
        kontoNamn: kontoNamn,
        debet: 0,
        kredit: totalExMoms,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });

      // 3. Moms
      if (totalMoms > 0) {
        poster.push({
          konto: "2610",
          kontoNamn: "Utgående moms 25%",
          debet: 0,
          kredit: totalMoms,
          beskrivning: `Moms faktura ${formData.fakturanummer}`,
        });
      }

      // Genomför bokföringen
      const result = await bokförFaktura({
        fakturaId: parseInt(fakturaId),
        fakturanummer: formData.fakturanummer,
        kundnamn: formData.kundnamn,
        totaltBelopp: totalInkMoms,
        poster: poster,
        kommentar: `Bokföring av faktura ${formData.fakturanummer} för ${formData.kundnamn}`,
      });

      if (result.success) {
        alert(`✅ Fakturan har sparats och bokförts!\n\n${result.message}`);
        // Uppdatera fakturasstatus
        const status = await hämtaFakturaStatus(parseInt(fakturaId));
        setFakturaStatus(status);
      } else {
        alert(`❌ Bokföringsfel: ${result.error}`);
      }
    } catch (error) {
      console.error("Bokföringsfel:", error);
      alert("❌ Fel vid automatisk bokföring");
    }
  };

  // Kontrollera vad som saknas för att kunna spara/bokföra
  const harKund = formData.kundId && formData.kundId.trim() !== "";
  const harArtiklar = formData.artiklar && formData.artiklar.length > 0;
  const kanSpara = harKund && harArtiklar;

  // Kontrollera om fakturan redan är betald
  const ärFakturanBetald = fakturaStatus.status_betalning === "Betald";

  // Knapptexter och disabled-logik
  const sparaKnappText = !harKund
    ? "❌ Välj kund först"
    : !harArtiklar
      ? "❌ Lägg till artiklar"
      : "💾 Spara faktura";

  const bokförKnappText = ärFakturanBetald
    ? "✅ Redan betald"
    : !harKund
      ? "❌ Välj kund först"
      : !harArtiklar
        ? "❌ Lägg till artiklar"
        : formData.id
          ? "📊 Bokför"
          : "📊 Spara & Bokför";

  const återställKnappText = ärFakturanBetald ? "🔒 Betald faktura" : "🔄 Återställ";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Knapp onClick={hanteraSpara} text={sparaKnappText} disabled={!kanSpara} />
        <Knapp onClick={onPreview} text="👁️ Granska" />
        <ExporteraPDFKnapp />
        <Knapp onClick={onReload} text={återställKnappText} disabled={ärFakturanBetald} />
        <Knapp
          onClick={hanteraBokför}
          text={bokförKnappText}
          disabled={ärFakturanBetald || !kanSpara}
        />
      </div>

      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />

      <BokförFakturaModal isOpen={bokförModalOpen} onClose={() => setBokförModalOpen(false)} />
    </div>
  );
}

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
import { laddaNerHUSFil } from "../../_utils/husFilGenerator";

// Lokal typ för bokföringsposter
interface BokföringsPost {
  konto: string;
  kontoNamn: string;
  debet: number;
  kredit: number;
  beskrivning: string;
}

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
  const [sparaLoading, setSparaLoading] = useState(false);
  const [bokförLoading, setBokförLoading] = useState(false);
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("fakturametoden");
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
  }>({});

  // Hämta bokföringsmetod när komponenten laddas
  useEffect(() => {
    hämtaBokföringsmetod().then(setBokföringsmetod);
  }, []);

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
    if (sparaLoading) return; // Förhindra dubbla sparningar

    setSparaLoading(true);
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
    } finally {
      setSparaLoading(false);
    }
  };

  const hanteraBokför = async () => {
    if (bokförLoading) return; // Förhindra dubbla bokföringar

    setBokförLoading(true);
    try {
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
    } finally {
      setBokförLoading(false);
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
      const poster: BokföringsPost[] = [];

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
      console.error("Fel vid automatisk bokföring:", error);
      alert("❌ Fel vid automatisk bokföring");
    }
  };

  const hanteraHUSFil = () => {
    if (!formData.rotRutAktiverat || !formData.rotRutTyp) return;

    // Validera att nödvändiga fält finns
    if (!formData.fakturanummer || !formData.personnummer) {
      alert("❌ Fakturanummer och personnummer krävs för HUS-fil");
      return;
    }

    const totalInkMoms =
      formData.artiklar?.reduce((sum, artikel) => {
        return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
      }, 0) ?? 0;

    const begartBelopp = Math.round(totalInkMoms * 0.5); // 50% avdrag

    laddaNerHUSFil({
      fakturanummer: formData.fakturanummer,
      kundPersonnummer: formData.personnummer,
      betalningsdatum: new Date().toISOString().split("T")[0],
      prisForArbete: Math.round(totalInkMoms),
      betaltBelopp: Math.round(totalInkMoms),
      begartBelopp: begartBelopp,
      rotRutTyp: formData.rotRutTyp,
      rotRutKategori: formData.rotRutKategori || "Städa",
      fastighetsbeteckning: formData.fastighetsbeteckning,
      lägenhetsNummer: formData.brfLagenhetsnummer,
      brfOrgNummer: formData.brfOrganisationsnummer,
    });
  };

  // Kontrollera vad som saknas för att kunna spara/bokföra
  const harKund = formData.kundId && formData.kundId.trim() !== "";
  const harArtiklar = formData.artiklar && formData.artiklar.length > 0;
  const kanSpara = harKund && harArtiklar;

  // Kontrollera om fakturan redan är betald
  const ärFakturanBetald = fakturaStatus.status_betalning === "Betald";

  // Knapptexter och disabled-logik
  const sparaKnappText = sparaLoading
    ? "💾 Sparar..."
    : !harKund
      ? "❌ Välj kund först"
      : !harArtiklar
        ? "❌ Lägg till artiklar"
        : "💾 Spara faktura";

  const bokförKnappText = bokförLoading
    ? "📊 Sparar & Bokför..."
    : ärFakturanBetald
      ? "✅ Redan betald"
      : !harKund
        ? "❌ Välj kund först"
        : !harArtiklar
          ? "❌ Lägg till artiklar"
          : formData.id
            ? "📊 Bokför"
            : "📊 Spara & Bokför";

  // Dölj bokför-knappen för nya fakturor med kontantmetod
  const ärKontantmetod = bokföringsmetod === "kontantmetoden";
  const ärNyFaktura = !formData.id;
  const doljBokförKnapp = ärKontantmetod && ärNyFaktura;

  const återställKnappText = ärFakturanBetald ? "🔒 Betald faktura" : "🔄 Återställ";

  const granskKnappText = !harKund
    ? "❌ Välj kund först"
    : !harArtiklar
      ? "❌ Lägg till artiklar"
      : "👁️ Granska";

  const pdfKnappText = !harKund
    ? "❌ Välj kund först"
    : !harArtiklar
      ? "❌ Lägg till artiklar"
      : "📤 Spara PDF";

  // Visa HUS-fil knapp för ROT/RUT-fakturor
  const ärROTRUTFaktura = formData.rotRutAktiverat && formData.rotRutTyp;
  const harPersonnummer = formData.personnummer && formData.personnummer.trim() !== "";

  // Debug logging
  console.log("🔍 HUS-fil debug:", {
    rotRutAktiverat: formData.rotRutAktiverat,
    rotRutTyp: formData.rotRutTyp,
    personnummer: formData.personnummer,
    harPersonnummer: harPersonnummer,
  });

  const husFilKnappText = !harKund
    ? "❌ Välj kund först"
    : !harArtiklar
      ? "❌ Lägg till artiklar"
      : !harPersonnummer
        ? "❌ Personnummer saknas"
        : `📄 Ladda ner HUS-fil (${formData.rotRutTyp})`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <Knapp
          onClick={hanteraSpara}
          text={sparaKnappText}
          disabled={!kanSpara || sparaLoading}
          className="flex-1 min-w-40"
        />
        <Knapp
          onClick={onPreview}
          text={granskKnappText}
          disabled={!kanSpara}
          className="flex-1 min-w-40"
        />
        <div className="flex-1 min-w-40">
          <ExporteraPDFKnapp disabled={!kanSpara} text={pdfKnappText} className="w-full" />
        </div>
        <Knapp
          onClick={onReload}
          text={återställKnappText}
          disabled={ärFakturanBetald}
          className="flex-1 min-w-40"
        />
        {!doljBokförKnapp && (
          <Knapp
            onClick={hanteraBokför}
            text={bokförKnappText}
            disabled={ärFakturanBetald || !kanSpara || bokförLoading}
            className="flex-1 min-w-40"
          />
        )}
        {ärROTRUTFaktura && (
          <Knapp
            onClick={hanteraHUSFil}
            text={husFilKnappText}
            disabled={!kanSpara || !harPersonnummer}
            className="flex-1 min-w-40"
          />
        )}
      </div>

      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />

      <BokförFakturaModal isOpen={bokförModalOpen} onClose={() => setBokförModalOpen(false)} />
    </div>
  );
}

//#region Huvud
"use client";

import { useState, useEffect } from "react";
import Knapp from "../../_components/Knapp";
import ExporteraPDFKnapp from "./ExporteraPDFKnapp";
import SkickaEpost from "./SkickaEpost";
import BokförFakturaModal from "./BokförFakturaModal";
import RotRutBetalningModal from "./RotRutBetalningModal";
import {
  saveInvoice,
  hämtaSparadeFakturor,
  hämtaFakturaStatus,
  bokförFaktura,
  hämtaBokföringsmetod,
  uppdateraRotRutStatus,
  registreraRotRutBetalning,
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
  const [rotRutModalOpen, setRotRutModalOpen] = useState(false);
  const [sparaLoading, setSparaLoading] = useState(false);
  const [bokförLoading, setBokförLoading] = useState(false);
  const [bokföringsmetod, setBokföringsmetod] = useState<string>("fakturametoden");
  const [fakturaStatus, setFakturaStatus] = useState<{
    status_betalning?: string;
    status_bokförd?: string;
    rot_rut_status?: string;
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

      // Kolla om det finns ROT/RUT-artiklar
      const harRotRutArtiklar =
        formData.artiklar?.some((artikel: any) => artikel.rotRutTyp) || false;
      const rotRutBelopp = harRotRutArtiklar ? totalInkMoms * 0.5 : 0; // 50% av totalen
      const kundBelopp = harRotRutArtiklar ? totalInkMoms - rotRutBelopp : totalInkMoms;

      // 1. Kundfordran eller Bank/Kassa (kundens del)
      const skuld_tillgångskonto = ärKontantmetod ? "1930" : "1510";
      poster.push({
        konto: skuld_tillgångskonto,
        kontoNamn: ärKontantmetod ? "Bank/Kassa" : "Kundfordringar",
        debet: kundBelopp,
        kredit: 0,
        beskrivning: `Faktura ${formData.fakturanummer} ${formData.kundnamn}`,
      });

      // 1b. ROT/RUT-fordran (SKV:s del) - om det finns ROT/RUT
      if (harRotRutArtiklar && rotRutBelopp > 0) {
        poster.push({
          konto: "1513",
          kontoNamn: "Kundfordringar – delad faktura",
          debet: rotRutBelopp,
          kredit: 0,
          beskrivning: `ROT/RUT-del faktura ${formData.fakturanummer}`,
        });
      }

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
    // Kolla om ROT/RUT finns antingen i formData eller i artiklar
    const harROTRUTArtiklar =
      formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
    const rotRutTyp =
      formData.rotRutTyp ||
      (formData.artiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

    if (!formData.rotRutAktiverat && !harROTRUTArtiklar) {
      console.log("🔍 Ingen ROT/RUT-data hittad");
      return;
    }
    if (!rotRutTyp) {
      console.log("🔍 Ingen ROT/RUT-typ hittad");
      return;
    }

    // Hämta personnummer från formData eller artiklar
    const personnummer =
      formData.personnummer ||
      (formData.artiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutPersonnummer)
          ?.rotRutPersonnummer);

    // Hämta ROT/RUT-kategori från formData eller artiklar
    const rotRutKategori =
      formData.rotRutKategori ||
      (formData.artiklar &&
        (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutKategori)
          ?.rotRutKategori) ||
      "Städa";

    // Validera att nödvändiga fält finns
    if (!formData.fakturanummer || !personnummer) {
      console.log("🔍 HUS-fil validering misslyckades:", {
        fakturanummer: formData.fakturanummer,
        personnummer: personnummer,
        rotRutAktiverat: formData.rotRutAktiverat,
        rotRutTyp: rotRutTyp,
        harROTRUTArtiklar: harROTRUTArtiklar,
      });
      alert("❌ Fakturanummer och personnummer krävs för HUS-fil");
      return;
    }

    // Beräkna total kostnad för alla artiklar
    const totalInkMoms =
      formData.artiklar?.reduce((sum, artikel) => {
        return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
      }, 0) ?? 0;

    // Beräkna kostnad för endast ROT/RUT-tjänster (för avdragsberäkning)
    const rotRutTjänsterInkMoms =
      formData.artiklar?.reduce((sum, artikel: any) => {
        // Bara tjänster med ROT/RUT, inte material
        console.log("Tjänst-check:", {
          beskrivning: artikel.beskrivning,
          typ: artikel.typ,
          rotRutTyp: artikel.rotRutTyp,
          rotRutMaterial: artikel.rotRutMaterial,
          matchesCondition:
            artikel.typ === "tjänst" && artikel.rotRutTyp && !artikel.rotRutMaterial,
        });
        if (artikel.typ === "tjänst" && artikel.rotRutTyp && !artikel.rotRutMaterial) {
          return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
        }
        return sum;
      }, 0) ?? 0;

    // Beräkna material kostnad separat
    const rotRutMaterialKostnad =
      formData.artiklar?.reduce((sum, artikel: any) => {
        console.log("Material-check:", {
          beskrivning: artikel.beskrivning,
          rotRutMaterial: artikel.rotRutMaterial,
          matchesCondition: !!artikel.rotRutMaterial,
        });
        if (artikel.rotRutMaterial) {
          return sum + artikel.antal * artikel.prisPerEnhet * (1 + (artikel.moms || 0) / 100);
        }
        return sum;
      }, 0) ?? 0;

    // Beräkna totala timmar från ROT/RUT-tjänster (inte material)
    const totalTimmar =
      formData.artiklar?.reduce((sum, artikel: any) => {
        // Om det är en tjänst med ROT/RUT (inte material), använd antal som timmar
        if (artikel.typ === "tjänst" && artikel.rotRutTyp && !artikel.rotRutMaterial) {
          return sum + artikel.antal;
        }
        return sum;
      }, 0) ?? 0;

    const begartBelopp = Math.round(rotRutTjänsterInkMoms * 0.5); // 50% avdrag bara på tjänster

    laddaNerHUSFil({
      fakturanummer: formData.fakturanummer,
      kundPersonnummer: personnummer!,
      betalningsdatum: new Date().toISOString().split("T")[0],
      prisForArbete: Math.round(rotRutTjänsterInkMoms), // Bara tjänster
      betaltBelopp: Math.round(totalInkMoms), // Total kostnad
      begartBelopp: begartBelopp, // Avdrag bara på tjänster
      rotRutTyp: rotRutTyp,
      rotRutKategori: rotRutKategori,
      materialKostnad: Math.round(rotRutMaterialKostnad), // Material separat
      fastighetsbeteckning: formData.fastighetsbeteckning,
      lägenhetsNummer: formData.brfLagenhetsnummer,
      brfOrgNummer: formData.brfOrganisationsnummer,
      antalTimmar: totalTimmar, // Skicka faktiska timmar
    });
  };

  const hanteraRotRutStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!formData.id) return;

    const nyStatus = e.target.value as "ej_inskickad" | "väntar" | "godkänd";

    const result = await uppdateraRotRutStatus(parseInt(formData.id), nyStatus);
    if (result.success) {
      setFakturaStatus((prev) => ({ ...prev, rot_rut_status: nyStatus }));
    } else {
      alert("❌ Kunde inte uppdatera status");
    }
  };

  const hanteraRotRutBetalning = async () => {
    if (!formData.id) return;
    setRotRutModalOpen(true);
  };

  const hanteraRotRutSuccess = (nyStatus: { rot_rut_status: string; status_betalning: string }) => {
    setFakturaStatus((prev) => ({ ...prev, ...nyStatus }));
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
  const harROTRUTArtiklar =
    formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
  const ärROTRUTFaktura = (formData.rotRutAktiverat && formData.rotRutTyp) || harROTRUTArtiklar;
  // Kolla om det finns personnummer antingen i formData eller i någon artikel
  const harPersonnummer =
    (formData.personnummer && formData.personnummer.trim() !== "") ||
    (formData.artiklar &&
      formData.artiklar.some(
        (artikel: any) => artikel.rotRutPersonnummer && artikel.rotRutPersonnummer.trim() !== ""
      ));

  // Debug logging
  console.log("🔍 HUS-fil debug:", {
    rotRutAktiverat: formData.rotRutAktiverat,
    rotRutTyp: formData.rotRutTyp,
    personnummer: formData.personnummer,
    harPersonnummer: harPersonnummer,
  });

  const rotRutTyp =
    formData.rotRutTyp ||
    (formData.artiklar &&
      (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

  const husFilKnappText = !harKund
    ? "❌ Välj kund först"
    : !harArtiklar
      ? "❌ Lägg till artiklar"
      : !harPersonnummer
        ? "❌ Personnummer saknas"
        : !formData.fakturanummer
          ? "❌ Spara fakturan först"
          : `📄 Ladda ner HUS-fil (${rotRutTyp})`;

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
      </div>

      {/* HUS-fil knapp på egen rad */}
      {ärROTRUTFaktura && (
        <div className="flex justify-center items-center gap-4">
          <Knapp
            onClick={hanteraHUSFil}
            text={husFilKnappText}
            disabled={!kanSpara || !harPersonnummer || !formData.fakturanummer}
            className=""
          />
          {formData.id && (
            <div className="flex flex-row gap-3 items-center">
              <select
                value={fakturaStatus.rot_rut_status || ""}
                onChange={hanteraRotRutStatusChange}
                className="px-3 py-2 rounded text-sm font-medium bg-slate-700 text-white border border-slate-600 hover:bg-slate-600 transition-colors"
              >
                <option value="" disabled>
                  ROT/RUT-status
                </option>
                <option value="ej_inskickad">📄 Ej inskickad till SKV</option>
                <option value="väntar">⏳ Väntar på SKV</option>
                <option value="godkänd">✅ Godkänd av SKV</option>
              </select>

              {(fakturaStatus.rot_rut_status === "väntar" ||
                fakturaStatus.status_betalning === "Delvis betald") && (
                <button
                  onClick={hanteraRotRutBetalning}
                  className="px-3 py-2 rounded text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-colors"
                >
                  💰 Registrera utbetalning från SKV
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <SkickaEpost
        onSuccess={() => console.log("E-post skickad")}
        onError={(err) => console.error("E-postfel:", err)}
      />

      <BokförFakturaModal isOpen={bokförModalOpen} onClose={() => setBokförModalOpen(false)} />

      <RotRutBetalningModal
        isOpen={rotRutModalOpen}
        onClose={() => setRotRutModalOpen(false)}
        fakturaId={formData.id ? parseInt(formData.id) : 0}
        fakturanummer={formData.fakturanummer || ""}
        kundnamn={formData.kundnamn || ""}
        totalBelopp={
          formData.artiklar?.reduce(
            (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet * (1 + artikel.moms / 100),
            0
          ) || 0
        }
        bokföringsmetod={bokföringsmetod}
        onSuccess={hanteraRotRutSuccess}
      />
    </div>
  );
}

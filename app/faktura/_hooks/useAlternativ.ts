import { useState, useEffect } from "react";
import { useFakturaClient } from "./useFakturaClient";
import {
  saveInvoice,
  hämtaSparadeFakturor,
  hämtaFakturaStatus,
  bokförFaktura,
  hämtaBokföringsmetod,
  uppdateraRotRutStatus,
  registreraRotRutBetalning,
} from "../actions";
import { laddaNerHUSFil } from "../Alternativ/husFilGenerator";
import { BokforingsPost } from "../_types/types";

export function useAlternativ() {
  const { formData, updateFormField } = useFakturaClient();
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
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Hämta användarens bokföringsmetod när komponenten laddas
  useEffect(() => {
    hämtaBokföringsmetod().then(setBokföringsmetod);
  }, []);

  // Hämta fakturaSTATUS när ID ändras
  useEffect(() => {
    if (formData.id) {
      hämtaFakturaStatus(parseInt(formData.id)).then(setFakturaStatus);
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
        setToast({
          message: "Faktura sparad!",
          type: "success",
          isVisible: true,
        });

        // UPPDATERA FORMDATA MED NYTT ID!
        if (res.id) {
          updateFormField("id", res.id.toString());
        }

        // Trigga reload event så Fakturor.tsx uppdaterar sin lista
        window.dispatchEvent(new Event("reloadFakturor"));
      } else {
        setToast({
          message: "Kunde inte spara fakturan.",
          type: "error",
          isVisible: true,
        });
      }
    } catch {
      setToast({
        message: "Kunde inte konvertera artiklar",
        type: "error",
        isVisible: true,
      });
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
            updateFormField("id", res.id.toString());
            // Trigga reload event så Fakturor.tsx uppdaterar sin lista
            window.dispatchEvent(new Event("reloadFakturor"));

            // NU BOKFÖR AUTOMATISKT
            await genomförBokföring(res.id.toString());
          } else {
            setToast({
              message: "Kunde inte spara fakturan innan bokföring.",
              type: "error",
              isVisible: true,
            });
            return;
          }
        } catch {
          setToast({
            message: "Kunde inte spara fakturan innan bokföring.",
            type: "error",
            isVisible: true,
          });
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
      const poster: BokforingsPost[] = [];

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
        setToast({
          message: `Fakturan har sparats och bokförts!\n\n${result.message}`,
          type: "success",
          isVisible: true,
        });
        // Uppdatera fakturasstatus
        const status = await hämtaFakturaStatus(parseInt(fakturaId));
        setFakturaStatus(status);
      } else {
        setToast({
          message: `Bokföringsfel: ${result.error}`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("Fel vid automatisk bokföring:", error);
      setToast({
        message: "Fel vid automatisk bokföring",
        type: "error",
        isVisible: true,
      });
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
      setToast({
        message: "Fakturanummer och personnummer krävs för HUS-fil",
        type: "error",
        isVisible: true,
      });
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
      setToast({
        message: "Kunde inte uppdatera status",
        type: "error",
        isVisible: true,
      });
    }
  };

  const hanteraRotRutBetalning = async () => {
    if (!formData.id) return;
    setRotRutModalOpen(true);
  };

  const hanteraRotRutSuccess = (nyStatus: { rot_rut_status: string; status_betalning: string }) => {
    setFakturaStatus((prev) => ({ ...prev, ...nyStatus }));
  };

  // Beräknade värden
  const harKund = formData.kundId && formData.kundId.trim() !== "";
  const harArtiklar = formData.artiklar && formData.artiklar.length > 0;
  const kanSpara = harKund && harArtiklar;
  const ärFakturanBetald = fakturaStatus.status_betalning === "Betald";
  const ärKontantmetod = bokföringsmetod === "kontantmetoden";
  const ärNyFaktura = !formData.id;
  const doljBokförKnapp = ärKontantmetod && ärNyFaktura;

  // Knapptexter
  const sparaKnappText = sparaLoading ? "💾 Sparar..." : "💾 Spara faktura";
  const bokförKnappText = bokförLoading
    ? "📊 Sparar & Bokför..."
    : ärFakturanBetald
      ? "✅ Redan betald"
      : formData.id
        ? "📊 Bokför"
        : "📊 Spara & Bokför";
  const återställKnappText = ärFakturanBetald ? "🔒 Betald faktura" : "🔄 Återställ";
  const granskKnappText = "👁️ Granska";
  const pdfKnappText = "📤 Spara PDF";

  // ROT/RUT-relaterade beräkningar
  const harROTRUTArtiklar =
    formData.artiklar && formData.artiklar.some((artikel: any) => artikel.rotRutTyp);
  const ärROTRUTFaktura = (formData.rotRutAktiverat && formData.rotRutTyp) || harROTRUTArtiklar;
  const harPersonnummer =
    (formData.personnummer && formData.personnummer.trim() !== "") ||
    (formData.artiklar &&
      formData.artiklar.some(
        (artikel: any) => artikel.rotRutPersonnummer && artikel.rotRutPersonnummer.trim() !== ""
      ));

  const rotRutTyp =
    formData.rotRutTyp ||
    (formData.artiklar &&
      (formData.artiklar as any[]).find((artikel: any) => artikel.rotRutTyp)?.rotRutTyp);

  const husFilKnappText = !harPersonnummer
    ? "📄 Personnummer saknas"
    : !formData.fakturanummer
      ? "📄 Spara fakturan först"
      : `📄 Ladda ner HUS-fil (${rotRutTyp})`;

  const getDisabledReason = () => {
    if (!harKund) return "Välj kund först";
    if (!harArtiklar) return "Lägg till artiklar först";
    return "";
  };

  return {
    // State
    sparadeFakturor,
    bokförModalOpen,
    rotRutModalOpen,
    sparaLoading,
    bokförLoading,
    bokföringsmetod,
    fakturaStatus,
    toast,
    formData,

    // Computed values
    harKund,
    harArtiklar,
    kanSpara,
    ärFakturanBetald,
    ärKontantmetod,
    ärNyFaktura,
    doljBokförKnapp,
    sparaKnappText,
    bokförKnappText,
    återställKnappText,
    granskKnappText,
    pdfKnappText,
    harROTRUTArtiklar,
    ärROTRUTFaktura,
    harPersonnummer,
    rotRutTyp,
    husFilKnappText,

    // Actions
    setBokförModalOpen,
    setRotRutModalOpen,
    setToast,
    hanteraSpara,
    hanteraBokför,
    hanteraHUSFil,
    hanteraRotRutStatusChange,
    hanteraRotRutBetalning,
    hanteraRotRutSuccess,
    getDisabledReason,
  };
}

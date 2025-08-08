//#region
"use client";

import { useEffect, useState } from "react";
import { useFakturaContext } from "../FakturaProvider";
import {
  saveInvoice,
  sparaFavoritArtikel,
  hämtaSparadeArtiklar,
  deleteFavoritArtikel,
} from "../actions";
import Knapp from "../../_components/Knapp";
import RotRutForm from "./RotRutForm";
import FavoritArtiklarList from "./FavoritArtiklarList";
import ArtiklarList from "./ArtiklarList";
import ArtikelForm from "./ArtikelForm";

type Artikel = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  arbetskostnadExMoms?: number;
  rotRutAntalTimmar?: number;
  rotRutPrisPerTimme?: number;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
};

type FavoritArtikel = Omit<Artikel, "arbetskostnadExMoms"> & {
  arbetskostnadExMoms?: number | string;
  rotRutAntalTimmar?: number | string;
  rotRutPrisPerTimme?: number | string;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string | Date;
  rotRutSlutdatum?: string | Date;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
  id?: number;
};
//#endregion

export default function ProdukterTjanster() {
  //#region State
  const { formData, setFormData } = useFakturaContext();
  const [beskrivning, setBeskrivning] = useState("");
  const [antal, setAntal] = useState(1);
  const [prisPerEnhet, setPrisPerEnhet] = useState(0);
  const [moms, setMoms] = useState(25);
  const [valuta, setValuta] = useState("SEK");
  const [typ, setTyp] = useState<"vara" | "tjänst">("vara");
  const [loading, setLoading] = useState(false);
  const [favoritArtiklar, setFavoritArtiklar] = useState<FavoritArtikel[]>([]);
  const [showFavoritArtiklar, setShowFavoritArtiklar] = useState(false);
  const [blinkIndex, setBlinkIndex] = useState<number | null>(null);
  const [visaRotRutForm, setVisaRotRutForm] = useState(false);
  //#endregion

  //#region Ladda favoritartiklar
  useEffect(() => {
    const laddaFavoriter = async () => {
      try {
        const artiklar = await hämtaSparadeArtiklar();
        setFavoritArtiklar((artiklar as FavoritArtikel[]) || []);
      } catch (error) {
        console.error("Fel vid laddning av favoritartiklar:", error);
        setFavoritArtiklar([]);
      }
    };
    laddaFavoriter();
  }, []);
  //#endregion

  //#region Handlers
  const handleAdd = async () => {
    if (!beskrivning.trim()) {
      alert("❌ Beskrivning krävs");
      return;
    }

    const newArtikel: Artikel = {
      beskrivning,
      antal,
      prisPerEnhet,
      moms,
      valuta,
      typ,
      ...(formData.rotRutAktiverat
        ? {
            rotRutTyp: formData.rotRutTyp as "ROT" | "RUT",
            rotRutKategori: formData.rotRutKategori,
            avdragProcent: formData.avdragProcent,
            arbetskostnadExMoms:
              typeof formData.arbetskostnadExMoms === "string"
                ? Number(formData.arbetskostnadExMoms)
                : formData.arbetskostnadExMoms,
            rotRutBeskrivning: formData.rotRutBeskrivning,
            rotRutStartdatum: formData.rotRutStartdatum,
            rotRutSlutdatum: formData.rotRutSlutdatum,
            // Lägg till de nya ROT/RUT-fälten
            rotRutPersonnummer: formData.personnummer,
            rotRutFastighetsbeteckning: formData.fastighetsbeteckning,
            rotRutBoendeTyp: formData.rotBoendeTyp,
            rotRutBrfOrg: formData.brfOrganisationsnummer,
            rotRutBrfLagenhet: formData.brfLagenhetsnummer,
          }
        : {}),
    };

    // Skapa den uppdaterade artikellistan
    const uppdateradeArtiklar = [...(formData.artiklar ?? []), newArtikel];

    // Lägg ALLTID till artikeln i fakturan (oavsett om den sparas som favorit)
    setFormData((prev) => ({
      ...prev,
      artiklar: uppdateradeArtiklar,
    }));

    // Spara ALLTID till fakturan (oavsett om den sparas som favorit)
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("artiklar", JSON.stringify(uppdateradeArtiklar)); // Använd den uppdaterade listan
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== "artiklar" && v != null) fd.append(k, String(v));
      });
      await saveInvoice(fd);
    } catch (err) {
      alert("❌ Fel vid sparande");
    } finally {
      setLoading(false);
    }

    setBeskrivning("");
    setAntal(1);
    setPrisPerEnhet(0);
    setMoms(25);
    setValuta("SEK");
    setTyp("vara");

    setTimeout(() => {
      setBlinkIndex(formData.artiklar?.length ?? 0);
      setTimeout(() => setBlinkIndex(null), 500);
    }, 50);
  };

  const handleSaveAsFavorite = async () => {
    if (!beskrivning.trim()) {
      alert("❌ Beskrivning krävs för att spara som favorit");
      return;
    }

    try {
      // Skapa favoritartikeln
      const favArtikel: Artikel = {
        beskrivning,
        antal,
        prisPerEnhet,
        moms,
        valuta,
        typ,
        // Inkludera ROT/RUT-data om det finns
        ...(formData.rotRutAktiverat
          ? {
              rotRutTyp: formData.rotRutTyp,
              rotRutKategori: formData.rotRutKategori,
              avdragProcent: formData.avdragProcent,
              arbetskostnadExMoms:
                typeof formData.arbetskostnadExMoms === "string"
                  ? Number(formData.arbetskostnadExMoms)
                  : formData.arbetskostnadExMoms,
              rotRutBeskrivning: formData.rotRutBeskrivning,
              rotRutStartdatum: formData.rotRutStartdatum,
              rotRutSlutdatum: formData.rotRutSlutdatum,
              rotRutPersonnummer: formData.personnummer,
              rotRutFastighetsbeteckning: formData.fastighetsbeteckning,
              rotRutBoendeTyp: formData.rotBoendeTyp,
              rotRutBrfOrg: formData.brfOrganisationsnummer,
              rotRutBrfLagenhet: formData.brfLagenhetsnummer,
            }
          : {}),
      };

      // Spara till databas
      const result = await sparaFavoritArtikel(favArtikel);

      if (result.success) {
        if (result.alreadyExists) {
          alert("ℹ️ Artikeln finns redan som favorit");
        } else {
          // Uppdatera favoritlistan efter att ha sparat
          const uppdateradeFavoriter = await hämtaSparadeArtiklar();
          setFavoritArtiklar((uppdateradeFavoriter as FavoritArtikel[]) || []);
          alert("✅ Sparad som favoritartikel!");
        }
      } else {
        alert("❌ Fel vid sparande av favoritartikel");
      }
    } catch (error) {
      console.error("Fel vid sparande av favoritartikel:", error);
      alert("❌ Fel vid sparande av favoritartikel");
    }
  };

  const handleRemove = (index: number) => {
    const nyaArtiklar = (formData.artiklar ?? []).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      artiklar: nyaArtiklar,
    }));
  };

  const handleEdit = (artikel: Artikel, index: number) => {
    console.log("🔍 handleEdit körs med artikel:", artikel);
    console.log("🔍 handleEdit körs med index:", index);

    // Fyll i formuläret med artikelns data
    console.log("🔍 Innan state-uppdateringar:", {
      beskrivning,
      antal,
      prisPerEnhet,
      moms,
      valuta,
      typ,
    });

    setBeskrivning(artikel.beskrivning);
    setAntal(artikel.antal);
    setPrisPerEnhet(artikel.prisPerEnhet);
    setMoms(artikel.moms);
    setValuta(artikel.valuta);
    setTyp(artikel.typ);

    console.log("🔍 Satte lokala states:", {
      beskrivning: artikel.beskrivning,
      antal: artikel.antal,
      prisPerEnhet: artikel.prisPerEnhet,
      moms: artikel.moms,
      valuta: artikel.valuta,
      typ: artikel.typ,
    });

    // Debugging: Kontrollera värdena efter en kort fördröjning
    setTimeout(() => {
      console.log("🔍 State efter uppdatering:", {
        beskrivning,
        antal,
        prisPerEnhet,
        moms,
        valuta,
        typ,
      });
    }, 100);

    // Om artikeln har ROT/RUT-data, aktivera det och fyll i formuläret
    if (artikel.rotRutTyp) {
      console.log("🔍 Artikel har ROT/RUT-data:", {
        rotRutTyp: artikel.rotRutTyp,
        rotRutKategori: artikel.rotRutKategori,
      });

      setFormData((prev) => ({
        ...prev,
        rotRutAktiverat: true,
        rotRutTyp: artikel.rotRutTyp,
        rotRutKategori: artikel.rotRutKategori,
        avdragProcent: artikel.avdragProcent,
        arbetskostnadExMoms: artikel.arbetskostnadExMoms,
        // Lägg till alla ROT/RUT-fält från artikeln
        rotRutBeskrivning: artikel.rotRutBeskrivning || "",
        rotRutStartdatum: artikel.rotRutStartdatum || "",
        rotRutSlutdatum: artikel.rotRutSlutdatum || "",
        personnummer: artikel.rotRutPersonnummer || "",
        fastighetsbeteckning: artikel.rotRutFastighetsbeteckning || "",
        brfOrganisationsnummer: artikel.rotRutBrfOrg || "",
        brfLagenhetsnummer: artikel.rotRutBrfLagenhet || "",
        rotRutAntalTimmar: artikel.rotRutAntalTimmar,
        rotRutPrisPerTimme: artikel.rotRutPrisPerTimme,
      }));
      setVisaRotRutForm(true);
    } else {
      console.log("🔍 Artikel har INGEN ROT/RUT-data");
      // Rensa ROT/RUT om artikeln inte har det
      setFormData((prev) => ({
        ...prev,
        rotRutAktiverat: false,
        rotRutTyp: undefined,
        rotRutKategori: undefined,
        avdragProcent: undefined,
        arbetskostnadExMoms: undefined,
        rotRutBeskrivning: "",
        rotRutStartdatum: "",
        rotRutSlutdatum: "",
        personnummer: "",
        fastighetsbeteckning: "",
        brfOrganisationsnummer: "",
        brfLagenhetsnummer: "",
        rotRutAntalTimmar: undefined,
        rotRutPrisPerTimme: undefined,
      }));
      setVisaRotRutForm(false);
    }

    // Ta bort artikeln från listan så den kan läggas till igen med ändringar
    handleRemove(index);

    console.log("🔍 handleEdit slutförd");
  };

  // När man väljer en favoritartikel: fyll i formuläret för redigering OCH lägg till i listan
  const handleSelectFavorit = (artikel: FavoritArtikel) => {
    console.log("🔍 handleSelectFavorit körs med artikel:", artikel);

    // FÖRST: Fyll i formulärfälten för redigering
    setBeskrivning(artikel.beskrivning);
    setAntal(artikel.antal);
    setPrisPerEnhet(artikel.prisPerEnhet);
    setMoms(artikel.moms);
    setValuta(artikel.valuta);
    setTyp(artikel.typ);

    console.log("🔍 Fyllde formulärfält:", {
      beskrivning: artikel.beskrivning,
      antal: artikel.antal,
      prisPerEnhet: artikel.prisPerEnhet,
      moms: artikel.moms,
      valuta: artikel.valuta,
      typ: artikel.typ,
    });

    // Skapa artikelobjekt för att lägga till i listan
    const nyArtikel: Artikel = {
      beskrivning: artikel.beskrivning,
      antal: artikel.antal,
      prisPerEnhet: artikel.prisPerEnhet,
      moms: artikel.moms,
      valuta: artikel.valuta,
      typ: artikel.typ,
      ...(artikel.rotRutTyp
        ? {
            rotRutTyp: artikel.rotRutTyp as "ROT" | "RUT",
            rotRutKategori: artikel.rotRutKategori,
            avdragProcent: artikel.avdragProcent,
            arbetskostnadExMoms:
              typeof artikel.arbetskostnadExMoms === "string"
                ? Number(artikel.arbetskostnadExMoms)
                : artikel.arbetskostnadExMoms,
          }
        : {}),
    };

    // Lägg till artikeln i "Tillagda artiklar" listan
    setFormData((prev) => ({
      ...prev,
      artiklar: [...(prev.artiklar ?? []), nyArtikel],
      // Om artikeln har ROT/RUT-data, aktivera det
      ...(artikel.rotRutTyp
        ? {
            rotRutAktiverat: true,
            rotRutTyp: artikel.rotRutTyp as "ROT" | "RUT",
            rotRutKategori: artikel.rotRutKategori,
            avdragProcent: artikel.avdragProcent,
            arbetskostnadExMoms:
              typeof artikel.arbetskostnadExMoms === "string"
                ? Number(artikel.arbetskostnadExMoms)
                : artikel.arbetskostnadExMoms,
            // Lägg till de extra ROT/RUT-fälten
            rotRutBeskrivning: artikel.rotRutBeskrivning || "",
            rotRutStartdatum: artikel.rotRutStartdatum
              ? typeof artikel.rotRutStartdatum === "string"
                ? artikel.rotRutStartdatum
                : (artikel.rotRutStartdatum as Date).toISOString().split("T")[0]
              : "",
            rotRutSlutdatum: artikel.rotRutSlutdatum
              ? typeof artikel.rotRutSlutdatum === "string"
                ? artikel.rotRutSlutdatum
                : (artikel.rotRutSlutdatum as Date).toISOString().split("T")[0]
              : "",
            personnummer: artikel.rotRutPersonnummer || "",
            fastighetsbeteckning: artikel.rotRutFastighetsbeteckning || "",
            brfOrganisationsnummer: artikel.rotRutBrfOrg || "",
            brfLagenhetsnummer: artikel.rotRutBrfLagenhet || "",
            rotRutAntalTimmar:
              typeof artikel.rotRutAntalTimmar === "string"
                ? Number(artikel.rotRutAntalTimmar)
                : artikel.rotRutAntalTimmar,
            rotRutPrisPerTimme:
              typeof artikel.rotRutPrisPerTimme === "string"
                ? Number(artikel.rotRutPrisPerTimme)
                : artikel.rotRutPrisPerTimme,
          }
        : {
            rotRutAktiverat: false,
            rotRutTyp: undefined,
            rotRutKategori: undefined,
            avdragProcent: undefined,
            arbetskostnadExMoms: undefined,
          }),
    }));

    // Visa ROT/RUT-formuläret om artikeln har ROT/RUT-data
    if (artikel.rotRutTyp) {
      setVisaRotRutForm(true);
    } else {
      setVisaRotRutForm(false);
    }

    // Sätt blinkindex för att visa att artikeln lades till
    setTimeout(() => {
      setBlinkIndex(formData.artiklar?.length ?? 0);
      setTimeout(() => setBlinkIndex(null), 500);
    }, 50);

    console.log("🔍 handleSelectFavorit slutförd - artikel tillagd i listan");
  };

  const handleDeleteFavorit = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("Ta bort denna favoritartikel?")) return;
    const res = await deleteFavoritArtikel(id);
    if (res.success) {
      setFavoritArtiklar((prev) => prev.filter((a) => a.id !== id));
    } else {
      alert("❌ Kunde inte ta bort favoritartikel");
    }
  };
  //#endregion

  //#region Vars: Gemensam storlek för checkbox och label
  const checkboxSize = "w-5 h-5";
  const labelSize = "text-base";
  //#endregion

  return (
    <div className="space-y-6">
      <FavoritArtiklarList
        favoritArtiklar={favoritArtiklar}
        showFavoritArtiklar={showFavoritArtiklar}
        onToggle={setShowFavoritArtiklar}
        onSelect={handleSelectFavorit}
        onDelete={handleDeleteFavorit}
      />

      <ArtiklarList
        artiklar={formData.artiklar as Artikel[]}
        blinkIndex={blinkIndex}
        onRemove={handleRemove}
        onEdit={handleEdit}
      />

      {/* Formulär för att lägga till ny artikel */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
          <h3 className="text-white font-medium">Skapa och lägg till vara / tjänst</h3>
        </div>

        {/* Formulär innehåll */}
        <div className="p-4 space-y-4">
          <ArtikelForm
            beskrivning={beskrivning}
            antal={antal}
            prisPerEnhet={prisPerEnhet}
            moms={moms}
            typ={typ}
            onChangeBeskrivning={setBeskrivning}
            onChangeAntal={setAntal}
            onChangePrisPerEnhet={setPrisPerEnhet}
            onChangeMoms={setMoms}
            onChangeTyp={setTyp}
          />

          <div className="mb-4">
            <Knapp
              onClick={() => {
                const newValue = !visaRotRutForm;
                setVisaRotRutForm(newValue);
                // Sätt automatiskt typ till "tjänst" när ROT/RUT aktiveras
                if (newValue) {
                  setTyp("tjänst");
                }
                setFormData((prev) => ({
                  ...prev,
                  rotRutAktiverat: newValue,
                  ...(newValue
                    ? {}
                    : {
                        rotRutTyp: undefined,
                        rotRutKategori: undefined,
                        avdragProcent: undefined,
                        arbetskostnadExMoms: undefined,
                        avdragBelopp: undefined,
                        personnummer: undefined,
                        fastighetsbeteckning: undefined,
                        rotBoendeTyp: undefined,
                        brfOrganisationsnummer: undefined,
                        brfLagenhetsnummer: undefined,
                      }),
                }));
              }}
              text={visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Aktivera ROT/RUT-avdrag"}
            />
          </div>

          {/* Visa RotRutForm endast om användaren själv aktiverat det */}
          {visaRotRutForm && (
            <div className="border border-slate-500 rounded-lg mt-4">
              <RotRutForm showCheckbox={false} />
            </div>
          )}

          {/* Visa beräknat avdrag om ROT/RUT är aktiverat och det finns artiklar */}
          {formData.rotRutAktiverat &&
            formData.rotRutTyp &&
            formData.artiklar &&
            formData.artiklar.length > 0 &&
            (() => {
              // Beräkna totalt avdrag baserat på alla artiklar
              const totalSumExkl = formData.artiklar.reduce(
                (sum, artikel) => sum + artikel.antal * artikel.prisPerEnhet,
                0
              );
              const totalMoms = formData.artiklar.reduce((sum, artikel) => {
                return sum + artikel.antal * artikel.prisPerEnhet * (artikel.moms / 100);
              }, 0);
              const totalInklMoms = totalSumExkl + totalMoms;
              const avdragProcent = formData.rotRutTyp === "ROT" ? 30 : 50;
              const beraknatAvdrag = totalInklMoms * (avdragProcent / 100);

              return (
                <div className="p-3 bg-slate-800 border border-slate-600 rounded-lg">
                  <div className="text-white font-semibold text-sm">
                    📊 Beräknat {formData.rotRutTyp}-avdrag ({avdragProcent}%):
                  </div>
                  <div className="text-green-400 font-bold text-lg">
                    {beraknatAvdrag.toLocaleString("sv-SE", {
                      style: "currency",
                      currency: "SEK",
                    })}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    Baserat på totalsumma inkl. moms:{" "}
                    {totalInklMoms.toLocaleString("sv-SE", {
                      style: "currency",
                      currency: "SEK",
                    })}
                  </div>
                </div>
              );
            })()}

          <div className="flex items-center justify-between pt-6 border-t border-slate-600">
            <Knapp onClick={handleSaveAsFavorite} text="📌 Lägg till som favoritartikel" />
            <Knapp
              onClick={handleAdd}
              text={loading ? "✚ Sparar…" : "✚ Lägg till och spara"}
              disabled={!beskrivning.trim() || loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

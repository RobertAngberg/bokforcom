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
import RotRutCheckbox from "./RotRutCheckbox";
import LäggTillFavoritartikel from "./LaggTillFavoritartikel";

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
};

type FavoritArtikel = Omit<Artikel, "arbetskostnadExMoms"> & {
  arbetskostnadExMoms?: number | string;
  rotRutAntalTimmar?: number | string;
  rotRutPrisPerTimme?: number | string;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
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
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
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

    // Kontrollera att kund är vald innan sparning
    if (!formData.kundId || formData.kundId.trim() === "") {
      alert("❌ Välj en kund innan du lägger till artiklar");
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
            rotRutAntalTimmar:
              typeof formData.rotRutAntalTimmar === "string"
                ? Number(formData.rotRutAntalTimmar)
                : formData.rotRutAntalTimmar,
            rotRutPrisPerTimme:
              typeof formData.rotRutPrisPerTimme === "string"
                ? Number(formData.rotRutPrisPerTimme)
                : formData.rotRutPrisPerTimme,
            rotRutBeskrivning: formData.rotRutBeskrivning,
            rotRutStartdatum: formData.rotRutStartdatum,
            rotRutSlutdatum: formData.rotRutSlutdatum,
          }
        : {}),
    };

    if (saveAsFavorite) {
      // För favoritartiklar sparar vi ALL data inklusive ROT/RUT-information
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
              rotRutAntalTimmar:
                typeof formData.rotRutAntalTimmar === "string"
                  ? Number(formData.rotRutAntalTimmar)
                  : formData.rotRutAntalTimmar,
              rotRutPrisPerTimme:
                typeof formData.rotRutPrisPerTimme === "string"
                  ? Number(formData.rotRutPrisPerTimme)
                  : formData.rotRutPrisPerTimme,
              rotRutBeskrivning: formData.rotRutBeskrivning,
              rotRutStartdatum: formData.rotRutStartdatum,
              rotRutSlutdatum: formData.rotRutSlutdatum,
            }
          : {}),
      };

      // Spara som favorit
      await sparaFavoritArtikel(favArtikel);

      // Uppdatera favoritlistan efter att ha sparat
      try {
        const uppdateradeFavoriter = await hämtaSparadeArtiklar();
        setFavoritArtiklar((uppdateradeFavoriter as FavoritArtikel[]) || []);
      } catch (error) {
        console.error("Fel vid uppdatering av favoritlistan:", error);
      }
    }

    // Lägg ALLTID till artikeln i fakturan (oavsett om den sparas som favorit)
    setFormData((prev) => ({
      ...prev,
      artiklar: [...(prev.artiklar ?? []), newArtikel],
    }));

    // Spara ALLTID till fakturan (oavsett om den sparas som favorit)
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("artiklar", JSON.stringify([...(formData.artiklar ?? []), newArtikel]));
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
    setSaveAsFavorite(false);

    setTimeout(() => {
      setBlinkIndex(formData.artiklar?.length ?? 0);
      setTimeout(() => setBlinkIndex(null), 500);
    }, 50);
  };

  const handleRemove = (index: number) => {
    const nyaArtiklar = (formData.artiklar ?? []).filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      artiklar: nyaArtiklar,
    }));
  };

  // När man väljer en favoritartikel: sätt ROT/RUT-data men visa INTE formuläret och toggla INTE checkboxen
  const handleSelectFavorit = (artikel: FavoritArtikel) => {
    const { 
      id, 
      rotRutTyp, 
      rotRutKategori, 
      avdragProcent, 
      arbetskostnadExMoms,
      rotRutAntalTimmar,
      rotRutPrisPerTimme,
      rotRutBeskrivning,
      rotRutStartdatum,
      rotRutSlutdatum,
      ...artikelUtanId 
    } = artikel;

    const artikelMedRutRot = {
      ...artikelUtanId,
      ...(rotRutTyp
        ? {
            rotRutTyp,
            rotRutKategori,
            avdragProcent,
            arbetskostnadExMoms:
              typeof arbetskostnadExMoms === "string"
                ? Number(arbetskostnadExMoms)
                : arbetskostnadExMoms,
            rotRutAntalTimmar:
              typeof rotRutAntalTimmar === "string"
                ? Number(rotRutAntalTimmar)
                : rotRutAntalTimmar,
            rotRutPrisPerTimme:
              typeof rotRutPrisPerTimme === "string"
                ? Number(rotRutPrisPerTimme)
                : rotRutPrisPerTimme,
            rotRutBeskrivning,
            rotRutStartdatum,
            rotRutSlutdatum,
          }
        : {}),
    };

    setFormData((prev) => ({
      ...prev,
      artiklar: [...(prev.artiklar ?? []), artikelMedRutRot],
      ...(rotRutTyp
        ? {
            rotRutAktiverat: true,
            rotRutTyp: rotRutTyp as "ROT" | "RUT" | undefined,
            rotRutKategori,
            avdragProcent,
            arbetskostnadExMoms:
              arbetskostnadExMoms !== undefined && arbetskostnadExMoms !== null
                ? Number(arbetskostnadExMoms)
                : undefined,
            // Lägg till de nya ROT/RUT-fälten i formData också
            rotRutAntalTimmar:
              typeof rotRutAntalTimmar === "string"
                ? Number(rotRutAntalTimmar)
                : rotRutAntalTimmar,
            rotRutPrisPerTimme:
              typeof rotRutPrisPerTimme === "string"
                ? Number(rotRutPrisPerTimme)
                : rotRutPrisPerTimme,
            rotRutBeskrivning: rotRutBeskrivning || "",
            rotRutStartdatum: rotRutStartdatum || "",
            rotRutSlutdatum: rotRutSlutdatum || "",
            // Beräkna avdragBelopp om alla värden finns
            avdragBelopp: (() => {
              if (rotRutAntalTimmar && rotRutPrisPerTimme && avdragProcent) {
                const antalTimmar = typeof rotRutAntalTimmar === "string" 
                  ? Number(rotRutAntalTimmar) 
                  : rotRutAntalTimmar;
                const prisPerTimme = typeof rotRutPrisPerTimme === "string" 
                  ? Number(rotRutPrisPerTimme) 
                  : rotRutPrisPerTimme;
                const arbetskostnadExMoms = antalTimmar * prisPerTimme;
                const moms = artikel.moms || 25; // Använd artikelns moms eller 25% som default
                const arbetskostnadInklMoms = arbetskostnadExMoms * (1 + moms / 100);
                return Math.round(arbetskostnadInklMoms * (avdragProcent / 100) * 100) / 100;
              }
              return undefined;
            })(),
          }
        : {}),
    }));

    setTimeout(() => {
      setBlinkIndex(formData.artiklar?.length ?? 0);
      setTimeout(() => setBlinkIndex(null), 500);
    }, 50);
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
            valuta={valuta}
            typ={typ}
            onChangeBeskrivning={setBeskrivning}
            onChangeAntal={setAntal}
            onChangePrisPerEnhet={setPrisPerEnhet}
            onChangeMoms={setMoms}
            onChangeValuta={setValuta}
            onChangeTyp={setTyp}
          />

          <RotRutCheckbox
            checked={visaRotRutForm}
            onChange={(checked) => {
              setVisaRotRutForm(checked);
              setFormData((prev) => ({
                ...prev,
                rotRutAktiverat: checked,
                ...(checked
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
            className={checkboxSize}
            labelClassName={labelSize + " text-white"}
          />

          {/* Visa RotRutForm endast om användaren själv aktiverat det */}
          {visaRotRutForm && <RotRutForm showCheckbox={false} />}

          <div className="flex items-center justify-between pt-2">
            <LäggTillFavoritartikel
              checked={saveAsFavorite}
              onChange={setSaveAsFavorite}
              className={checkboxSize}
              labelClassName={`text-white cursor-pointer ${labelSize}`}
            />
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-600">
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

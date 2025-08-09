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
import Modal from "../../_components/Modal";
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
  // För att hålla reda på om artikeln kommer från en favoritartikel
  ursprungligFavoritId?: number;
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
  const [typ, setTyp] = useState<"vara" | "tjänst">("tjänst");
  const [rotRutMaterial, setRotRutMaterial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [favoritArtiklar, setFavoritArtiklar] = useState<FavoritArtikel[]>([]);
  const [showFavoritArtiklar, setShowFavoritArtiklar] = useState(false);
  const [blinkIndex, setBlinkIndex] = useState<number | null>(null);
  const [visaRotRutForm, setVisaRotRutForm] = useState(false);
  const [ursprungligFavoritId, setUrsprungligFavoritId] = useState<number | null>(null);
  const [redigerarIndex, setRedigerarIndex] = useState<number | null>(null); // Nytt: håll reda på vilket index som redigeras
  const [favoritArtikelVald, setFavoritArtikelVald] = useState(false); // Nytt: håll reda på om en favoritartikel är vald
  const [visaArtikelForm, setVisaArtikelForm] = useState(false); // Nytt: visa/dölj artikelformuläret
  const [visaArtikelModal, setVisaArtikelModal] = useState(false); // Modal för att visa artikeldetaljer
  const [valtArtikel, setValtArtikel] = useState<FavoritArtikel | null>(null); // Den valda artikeln för modalen
  const [artikelSparadSomFavorit, setArtikelSparadSomFavorit] = useState(false); // Håll reda på om artikeln precis sparats som favorit
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

  //#region Visa ROT/RUT-formulär automatiskt när data finns
  useEffect(() => {
    // Visa ROT/RUT-formuläret automatiskt om det är aktiverat i formData
    if (formData.rotRutAktiverat) {
      console.log("🔍 ROT/RUT är aktiverat, visar formulär. FormData:", {
        rotRutAktiverat: formData.rotRutAktiverat,
        rotRutTyp: formData.rotRutTyp,
        rotRutKategori: formData.rotRutKategori,
        personnummer: formData.personnummer,
        rotRutBeskrivning: formData.rotRutBeskrivning,
        rotRutStartdatum: formData.rotRutStartdatum,
        rotRutSlutdatum: formData.rotRutSlutdatum,
      });
      setVisaRotRutForm(true);
    }
  }, [formData.rotRutAktiverat]);
  //#endregion

  //#region Handlers
  const handleAdd = async () => {
    console.log("🔍 handleAdd körs - DEBUG INFO:", {
      beskrivning: beskrivning,
      beskrivningTrimmed: beskrivning.trim(),
      beskrivningLength: beskrivning.length,
      antal: antal,
      prisPerEnhet: prisPerEnhet,
      favoritArtikelVald: favoritArtikelVald,
      redigerarIndex: redigerarIndex,
    });

    if (!beskrivning.trim()) {
      alert("❌ Beskrivning krävs");
      return;
    }

    // Kontrollera blandade ROT/RUT-typer
    if (formData.rotRutAktiverat && formData.artiklar && formData.artiklar.length > 0) {
      const befintligTyp = formData.rotRutTyp;
      const befintligaROTRUTArtiklar = formData.artiklar.filter(
        (artikel: any) => artikel.rotRutTyp
      );

      if (befintligaROTRUTArtiklar.length > 0) {
        const förstaBefintligTyp = (befintligaROTRUTArtiklar[0] as any).rotRutTyp;
        if (befintligTyp !== förstaBefintligTyp) {
          alert(
            `❌ Du kan inte blanda ${förstaBefintligTyp} och ${befintligTyp} på samma faktura.\n\nVälj samma typ för alla artiklar eller skapa separata fakturor.`
          );
          return;
        }
      }
    }

    console.log("🔍 handleAdd - formData ROT/RUT-fält:", {
      rotRutAktiverat: formData.rotRutAktiverat,
      rotRutBeskrivning: formData.rotRutBeskrivning,
      rotRutStartdatum: formData.rotRutStartdatum,
      rotRutSlutdatum: formData.rotRutSlutdatum,
      personnummer: formData.personnummer,
      fastighetsbeteckning: formData.fastighetsbeteckning,
    });

    const newArtikel: Artikel = {
      beskrivning,
      antal,
      prisPerEnhet,
      moms,
      valuta,
      typ,
      // Lägg till ROT/RUT-material flagga för varor
      ...(typ === "vara" && rotRutMaterial ? { rotRutMaterial: true } : {}),
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
    let uppdateradeArtiklar;

    if (redigerarIndex !== null) {
      // Uppdatera befintlig artikel
      uppdateradeArtiklar = [...(formData.artiklar ?? [])];
      uppdateradeArtiklar[redigerarIndex] = newArtikel;
    } else {
      // Lägg till ny artikel
      uppdateradeArtiklar = [...(formData.artiklar ?? []), newArtikel];
    }

    // Uppdatera artikellistan
    console.log("🔍 Före artikeluppdatering:", {
      artiklarAntal: formData.artiklar?.length ?? 0,
      redigerarIndex: redigerarIndex,
      nyArtikelBeskrivning: newArtikel.beskrivning,
    });

    setFormData((prev) => ({
      ...prev,
      artiklar: uppdateradeArtiklar,
    }));

    console.log("🔍 Efter artikeluppdatering - nya artiklar:", uppdateradeArtiklar.length);

    // BORT: Spara inte till databas här - låt användaren själv klicka "Spara faktura"
    // try {
    //   setLoading(true);
    //   const fd = new FormData();
    //   fd.append("artiklar", JSON.stringify(uppdateradeArtiklar));
    //   Object.entries(formData).forEach(([k, v]) => {
    //     if (k !== "artiklar" && v != null) fd.append(k, String(v));
    //   });
    //   await saveInvoice(fd);
    // } catch (err) {
    //   alert("❌ Fel vid sparande");
    // } finally {
    //   setLoading(false);
    // }

    setBeskrivning("");
    setAntal(1);
    setPrisPerEnhet(0);
    setMoms(25);
    setValuta("SEK");
    setTyp("vara");
    setRotRutMaterial(false);
    setUrsprungligFavoritId(null); // Rensa spårning av ursprunglig favorit
    setRedigerarIndex(null); // Rensa redigeringsläge
    setFavoritArtikelVald(false); // Lås upp formuläret
    setVisaArtikelForm(false); // Stäng formuläret efter att artikel läggs till

    // Rensa formulärfälten men behåll ROT/RUT-aktiverat om det finns ROT/RUT-artiklar
    const harRotRutArtiklar = uppdateradeArtiklar.some((artikel: any) => artikel.rotRutTyp);

    setFormData((prev) => ({
      ...prev,
      rotRutAktiverat: harRotRutArtiklar, // Behåll aktiverat om det finns ROT/RUT-artiklar
      // Rensa endast formulärfält, inte hela ROT/RUT-data
      ...(harRotRutArtiklar
        ? {}
        : {
            // Rensa endast om det inte finns några ROT/RUT-artiklar
            rotRutTyp: undefined,
            rotRutKategori: undefined,
            avdragProcent: undefined,
            arbetskostnadExMoms: undefined,
            rotRutBeskrivning: "",
            rotRutStartdatum: "",
            rotRutSlutdatum: "",
            personnummer: "",
            fastighetsbeteckning: "",
            rotBoendeTyp: undefined,
            brfOrganisationsnummer: "",
            brfLagenhetsnummer: "",
          }),
    }));
    setVisaRotRutForm(false);

    // Blinka bara vid ny artikel, inte vid uppdatering
    if (redigerarIndex === null) {
      setTimeout(() => {
        setBlinkIndex(formData.artiklar?.length ?? 0);
        setTimeout(() => setBlinkIndex(null), 500);
      }, 50);
    }
  };

  const handleSaveAsFavorite = async () => {
    if (!beskrivning.trim()) {
      alert("❌ Beskrivning krävs för att spara som favorit");
      return;
    }

    // Kontrollera om denna artikel redan kommer från en favorit
    if (ursprungligFavoritId) {
      alert("ℹ️ Denna artikel kommer redan från en favoritartikel och behöver inte sparas igen");
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
          setArtikelSparadSomFavorit(true); // Markera att artikeln har sparats
          alert(
            "✅ Sparad som favoritartikel!\n\nOBS: Du måste fortfarande lägga till den på fakturan om du inte redan gjort det."
          );
        }
      } else {
        alert("❌ Fel vid sparande av favoritartikel");
      }
    } catch (error) {
      console.error("Fel vid sparande av favoritartikel:", error);
      alert("❌ Fel vid sparande av favoritartikel");
    }
  };

  const handleResetForm = () => {
    // Rensa formuläret och avsluta redigeringsläge
    setBeskrivning("");
    setAntal(1);
    setPrisPerEnhet(0);
    setMoms(25);
    setValuta("SEK");
    setTyp("vara");
    setRotRutMaterial(false);
    setUrsprungligFavoritId(null);
    setRedigerarIndex(null);
    setVisaRotRutForm(false);
    setFavoritArtikelVald(false); // Lås upp formuläret
    setArtikelSparadSomFavorit(false); // Återställ favoritsparning-flaggan
    setVisaArtikelForm(true); // Håll formuläret öppet för ny artikel

    // Rensa ROT/RUT-formuläret
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
      rotBoendeTyp: undefined,
      brfOrganisationsnummer: "",
      brfLagenhetsnummer: "",
    }));
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

    // Sätt redigeringsindex
    setRedigerarIndex(index);
    setVisaArtikelForm(true); // Öppna formuläret för redigering

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
        rotRutBeskrivning: artikel.rotRutBeskrivning,
        rotRutStartdatum: artikel.rotRutStartdatum,
        rotRutSlutdatum: artikel.rotRutSlutdatum,
        rotRutPersonnummer: artikel.rotRutPersonnummer,
        rotRutFastighetsbeteckning: artikel.rotRutFastighetsbeteckning,
        rotRutBrfOrg: artikel.rotRutBrfOrg,
        rotRutBrfLagenhet: artikel.rotRutBrfLagenhet,
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

    // Sätt spårning för ursprunglig favorit om artikeln har det
    if (artikel.ursprungligFavoritId) {
      setUrsprungligFavoritId(artikel.ursprungligFavoritId);
    } else {
      setUrsprungligFavoritId(null);
    }

    console.log("🔍 handleEdit slutförd");
  };

  // När man väljer en favoritartikel: lägg till direkt i listan
  const handleSelectFavorit = (artikel: FavoritArtikel) => {
    console.log("🔍 handleSelectFavorit körs med artikel:", artikel);

    // Konvertera FavoritArtikel till Artikel och lägg till direkt i listan
    const newArtikel: Artikel = {
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
            avdragProcent: artikel.avdragProcent ? Number(artikel.avdragProcent) : 50,
            arbetskostnadExMoms: artikel.arbetskostnadExMoms
              ? Number(artikel.arbetskostnadExMoms)
              : undefined,
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
            rotRutPersonnummer: artikel.rotRutPersonnummer || "",
            rotRutFastighetsbeteckning: artikel.rotRutFastighetsbeteckning || "",
            rotRutBoendeTyp: artikel.rotRutBoendeTyp,
            rotRutBrfOrg: artikel.rotRutBrfOrg || "",
            rotRutBrfLagenhet: artikel.rotRutBrfLagenhet || "",
          }
        : {}),
    };

    // Lägg till artikeln direkt i listan
    const uppdateradeArtiklar = [...(formData.artiklar ?? []), newArtikel];

    setFormData((prev) => ({
      ...prev,
      artiklar: uppdateradeArtiklar,
      // Om artikeln har ROT/RUT-data, aktivera det
      ...(artikel.rotRutTyp
        ? {
            rotRutAktiverat: true,
          }
        : {}),
    }));

    console.log("🔍 Favoritartikel tillagd direkt i listan:", newArtikel.beskrivning);

    // Blinka den nya artikeln
    setTimeout(() => {
      setBlinkIndex(uppdateradeArtiklar.length - 1);
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

  const handleShowArtikelDetaljer = (artikel: Artikel) => {
    setValtArtikel(artikel);
    setVisaArtikelModal(true);
  };

  const handleCloseArtikelModal = () => {
    setVisaArtikelModal(false);
    setValtArtikel(null);
  };

  const handleToggleArtikelForm = () => {
    const newValue = !visaArtikelForm;
    setVisaArtikelForm(newValue);

    // Om vi öppnar formuläret för en ny artikel (inte redigering), återställ ROT/RUT-tillståndet
    if (newValue && redigerarIndex === null) {
      setVisaRotRutForm(false);
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
        rotBoendeTyp: undefined,
        brfOrganisationsnummer: "",
        brfLagenhetsnummer: "",
      }));
    }
  };
  //#endregion

  //#region Vars: Gemensam storlek för checkbox och label
  const checkboxSize = "w-5 h-5";
  const labelSize = "text-base";
  //#endregion

  return (
    <div className="space-y-4">
      <FavoritArtiklarList
        favoritArtiklar={favoritArtiklar}
        showFavoritArtiklar={showFavoritArtiklar}
        onToggle={setShowFavoritArtiklar}
        onSelect={handleSelectFavorit}
        onDelete={handleDeleteFavorit}
        inladdadFavoritId={favoritArtikelVald ? ursprungligFavoritId : null}
      />

      <ArtiklarList
        artiklar={formData.artiklar as Artikel[]}
        blinkIndex={blinkIndex}
        onRemove={handleRemove}
        onEdit={handleEdit}
        onShow={handleShowArtikelDetaljer}
      />

      {/* ROT/RUT infobox - visas under artikellistan */}
      {formData.rotRutAktiverat &&
        formData.artiklar &&
        formData.artiklar.length > 0 &&
        formData.artiklar.some((artikel: any) => artikel.rotRutTyp) && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white">
                  {formData.rotRutTyp || "ROT/RUT"} är aktiverat
                </h3>
                <div className="mt-1 text-sm text-slate-300">
                  <p>
                    Tjänster/arbete berättigar 50% avdrag. Lägg till eventuell materialkostnad som
                    en separat artikel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Knapp för att visa/dölja artikelformuläret */}
      <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
        {/* Knapp som header */}
        <div className="border-b border-slate-600">
          {visaArtikelForm ? (
            <Knapp
              onClick={handleToggleArtikelForm}
              text="❌ Avsluta lägg till ny artikel"
              className="w-full rounded-none border-none"
            />
          ) : (
            <Knapp
              onClick={handleToggleArtikelForm}
              text="✚ Lägg till ny artikel"
              className="w-full rounded-none border-none"
            />
          )}
        </div>

        {/* Formulär som expanderar nedåt */}
        {visaArtikelForm && (
          <div className="p-4 space-y-4">
            <ArtikelForm
              beskrivning={beskrivning}
              antal={antal}
              prisPerEnhet={prisPerEnhet}
              moms={moms}
              typ={typ}
              rotRutMaterial={rotRutMaterial}
              onChangeBeskrivning={setBeskrivning}
              onChangeAntal={setAntal}
              onChangePrisPerEnhet={setPrisPerEnhet}
              onChangeMoms={setMoms}
              onChangeTyp={setTyp}
              onChangeRotRutMaterial={setRotRutMaterial}
              disabled={favoritArtikelVald}
            />

            {/* ROT/RUT-knapp - alltid synlig men disabled för varor */}
            <div className="mb-4">
              <Knapp
                onClick={() => {
                  if (typ === "vara") {
                    alert(
                      "❌ ROT/RUT-avdrag kan endast användas för tjänster.\n\nÄndra typ till 'Tjänst' först."
                    );
                    return;
                  }

                  const newValue = !visaRotRutForm;
                  setVisaRotRutForm(newValue);
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
                text={
                  visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Lägg till ROT/RUT-avdrag"
                }
                disabled={typ === "vara"}
                className={typ === "vara" ? "opacity-50 cursor-not-allowed" : ""}
              />
            </div>

            {/* ROT/RUT formulär */}
            {visaRotRutForm && (
              <div className="border border-slate-500 rounded-lg mt-4">
                <RotRutForm showCheckbox={false} disabled={favoritArtikelVald} />
              </div>
            )}

            {/* Spara som favorit knapp */}
            <div className="mb-4">
              <Knapp
                onClick={handleSaveAsFavorite}
                text="📌 Lägg till som favoritartikel"
                disabled={
                  !beskrivning.trim() ||
                  !antal ||
                  !prisPerEnhet ||
                  Number(prisPerEnhet) <= 0 ||
                  favoritArtikelVald ||
                  artikelSparadSomFavorit
                }
              />
            </div>

            {/* Lägg till artikel knapp */}
            <div className="border-t border-slate-600 pt-4 flex justify-end">
              <Knapp
                onClick={handleAdd}
                text="✚ Lägg till artikel"
                disabled={!beskrivning.trim()}
              />
            </div>
          </div>
        )}
      </div>
      {/* Visa "Lägg till artikel"-knapp när man redigerar */}
      {redigerarIndex !== null && (
        <div className="text-center">
          <Knapp onClick={handleResetForm} text="✚ Lägg till en till artikel" />
        </div>
      )}

      {/* Visa "Lägg till artikel"-knapp när favoritartikel är vald */}
      {favoritArtikelVald && (
        <div className="mb-4">
          <Knapp
            onClick={handleAdd}
            text="✚ Lägg till artikel"
            className="w-full bg-green-800 hover:bg-green-700"
          />
        </div>
      )}

      {/* Redigeringsformulär - visa när artikel redigeras OCH expandable form INTE visas */}
      {redigerarIndex !== null && !visaArtikelForm && (
        <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
            <h3 className="text-white font-medium">Redigera artikel {redigerarIndex + 1}</h3>
          </div>

          {/* Formulär innehåll för redigering */}
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
                  // Blockera ROT/RUT för varor
                  if (typ === "vara") {
                    alert(
                      "❌ ROT/RUT-avdrag kan endast användas för tjänster.\n\nÄndra typ till 'Tjänst' först."
                    );
                    return;
                  }

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
                text={
                  visaRotRutForm ? "❌ Avaktivera ROT/RUT-avdrag" : "🏠 Aktivera ROT/RUT-avdrag"
                }
                disabled={typ === "vara" || redigerarIndex !== null}
                className={
                  typ === "vara" || redigerarIndex !== null ? "opacity-50 cursor-not-allowed" : ""
                }
              />
            </div>

            {/* Visa RotRutForm endast om användaren själv aktiverat det */}
            {visaRotRutForm && (
              <div className="border border-slate-500 rounded-lg mt-4">
                <RotRutForm showCheckbox={false} />
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-slate-600">
              <Knapp
                onClick={handleResetForm}
                text="❌ Avbryt redigering"
                className="bg-red-600 hover:bg-red-700"
              />
              <Knapp
                onClick={handleAdd}
                text="💾 Uppdatera artikel"
                disabled={!beskrivning.trim()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal för att visa artikeldetaljer */}
      <Modal
        isOpen={visaArtikelModal && !!valtArtikel}
        onClose={handleCloseArtikelModal}
        title="Artikeldetaljer"
      >
        {valtArtikel && (
          <div className="space-y-4">
            <div className="text-sm text-gray-400 mb-4 text-center">
              Detta är bara en översikt. Om du vill ändra något måste du skapa en ny artikel.
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Beskrivning</label>
                <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                  {valtArtikel.beskrivning}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Antal</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.antal}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Pris per enhet
                  </label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.prisPerEnhet} {valtArtikel.valuta}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Moms (%)</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.moms}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Typ</label>
                  <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                    {valtArtikel.typ}
                  </div>
                </div>
              </div>

              {valtArtikel.rotRutTyp && (
                <>
                  <div className="border-t border-slate-600 pt-4">
                    <h3 className="text-lg font-semibold text-white mb-3">ROT/RUT-avdrag</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Typ av avdrag
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutTyp}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Kategori
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutKategori || "Ej angiven"}
                      </div>
                    </div>
                  </div>

                  {valtArtikel.rotRutBeskrivning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Beskrivning av arbetet
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutBeskrivning}
                      </div>
                    </div>
                  )}

                  {(valtArtikel.rotRutStartdatum || valtArtikel.rotRutSlutdatum) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Startdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutStartdatum || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Slutdatum
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutSlutdatum || "Ej angiven"}
                        </div>
                      </div>
                    </div>
                  )}

                  {valtArtikel.rotRutPersonnummer && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Personnummer
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutPersonnummer}
                      </div>
                    </div>
                  )}

                  {valtArtikel.rotRutFastighetsbeteckning && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Fastighetsbeteckning
                      </label>
                      <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                        {valtArtikel.rotRutFastighetsbeteckning}
                      </div>
                    </div>
                  )}

                  {(valtArtikel.rotRutBrfOrg || valtArtikel.rotRutBrfLagenhet) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          BRF Organisationsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutBrfOrg || "Ej angiven"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Lägenhetsnummer
                        </label>
                        <div className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white">
                          {valtArtikel.rotRutBrfLagenhet || "Ej angiven"}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Knapp onClick={handleCloseArtikelModal} text="Stäng" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

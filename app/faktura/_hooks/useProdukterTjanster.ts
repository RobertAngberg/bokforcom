"use client";

import { useState, useEffect, useCallback } from "react";
import { sparaFavoritArtikel, hämtaSparadeArtiklar, deleteFavoritArtikel } from "../actions";
import { useFakturaClient } from "./useFakturaClient";
import type { Artikel, FavoritArtikel } from "../_types/types";

export function useProdukterTjanster() {
  const {
    formData,
    updateFormField,
    updateMultipleFields,
    produkterTjansterState,
    setProdukterTjansterState,
    nyArtikel,
    updateArtikel,
    resetNyArtikel,
    showSuccess,
    showError,
    toastState,
    clearToast,
  } = useFakturaClient();

  // Använd nyArtikel från Zustand istället för lokala states
  const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

  // ROT/RUT material state (lokal eftersom det är UI-specifik)
  const [rotRutMaterial, setRotRutMaterial] = useState(false);

  // Store state destructuring
  const {
    favoritArtiklar,
    showFavoritArtiklar,
    blinkIndex,
    visaRotRutForm,
    visaArtikelForm,
    visaArtikelModal,
    redigerarIndex,
    favoritArtikelVald,
    ursprungligFavoritId,
    artikelSparadSomFavorit,
    valtArtikel,
  } = produkterTjansterState;

  // ROT/RUT constants
  const RUT_KATEGORIER = [
    "Passa barn",
    "Fiber- och it-tjänster",
    "Flytta och packa",
    "Transport till försäljning för återanvändning",
    "Möblering",
    "Ta hand om en person och ge omsorg",
    "Reparera vitvaror",
    "Skotta snö",
    "Städa",
    "Tvätta, laga och sy",
    "Tvätt vid tvättinrättning",
    "Trädgårdsarbete – fälla och beskära träd",
    "Trädgårdsarbete – underhålla, klippa och gräva",
    "Tillsyn",
  ];

  const ROT_KATEGORIER = [
    "Bygg – reparera och underhålla",
    "Bygg – bygga om och bygga till",
    "El",
    "Glas och plåt",
    "Gräv- och markarbete",
    "Murning och sotning",
    "Målning och tapetsering",
    "Rengöring",
    "VVS",
  ];

  // ROT/RUT utility functions
  const sanitizeRotRutInput = (text: string): string => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/[<>'"&{}()[\]]/g, "") // Ta bort XSS-farliga tecken
      .replace(/\s+/g, " ") // Normalisera whitespace
      .trim()
      .substring(0, 500); // Begränsa längd
  };

  const validateRotRutNumeric = (value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0 && num < 10000000;
  };

  const validatePersonnummer = (personnummer: string): boolean => {
    if (!personnummer) return false;
    const clean = personnummer.replace(/[-\s]/g, "");
    return /^\d{10}$/.test(clean) || /^\d{12}$/.test(clean);
  };

  // ROT/RUT event handlers
  const handleRotRutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let finalValue: string | boolean = value;

      if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
        finalValue = e.target.checked;
      } else if (typeof value === "string") {
        // SÄKERHETSVALIDERING: Sanitera alla textvärden
        if (name === "rotRutBeskrivning") {
          finalValue = sanitizeRotRutInput(value);
        } else if (name === "personnummer") {
          // Tillåt bara siffror och bindestreck för personnummer
          finalValue = value.replace(/[^\d-]/g, "").substring(0, 13);
        } else if (
          name === "fastighetsbeteckning" ||
          name === "brfOrganisationsnummer" ||
          name === "brfLagenhetsnummer"
        ) {
          finalValue = sanitizeRotRutInput(value);
        } else if (typeof value === "string") {
          finalValue = sanitizeRotRutInput(value);
        }
      }

      if (name === "rotRutAktiverat" && finalValue === false) {
        // Reset alla ROT/RUT fält när det inaktiveras
        const fieldsToReset = {
          rotRutAktiverat: false,
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
        };

        Object.entries(fieldsToReset).forEach(([key, value]) => {
          updateFormField(key as keyof typeof fieldsToReset, value);
        });
        return;
      }

      if (name === "rotRutTyp") {
        const procent = value === "ROT" ? 50 : value === "RUT" ? 50 : undefined; // 50% för både ROT och RUT
        const isActive = value === "ROT" || value === "RUT";

        updateMultipleFields({
          rotRutAktiverat: isActive,
          rotRutTyp: isActive ? value : undefined,
          avdragProcent: procent,
          rotRutKategori: undefined,
        });
        return;
      }

      // Vanlig uppdatering av enskilt fält
      updateFormField(name as keyof typeof formData, finalValue);
    },
    [updateFormField, updateMultipleFields, formData]
  );

  const handleRotRutBoendeTypChange = useCallback(
    (typ: "fastighet" | "brf") => {
      updateFormField("rotBoendeTyp", typ);
    },
    [updateFormField]
  );

  const handleRotRutDateChange = useCallback(
    (field: string, date: Date | null) => {
      if (date) {
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        updateFormField(field as keyof typeof formData, dateString);
      }
    },
    [updateFormField]
  );

  // Ladda favoritartiklar vid mount
  useEffect(() => {
    const laddaFavoriter = async () => {
      try {
        const artiklar = await hämtaSparadeArtiklar();
        setProdukterTjansterState({
          favoritArtiklar: (artiklar as FavoritArtikel[]) || [],
        });
      } catch (error) {
        console.error("Fel vid laddning av favoritartiklar:", error);
        setProdukterTjansterState({ favoritArtiklar: [] });
      }
    };
    laddaFavoriter();
  }, [setProdukterTjansterState]);

  // Visa ROT/RUT-formulär automatiskt när data finns
  useEffect(() => {
    if (formData.rotRutAktiverat) {
      setProdukterTjansterState({ visaRotRutForm: true });
    }
  }, [formData.rotRutAktiverat, setProdukterTjansterState]);

  // ROT/RUT useEffects
  // Sätt dagens datum som default för startdatum om det är tomt OCH det inte redan finns data
  useEffect(() => {
    if (!formData.rotRutStartdatum && formData.rotRutAktiverat) {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      updateFormField("rotRutStartdatum", today);
    }
  }, [formData.rotRutAktiverat, formData.rotRutStartdatum, updateFormField]);

  // Automatisk beräkning av arbetskostnadExMoms och avdragBelopp
  useEffect(() => {
    // Använd antal och prisPerEnhet från nyArtikel
    if (formData.rotRutAktiverat && antal && prisPerEnhet) {
      const antalTimmar = parseFloat(antal);
      const prisPerTimme = parseFloat(prisPerEnhet);

      // Kontrollera att vi har giltiga nummer
      if (isNaN(antalTimmar) || isNaN(prisPerTimme)) {
        return;
      }

      const arbetskostnadExMoms = antalTimmar * prisPerTimme;

      // Beräkna avdragBelopp om procentsats finns
      let avdragBelopp: number | undefined = undefined;
      if (formData.avdragProcent !== undefined) {
        // Hämta momssats från nyArtikel eller använd 25% som standard
        const momsSats = parseFloat(moms) || 25;

        // Räkna ut arbetskostnad inkl moms
        const arbetskostnadInklMoms = arbetskostnadExMoms * (1 + momsSats / 100);
        avdragBelopp =
          Math.round(arbetskostnadInklMoms * (formData.avdragProcent / 100) * 100) / 100;
      }

      updateMultipleFields({
        arbetskostnadExMoms: arbetskostnadExMoms,
        avdragBelopp: avdragBelopp,
      });
    }
  }, [
    antal,
    prisPerEnhet,
    formData.avdragProcent,
    formData.rotRutAktiverat,
    formData.artiklar,
    updateMultipleFields,
    moms,
  ]);

  // Automatisk ifyllning av arbetskostnad från aktuell artikel-form eller befintliga artiklar
  useEffect(() => {
    if (formData.rotRutAktiverat && !formData.arbetskostnadExMoms) {
      let arbetskostnad: number | undefined = undefined;

      // Kontrollera om vi har aktuell artikel i formuläret
      if (typ === "tjänst" && beskrivning && parseFloat(prisPerEnhet) > 0) {
        arbetskostnad = parseFloat(antal) * parseFloat(prisPerEnhet);
      } else {
        const tjänsteArtiklar = (formData.artiklar || []).filter((a) => a.typ === "tjänst");
        if (tjänsteArtiklar.length === 1) {
          const art = tjänsteArtiklar[0];
          arbetskostnad = parseFloat(String(art.antal)) * parseFloat(String(art.prisPerEnhet));
        }
      }

      if (arbetskostnad !== undefined) {
        updateFormField("arbetskostnadExMoms", arbetskostnad);
      }
    }
  }, [
    formData.rotRutAktiverat,
    formData.arbetskostnadExMoms,
    formData.artiklar,
    updateFormField,
    typ,
    beskrivning,
    prisPerEnhet,
    antal,
  ]);

  // DatePicker styling för att matcha applikationens tema
  useEffect(() => {
    const datePickerEls = document.querySelectorAll(".react-datepicker-wrapper");
    datePickerEls.forEach((el) => {
      (el as HTMLElement).style.width = "100%";
    });

    const inputEls = document.querySelectorAll(".react-datepicker__input-container input");
    inputEls.forEach((el) => {
      (el as HTMLElement).className =
        "w-full p-2 rounded bg-slate-900 border border-slate-700 text-white";
    });
  }, [formData.rotRutAktiverat]);

  // Reset form
  const handleResetForm = useCallback(() => {
    resetNyArtikel();
    setRotRutMaterial(false);
    setProdukterTjansterState({
      redigerarIndex: null,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
    });
  }, [resetNyArtikel, setProdukterTjansterState]);

  // Lägg till artikel
  const handleAdd = useCallback(async () => {
    if (!beskrivning.trim()) {
      showError("Beskrivning krävs");
      return;
    }

    const nyArtikel: Artikel = {
      beskrivning: beskrivning.trim(),
      antal: parseFloat(antal) || 1,
      prisPerEnhet: parseFloat(prisPerEnhet) || 0,
      moms: parseFloat(moms) || 25,
      valuta,
      typ,
      rotRutTyp: formData.rotRutAktiverat ? formData.rotRutTyp : undefined,
      rotRutKategori: formData.rotRutAktiverat ? formData.rotRutKategori : undefined,
      ursprungligFavoritId: ursprungligFavoritId || undefined,
    };

    if (redigerarIndex !== null) {
      // Uppdatera befintlig artikel
      const nyaArtiklar = [...(formData.artiklar || [])];
      nyaArtiklar[redigerarIndex] = nyArtikel;
      updateFormField("artiklar", nyaArtiklar);
      setProdukterTjansterState({ redigerarIndex: null });

      showSuccess("Artikel uppdaterad!");
    } else {
      // Lägg till ny artikel
      const nyaArtiklar = [...(formData.artiklar || []), nyArtikel];
      updateFormField("artiklar", nyaArtiklar);

      // Blink effekt för ny artikel
      setProdukterTjansterState({ blinkIndex: nyaArtiklar.length - 1 });
      setTimeout(() => {
        setProdukterTjansterState({ blinkIndex: null });
      }, 2000);

      showSuccess("Artikel tillagd!");
    }

    handleResetForm();
  }, [
    beskrivning,
    antal,
    prisPerEnhet,
    moms,
    valuta,
    typ,
    formData,
    ursprungligFavoritId,
    redigerarIndex,
    updateFormField,
    setProdukterTjansterState,
    handleResetForm,
    showError,
    showSuccess,
  ]);

  // Ta bort artikel
  const handleRemove = useCallback(
    (index: number) => {
      const nyaArtiklar = formData.artiklar?.filter((_, i) => i !== index) || [];
      updateFormField("artiklar", nyaArtiklar);
    },
    [formData.artiklar, updateFormField]
  );

  // Redigera artikel
  const handleEdit = useCallback(
    (artikel: Artikel, index: number) => {
      updateArtikel({
        beskrivning: artikel.beskrivning,
        antal: artikel.antal.toString(),
        prisPerEnhet: artikel.prisPerEnhet.toString(),
        moms: artikel.moms.toString(),
        valuta: artikel.valuta,
        typ: artikel.typ,
      });
      setRotRutMaterial(artikel.rotRutTyp === "ROT" || artikel.rotRutTyp === "RUT");

      setProdukterTjansterState({
        redigerarIndex: index,
        ursprungligFavoritId: artikel.ursprungligFavoritId || null,
        visaArtikelForm: true,
      });
    },
    [updateArtikel, setProdukterTjansterState]
  );

  // Välj favoritartikel - lägg till direkt i listan
  const handleSelectFavorit = useCallback(
    (artikel: FavoritArtikel) => {
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

      updateFormField("artiklar", uppdateradeArtiklar);

      // Om artikeln har ROT/RUT-data, aktivera det
      if (artikel.rotRutTyp) {
        updateFormField("rotRutAktiverat", true);
      }

      console.log("🔍 Favoritartikel tillagd direkt i listan:", newArtikel.beskrivning);

      // Blinka den nya artikeln och stäng favoritlistan
      setProdukterTjansterState({
        blinkIndex: uppdateradeArtiklar.length - 1,
        showFavoritArtiklar: false,
      });

      // Ta bort blinkning efter en kort stund
      setTimeout(() => {
        setProdukterTjansterState({ blinkIndex: null });
      }, 500);
    },
    [formData.artiklar, updateFormField, setProdukterTjansterState]
  );

  // Spara som favorit
  const handleSaveAsFavorite = useCallback(async () => {
    if (!beskrivning.trim()) {
      showError("Beskrivning krävs för att spara som favorit");
      return;
    }

    try {
      const favoritData = {
        beskrivning: beskrivning.trim(),
        antal: parseFloat(antal) || 1,
        prisPerEnhet: parseFloat(prisPerEnhet) || 0,
        moms: parseFloat(moms) || 25,
        valuta,
        typ,
        rotRutTyp: formData.rotRutAktiverat ? formData.rotRutTyp : undefined,
        rotRutKategori: formData.rotRutAktiverat ? formData.rotRutKategori : undefined,
      };

      const result = await sparaFavoritArtikel(favoritData);

      if (result.success) {
        showSuccess("Artikel sparad som favorit!");

        // Ladda om favoritlistan
        const artiklar = await hämtaSparadeArtiklar();
        setProdukterTjansterState({
          favoritArtiklar: (artiklar as FavoritArtikel[]) || [],
          artikelSparadSomFavorit: true,
        });

        // Återställ flaggan efter 3 sekunder
        setTimeout(() => {
          setProdukterTjansterState({ artikelSparadSomFavorit: false });
        }, 3000);
      } else {
        showError("Kunde inte spara artikel som favorit");
      }
    } catch (error) {
      console.error("Fel vid sparande av favoritartikel:", error);
      showError("Kunde inte spara artikel som favorit");
    }
  }, [
    beskrivning,
    antal,
    prisPerEnhet,
    moms,
    valuta,
    typ,
    formData,
    setProdukterTjansterState,
    showSuccess,
    showError,
  ]);

  // Ta bort favoritartikel
  const handleDeleteFavorit = useCallback(
    async (id?: number) => {
      if (!id) return;

      try {
        await deleteFavoritArtikel(id);
        const artiklar = await hämtaSparadeArtiklar();
        setProdukterTjansterState({
          favoritArtiklar: (artiklar as FavoritArtikel[]) || [],
        });
        showSuccess("Favoritartikel borttagen");
      } catch (error) {
        console.error("Fel vid borttagning av favoritartikel:", error);
        showError("Kunde inte ta bort favoritartikel");
      }
    },
    [setProdukterTjansterState, showSuccess, showError]
  );

  // Visa artikeldetaljer
  const handleShowArtikelDetaljer = useCallback(
    (artikel: Artikel) => {
      setProdukterTjansterState({
        valtArtikel: artikel as FavoritArtikel,
        visaArtikelModal: true,
      });
    },
    [setProdukterTjansterState]
  );

  // Stäng artikelmodal
  const handleCloseArtikelModal = useCallback(() => {
    setProdukterTjansterState({
      visaArtikelModal: false,
      valtArtikel: null,
    });
  }, [setProdukterTjansterState]);

  // Växla artikelformulär
  const handleToggleArtikelForm = useCallback(() => {
    if (visaArtikelForm) {
      handleResetForm();
    }
    setProdukterTjansterState({ visaArtikelForm: !visaArtikelForm });
  }, [visaArtikelForm, handleResetForm, setProdukterTjansterState]);

  // Store state setters (för enkel användning)
  const setShowFavoritArtiklar = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ showFavoritArtiklar: value });
    },
    [setProdukterTjansterState]
  );

  const setVisaRotRutForm = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ visaRotRutForm: value });
    },
    [setProdukterTjansterState]
  );

  const setVisaArtikelForm = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ visaArtikelForm: value });
    },
    [setProdukterTjansterState]
  );

  // Stäng toast
  const closeToast = useCallback(() => {
    clearToast();
  }, [clearToast]);

  return {
    // State från store
    formData,
    favoritArtiklar,
    showFavoritArtiklar,
    blinkIndex,
    visaRotRutForm,
    visaArtikelForm,
    visaArtikelModal,
    redigerarIndex,
    favoritArtikelVald,
    ursprungligFavoritId,
    artikelSparadSomFavorit,
    valtArtikel,
    toastState,
    clearToast,

    // Artikel state från nyArtikel
    beskrivning,
    antal,
    prisPerEnhet,
    moms,
    valuta,
    typ,
    rotRutMaterial,

    // Setters för artikel state (via updateArtikel)
    setBeskrivning: (value: string) => updateArtikel({ beskrivning: value }),
    setAntal: (value: number) => updateArtikel({ antal: value.toString() }),
    setPrisPerEnhet: (value: number) => updateArtikel({ prisPerEnhet: value.toString() }),
    setMoms: (value: number) => updateArtikel({ moms: value.toString() }),
    setValuta: (value: string) => updateArtikel({ valuta: value }),
    setTyp: (value: "vara" | "tjänst") => updateArtikel({ typ: value }),
    setRotRutMaterial,

    // Setters för store state
    setShowFavoritArtiklar,
    setVisaRotRutForm,
    setVisaArtikelForm,

    // Event handlers
    handleAdd,
    handleSaveAsFavorite,
    handleResetForm,
    handleRemove,
    handleEdit,
    handleSelectFavorit,
    handleDeleteFavorit,
    handleShowArtikelDetaljer,
    handleCloseArtikelModal,
    handleToggleArtikelForm,
    closeToast,

    // Form actions
    updateFormField,
    updateMultipleFields,

    // ROT/RUT constants and handlers
    RUT_KATEGORIER,
    ROT_KATEGORIER,
    sanitizeRotRutInput,
    validateRotRutNumeric,
    validatePersonnummer,
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,
  };
}

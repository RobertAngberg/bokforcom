"use client";

import { useCallback, useEffect } from "react";
import { useFakturaContext } from "../context/FakturaContext";
import { hämtaSparadeArtiklar, deleteFavoritArtikel } from "../actions/fakturaActions";
import { sparaFavoritArtikel } from "../actions/artikelActions";

// Types
import type { FakturaFormData, NyArtikel, Artikel } from "../types/types";

/**
 * Hook för produkter, tjänster och ROT/RUT hantering
 */
export function useProdukterTjanster() {
  // Context state
  const context = useFakturaContext();
  const {
    state: { formData, nyArtikel, produkterTjansterState },
    setFormData,
    setNyArtikel,
    resetNyArtikel,
    setProdukterTjansterState,
    setToast,
  } = context;

  // =============================================================================
  // ROT/RUT CONSTANTS
  // =============================================================================

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

  // =============================================================================
  // ROT/RUT UTILITY FUNCTIONS
  // =============================================================================

  const sanitizeRotRutInput = useCallback((text: string): string => {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/[<>'"&{}()[\]]/g, "") // Ta bort XSS-farliga tecken
      .replace(/\s+/g, " ") // Normalisera whitespace
      .trim()
      .substring(0, 500); // Begränsa längd
  }, []);

  const validateRotRutNumeric = useCallback((value: string): boolean => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0 && num < 10000000;
  }, []);

  const validatePersonnummerRotRut = useCallback((personnummer: string): boolean => {
    if (!personnummer) return false;
    const clean = personnummer.replace(/[-\s]/g, "");
    return /^\d{10}$/.test(clean) || /^\d{12}$/.test(clean);
  }, []);

  // =============================================================================
  // STORE STATE HELPERS
  // =============================================================================

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

  // =============================================================================
  // ARTIKEL FUNCTIONS
  // =============================================================================

  // Ladda sparade artiklar
  const laddaSparadeArtiklar = useCallback(async () => {
    try {
      const artiklar = await hämtaSparadeArtiklar();
      setProdukterTjansterState({ favoritArtiklar: artiklar || [] });
    } catch (error) {
      console.error("Fel vid laddning av artiklar:", error);
      setToast({ message: "Kunde inte ladda sparade artiklar", type: "error" });
    }
  }, [setProdukterTjansterState, setToast]);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  // Ladda favoritartiklar när komponenten mountas
  useEffect(() => {
    if (favoritArtiklar.length === 0) {
      laddaSparadeArtiklar();
    }
  }, [laddaSparadeArtiklar]);

  // Lägg till artikel
  const läggTillArtikel = useCallback(() => {
    const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

    if (!beskrivning || !antal || !prisPerEnhet) {
      setToast({ message: "Fyll i alla obligatoriska fält", type: "error" });
      return;
    }

    const nyArtikelData: Artikel = {
      beskrivning,
      antal: parseFloat(antal),
      prisPerEnhet: parseFloat(prisPerEnhet),
      moms: parseFloat(moms),
      valuta,
      typ,
      ursprungligFavoritId: ursprungligFavoritId ?? undefined,
    };

    const uppdateradeArtiklar = [...formData.artiklar, nyArtikelData];
    setFormData({ artiklar: uppdateradeArtiklar });
    resetNyArtikel();
    setProdukterTjansterState({
      visaArtikelForm: false,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
    });
    setToast({ message: "Artikel tillagd", type: "success" });
  }, [
    nyArtikel,
    formData.artiklar,
    ursprungligFavoritId,
    setFormData,
    resetNyArtikel,
    setProdukterTjansterState,
    setToast,
  ]);

  // Ta bort artikel
  const taBortArtikel = useCallback(
    (index: number) => {
      const uppdateradeArtiklar = formData.artiklar.filter((_, i) => i !== index);
      setFormData({ artiklar: uppdateradeArtiklar });
      setToast({ message: "Artikel borttagen", type: "success" });
    },
    [formData.artiklar, setFormData, setToast]
  );

  // Spara artikel som favorit
  const sparaArtikelSomFavorit = useCallback(async () => {
    const { beskrivning, antal, prisPerEnhet, moms, valuta, typ } = nyArtikel;

    if (!beskrivning.trim() || !antal || !prisPerEnhet || Number(prisPerEnhet) <= 0) {
      setToast({ message: "Fyll i alla obligatoriska fält", type: "error" });
      return;
    }

    const artikelData = {
      beskrivning: beskrivning.trim(),
      antal: Number(antal),
      prisPerEnhet: Number(prisPerEnhet),
      moms: Number(moms),
      valuta,
      typ,
      // Lägg till ROT/RUT data om det finns
      rotRutTyp: formData.rotRutTyp || undefined,
      rotRutKategori: formData.rotRutKategori || undefined,
      avdragProcent: formData.avdragProcent || undefined,
      arbetskostnadExMoms: Number(formData.arbetskostnadExMoms) || undefined,
    };

    try {
      const result = await sparaFavoritArtikel(artikelData);
      if (result.success) {
        if (result.alreadyExists) {
          setToast({ message: "Artikeln finns redan som favorit! 📌", type: "info" });
        } else {
          setToast({ message: "Artikel sparad som favorit! 📌", type: "success" });
        }
        setProdukterTjansterState({ artikelSparadSomFavorit: true });
        // Ladda om favoriter för att visa den nya
        await laddaSparadeArtiklar();
      } else {
        setToast({ message: "Kunde inte spara som favorit", type: "error" });
      }
    } catch (error) {
      setToast({ message: "Fel vid sparande av favorit", type: "error" });
    }
  }, [
    nyArtikel,
    formData.rotRutTyp,
    formData.rotRutKategori,
    formData.avdragProcent,
    formData.arbetskostnadExMoms,
    sparaFavoritArtikel,
    setToast,
    setProdukterTjansterState,
    laddaSparadeArtiklar,
  ]);

  // Ta bort favoritartikel
  const taBortFavoritArtikel = useCallback(
    async (id: number) => {
      if (!confirm("Är du säker på att du vill ta bort denna favoritartikel?")) {
        return;
      }

      try {
        const result = await deleteFavoritArtikel(id);
        if (result.success) {
          setToast({ message: "Favoritartikel borttagen! 🗑️", type: "success" });
          // Ladda om favoriter för att uppdatera listan
          await laddaSparadeArtiklar();
        } else {
          setToast({ message: "Kunde inte ta bort favoritartikel", type: "error" });
        }
      } catch (error) {
        setToast({ message: "Fel vid borttagning av favoritartikel", type: "error" });
      }
    },
    [deleteFavoritArtikel, setToast, laddaSparadeArtiklar]
  );

  // Ladda favoritartikel till formuläret
  const laddaFavoritArtikel = useCallback(
    (artikel: any) => {
      // Fyll i nyArtikel formuläret med data från favoritartikeln
      setNyArtikel({
        beskrivning: artikel.beskrivning || "",
        antal: artikel.antal?.toString() || "1",
        prisPerEnhet: artikel.prisPerEnhet?.toString() || "",
        moms: artikel.moms?.toString() || "25",
        valuta: artikel.valuta || "SEK",
        typ: artikel.typ || "vara",
      });

      // Sätt state för att visa att en favoritartikel är vald
      setProdukterTjansterState({
        favoritArtikelVald: true,
        ursprungligFavoritId: artikel.id,
        visaArtikelForm: true, // Visa formuläret så användaren kan se/redigera
      });

      // Uppdatera också ROT/RUT data om det finns
      if (artikel.rotRutTyp) {
        setFormData({
          rotRutAktiverat: true,
          rotRutTyp: artikel.rotRutTyp,
          rotRutKategori: artikel.rotRutKategori,
          avdragProcent: artikel.avdragProcent,
          arbetskostnadExMoms: artikel.arbetskostnadExMoms,
        });
      }

      setToast({
        message: `Favoritartikel "${artikel.beskrivning}" inladdad! 📌`,
        type: "success",
      });
    },
    [setNyArtikel, setProdukterTjansterState, setFormData, setToast]
  );

  // =============================================================================
  // ROT/RUT EVENT HANDLERS
  // =============================================================================

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
          setFormData({ [key]: value });
        });
        return;
      }

      if (name === "rotRutTyp") {
        const procent = value === "ROT" ? 50 : value === "RUT" ? 50 : undefined;
        const isActive = value === "ROT" || value === "RUT";

        setFormData({
          rotRutAktiverat: isActive,
          rotRutTyp: isActive ? (value as "ROT" | "RUT") : undefined,
          avdragProcent: procent,
          rotRutKategori: undefined,
        });
        return;
      }

      // Vanlig uppdatering av enskilt fält
      setFormData({ [name]: finalValue });
    },
    [setFormData, sanitizeRotRutInput]
  );

  const handleRotRutBoendeTypChange = useCallback(
    (typ: "fastighet" | "brf") => {
      setFormData({ rotBoendeTyp: typ });
    },
    [setFormData]
  );

  const handleRotRutDateChange = useCallback(
    (field: string, date: Date | null) => {
      if (date) {
        const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        setFormData({ [field]: dateString });
      }
    },
    [setFormData]
  );

  // =============================================================================
  // STATE SETTERS
  // =============================================================================

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

  const setVisaArtikelModal = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ visaArtikelModal: value });
    },
    [setProdukterTjansterState]
  );

  const setRedigerarIndex = useCallback(
    (value: number | null) => {
      setProdukterTjansterState({ redigerarIndex: value });
    },
    [setProdukterTjansterState]
  );

  const setFavoritArtikelVald = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ favoritArtikelVald: value });
    },
    [setProdukterTjansterState]
  );

  const setUrsprungligFavoritId = useCallback(
    (value: number | null) => {
      setProdukterTjansterState({ ursprungligFavoritId: value });
    },
    [setProdukterTjansterState]
  );

  const setArtikelSparadSomFavorit = useCallback(
    (value: boolean) => {
      setProdukterTjansterState({ artikelSparadSomFavorit: value });
    },
    [setProdukterTjansterState]
  );

  const setValtArtikel = useCallback(
    (value: any) => {
      setProdukterTjansterState({ valtArtikel: value });
    },
    [setProdukterTjansterState]
  );

  const setBlinkIndex = useCallback(
    (value: number | null) => {
      setProdukterTjansterState({ blinkIndex: value });
    },
    [setProdukterTjansterState]
  );

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  const updateArtikel = useCallback(
    (updates: Partial<NyArtikel>) => {
      setNyArtikel(updates);
    },
    [setNyArtikel]
  );

  // Artikel setters för nyArtikel state
  const setBeskrivning = useCallback(
    (value: string) => updateArtikel({ beskrivning: value }),
    [updateArtikel]
  );
  const setAntal = useCallback(
    (value: number) => updateArtikel({ antal: value.toString() }),
    [updateArtikel]
  );
  const setPrisPerEnhet = useCallback(
    (value: number) => updateArtikel({ prisPerEnhet: value.toString() }),
    [updateArtikel]
  );
  const setMoms = useCallback(
    (value: number) => updateArtikel({ moms: value.toString() }),
    [updateArtikel]
  );
  const setValuta = useCallback(
    (value: string) => updateArtikel({ valuta: value }),
    [updateArtikel]
  );
  const setTyp = useCallback(
    (value: "vara" | "tjänst") => updateArtikel({ typ: value }),
    [updateArtikel]
  );

  // =============================================================================
  // RETURN OBJECT
  // =============================================================================

  return {
    // State from produkterTjansterState
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

    // nyArtikel state
    nyArtikel,

    // ROT/RUT constants
    RUT_KATEGORIER,
    ROT_KATEGORIER,

    // ROT/RUT utility functions
    sanitizeRotRutInput,
    validateRotRutNumeric,
    validatePersonnummerRotRut,

    // Artikel functions
    laddaSparadeArtiklar,
    läggTillArtikel,
    taBortArtikel,
    sparaArtikelSomFavorit,
    taBortFavoritArtikel,
    laddaFavoritArtikel,

    // ROT/RUT event handlers
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,

    // State setters
    setShowFavoritArtiklar,
    setVisaRotRutForm,
    setVisaArtikelForm,
    setVisaArtikelModal,
    setRedigerarIndex,
    setFavoritArtikelVald,
    setUrsprungligFavoritId,
    setArtikelSparadSomFavorit,
    setValtArtikel,
    setBlinkIndex,

    // Artikel setters för nyArtikel state
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    updateArtikel,
  };
}

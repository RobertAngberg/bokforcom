"use client";

import { useCallback } from "react";
import { showToast } from "../../../_components/Toast";
import { useFakturaArtikelContext } from "../../context/hooks/FakturaArtikelContext";
import { useFakturaForm, useFakturaFormActions } from "../../context/hooks/FakturaFormContext";
import type { Artikel, NyArtikel } from "../../types/types";

export function useArtikelForm() {
  const { state, setState, setNyArtikel, resetNyArtikel } = useFakturaArtikelContext();
  const formData = useFakturaForm();
  const { setFormData } = useFakturaFormActions();

  const läggTillArtikel = useCallback(() => {
    const {
      beskrivning,
      antal,
      prisPerEnhet,
      moms,
      valuta,
      typ,
      rotRutArbete: nyArtikelRotRutArbete,
      rotRutMaterial: nyArtikelRotRutMaterial,
    } = state.nyArtikel;

    const artiklar = formData.artiklar ?? [];

    if (!beskrivning?.trim() || !antal?.toString().trim() || !prisPerEnhet?.toString().trim()) {
      showToast("Fyll i alla obligatoriska fält", "error");
      return;
    }

    const parsedAntal = parseFloat(antal);
    const parsedPris = parseFloat(prisPerEnhet);
    const parsedMoms = parseFloat(moms);

    if ([parsedAntal, parsedPris, parsedMoms].some((value) => Number.isNaN(value))) {
      showToast("Kontrollera att antal, pris och moms är giltiga siffror", "error");
      return;
    }

    const aktivRotRutTyp = formData.rotRutTyp;
    const rotRutAktiv = Boolean(
      state.visaRotRutForm &&
        aktivRotRutTyp &&
        (aktivRotRutTyp === "ROT" || aktivRotRutTyp === "RUT")
    );

    const startdatum = (formData.rotRutStartdatum || "").toString().trim();
    const slutdatum = (formData.rotRutSlutdatum || "").toString().trim();
    const personnummer = (formData.personnummer || "").toString().trim();
    const fastighetsbeteckning = (formData.fastighetsbeteckning || "").toString().trim();
    const brfOrg = (formData.brfOrganisationsnummer || "").toString().trim();
    const brfLgh = (formData.brfLagenhetsnummer || "").toString().trim();

    const rotRutArbeteFlag = typ === "tjänst" ? (nyArtikelRotRutArbete ?? true) : false;
    const rotRutMaterialFlag = typ === "vara" ? Boolean(nyArtikelRotRutMaterial) : false;

    const rotRutAktivaFält: Partial<Artikel> = rotRutAktiv
      ? {
          rotRutTyp: aktivRotRutTyp as "ROT" | "RUT",
          rotRutKategori: formData.rotRutKategori || undefined,
          rotRutBeskrivning: formData.rotRutBeskrivning || undefined,
          rotRutStartdatum: startdatum || undefined,
          rotRutSlutdatum: slutdatum || undefined,
          rotRutPersonnummer: personnummer || undefined,
          rotRutBoendeTyp: formData.rotBoendeTyp || undefined,
          rotRutFastighetsbeteckning:
            formData.rotBoendeTyp === "brf" ? undefined : fastighetsbeteckning || undefined,
          rotRutBrfOrg: formData.rotBoendeTyp === "brf" ? brfOrg || undefined : undefined,
          rotRutBrfLagenhet: formData.rotBoendeTyp === "brf" ? brfLgh || undefined : undefined,
          rotRutArbete: rotRutArbeteFlag,
          rotRutMaterial: rotRutMaterialFlag,
        }
      : {};

    const rotRutInaktivaFält: Partial<Artikel> = rotRutAktiv
      ? {}
      : {
          rotRutTyp: undefined,
          rotRutKategori: undefined,
          rotRutBeskrivning: undefined,
          rotRutStartdatum: undefined,
          rotRutSlutdatum: undefined,
          rotRutPersonnummer: undefined,
          rotRutBoendeTyp: undefined,
          rotRutFastighetsbeteckning: undefined,
          rotRutBrfOrg: undefined,
          rotRutBrfLagenhet: undefined,
          rotRutArbete: false,
          rotRutMaterial: false,
        };

    if (state.redigerarIndex !== null) {
      const index = state.redigerarIndex;
      const tidigareArtikel = artiklar[index];

      if (!tidigareArtikel) {
        showToast("Kunde inte hitta artikeln att uppdatera", "error");
        return;
      }

      const uppdateradArtikel: Artikel = {
        ...tidigareArtikel,
        beskrivning: beskrivning.trim(),
        antal: parsedAntal,
        prisPerEnhet: parsedPris,
        moms: parsedMoms,
        valuta,
        typ,
        ursprungligFavoritId: tidigareArtikel.ursprungligFavoritId,
        ...(rotRutAktiv ? rotRutAktivaFält : rotRutInaktivaFält),
        rotRutArbete: rotRutAktiv ? rotRutArbeteFlag : false,
        rotRutMaterial: rotRutAktiv ? rotRutMaterialFlag : false,
      };

      const uppdateradeArtiklar = artiklar.map((artikel, idx) =>
        idx === index ? uppdateradArtikel : artikel
      );

      const firstRotRutArtikel = uppdateradeArtiklar.find((rad) => Boolean(rad.rotRutTyp));
      const harRotRutEfter = Boolean(firstRotRutArtikel);

      setFormData({
        artiklar: uppdateradeArtiklar,
        rotRutAktiverat: harRotRutEfter,
        rotRutTyp: firstRotRutArtikel?.rotRutTyp,
        rotRutKategori: firstRotRutArtikel?.rotRutKategori,
        rotRutBeskrivning: firstRotRutArtikel?.rotRutBeskrivning,
        rotRutStartdatum: firstRotRutArtikel?.rotRutStartdatum,
        rotRutSlutdatum: firstRotRutArtikel?.rotRutSlutdatum,
        personnummer: firstRotRutArtikel?.rotRutPersonnummer,
        rotBoendeTyp: firstRotRutArtikel?.rotRutBoendeTyp as "fastighet" | "brf" | undefined,
        fastighetsbeteckning: firstRotRutArtikel?.rotRutFastighetsbeteckning,
        brfOrganisationsnummer: firstRotRutArtikel?.rotRutBrfOrg,
        brfLagenhetsnummer: firstRotRutArtikel?.rotRutBrfLagenhet,
      });
      resetNyArtikel();
      setState({
        redigerarIndex: null,
        favoritArtikelVald: false,
        ursprungligFavoritId: null,
        artikelSparadSomFavorit: false,
        blinkIndex: index,
        visaRotRutForm: false,
      });
      showToast("Artikel uppdaterad", "success");
      return;
    }

    const nyArtikelData: Artikel = {
      beskrivning: beskrivning.trim(),
      antal: parsedAntal,
      prisPerEnhet: parsedPris,
      moms: parsedMoms,
      valuta,
      typ,
      ursprungligFavoritId: state.ursprungligFavoritId ?? undefined,
      ...rotRutAktivaFält,
      rotRutArbete: rotRutAktiv ? rotRutArbeteFlag : false,
      rotRutMaterial: rotRutAktiv ? rotRutMaterialFlag : false,
    };

    const uppdateradeArtiklar = [...artiklar, nyArtikelData];
    const firstRotRutArtikel = uppdateradeArtiklar.find((rad) => Boolean(rad.rotRutTyp));
    const harRotRutEfter = Boolean(firstRotRutArtikel);

    setFormData({
      artiklar: uppdateradeArtiklar,
      rotRutAktiverat: harRotRutEfter,
      rotRutTyp: firstRotRutArtikel?.rotRutTyp,
      rotRutKategori: firstRotRutArtikel?.rotRutKategori,
      rotRutBeskrivning: firstRotRutArtikel?.rotRutBeskrivning,
      rotRutStartdatum: firstRotRutArtikel?.rotRutStartdatum,
      rotRutSlutdatum: firstRotRutArtikel?.rotRutSlutdatum,
      personnummer: firstRotRutArtikel?.rotRutPersonnummer,
      rotBoendeTyp: firstRotRutArtikel?.rotRutBoendeTyp as "fastighet" | "brf" | undefined,
      fastighetsbeteckning: firstRotRutArtikel?.rotRutFastighetsbeteckning,
      brfOrganisationsnummer: firstRotRutArtikel?.rotRutBrfOrg,
      brfLagenhetsnummer: firstRotRutArtikel?.rotRutBrfLagenhet,
    });
    resetNyArtikel();
    setState({
      visaArtikelForm: false,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
      artikelSparadSomFavorit: false,
      blinkIndex: uppdateradeArtiklar.length - 1,
      visaRotRutForm: false,
    });
    showToast("Artikel tillagd", "success");
  }, [
    state.nyArtikel,
    state.redigerarIndex,
    state.ursprungligFavoritId,
    state.visaRotRutForm,
    formData,
    setFormData,
    resetNyArtikel,
    setState,
  ]);

  const startRedigeraArtikel = useCallback(
    (artikel: Artikel, index: number) => {
      setNyArtikel({
        beskrivning: artikel.beskrivning ?? "",
        antal: artikel.antal?.toString() ?? "",
        prisPerEnhet: artikel.prisPerEnhet?.toString() ?? "",
        moms: artikel.moms?.toString() ?? "",
        valuta: artikel.valuta ?? "SEK",
        typ: artikel.typ ?? "tjänst",
        rotRutArbete:
          artikel.typ === "tjänst"
            ? (artikel.rotRutArbete ?? true)
            : (artikel.rotRutArbete ?? false),
        rotRutMaterial: artikel.rotRutMaterial ?? false,
      });

      const rotRutAktiv = Boolean(artikel.rotRutTyp);

      setFormData({
        rotRutAktiverat: rotRutAktiv,
        rotRutTyp: artikel.rotRutTyp,
        rotRutKategori: artikel.rotRutKategori,
        rotRutBeskrivning: artikel.rotRutBeskrivning,
        rotRutStartdatum: artikel.rotRutStartdatum,
        rotRutSlutdatum: artikel.rotRutSlutdatum,
        personnummer: artikel.rotRutPersonnummer,
        rotBoendeTyp: artikel.rotRutBoendeTyp as "fastighet" | "brf" | undefined,
        fastighetsbeteckning: artikel.rotRutFastighetsbeteckning,
        brfOrganisationsnummer: artikel.rotRutBrfOrg,
        brfLagenhetsnummer: artikel.rotRutBrfLagenhet,
      });

      setState({
        redigerarIndex: index,
        visaArtikelForm: false,
        favoritArtikelVald: false,
        artikelSparadSomFavorit: false,
        ursprungligFavoritId: artikel.ursprungligFavoritId ?? null,
        visaRotRutForm: rotRutAktiv,
      });
    },
    [setNyArtikel, setFormData, setState]
  );

  const avbrytRedigering = useCallback(() => {
    resetNyArtikel();
    setState({
      redigerarIndex: null,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
      artikelSparadSomFavorit: false,
      visaRotRutForm: false,
    });
  }, [resetNyArtikel, setState]);

  const taBortArtikel = useCallback(
    (index: number) => {
      const artiklar = formData.artiklar ?? [];
      const uppdateradeArtiklar = artiklar.filter((_, i) => i !== index);
      setFormData({ artiklar: uppdateradeArtiklar });
      setState({ blinkIndex: null });
      showToast("Artikel borttagen", "success");
    },
    [formData.artiklar, setFormData, setState]
  );

  const uppdateraArtikelRotRutArbete = useCallback(
    (index: number, checked: boolean) => {
      const aktuellaArtiklar = formData.artiklar ?? [];
      if (!aktuellaArtiklar[index]) {
        return;
      }

      const uppdateradeArtiklar = aktuellaArtiklar.map((artikel, idx) => {
        if (idx !== index) {
          return artikel;
        }

        const uppdaterad: Artikel = {
          ...artikel,
          rotRutArbete: checked,
          rotRutMaterial: checked ? false : artikel.rotRutMaterial,
        };

        return uppdaterad;
      });

      setFormData({ artiklar: uppdateradeArtiklar });
    },
    [formData.artiklar, setFormData]
  );

  const uppdateraArtikelRotRutMaterial = useCallback(
    (index: number, checked: boolean) => {
      const aktuellaArtiklar = formData.artiklar ?? [];
      if (!aktuellaArtiklar[index]) {
        return;
      }

      const uppdateradeArtiklar = aktuellaArtiklar.map((artikel, idx) => {
        if (idx !== index) {
          return artikel;
        }

        const uppdaterad: Artikel = {
          ...artikel,
          rotRutMaterial: checked,
          rotRutArbete: checked ? false : artikel.rotRutArbete,
        };

        return uppdaterad;
      });

      setFormData({ artiklar: uppdateradeArtiklar });
    },
    [formData.artiklar, setFormData]
  );

  const updateArtikel = useCallback(
    (updates: Partial<NyArtikel>) => {
      setNyArtikel(updates);
    },
    [setNyArtikel]
  );

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
    (value: "vara" | "tjänst") => {
      const updates: Partial<NyArtikel> = {
        typ: value,
        rotRutArbete: value === "tjänst" ? (state.nyArtikel.rotRutArbete ?? true) : false,
        rotRutMaterial: value === "vara" ? (state.nyArtikel.rotRutMaterial ?? false) : false,
      };
      setNyArtikel(updates);
    },
    [setNyArtikel, state.nyArtikel.rotRutArbete, state.nyArtikel.rotRutMaterial]
  );

  const setRotRutArbete = useCallback(
    (value: boolean) => updateArtikel({ rotRutArbete: value }),
    [updateArtikel]
  );

  const setRotRutMaterial = useCallback(
    (value: boolean) => updateArtikel({ rotRutMaterial: value }),
    [updateArtikel]
  );

  return {
    nyArtikel: state.nyArtikel,
    redigerarIndex: state.redigerarIndex,
    visaArtikelForm: state.visaArtikelForm,
    visaArtikelModal: state.visaArtikelModal,
    favoritArtikelVald: state.favoritArtikelVald,
    ursprungligFavoritId: state.ursprungligFavoritId,
    artikelSparadSomFavorit: state.artikelSparadSomFavorit,
    valtArtikel: state.valtArtikel,
    blinkIndex: state.blinkIndex,
    visaRotRutForm: state.visaRotRutForm,
    läggTillArtikel,
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    uppdateraArtikelRotRutArbete,
    uppdateraArtikelRotRutMaterial,
    updateArtikel,
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,
    resetNyArtikel,
    setVisaArtikelForm: (value: boolean) => setState({ visaArtikelForm: value }),
    setVisaArtikelModal: (value: boolean) => setState({ visaArtikelModal: value }),
    setRedigerarIndex: (value: number | null) => setState({ redigerarIndex: value }),
    setFavoritArtikelVald: (value: boolean) => setState({ favoritArtikelVald: value }),
    setUrsprungligFavoritId: (value: number | null) => setState({ ursprungligFavoritId: value }),
    setArtikelSparadSomFavorit: (value: boolean) => setState({ artikelSparadSomFavorit: value }),
    setValtArtikel: (value: Artikel | null) => setState({ valtArtikel: value }),
    setBlinkIndex: (value: number | null) => setState({ blinkIndex: value }),
    setVisaRotRutForm: (value: boolean) => setState({ visaRotRutForm: value }),
  };
}

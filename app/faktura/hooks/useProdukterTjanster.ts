"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";

import { dateToYyyyMmDd } from "../../_utils/datum";

import { useFakturaArtikelContext } from "../context/hooks/FakturaArtikelContext";
import {
  useFakturaForm,
  useFakturaFormActions,
  useFakturaLifecycle,
} from "../context/hooks/FakturaFormContext";
import {
  hamtaSparadeArtiklar,
  deleteFavoritArtikel,
  sparaFavoritArtikel,
} from "../actions/artikelActions";
import { showToast } from "../../_components/Toast";
import type { Artikel, FavoritArtikel, FakturaFormData, NyArtikel } from "../types/types";

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

function deriveArtikelMetrics(formData: FakturaFormData) {
  const rows = formData.artiklar ?? [];

  const sumExkl = rows.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const totalMoms = rows.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const sumInkl = sumExkl + totalMoms;

  const ärRotRutArbete = (rad: Artikel) => {
    if (!rad.rotRutTyp) return false;
    if (typeof rad.rotRutArbete === "boolean") {
      return rad.rotRutArbete;
    }
    return rad.typ === "tjänst" && rad.rotRutMaterial !== true;
  };

  const ärRotRutMaterial = (rad: Artikel) => {
    if (!rad.rotRutTyp) return false;
    if (typeof rad.rotRutMaterial === "boolean") {
      return rad.rotRutMaterial;
    }
    return false;
  };

  const rotRutArtiklar = rows.filter((rad) => ärRotRutArbete(rad) || ärRotRutMaterial(rad));
  const harRotRutArtiklar = rotRutArtiklar.length > 0;
  const rotRutAktiverat = Boolean(formData.rotRutAktiverat || harRotRutArtiklar);
  const rotRutTyp = formData.rotRutTyp ?? rotRutArtiklar[0]?.rotRutTyp;

  const rotRutArbeteRader = rotRutArtiklar.filter(ärRotRutArbete);
  const rotRutMaterialRader = rotRutArtiklar.filter(ärRotRutMaterial);

  const rotRutTjänsterSumExkl = rotRutArbeteRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const rotRutTjänsterMoms = rotRutArbeteRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const rotRutTjänsterInklMoms = rotRutTjänsterSumExkl + rotRutTjänsterMoms;

  const rotRutMaterialSumExkl = rotRutMaterialRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    return acc + antal * pris;
  }, 0);

  const rotRutMaterialMoms = rotRutMaterialRader.reduce((acc, rad) => {
    const antal = Number(rad.antal) || 0;
    const pris = Number(rad.prisPerEnhet) || 0;
    const moms = Number(rad.moms) || 0;
    return acc + antal * pris * (moms / 100);
  }, 0);

  const rotRutMaterialInklMoms = rotRutMaterialSumExkl + rotRutMaterialMoms;

  const rotRutAvdrag =
    rotRutAktiverat && (rotRutTyp === "ROT" || rotRutTyp === "RUT")
      ? 0.5 * rotRutTjänsterInklMoms
      : 0;

  const summaAttBetala = Math.max(sumInkl - rotRutAvdrag, 0);

  const rotRutPersonnummer =
    formData.personnummer ||
    rotRutArbeteRader.find((rad) => rad.rotRutPersonnummer)?.rotRutPersonnummer ||
    rotRutMaterialRader.find((rad) => rad.rotRutPersonnummer)?.rotRutPersonnummer ||
    "";

  const rotRutTotalTimmar = rotRutArbeteRader.reduce(
    (sum, rad) => sum + (Number(rad.antal) || 0),
    0
  );

  const rotRutGenomsnittsPris =
    rotRutArbeteRader.length > 0
      ? rotRutArbeteRader.reduce((sum, rad) => sum + (Number(rad.prisPerEnhet) || 0), 0) /
        rotRutArbeteRader.length
      : 0;

  const rotRutAvdragProcent = rotRutTyp === "ROT" || rotRutTyp === "RUT" ? "50%" : "—";

  const shouldShowRotRut = Boolean(rotRutAktiverat && rotRutTyp);

  return {
    artiklar: rows,
    totals: {
      sumExkl,
      totalMoms,
      sumInkl,
      rotRutAvdrag,
      summaAttBetala,
    },
    rotRutSummary: {
      harRotRutArtiklar,
      rotRutTyp,
      rotRutTjänsterSumExkl,
      rotRutTjänsterMoms,
      rotRutTjänsterInklMoms,
      rotRutMaterialSumExkl,
      rotRutMaterialMoms,
      rotRutMaterialInklMoms,
      rotRutAvdrag,
      rotRutPersonnummer,
      rotRutTotalTimmar,
      rotRutGenomsnittsPris,
      rotRutAvdragProcent,
      rotRutArtiklarAntal: rotRutArtiklar.length,
      shouldShowRotRut,
    },
  };
}

export function useProdukterTjanster() {
  const { state, setState, setNyArtikel, resetNyArtikel, setFavoritArtiklar } =
    useFakturaArtikelContext();
  const formData = useFakturaForm();
  const { setFormData } = useFakturaFormActions();
  const lifecycle = useFakturaLifecycle();

  const metrics = useMemo(() => deriveArtikelMetrics(formData), [formData]);
  const artiklar = metrics.artiklar;
  const harBlandadeArtikelTyper =
    artiklar.some((rad) => rad.typ === "vara") && artiklar.some((rad) => rad.typ === "tjänst");

  const laddaSparadeArtiklar = useCallback(async () => {
    try {
      const artiklar = await hamtaSparadeArtiklar();
      setFavoritArtiklar(artiklar || []);
    } catch (error) {
      console.error("Fel vid laddning av artiklar:", error);
      showToast("Kunde inte ladda sparade artiklar", "error");
    }
  }, [setFavoritArtiklar]);

  useEffect(() => {
    if (state.favoritArtiklar.length > 0) {
      return;
    }

    if (lifecycle.current.harLastatFavoritArtiklar) {
      return;
    }

    lifecycle.current.harLastatFavoritArtiklar = true;

    laddaSparadeArtiklar().catch((error) => {
      console.error("[FakturaArtikel] kunde inte ladda favoritartiklar", error);
      lifecycle.current.harLastatFavoritArtiklar = false;
    });
  }, [state.favoritArtiklar.length, laddaSparadeArtiklar, lifecycle]);

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
      (formData.rotRutAktiverat || aktivRotRutTyp) &&
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
          rotRutArbete: undefined,
          rotRutMaterial: undefined,
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

      const harRotRutEfter = uppdateradeArtiklar.some((rad) => Boolean(rad.rotRutTyp));

      setFormData({ artiklar: uppdateradeArtiklar, rotRutAktiverat: harRotRutEfter });
      resetNyArtikel();
      setState({
        redigerarIndex: null,
        favoritArtikelVald: false,
        ursprungligFavoritId: null,
        artikelSparadSomFavorit: false,
        blinkIndex: index,
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
    const harRotRutEfter = uppdateradeArtiklar.some((rad) => Boolean(rad.rotRutTyp));

    setFormData({ artiklar: uppdateradeArtiklar, rotRutAktiverat: harRotRutEfter });
    resetNyArtikel();
    setState({
      visaArtikelForm: false,
      favoritArtikelVald: false,
      ursprungligFavoritId: null,
      artikelSparadSomFavorit: false,
      blinkIndex: uppdateradeArtiklar.length - 1,
    });
    showToast("Artikel tillagd", "success");
  }, [
    state.nyArtikel,
    state.redigerarIndex,
    state.ursprungligFavoritId,
    artiklar,
    setFormData,
    resetNyArtikel,
    setState,
    formData.rotRutAktiverat,
    formData.rotRutTyp,
    formData.rotRutKategori,
    formData.rotRutBeskrivning,
    formData.rotRutStartdatum,
    formData.rotRutSlutdatum,
    formData.personnummer,
    formData.rotBoendeTyp,
    formData.fastighetsbeteckning,
    formData.brfOrganisationsnummer,
    formData.brfLagenhetsnummer,
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
      const uppdateradeArtiklar = artiklar.filter((_, i) => i !== index);
      setFormData({ artiklar: uppdateradeArtiklar });
      setState({ blinkIndex: null });
      showToast("Artikel borttagen", "success");
    },
    [artiklar, setFormData, setState]
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

  const sparaArtikelSomFavorit = useCallback(async () => {
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

    if (!beskrivning || !antal || !prisPerEnhet || Number(prisPerEnhet) <= 0) {
      showToast("Fyll i alla obligatoriska fält", "error");
      return;
    }

    const artikelData: Artikel = {
      beskrivning,
      antal: Number(antal),
      prisPerEnhet: Number(prisPerEnhet),
      moms: Number(moms),
      valuta,
      typ,
      rotRutArbete: Boolean(nyArtikelRotRutArbete ?? typ === "tjänst"),
      rotRutMaterial: Boolean(nyArtikelRotRutMaterial && typ === "vara"),
      rotRutTyp: undefined,
      rotRutKategori: undefined,
      avdragProcent: undefined,
      arbetskostnadExMoms: undefined,
    };

    if (
      formData.rotRutAktiverat &&
      (formData.rotRutTyp === "ROT" || formData.rotRutTyp === "RUT")
    ) {
      artikelData.rotRutTyp = formData.rotRutTyp;
      artikelData.rotRutKategori = formData.rotRutKategori || undefined;
      artikelData.avdragProcent = formData.avdragProcent || undefined;
      artikelData.arbetskostnadExMoms = Number(formData.arbetskostnadExMoms) || undefined;
    }

    try {
      const result = await sparaFavoritArtikel(artikelData);
      if (result.success) {
        const message = `${
          result.alreadyExists
            ? "Artikeln finns redan som favorit! 📌"
            : "Artikel sparad som favorit! 📌"
        }\nDu måste fortfarande klicka på knappen ✚ Lägg till artikel.`;

        showToast(message, result.alreadyExists ? "info" : "success");
        setState({ artikelSparadSomFavorit: true });
        await laddaSparadeArtiklar();
      } else {
        showToast("Kunde inte spara som favorit", "error");
      }
    } catch (error) {
      console.error("Fel vid sparande av favoritartikel", error);
      showToast("Fel vid sparande av favorit", "error");
    }
  }, [state.nyArtikel, formData, setState, laddaSparadeArtiklar]);

  const taBortFavoritArtikel = useCallback(
    (id: number) => {
      setState({ deleteFavoritId: id, showDeleteFavoritModal: true });
    },
    [setState]
  );

  const confirmDeleteFavorit = useCallback(async () => {
    if (!state.deleteFavoritId) return;

    setState({ showDeleteFavoritModal: false });

    try {
      const result = await deleteFavoritArtikel(state.deleteFavoritId);
      if (result.success) {
        showToast("Favoritartikel borttagen! 🗑️", "success");
        await laddaSparadeArtiklar();
      } else {
        showToast("Kunde inte ta bort favoritartikel", "error");
      }
    } catch (error) {
      console.error("Fel vid borttagning av favoritartikel", error);
      showToast("Fel vid borttagning av favoritartikel", "error");
    } finally {
      setState({ deleteFavoritId: null });
    }
  }, [state.deleteFavoritId, laddaSparadeArtiklar, setState]);

  const laddaFavoritArtikel = useCallback(
    (artikel: FavoritArtikel) => {
      const nyArtikelData: Artikel = {
        beskrivning: artikel.beskrivning || "",
        antal: artikel.antal || 1,
        prisPerEnhet: artikel.prisPerEnhet || 0,
        moms: artikel.moms || 25,
        valuta: artikel.valuta || "SEK",
        typ: artikel.typ || "vara",
        ursprungligFavoritId: artikel.id,
        rotRutArbete: artikel.rotRutArbete ?? artikel.typ === "tjänst",
        rotRutMaterial: artikel.rotRutMaterial ?? false,
      };

      if (artikel.rotRutTyp) {
        nyArtikelData.rotRutTyp = artikel.rotRutTyp as "ROT" | "RUT";
        nyArtikelData.rotRutKategori = artikel.rotRutKategori || undefined;
        nyArtikelData.rotRutMaterial = artikel.rotRutMaterial ?? undefined;
        nyArtikelData.rotRutBeskrivning = artikel.rotRutBeskrivning || undefined;
        nyArtikelData.rotRutStartdatum = artikel.rotRutStartdatum
          ? typeof artikel.rotRutStartdatum === "string"
            ? artikel.rotRutStartdatum
            : dateToYyyyMmDd(artikel.rotRutStartdatum)
          : undefined;
        nyArtikelData.rotRutSlutdatum = artikel.rotRutSlutdatum
          ? typeof artikel.rotRutSlutdatum === "string"
            ? artikel.rotRutSlutdatum
            : dateToYyyyMmDd(artikel.rotRutSlutdatum)
          : undefined;
        nyArtikelData.rotRutPersonnummer = artikel.rotRutPersonnummer || undefined;
        nyArtikelData.rotRutBoendeTyp = artikel.rotRutBoendeTyp || undefined;
        nyArtikelData.rotRutFastighetsbeteckning = artikel.rotRutFastighetsbeteckning || undefined;
        nyArtikelData.rotRutBrfOrg = artikel.rotRutBrfOrg || undefined;
        nyArtikelData.rotRutBrfLagenhet = artikel.rotRutBrfLagenhet || undefined;
      }

      const uppdateradeArtiklar = [...artiklar, nyArtikelData];
      setFormData({ artiklar: uppdateradeArtiklar });

      if (artikel.rotRutTyp) {
        setFormData({
          rotRutAktiverat: true,
          rotRutTyp: artikel.rotRutTyp,
          rotRutKategori: artikel.rotRutKategori,
          avdragProcent: artikel.avdragProcent,
          arbetskostnadExMoms: artikel.arbetskostnadExMoms,
        });
      }

      setState({ blinkIndex: uppdateradeArtiklar.length - 1 });
      showToast(`Favoritartikel "${artikel.beskrivning}" tillagd! 📌`, "success");
    },
    [artiklar, setFormData, setState]
  );

  const handleRotRutChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let finalValue: string | boolean = value;

      if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
        finalValue = e.target.checked;
      }

      if (name === "rotRutAktiverat" && finalValue === false) {
        setFormData({
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
        });
        return;
      }

      if (name === "rotRutTyp") {
        const procent = value === "ROT" || value === "RUT" ? 50 : undefined;
        const isActive = value === "ROT" || value === "RUT";

        setFormData({
          rotRutAktiverat: isActive,
          rotRutTyp: isActive ? (value as "ROT" | "RUT") : undefined,
          avdragProcent: procent,
          rotRutKategori: undefined,
        });
        return;
      }

      setFormData({ [name]: finalValue });
    },
    [setFormData]
  );

  const handleRotRutBoendeTypChange = useCallback(
    (typ: "fastighet" | "brf") => {
      setFormData({ rotBoendeTyp: typ });
    },
    [setFormData]
  );

  const handleRotRutDateChange = useCallback(
    (field: string, date: Date | null) => {
      setFormData({ [field]: date ? dateToYyyyMmDd(date) : undefined });
    },
    [setFormData]
  );

  const setShowFavoritArtiklar = useCallback(
    (value: boolean) => {
      setState({ showFavoritArtiklar: value });
    },
    [setState]
  );

  const setVisaRotRutForm = useCallback(
    (value: boolean) => {
      setState({ visaRotRutForm: value });
    },
    [setState]
  );

  const setVisaArtikelForm = useCallback(
    (value: boolean) => {
      setState({ visaArtikelForm: value });
    },
    [setState]
  );

  const setVisaArtikelModal = useCallback(
    (value: boolean) => {
      setState({ visaArtikelModal: value });
    },
    [setState]
  );

  const setRedigerarIndex = useCallback(
    (value: number | null) => {
      setState({ redigerarIndex: value });
    },
    [setState]
  );

  const setFavoritArtikelVald = useCallback(
    (value: boolean) => {
      setState({ favoritArtikelVald: value });
    },
    [setState]
  );

  const setUrsprungligFavoritId = useCallback(
    (value: number | null) => {
      setState({ ursprungligFavoritId: value });
    },
    [setState]
  );

  const setArtikelSparadSomFavorit = useCallback(
    (value: boolean) => {
      setState({ artikelSparadSomFavorit: value });
    },
    [setState]
  );

  const setValtArtikel = useCallback(
    (value: FavoritArtikel | null) => {
      setState({ valtArtikel: value });
    },
    [setState]
  );

  const setBlinkIndex = useCallback(
    (value: number | null) => {
      setState({ blinkIndex: value });
    },
    [setState]
  );

  const setShowDeleteFavoritModal = useCallback(
    (value: boolean) => {
      setState({
        showDeleteFavoritModal: value,
        deleteFavoritId: value ? state.deleteFavoritId : null,
      });
    },
    [setState, state.deleteFavoritId]
  );

  const setDeleteFavoritId = useCallback(
    (value: number | null) => {
      setState({ deleteFavoritId: value });
    },
    [setState]
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
    // State
    favoritArtiklar: state.favoritArtiklar,
    showFavoritArtiklar: state.showFavoritArtiklar,
    blinkIndex: state.blinkIndex,
    visaRotRutForm: state.visaRotRutForm,
    visaArtikelForm: state.visaArtikelForm,
    visaArtikelModal: state.visaArtikelModal,
    redigerarIndex: state.redigerarIndex,
    favoritArtikelVald: state.favoritArtikelVald,
    ursprungligFavoritId: state.ursprungligFavoritId,
    artikelSparadSomFavorit: state.artikelSparadSomFavorit,
    valtArtikel: state.valtArtikel,
    showDeleteFavoritModal: state.showDeleteFavoritModal,
    deleteFavoritId: state.deleteFavoritId,
    nyArtikel: state.nyArtikel,

    // Derived
    artiklar,
    harArtiklar: artiklar.length > 0,
    totals: metrics.totals,
    rotRutSummary: metrics.rotRutSummary,
    standardValuta: artiklar[0]?.valuta ?? "SEK",
    harBlandadeArtikelTyper,

    // Constants
    RUT_KATEGORIER,
    ROT_KATEGORIER,

    // Utils
    // Actions
    laddaSparadeArtiklar,
    läggTillArtikel,
    startRedigeraArtikel,
    avbrytRedigering,
    taBortArtikel,
    sparaArtikelSomFavorit,
    taBortFavoritArtikel,
    confirmDeleteFavorit,
    laddaFavoritArtikel,
    handleRotRutChange,
    handleRotRutBoendeTypChange,
    handleRotRutDateChange,
    uppdateraArtikelRotRutArbete,
    uppdateraArtikelRotRutMaterial,

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
    setShowDeleteFavoritModal,
    setDeleteFavoritId,

    // Artikel setters
    setBeskrivning,
    setAntal,
    setPrisPerEnhet,
    setMoms,
    setValuta,
    setTyp,
    setRotRutArbete,
    setRotRutMaterial,
    updateArtikel,
    resetNyArtikel,
  };
}

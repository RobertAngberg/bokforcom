"use client";

import { useCallback, useEffect } from "react";
import { showToast } from "../../../_components/Toast";
import {
  hamtaSparadeArtiklar,
  deleteFavoritArtikel,
  sparaFavoritArtikel,
} from "../../actions/artikelActions";
import type { Artikel, FavoritArtikel } from "../../types/types";
import { useFakturaArtikelContext } from "../../context/hooks/FakturaArtikelContext";
import { useFakturaFormActions, useFakturaLifecycle } from "../../context/hooks/FakturaFormContext";
import { dateToYyyyMmDd } from "../../../_utils/datum";

export function useFavoritArtiklar() {
  const { state, setState, setFavoritArtiklar } = useFakturaArtikelContext();
  const { setFormData } = useFakturaFormActions();
  const lifecycle = useFakturaLifecycle();

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

  const sparaArtikelSomFavorit = useCallback(
    async (
      nyArtikel: {
        beskrivning: string;
        antal: string;
        prisPerEnhet: string;
        moms: string;
        valuta: string;
        typ: "vara" | "tjänst";
        rotRutArbete?: boolean;
        rotRutMaterial?: boolean;
      },
      formData: {
        rotRutTyp?: string;
        rotRutKategori?: string;
        avdragProcent?: number;
        arbetskostnadExMoms?: number;
      },
      visaRotRutForm: boolean
    ) => {
      const { beskrivning, antal, prisPerEnhet, moms, valuta, typ, rotRutArbete, rotRutMaterial } =
        nyArtikel;

      if (!beskrivning || !antal || !prisPerEnhet || Number(prisPerEnhet) <= 0) {
        showToast("Fyll i alla obligatoriska fält", "error");
        return;
      }

      const rotRutTyp =
        formData.rotRutTyp && (formData.rotRutTyp === "ROT" || formData.rotRutTyp === "RUT")
          ? formData.rotRutTyp
          : undefined;

      const rotRutAktivFörNyArtikel = Boolean(visaRotRutForm && rotRutTyp);

      const artikelData: Artikel = {
        beskrivning,
        antal: Number(antal),
        prisPerEnhet: Number(prisPerEnhet),
        moms: Number(moms),
        valuta,
        typ,
        rotRutArbete: rotRutAktivFörNyArtikel ? Boolean(rotRutArbete ?? typ === "tjänst") : false,
        rotRutMaterial: rotRutAktivFörNyArtikel ? Boolean(rotRutMaterial && typ === "vara") : false,
        rotRutTyp: undefined,
        rotRutKategori: undefined,
        avdragProcent: undefined,
        arbetskostnadExMoms: undefined,
      };

      if (rotRutAktivFörNyArtikel && rotRutTyp) {
        artikelData.rotRutTyp = rotRutTyp as "ROT" | "RUT";
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
    },
    [setState, laddaSparadeArtiklar]
  );

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
    (artikel: FavoritArtikel, artiklar: Artikel[]) => {
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
    [setFormData, setState]
  );

  return {
    favoritArtiklar: state.favoritArtiklar,
    showFavoritArtiklar: state.showFavoritArtiklar,
    showDeleteFavoritModal: state.showDeleteFavoritModal,
    deleteFavoritId: state.deleteFavoritId,
    laddaSparadeArtiklar,
    sparaArtikelSomFavorit,
    taBortFavoritArtikel,
    confirmDeleteFavorit,
    laddaFavoritArtikel,
    setShowFavoritArtiklar: (value: boolean) => setState({ showFavoritArtiklar: value }),
    setShowDeleteFavoritModal: (value: boolean) =>
      setState({
        showDeleteFavoritModal: value,
        deleteFavoritId: value ? state.deleteFavoritId : null,
      }),
  };
}

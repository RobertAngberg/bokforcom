// Det här är den “globala ryggsäcken” för hela fakturaflödet – alla får samma state och actions härifrån.
// Hookarna i filen är enkla genvägar som gör att komponenter kan läsa och uppdatera fakturadatat utan krångel.

"use client";

import { useContext } from "react";
import { useFakturaForm, useFakturaFormActions } from "./FakturaFormContext";
import { FakturaContext, FakturaInitialDataContext } from "../defaults/FakturaDefaults";

// Använd den här hooken när du vill komma åt hela fakturastatet direkt från contexten.
export function useFakturaContext() {
  const context = useContext(FakturaContext);
  if (!context) {
    throw new Error("useFakturaContext must be used within a FakturaProvider");
  }

  return context;
}

// Ger dig både formulärdata och alla actions utan att du behöver plocka ihop dem själv.
export function useFakturaClient() {
  const context = useFakturaContext();
  const formData = useFakturaForm();
  const { setFormData, resetFormData } = useFakturaFormActions();

  return {
    formData,
    kundStatus: context.state.kundStatus,
    userSettings: context.state.userSettings,
    navigationState: context.state.navigationState,
    setFormData,
    resetFormData,
    setKundStatus: context.setKundStatus,
    resetKund: context.resetKund,
    setBokföringsmetod: context.setBokföringsmetod,
    navigateToView: context.navigateToView,
    navigateToEdit: context.navigateToEdit,
    navigateBack: context.navigateBack,
    setNavigation: context.setNavigation,
  };
}

// Hämtar serverns startdata (om någon finns) så du kan använda den i dina komponenter.
export function useFakturaInitialData() {
  return useContext(FakturaInitialDataContext);
}

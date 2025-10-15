"use client";

/**
 * Översikt:
 * - Den här filen sätter upp FakturaContext, som håller koll på övergripande UI-state
 *   (kundstatus, vilken vy som visas, vald bokföringsmetod osv).
 * - `FakturaProvider` wrappar barnen med tre lager: formulärkontext, artikelkontext och slutligen fakturakontexten här.
 * - Reducern `fakturaReducer` beskriver exakt hur state förändras när actions dispatchas.
 * - `FakturaStateProvider` skapar helper-funktioner (navigate, setKundStatus m.m.), memoiserar värdet och matar in i context.
 * - `useFakturaContext` / `useFakturaClient` är hjälphooks för att konsumera värden/åtgärder inne i komponenterna.
 * Så: lägg till `FakturaProvider` högst upp i sidan, och använd helper-hooks för att läsa/uppdatera fakturaflödet.
 */

import { createContext, useContext, useMemo, useReducer } from "react";
import type {
  FakturaContextType,
  FakturaProviderProps,
  FakturaContextInnerProps,
  ServerData,
} from "../types/types";
import { FakturaFormProvider, useFakturaForm, useFakturaFormActions } from "./FakturaFormContext";
import { FakturaArtikelProvider } from "./FakturaArtikelContext";
import { fakturaReducer, initialFakturaState } from "./fakturaReducer";
import { useFakturaActions } from "./useFakturaActions";

const FakturaContext = createContext<FakturaContextType | undefined>(undefined);
const FakturaInitialDataContext = createContext<ServerData | null>(null);

// Wrapper som instansierar reducer, helper-actions och exponerar context-värdet
function FakturaStateProvider({ children }: FakturaContextInnerProps) {
  const [state, dispatch] = useReducer(fakturaReducer, initialFakturaState);
  const actions = useFakturaActions(dispatch);

  const contextValue: FakturaContextType = useMemo(
    () => ({
      state,
      dispatch,
      ...actions,
    }),
    [state, dispatch, actions]
  );

  return <FakturaContext.Provider value={contextValue}>{children}</FakturaContext.Provider>;
}

// Huvudprovider som komponerar formulär-, artikel- och fakturacontexten
export function FakturaProvider({ children, initialData }: FakturaProviderProps) {
  return (
    <FakturaInitialDataContext.Provider value={initialData ?? null}>
      <FakturaFormProvider initialData={initialData}>
        <FakturaArtikelProvider initialFavoritArtiklar={initialData?.artiklar}>
          <FakturaStateProvider>{children}</FakturaStateProvider>
        </FakturaArtikelProvider>
      </FakturaFormProvider>
    </FakturaInitialDataContext.Provider>
  );
}

// Hook för att komma åt FakturaContext och garantera att provider finns
export function useFakturaContext() {
  const context = useContext(FakturaContext);
  if (!context) {
    throw new Error("useFakturaContext must be used within a FakturaProvider");
  }
  return context;
}

// Hjälphook som kapslar formulärdata ihop med fakturaåtgärder för komponenterna
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

export function useFakturaInitialData() {
  return useContext(FakturaInitialDataContext);
}

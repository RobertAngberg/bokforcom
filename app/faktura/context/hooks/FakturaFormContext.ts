// Här bygger vi upp en liten “butik” där formulärvärdena ligger och kan prenumereras på.
// Hookarna låter dig plocka ut hela formuläret eller bara ett fält utan att du behöver röra låg-nivå-API:er.

"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type {
  FakturaFormContextValue,
  FakturaFormData,
  FakturaFormSelector,
} from "../../types/types";

export const FakturaFormContext = createContext<FakturaFormContextValue | null>(null);

// Hämtar själva context-objektet och slår larm om du glömt lägga till providern.
export function useFakturaFormContextValue(): FakturaFormContextValue {
  const context = useContext(FakturaFormContext);
  if (!context) {
    throw new Error("useFakturaFormContext must be used within a FakturaFormProvider");
  }

  return context;
}

// Prenumererar på hela formulärstate så du alltid får en färsk kopia.
export function useFakturaForm(): FakturaFormData {
  const { subscribe, getSnapshot } = useFakturaFormContextValue();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Låter dig lyfta ut en liten bit av state utan att allt rerenderas i onödan.
export function useFakturaFormSelector<T>(selector: FakturaFormSelector<T>): T {
  const { subscribe, getSnapshot } = useFakturaFormContextValue();
  const getSelectedSnapshot = useCallback(() => selector(getSnapshot()), [selector, getSnapshot]);
  return useSyncExternalStore(subscribe, getSelectedSnapshot, getSelectedSnapshot);
}

// Snabbgenväg om du bara behöver ett enskilt formulärfält.
export function useFakturaFormField<K extends keyof FakturaFormData>(field: K): FakturaFormData[K] {
  return useFakturaFormSelector((state) => state[field]);
}

// Ger dig funktionerna för att uppdatera, återställa och hydrera formuläret.
export function useFakturaFormActions() {
  const { setFormData, resetFormData, hydrateFromServer } = useFakturaFormContextValue();
  return { setFormData, resetFormData, hydrateFromServer };
}

// Delar lifecycle-flagglådan så alla kan se vilka engångssteg som redan är gjorda.
export function useFakturaLifecycle() {
  const { lifecycle } = useFakturaFormContextValue();
  return lifecycle;
}

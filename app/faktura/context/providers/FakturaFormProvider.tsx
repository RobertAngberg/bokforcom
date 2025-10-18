// Tänk den här providern som en liten kontrollpanel som styr formulärets dataflöde och “kom-ihåg”-flaggor.
// Flaggorna är bara booleaner i lifecycle-objektet som bockar av engångssteg (t.ex. har vi laddat kunder?);
// panelen ser även till att varje uppdatering sparas i contexten så att alla barnkomponenter får färska värden.

"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  FakturaFormContextValue,
  FakturaFormData,
  FakturaFormProviderProps,
  FakturaLifecycleFlags,
  FakturaFormAction,
  ServerData,
} from "../../types/types";
import { FakturaFormContext } from "../defaults/FakturaFormDefaults";
import {
  createDefaultFakturaFormData,
  createLifecycleDefaults,
} from "../defaults/FakturaFormDefaults";

// Hjälpfunktionen jämför två värden och säger om de är identiska ned på minsta nivå.
function areValuesDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a === null || b === null) {
    return a === b;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((value, index) => areValuesDeepEqual(value, b[index]));
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    return aKeys.every((key) =>
      areValuesDeepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }

  return false;
}

// Plockar fram vilka fält som faktiskt ändrats så vi slipper uppdatera i onödan.
function collectChangedKeys(previous: FakturaFormData, updates: Partial<FakturaFormData>) {
  return Object.entries(updates).reduce<string[]>((acc, [key, value]) => {
    const previousValue = previous[key as keyof FakturaFormData];
    if (!areValuesDeepEqual(previousValue, value)) {
      acc.push(key);
    }
    return acc;
  }, []);
}

// Själva reducer-motorn bestämmer hur formulärstate ska ändras för varje action.
function formReducer(state: FakturaFormData, action: FakturaFormAction): FakturaFormData {
  switch (action.type) {
    case "SET_FORM_DATA": {
      const payload = action.payload ?? {};
      const changes = collectChangedKeys(state, payload);
      if (changes.length === 0) {
        return state;
      }
      return {
        ...state,
        ...payload,
      };
    }
    case "HYDRATE_FORM_DATA": {
      const payload = action.payload ?? {};
      const changes = collectChangedKeys(state, payload);
      if (changes.length === 0) {
        return state;
      }
      return {
        ...state,
        ...payload,
      };
    }
    case "RESET_FORM_DATA":
      return createDefaultFakturaFormData();
    default:
      return state;
  }
}

// Översätter serverns företagsprofil till de fält vi använder i formuläret.
function mapForetagsprofil(data: ServerData["foretagsprofil"]): Partial<FakturaFormData> {
  if (!data) {
    return {};
  }

  return {
    företagsnamn: data.företagsnamn ?? "",
    adress: data.adress ?? "",
    postnummer: data.postnummer ?? "",
    stad: data.stad ?? "",
    organisationsnummer: data.organisationsnummer ?? "",
    momsregistreringsnummer: data.momsregistreringsnummer ?? "",
    telefonnummer: data.telefonnummer ?? "",
    epost: data.epost ?? "",
    bankinfo: data.bankinfo ?? "",
    webbplats: data.webbplats ?? "",
    logo: data.logo ?? "",
    logoWidth:
      typeof data.logoWidth === "number" && Number.isFinite(data.logoWidth) ? data.logoWidth : 200,
  };
}

// Providern kopplar ihop reducer, lifecycleflaggor och context så barnkomponenter får allt i ett paket.
export function FakturaFormProvider({ children, initialData }: FakturaFormProviderProps) {
  const [formData, dispatch] = useReducer(formReducer, undefined, createDefaultFakturaFormData);
  const listenersRef = useRef(new Set<() => void>());
  const formDataRef = useRef(formData);
  const lifecycle = useRef<FakturaLifecycleFlags>(createLifecycleDefaults());

  useEffect(() => {
    formDataRef.current = formData;
    listenersRef.current.forEach((listener) => listener());
  }, [formData]);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => formDataRef.current, []);

  const setFormData = useCallback((updates: Partial<FakturaFormData>) => {
    dispatch({ type: "SET_FORM_DATA", payload: updates });
  }, []);

  const resetFormData = useCallback(() => {
    dispatch({ type: "RESET_FORM_DATA" });
  }, []);

  const hydrateFromServer = useCallback((data: ServerData) => {
    if (!data?.foretagsprofil) return;
    dispatch({ type: "HYDRATE_FORM_DATA", payload: mapForetagsprofil(data.foretagsprofil) });
  }, []);

  useEffect(() => {
    if (initialData) {
      hydrateFromServer(initialData);
    }
  }, [initialData, hydrateFromServer]);

  useEffect(() => {
    return () => {
      lifecycle.current = createLifecycleDefaults();
    };
  }, []);

  const value: FakturaFormContextValue = useMemo(
    () => ({
      subscribe,
      getSnapshot,
      setFormData,
      resetFormData,
      hydrateFromServer,
      lifecycle,
    }),
    [subscribe, getSnapshot, setFormData, resetFormData, hydrateFromServer]
  );

  return <FakturaFormContext.Provider value={value}>{children}</FakturaFormContext.Provider>;
}

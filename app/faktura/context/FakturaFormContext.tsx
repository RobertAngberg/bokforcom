"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useSyncExternalStore,
} from "react";
import type {
  FakturaFormData,
  ServerData,
  FakturaLifecycleFlags,
  FakturaFormAction,
  FakturaFormSelector,
  FakturaFormContextValue,
  FakturaFormProviderProps,
} from "../types/types";

const FakturaFormContext = createContext<FakturaFormContextValue | null>(null);

const lifecycleDefaults: FakturaLifecycleFlags = {
  lastDefaultsSessionId: null,
  harInitDefaults: false,
  harAutoBeraknatForfallo: false,
  harLastatForetagsprofil: false,
  harLastatKunder: false,
  harLastatFavoritArtiklar: false,
  harInitNyFaktura: false,
};

const defaultFormTemplate: FakturaFormData = {
  id: "",
  fakturanummer: "",
  fakturadatum: "",
  forfallodatum: "",
  betalningsmetod: "",
  betalningsvillkor: "",
  drojsmalsranta: "",
  kundId: "",
  nummer: "",
  personnummer: "",
  fastighetsbeteckning: "",
  rotBoendeTyp: "fastighet",
  brfOrganisationsnummer: "",
  brfLagenhetsnummer: "",
  kundnamn: "",
  kundnummer: "",
  kundorganisationsnummer: "",
  kundmomsnummer: "",
  kundadress: "",
  kundpostnummer: "",
  kundstad: "",
  kundemail: "",
  företagsnamn: "",
  adress: "",
  postnummer: "",
  stad: "",
  organisationsnummer: "",
  momsregistreringsnummer: "",
  telefonnummer: "",
  bankinfo: "",
  epost: "",
  webbplats: "",
  logo: "",
  logoWidth: 200,
  rotRutAktiverat: false,
  rotRutTyp: "ROT",
  rotRutKategori: "",
  avdragProcent: 0,
  avdragBelopp: 0,
  arbetskostnadExMoms: 0,
  materialkostnadExMoms: 0,
  rotRutBeskrivning: "",
  rotRutStartdatum: "",
  rotRutSlutdatum: "",
  artiklar: [],
};

// Returnerar en ny kopia av standardformulärets startvärden
export function createDefaultFakturaFormData(): FakturaFormData {
  return {
    ...defaultFormTemplate,
    artiklar: [],
  };
}

// Jämför två värden rekursivt för att se om de är identiska
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

// Samlar ihop vilka fält som faktiskt ändrats mellan två formtillstånd
function collectChangedKeys(
  previous: FakturaFormData,
  updates: Partial<FakturaFormData>
): string[] {
  return Object.entries(updates).reduce<string[]>((acc, [key, value]) => {
    const previousValue = previous[key as keyof FakturaFormData];
    if (!areValuesDeepEqual(previousValue, value)) {
      acc.push(key);
    }
    return acc;
  }, []);
}

// Reducer som hanterar uppdateringar av fakturaformulärets state
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

// Mappar serverns företagsprofil till relevanta formulärfält
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

// Provider som exponerar formulärstate och åtgärder via context
export function FakturaFormProvider({ children, initialData }: FakturaFormProviderProps) {
  const [formData, dispatch] = useReducer(formReducer, undefined, createDefaultFakturaFormData);
  const listenersRef = useRef(new Set<() => void>());
  const formDataRef = useRef(formData);
  const lifecycle = useRef<FakturaLifecycleFlags>({ ...lifecycleDefaults });

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
      lifecycle.current = { ...lifecycleDefaults };
    };
  }, []);

  const value = useMemo<FakturaFormContextValue>(
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

// Hämtar och validerar context-värdet för fakturaformuläret
function useFakturaFormContextValue(): FakturaFormContextValue {
  const context = useContext(FakturaFormContext);
  if (!context) {
    throw new Error("useFakturaFormContext must be used within a FakturaFormProvider");
  }
  return context;
}

// Prenumererar på hela formulärstate via useSyncExternalStore
export function useFakturaForm(): FakturaFormData {
  const { subscribe, getSnapshot } = useFakturaFormContextValue();
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// Returnerar ett selekterat utdrag av formuläret utan onödiga rerenders
export function useFakturaFormSelector<T>(selector: FakturaFormSelector<T>): T {
  const { subscribe, getSnapshot } = useFakturaFormContextValue();
  const getSelectedSnapshot = useCallback(() => selector(getSnapshot()), [selector, getSnapshot]);
  return useSyncExternalStore(subscribe, getSelectedSnapshot, getSelectedSnapshot);
}

// Hämtar ett enskilt formulärfält som hålls uppdaterat
export function useFakturaFormField<K extends keyof FakturaFormData>(field: K): FakturaFormData[K] {
  return useFakturaFormSelector((state) => state[field]);
}

// Ger tillgång till funktioner för att uppdatera eller återställa formuläret
export function useFakturaFormActions() {
  const { setFormData, resetFormData, hydrateFromServer } = useFakturaFormContextValue();
  return { setFormData, resetFormData, hydrateFromServer };
}

// Exponerar lifecycle-flaggorna som delar engångsguards mellan hooks
export function useFakturaLifecycle() {
  const { lifecycle } = useFakturaFormContextValue();
  return lifecycle;
}

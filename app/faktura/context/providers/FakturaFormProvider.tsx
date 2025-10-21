"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  FakturaFormContext,
  createDefaultFakturaFormData,
  createLifecycleDefaults,
} from "../defaults/FakturaFormDefaults";
import type { FakturaFormData, FakturaFormProviderProps, ServerData } from "../../types/types";

function buildInitialFormState(initialData?: ServerData): FakturaFormData {
  const base = createDefaultFakturaFormData();

  if (initialData?.foretagsprofil) {
    const profil = initialData.foretagsprofil;
    base.företagsnamn = profil?.företagsnamn ?? "";
    base.adress = profil?.adress ?? "";
    base.postnummer = profil?.postnummer ?? "";
    base.stad = profil?.stad ?? "";
    base.organisationsnummer = profil?.organisationsnummer ?? "";
    base.momsregistreringsnummer = profil?.momsregistreringsnummer ?? "";
    base.telefonnummer = profil?.telefonnummer ?? "";
    base.epost = profil?.epost ?? "";
    base.webbplats = profil?.webbplats ?? "";
    base.bankinfo = profil?.bankinfo ?? "";
    base.logo = profil?.logo ?? "";

    if (typeof profil?.logoWidth === "number" && Number.isFinite(profil.logoWidth)) {
      base.logoWidth = profil.logoWidth;
    }
  }

  if (initialData?.senasteBetalning) {
    const senaste = initialData.senasteBetalning;
    base.betalningsmetod = senaste?.betalningsmetod ?? "";
    base.nummer = senaste?.nummer ?? "";
  }

  return { ...base, artiklar: Array.isArray(base.artiklar) ? [...base.artiklar] : [] };
}

export function FakturaFormProvider({ children, initialData }: FakturaFormProviderProps) {
  const initialFormData = useMemo(() => buildInitialFormState(initialData), [initialData]);
  const storeRef = useRef<FakturaFormData>(initialFormData);
  const baseSnapshotRef = useRef<FakturaFormData>(initialFormData);
  const listenersRef = useRef(new Set<() => void>());
  const lifecycle = useRef(createLifecycleDefaults());

  const notify = useCallback(() => {
    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, []);

  const getSnapshot = useCallback(() => storeRef.current, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const setFormData = useCallback(
    (updates: Partial<FakturaFormData>) => {
      const current = storeRef.current;
      const next: FakturaFormData = {
        ...current,
        ...updates,
      };

      if (updates.artiklar) {
        next.artiklar = [...updates.artiklar];
      }

      storeRef.current = next;
      notify();
    },
    [notify]
  );

  const resetFormData = useCallback(() => {
    const base = baseSnapshotRef.current;
    storeRef.current = {
      ...base,
      artiklar: [...(base.artiklar ?? [])],
    };
    notify();
  }, [notify]);

  const hydrateFromServer = useCallback(
    (data: ServerData) => {
      const nextBase = buildInitialFormState(data);
      baseSnapshotRef.current = nextBase;
      storeRef.current = nextBase;
      notify();
    },
    [notify]
  );

  const contextValue = useMemo(
    () => ({
      getSnapshot,
      subscribe,
      setFormData,
      resetFormData,
      hydrateFromServer,
      lifecycle,
    }),
    [getSnapshot, subscribe, setFormData, resetFormData, hydrateFromServer]
  );

  return <FakturaFormContext.Provider value={contextValue}>{children}</FakturaFormContext.Provider>;
}

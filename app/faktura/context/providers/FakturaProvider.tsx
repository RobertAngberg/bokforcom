"use client";

import { useMemo, useReducer, type ReactNode } from "react";
import { FakturaContext, FakturaInitialDataContext } from "../defaults/FakturaDefaults";
import { fakturaReducer, initialFakturaState } from "../state/fakturaReducer";
import { useFakturaReducerActions } from "../state/useFakturaReducerActions";
import { FakturaFormProvider } from "./FakturaFormProvider";
import { FakturaArtikelProvider } from "./FakturaArtikelProvider";
import type { FakturaProviderProps, FakturaContextType, ServerData } from "../../types/types";

interface FakturaContextShellProps {
  children: ReactNode;
  initialData?: ServerData;
}

function initializeState(initialData?: ServerData) {
  const base = { ...initialFakturaState };

  if (initialData?.bokforingsmetod) {
    base.userSettings = {
      ...base.userSettings,
      bokföringsmetod: initialData.bokforingsmetod,
    };
  }

  return base;
}

function FakturaContextShell({ children, initialData }: FakturaContextShellProps) {
  const [state, dispatch] = useReducer(fakturaReducer, initialData, (data?: ServerData) =>
    initializeState(data)
  );

  const actions = useFakturaReducerActions(dispatch);

  const contextValue = useMemo<FakturaContextType>(
    () => ({
      state,
      dispatch,
      ...actions,
    }),
    [state, dispatch, actions]
  );

  return (
    <FakturaContext.Provider value={contextValue}>
      <FakturaArtikelProvider initialFavoritArtiklar={initialData?.artiklar}>
        {children}
      </FakturaArtikelProvider>
    </FakturaContext.Provider>
  );
}

export function FakturaProvider({ children, initialData }: FakturaProviderProps) {
  return (
    <FakturaInitialDataContext.Provider value={initialData ?? null}>
      <FakturaFormProvider initialData={initialData}>
        <FakturaContextShell initialData={initialData}>{children}</FakturaContextShell>
      </FakturaFormProvider>
    </FakturaInitialDataContext.Provider>
  );
}

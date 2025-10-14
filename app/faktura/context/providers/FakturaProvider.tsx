// Detta är ytterhöljet som kopplar ihop alla mindre providers så att sidan får ett komplett fakturaflöde.
// Lägg hela fakturadelen innanför denna komponent så delar allt samma formulärdata, artiklar och navigation.

"use client";

import { useMemo, useReducer } from "react";
import type {
  FakturaContextInnerProps,
  FakturaContextType,
  FakturaProviderProps,
} from "../../types/types";
import { FakturaContext, FakturaInitialDataContext } from "../defaults/FakturaDefaults";
import { FakturaFormProvider } from "./FakturaFormProvider";
import { FakturaArtikelProvider } from "./FakturaArtikelProvider";
import { fakturaReducer, initialFakturaState } from "../state/fakturaReducer";
import { useFakturaActions } from "../state/useFakturaActions";

// Den här interna providern håller reducer och actions för huvudsakliga fakturastatet.
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

// Yttersta providern som knyter ihop alla lager och skickar in startdata från servern.
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

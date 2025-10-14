// För att slippa skriva dispatch-logik överallt paketerar vi den här i enkla, namngivna hjälpfunktioner.
// Du anropar bara en action-funktion (t.ex. navigateToView) och så sköts resten automatiskt under huven.

import { useCallback, useMemo } from "react";
import type {
  FakturaContextType,
  FakturaDispatch,
  FakturaState,
  ViewType,
} from "../../types/types";
import { useFakturaFormActions } from "../hooks/FakturaFormContext";

// Huvudhooken kopplar dispatch till färdiga actions så resten av appen kan ropa på dem enkelt.
export function useFakturaActions(dispatch: FakturaDispatch) {
  const { setFormData } = useFakturaFormActions();

  // Uppdaterar kundstatus utan att röra något annat i state.
  const setKundStatus = useCallback(
    (status: FakturaState["kundStatus"]) => {
      dispatch({ type: "SET_KUND_STATUS", payload: status });
    },
    [dispatch]
  );

  // Nollställer kundrelaterade fält och flaggan när du vill börja om.
  const resetKund = useCallback(() => {
    setFormData({
      kundId: "",
      kundnamn: "",
      kundnummer: "",
      kundorganisationsnummer: "",
      kundmomsnummer: "",
      kundadress: "",
      kundpostnummer: "",
      kundstad: "",
      kundemail: "",
    });
    dispatch({ type: "RESET_KUND" });
  }, [dispatch, setFormData]);

  // Blandar in nya navigation-värden i det som redan finns.
  const setNavigation = useCallback(
    (navigation: Partial<FakturaState["navigationState"]>) => {
      dispatch({ type: "SET_NAVIGATION", payload: navigation });
    },
    [dispatch]
  );

  // Byter vy när du vill visa ett annat steg i flödet.
  const navigateToView = useCallback(
    (view: ViewType) => {
      dispatch({ type: "NAVIGATE_TO_VIEW", payload: view });
    },
    [dispatch]
  );

  // Byter vy och talar om vilken faktura som ska redigeras.
  const navigateToEdit = useCallback(
    (view: ViewType, fakturaId?: number) => {
      dispatch({ type: "NAVIGATE_TO_EDIT", payload: { view, fakturaId } });
    },
    [dispatch]
  );

  // Hoppar tillbaka till menyläget när användaren är klar.
  const navigateBack = useCallback(() => {
    dispatch({ type: "NAVIGATE_BACK" });
  }, [dispatch]);

  // Sparar vilken bokföringsmetod användaren har valt.
  const setBokföringsmetod = useCallback(
    (metod: "kontantmetoden" | "fakturametoden") => {
      dispatch({ type: "SET_BOKFÖRINGSMETOD", payload: metod });
    },
    [dispatch]
  );

  return useMemo<
    Pick<
      FakturaContextType,
      | "setKundStatus"
      | "resetKund"
      | "setNavigation"
      | "navigateToView"
      | "navigateToEdit"
      | "navigateBack"
      | "setBokföringsmetod"
    >
  >(
    () => ({
      setKundStatus,
      resetKund,
      setNavigation,
      navigateToView,
      navigateToEdit,
      navigateBack,
      setBokföringsmetod,
    }),
    [
      setKundStatus,
      resetKund,
      setNavigation,
      navigateToView,
      navigateToEdit,
      navigateBack,
      setBokföringsmetod,
    ]
  );
}

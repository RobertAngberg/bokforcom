import { useCallback, useMemo } from "react";
import type { FakturaContextType, FakturaDispatch, FakturaState, ViewType } from "../types/types";
import { useFakturaFormActions } from "./FakturaFormContext";

/**
 * Binder faktura-reducerarens `dispatch` till en uppsättning praktiska helpers
 * och bäddar samtidigt in de sidoeffekter som behöver samköra med formulärkontexten.
 * Resultatet matchar den publika API:n som exponeras från `FakturaContext`.
 */
export function useFakturaActions(dispatch: FakturaDispatch) {
  const { setFormData } = useFakturaFormActions();

  // Uppdaterar endast kundstatusflaggan i state – inga sidoeffekter utöver dispatch.
  const setKundStatus = useCallback(
    (status: FakturaState["kundStatus"]) => {
      dispatch({ type: "SET_KUND_STATUS", payload: status });
    },
    [dispatch]
  );

  // Tömmer kundrelaterade formfält innan kundstatus återställs till "none".
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

  // Slår ihop inkommande navigation med befintligt läge (fritt för partiella uppdateringar).
  const setNavigation = useCallback(
    (navigation: Partial<FakturaState["navigationState"]>) => {
      dispatch({ type: "SET_NAVIGATION", payload: navigation });
    },
    [dispatch]
  );

  // Växlar till angiven vy utan att spara tidigare edit-id.
  const navigateToView = useCallback(
    (view: ViewType) => {
      dispatch({ type: "NAVIGATE_TO_VIEW", payload: view });
    },
    [dispatch]
  );

  // Kombinerar vybyte med valfri faktura att redigera.
  const navigateToEdit = useCallback(
    (view: ViewType, fakturaId?: number) => {
      dispatch({ type: "NAVIGATE_TO_EDIT", payload: { view, fakturaId } });
    },
    [dispatch]
  );

  // Backar till huvudmenyn – används när editflödet ska avslutas.
  const navigateBack = useCallback(() => {
    dispatch({ type: "NAVIGATE_BACK" });
  }, [dispatch]);

  // Sätter användarens bokföringsmetodspreferens (kontant- eller fakturametoden).
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

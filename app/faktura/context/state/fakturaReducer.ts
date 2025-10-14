// Här definieras vilket startläge fakturaflödet har och hur state ska ändras när olika actions kommer in.
// Reducern är bara en stor switch-sats: den tar emot en action och returnerar ett nytt state-objekt.

import type { FakturaState, FakturaAction, ViewType } from "../../types/types";

const defaultUserSettings = {
  bokföringsmetod: "kontantmetoden" as "kontantmetoden" | "fakturametoden",
};

const defaultNavigationState = {
  currentView: "menu" as ViewType,
};

export const initialFakturaState: FakturaState = {
  kundStatus: "none",
  navigationState: defaultNavigationState,
  userSettings: defaultUserSettings,
};

// Reducern tar emot en action och lämnar tillbaka hur hela fakturastatet ska se ut efter den händelsen.
export function fakturaReducer(state: FakturaState, action: FakturaAction): FakturaState {
  switch (action.type) {
    case "SET_KUND_STATUS":
      return {
        ...state,
        kundStatus: action.payload,
      };
    case "RESET_KUND":
      return {
        ...state,
        kundStatus: "none",
      };
    case "SET_NAVIGATION":
      return {
        ...state,
        navigationState: { ...state.navigationState, ...action.payload },
      };
    case "NAVIGATE_TO_VIEW":
      return {
        ...state,
        navigationState: { currentView: action.payload },
      };
    case "NAVIGATE_TO_EDIT":
      return {
        ...state,
        navigationState: {
          currentView: action.payload.view,
          editFakturaId: action.payload.fakturaId,
        },
      };
    case "NAVIGATE_BACK":
      return {
        ...state,
        navigationState: { currentView: "menu" },
      };
    case "SET_BOKFÖRINGSMETOD":
      return {
        ...state,
        userSettings: { ...state.userSettings, bokföringsmetod: action.payload },
      };
    default:
      return state;
  }
}

export const fakturaDefaults = {
  defaultUserSettings,
  defaultNavigationState,
};

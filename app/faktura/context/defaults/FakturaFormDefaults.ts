// För att slippa hårdkoda startvärden överallt samlar vi dem här i enkla funktioner och konstanter.
// Resultatet blir att formulärmotorn alltid får samma “nollställning” och vet vilka engångssteg som är gjorda.

import { createContext } from "react";
import type {
  FakturaFormContextValue,
  FakturaFormData,
  FakturaLifecycleFlags,
} from "../../types/types";

export const FakturaFormContext = createContext<FakturaFormContextValue | null>(null);

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

// Ger oss ett fräscht formulär med samma startvärden varje gång vi startar en ny faktura.
export function createDefaultFakturaFormData(): FakturaFormData {
  return {
    ...defaultFormTemplate,
    artiklar: [],
  };
}

// Skapar ett nytt set med “kom-ihåg”-flaggor så kontrollpanelen vet vad som redan är gjort.
export function createLifecycleDefaults(): FakturaLifecycleFlags {
  return { ...lifecycleDefaults };
}

export { lifecycleDefaults };

import type { Session } from "next-auth";

export interface AnvandarInfo {
  id: string;
  email: string;
  name: string;
  skapad?: string;
  uppdaterad?: string;
  provider?: string;
}

export interface ForetagsProfil {
  foretagsnamn: string;
  adress: string;
  postnummer: string;
  stad: string;
  organisationsnummer: string;
  momsregistreringsnummer: string;
  telefonnummer: string;
  epost: string;
  webbplats: string;
}

export interface MeddelandeTillstand {
  type: "success" | "error";
  text: string;
}

export interface AnvandarRedigeringsFormular {
  name: string;
  email: string;
}

// Tidigare komponent-props (nu inlinade via hooks) borttagna efter refactor
// Återinför centraliserade prop-interfaces för komponenternas publika API

export interface AnvandarprofilComponentProps {
  initialUser: AnvandarInfo | null;
  session: Session | null;
}

export interface ForetagsprofilComponentProps {
  initialForetag: ForetagsProfil | null;
}

export interface FarozonComponentProps {
  // För närvarande inga inkommande props – men reserverad för framtida styrning (feature flags etc)
  // Lämnas tom för konsekvens och möjlig framtida expansion
}

// Action result types
export interface AktionsResultat<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AnvandarInfo;
}

// Payloads för server actions (delade)
export interface UppdateraAnvandarPayload {
  name: string;
  email: string;
}

// AdminSektion props (wrapper kring tre sektioner)
// AdminSektionProps togs bort när Admin-wrappern försvann

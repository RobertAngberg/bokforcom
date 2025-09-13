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

export interface AnvandarprofilComponentProps {
  initialUser: AnvandarInfo | null;
  session: Session | null;
}

export interface ForetagsprofilComponentProps {
  initialForetag: ForetagsProfil | null;
}

export interface AktionsResultat<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AnvandarInfo;
}

export interface UppdateraAnvandarPayload {
  name: string;
  email: string;
}

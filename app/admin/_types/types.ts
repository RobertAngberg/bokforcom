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

// Store interfaces
export interface AdminStoreState {
  // User state
  userInfo: AnvandarInfo | null;
  setUserInfo: (user: AnvandarInfo | null) => void;

  // Company state
  foretagsInfo: ForetagsProfil | null;
  setForetagsInfo: (foretag: ForetagsProfil | null) => void;

  // Init function
  initStore: (data: {
    userInfo?: AnvandarInfo | null;
    foretagsInfo?: ForetagsProfil | null;
  }) => void;
}

// Component interfaces
export interface AdminInitializerProps {
  anvandarInfo: AnvandarInfo | null;
  foretagsInfo: ForetagsProfil | null;
}

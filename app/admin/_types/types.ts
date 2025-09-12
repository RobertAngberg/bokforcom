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

export interface AnvandarprofilProps {
  userInfo: AnvandarInfo | null;
  editForm: AnvandarRedigeringsFormular;
  isEditing: boolean;
  isSaving: boolean;
  message: MeddelandeTillstand | null;
  session: Session | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (field: keyof AnvandarRedigeringsFormular, value: string) => void;
}

export interface ForetagsprofilProps {
  foretagsProfil: ForetagsProfil;
  isEditingCompany: boolean;
  isSavingCompany: boolean;
  companyMessage: MeddelandeTillstand | null;
  onEditCompany: () => void;
  onCancelCompany: () => void;
  onSaveCompany: () => void;
  onChangeCompany: (field: keyof ForetagsProfil, value: string) => void;
}

export interface FarozonProps {
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  onDeleteCompany: () => void;
  onConfirm: () => void;
  onCancel: () => void;
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
export interface AdminSektionProps {
  initialUser: AnvandarInfo | null;
  initialForetag: ForetagsProfil | null;
  session: Session | null;
}

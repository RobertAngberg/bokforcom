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

// Hook interfaces
export interface UseAdminProps {
  initialUser: AnvandarInfo | null;
  initialForetagsInfo: ForetagsProfil | null;
}

// Hook return type sections
export interface AdminUserSection {
  state: {
    userInfo: AnvandarInfo | null;
    editForm: AnvandarRedigeringsFormular;
    isEditing: boolean;
    isSaving: boolean;
    message: MeddelandeTillstand | null;
  };
  actions: {
    setEditForm: (form: AnvandarRedigeringsFormular) => void;
    setIsEditing: (editing: boolean) => void;
    setIsSaving: (saving: boolean) => void;
    setMessage: (message: MeddelandeTillstand | null) => void;
  };
  handlers: {
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => Promise<void>;
    onChange: (field: keyof AnvandarRedigeringsFormular, value: string) => void;
    clearMessage: () => void;
  };
}

export interface AdminCompanySection {
  state: {
    foretagsProfil: ForetagsProfil;
    isEditingCompany: boolean;
    isSavingCompany: boolean;
    companyMessage: MeddelandeTillstand | null;
  };
  actions: {
    setForetagsProfil: (profil: ForetagsProfil) => void;
    setIsEditingCompany: (editing: boolean) => void;
    setIsSavingCompany: (saving: boolean) => void;
    setCompanyMessage: (message: MeddelandeTillstand | null) => void;
  };
  handlers: {
    onEditCompany: () => void;
    onCancelCompany: () => void;
    onSaveCompany: () => Promise<void>;
    onChangeCompany: (field: keyof ForetagsProfil, value: string) => void;
    clearCompanyMessage: () => void;
  };
}

export interface AdminDangerZoneSection {
  state: {
    showDeleteConfirm: boolean;
    isDeleting: boolean;
  };
  handlers: {
    onConfirm: () => void;
    onCancel: () => void;
    onDeleteCompany: () => Promise<void>;
  };
}

// Component prop interfaces
export interface AnvandarprofilProps {
  user: AdminUserSection;
}

export interface ForetagsprofilProps {
  company: AdminCompanySection;
}

export interface FarozonProps {
  dangerZone: AdminDangerZoneSection;
}

export interface AdminContentProps {
  användarInfo: AnvandarInfo | null;
  företagsInfo: ForetagsProfil | null;
}

// Constants
export const TOM_FORETAG: ForetagsProfil = {
  foretagsnamn: "",
  adress: "",
  postnummer: "",
  stad: "",
  organisationsnummer: "",
  momsregistreringsnummer: "",
  telefonnummer: "",
  epost: "",
  webbplats: "",
};

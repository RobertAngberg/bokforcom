// ============================================================================
// Admin Type Definitions
// ============================================================================

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

// Component Props
export interface AnvandarprofilSektionProps {
  userInfo: AnvandarInfo | null;
  editForm: AnvandarRedigeringsFormular;
  state: {
    isEditing: boolean;
    isSaving: boolean;
    message: MeddelandeTillstand | null;
  };
  session: any;
  handlers: {
    handleEdit: () => void;
    handleCancel: () => void;
    handleSave: () => void;
    updateEditForm: (field: keyof AnvandarRedigeringsFormular, value: string) => void;
  };
}

export interface ForetagsprofilSektionProps {
  foretagsProfil: ForetagsProfil;
  state: {
    isEditingCompany: boolean;
    isSavingCompany: boolean;
    companyMessage: MeddelandeTillstand | null;
  };
  handlers: {
    handleEditCompany: () => void;
    handleCancelCompany: () => void;
    handleSaveCompany: () => void;
    handleCompanyInputChange: (field: keyof ForetagsProfil, value: string) => void;
  };
}

export interface RaderingsSektionProps {
  state: {
    showDeleteConfirm: boolean;
    isDeleting: boolean;
  };
  handlers: {
    handleDeleteCompany: () => void;
    confirmDelete: () => void;
    cancelDelete: () => void;
  };
}

// Action result types
export interface AktionsResultat<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: AnvandarInfo;
}

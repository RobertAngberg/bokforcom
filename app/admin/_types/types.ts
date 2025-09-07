// ============================================================================
// Admin Type Definitions
// ============================================================================

export interface UserInfo {
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

export interface MessageState {
  type: "success" | "error";
  text: string;
}

export interface UserEditForm {
  name: string;
  email: string;
}

// Component Props
export interface UserProfileSectionProps {
  userInfo: UserInfo | null;
  editForm: UserEditForm;
  state: {
    isEditing: boolean;
    isSaving: boolean;
    message: MessageState | null;
  };
  session: any;
  handlers: {
    handleEdit: () => void;
    handleCancel: () => void;
    handleSave: () => void;
    updateEditForm: (field: keyof UserEditForm, value: string) => void;
  };
}

export interface CompanyProfileSectionProps {
  foretagsProfil: ForetagsProfil;
  isEditingCompany: boolean;
  isSavingCompany: boolean;
  companyMessage: MessageState | null;
  handleEditCompany: () => void;
  handleCancelCompany: () => void;
  handleSaveCompany: () => void;
  handleCompanyInputChange: (field: keyof ForetagsProfil, value: string) => void;
}

export interface DeleteSectionProps {
  showDeleteConfirm: boolean;
  isDeleting: boolean;
  handleDeleteCompany: () => void;
  confirmDelete: () => void;
  cancelDelete: () => void;
}

// Action result types
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  user?: UserInfo;
}

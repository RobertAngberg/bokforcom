// 🎯 Admin Type Definitions
// Enterprise-grade types for admin module

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

// Hook return types
export interface UseAdminAnvandarhanteringReturn {
  // Data state
  userInfo: UserInfo | null;
  editForm: UserEditForm;

  // UI state
  isEditing: boolean;
  isSaving: boolean;
  loading: boolean;
  message: MessageState | null;

  // Actions
  handleEdit: () => void;
  handleCancel: () => void;
  handleSave: () => Promise<void>;
  updateEditForm: (field: keyof UserEditForm, value: string) => void;
  clearMessage: () => void;
}

export interface UseAdminForetagshanteringReturn {
  // Data
  foretagsProfil: ForetagsProfil;

  // State
  isEditingCompany: boolean;
  isSavingCompany: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  companyMessage: MessageState | null;

  // Actions
  handleEditCompany: () => void;
  handleCancelCompany: () => void;
  handleSaveCompany: () => Promise<void>;
  handleDeleteCompany: () => Promise<void>;
  updateCompanyField: (field: keyof ForetagsProfil, value: string) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  clearCompanyMessage: () => void;

  // Utils
  fetchCompanyProfile: () => Promise<void>;
}

export interface UseAdminSakerhetReturn {
  // Security state
  adminAttempts: Map<string, { attempts: number; lastAttempt: number }>;

  // Actions
  validateAdminSession: () => Promise<{ valid: boolean; userId?: string; error?: string }>;
  validateAdminAttempt: (userId: string) => Promise<boolean>;
  logAdminSecurityEvent: (userId: string, eventType: string, details: string) => Promise<void>;

  // Additional utilities
  adminStats: any;
  securityLoading: boolean;
  fetchAdminStats: () => Promise<void>;
}

// Component Props
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

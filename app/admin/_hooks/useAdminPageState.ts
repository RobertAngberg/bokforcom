import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useAdminAnvandarhantering } from "./useAnvandarhantering";
import { useAdminForetagshantering } from "./useForetagshantering";
import { useFarozon } from "./useFarozon";

export const useAdminPageState = () => {
  const auth = useAuth();
  const userProfile = useAdminAnvandarhantering();
  const companyProfile = useAdminForetagshantering();
  const deleteConfirmation = useFarozon();

  useEffect(() => {
    if (auth.session?.user?.id) {
      companyProfile.fetchCompanyProfile();
    }
  }, [auth.session]);

  return {
    auth,
    userProfile: {
      userInfo: userProfile.userInfo,
      editForm: userProfile.editForm,
      state: {
        isEditing: userProfile.isEditing,
        isSaving: userProfile.isSaving,
        message: userProfile.message,
      },
      session: auth.session,
      handlers: {
        handleEdit: userProfile.handleEdit,
        handleCancel: userProfile.handleCancel,
        handleSave: userProfile.handleSave,
        updateEditForm: userProfile.updateEditForm,
      },
    },
    companyProfile: {
      getComponentProps: () => ({
        foretagsProfil: companyProfile.foretagsProfil,
        state: {
          isEditingCompany: companyProfile.isEditingCompany,
          isSavingCompany: companyProfile.isSavingCompany,
          companyMessage: companyProfile.companyMessage,
        },
        handlers: {
          handleEditCompany: companyProfile.handleEditCompany,
          handleCancelCompany: companyProfile.handleCancelCompany,
          handleSaveCompany: companyProfile.handleSaveCompany,
          handleCompanyInputChange: companyProfile.updateCompanyField,
        },
      }),
    },
    deleteConfirmation: {
      getComponentProps: () => deleteConfirmation,
    },
    isLoading: auth.isLoading || userProfile.loading,
  };
};

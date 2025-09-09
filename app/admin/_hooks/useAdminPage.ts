import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useAnvandarprofil";
import { useCompanyProfile } from "./useForetagsprofil";
import { useDeleteSection } from "./useFarozon";

export const useAdminPageState = () => {
  const auth = useAuth();
  const userProfile = useUserProfile();
  const companyProfile = useCompanyProfile();
  const deleteConfirmation = useDeleteSection();

  useEffect(() => {
    if (auth.session?.user?.id) {
      userProfile.fetchUserInfo();
      companyProfile.fetchCompanyProfile();
    }
  }, [auth.session]);

  return {
    auth,
    userProfile,
    companyProfile,
    deleteConfirmation,
    isLoading: auth.isLoading || userProfile.loading,
  };
};

import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useUserProfile } from "./useUserProfile";
import { useCompanyProfile } from "./useCompanyProfile";
import { useDeleteConfirmation } from "./useDeleteConfirmation";

export const useAdminPageState = () => {
  const auth = useAuth();
  const userProfile = useUserProfile();
  const companyProfile = useCompanyProfile();
  const deleteConfirmation = useDeleteConfirmation();

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

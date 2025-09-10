import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useAnvandarprofil } from "./useAnvandarprofil";
import { useForetagsprofil } from "./useForetagsprofil";
import { useFarozon } from "./useFarozon";

export const useAdminPageState = () => {
  const auth = useAuth();
  const userProfile = useAnvandarprofil();
  const companyProfile = useForetagsprofil();
  const deleteConfirmation = useFarozon();

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

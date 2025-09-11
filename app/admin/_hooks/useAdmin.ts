"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { hamtaAnvandarInfo, uppdateraAnvandarInfo } from "../_actions/anvandarActions";
import {
  hamtaForetagsprofilAdmin,
  uppdateraForetagsprofilAdmin,
  raderaForetag,
} from "../_actions/foretagsActions";
import type {
  AnvandarInfo,
  AnvandarRedigeringsFormular,
  ForetagsProfil,
  MeddelandeTillstand,
} from "../_types/types";

export const useAdmin = () => {
  const { data: session, status } = useSession();

  // User state
  const [userInfo, setUserInfo] = useState<AnvandarInfo | null>(null);
  const [userEditForm, setUserEditForm] = useState<AnvandarRedigeringsFormular>({
    name: "",
    email: "",
  });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [userMessage, setUserMessage] = useState<MeddelandeTillstand | null>(null);

  // Company state
  const [companyProfile, setCompanyProfile] = useState<ForetagsProfil>({
    foretagsnamn: "",
    adress: "",
    postnummer: "",
    stad: "",
    organisationsnummer: "",
    momsregistreringsnummer: "",
    telefonnummer: "",
    epost: "",
    webbplats: "",
  });
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MeddelandeTillstand | null>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Auth helpers
  const isLoading = status === "loading";
  const isAuthenticated = !!session;

  // Fetch user info
  const fetchUserInfo = async () => {
    try {
      const data = await hamtaAnvandarInfo();
      if (data) {
        setUserInfo(data);
        setUserEditForm({
          name: data.name || session?.user?.name || "",
          email: data.email || session?.user?.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Fetch company profile
  const fetchCompanyProfile = async () => {
    try {
      const data = await hamtaForetagsprofilAdmin();
      if (data) {
        setCompanyProfile(data);
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
    }
  };

  // Initialize data
  useEffect(() => {
    if (session?.user?.id) {
      Promise.all([fetchUserInfo(), fetchCompanyProfile()]).finally(() => setLoading(false));
    }
  }, [session]);

  // User handlers
  const handleEditUser = () => {
    setIsEditingUser(true);
    setUserEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
    });
    setUserMessage(null);
  };

  const handleCancelUser = () => {
    setIsEditingUser(false);
    setUserEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
    });
    setUserMessage(null);
  };

  const handleSaveUser = async () => {
    if (!userEditForm.name.trim() || !userEditForm.email.trim()) {
      setUserMessage({ type: "error", text: "Alla fält måste fyllas i" });
      return;
    }

    setIsSavingUser(true);
    try {
      const formData = new FormData();
      formData.append("name", userEditForm.name.trim());
      formData.append("email", userEditForm.email.trim());

      const result = await uppdateraAnvandarInfo(formData);

      if (result.success) {
        setUserInfo(result.user || null);
        setIsEditingUser(false);
        setUserMessage({ type: "success", text: "Användarinformation uppdaterad!" });
      } else {
        setUserMessage({ type: "error", text: result.error || "Ett fel uppstod" });
      }
    } catch (error) {
      setUserMessage({ type: "error", text: "Ett oväntat fel uppstod" });
    } finally {
      setIsSavingUser(false);
    }
  };

  const updateUserForm = (field: keyof AnvandarRedigeringsFormular, value: string) => {
    setUserEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Company handlers
  const handleEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const handleCancelCompany = () => {
    setIsEditingCompany(false);
    fetchCompanyProfile(); // Reset to original data
    setCompanyMessage(null);
  };

  const handleSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const formData = new FormData();
      Object.entries(companyProfile).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const result = await uppdateraForetagsprofilAdmin(formData);

      if (result.success) {
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Företagsprofil uppdaterad!" });
        await fetchCompanyProfile();
      } else {
        setCompanyMessage({ type: "error", text: result.error || "Ett fel uppstod" });
      }
    } catch (error) {
      setCompanyMessage({ type: "error", text: "Ett oväntat fel uppstod" });
    } finally {
      setIsSavingCompany(false);
    }
  };

  const updateCompanyForm = (field: keyof ForetagsProfil, value: string) => {
    setCompanyProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Delete handlers
  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      const result = await raderaForetag();

      if (result.success) {
        await signOut({ callbackUrl: "/" });
      } else {
        console.error("Delete error:", result.error);
      }
    } catch (error) {
      console.error("Unexpected delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return {
    // Auth
    auth: {
      session,
      status,
      isLoading,
      isAuthenticated,
      user: session?.user,
    },

    // User profile - structured for component props
    userProfile: {
      userInfo,
      editForm: userEditForm,
      state: {
        isEditing: isEditingUser,
        isSaving: isSavingUser,
        message: userMessage,
      },
      session,
      handlers: {
        handleEdit: handleEditUser,
        handleCancel: handleCancelUser,
        handleSave: handleSaveUser,
        updateEditForm: updateUserForm,
      },
    },

    // Company profile - structured for component props
    companyProfile: {
      foretagsProfil: companyProfile,
      state: {
        isEditingCompany,
        isSavingCompany,
        companyMessage,
      },
      handlers: {
        handleEditCompany,
        handleCancelCompany,
        handleSaveCompany,
        handleCompanyInputChange: updateCompanyForm,
      },
    },

    // Delete confirmation - structured for component props
    deleteConfirmation: {
      state: {
        showDeleteConfirm,
        isDeleting,
      },
      handlers: {
        handleDeleteCompany,
        confirmDelete,
        cancelDelete,
      },
    },

    // Global loading state
    isLoading: isLoading || loading,
  };
};

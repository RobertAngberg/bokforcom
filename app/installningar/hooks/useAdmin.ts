"use client";

import { useState } from "react";
import { signOut } from "../../_lib/auth-client";
import { uppdateraAnvandarInfo } from "../actions/anvandarprofilActions";
import { uppdateraForetagsprofilAdmin } from "../actions/foretagsprofilActions";
import { raderaForetag } from "../actions/farozonActions";
import { uploadLogoAction } from "../../faktura/actions/foretagActions";
import { TOM_FORETAG } from "../types/types";
import type {
  AnvandarInfo,
  ForetagsProfil,
  AnvandarRedigeringsFormular,
  MeddelandeTillstand,
  UseAdminProps,
} from "../types/types";

export function useAdmin({ initialUser, initialForetagsInfo }: UseAdminProps) {
  // User state
  const [userInfo, setUserInfo] = useState<AnvandarInfo | null>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MeddelandeTillstand | null>(null);

  // Derive edit form from userInfo
  const editForm: AnvandarRedigeringsFormular = {
    name: userInfo?.name || "",
    email: userInfo?.email || "",
  };

  // Company state
  const [foretagsInfo, setForetagsInfo] = useState<ForetagsProfil | null>(initialForetagsInfo);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MeddelandeTillstand | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Derive company profile from foretagsInfo
  const foretagsProfil: ForetagsProfil = foretagsInfo || TOM_FORETAG;

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local editing state for forms
  const [localEditForm, setLocalEditForm] = useState<AnvandarRedigeringsFormular>(editForm);
  const [localForetagsProfil, setLocalForetagsProfil] = useState<ForetagsProfil>(foretagsProfil);

  // User profile handlers
  const onEditUser = () => {
    setLocalEditForm(editForm);
    setIsEditing(true);
    setMessage(null);
  };

  const onCancelUser = () => {
    setIsEditing(false);
    setLocalEditForm(editForm);
    setMessage(null);
  };

  const onSaveUser = async () => {
    if (!localEditForm.name.trim() || !localEditForm.email.trim()) {
      setMessage({ type: "error", text: "Namn och email far inte vara tomma" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await uppdateraAnvandarInfo({
        name: localEditForm.name.trim(),
        email: localEditForm.email.trim(),
      });
      if (result.success) {
        setUserInfo(result.user!);
        setIsEditing(false);
        setMessage({ type: "success", text: "Anvandarinformation uppdaterad!" });
      } else {
        setMessage({ type: "error", text: result.error || "Kunde inte uppdatera information" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
    } finally {
      setIsSaving(false);
    }
  };

  const onChangeUser = (field: keyof AnvandarRedigeringsFormular, value: string) => {
    setLocalEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearUserMessage = () => setMessage(null);

  // Company profile handlers
  const onEditCompany = () => {
    setLocalForetagsProfil(foretagsProfil);
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const onCancelCompany = () => {
    setIsEditingCompany(false);
    setLocalForetagsProfil(foretagsProfil);
    setCompanyMessage(null);
  };

  const persistCompanyProfile = async (profil: ForetagsProfil) => {
    try {
      const result = await uppdateraForetagsprofilAdmin({ ...profil });
      if (result.success) {
        const uppdaterad = {
          ...profil,
          ...(result.data ?? {}),
          logoWidth: profil.logoWidth ?? result.data?.logoWidth ?? 200,
        };
        setForetagsInfo(uppdaterad);
        return { success: true as const, data: uppdaterad };
      }
      setCompanyMessage({
        type: "error",
        text: result.error || "Kunde inte uppdatera företagsprofil",
      });
      return { success: false as const, data: null };
    } catch (error) {
      console.error("Error updating company profile:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
      return { success: false as const, data: null };
    }
  };

  const onSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const result = await persistCompanyProfile({ ...localForetagsProfil });
      if (result.success) {
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Företagsprofil uppdaterad!" });
      }
    } finally {
      setIsSavingCompany(false);
    }
  };

  const normalizeCompanyField = (field: keyof ForetagsProfil, value: string): string => {
    if (field === "postnummer") {
      const digits = value.replace(/\D/g, "").slice(0, 5);
      return digits.length > 3 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
    }
    if (field === "organisationsnummer") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      if (digits.length <= 6) return digits;
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    if (field === "momsregistreringsnummer") {
      let v = value.toUpperCase().replace(/\s/g, "");
      if (/^[0-9]{12}$/.test(v)) v = `SE${v}`;
      if (!/^SE[0-9]{0,12}$/.test(v)) {
        if (v.startsWith("SE")) {
          v = "SE" + v.slice(2).replace(/[^0-9]/g, "");
        } else {
          v = v.replace(/[^0-9]/g, "");
          if (v.length > 0) v = `SE${v}`;
        }
      }
      return v.slice(0, 14);
    }
    return value;
  };

  const onChangeCompany = (field: keyof ForetagsProfil, value: string) => {
    const normalized = normalizeCompanyField(field, value);
    setLocalForetagsProfil((prev) => ({ ...prev, [field]: normalized }));
  };

  const clearCompanyMessage = () => setCompanyMessage(null);

  const onUploadLogo = async (file: File) => {
    setIsUploadingLogo(true);
    setCompanyMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResult = await uploadLogoAction(formData);
      if (!uploadResult.success || !uploadResult.url) {
        setCompanyMessage({
          type: "error",
          text: uploadResult.error || "Kunde inte ladda upp logotyp",
        });
        return;
      }

      const persistedProfil = foretagsInfo || TOM_FORETAG;
      const uppdateradProfil: ForetagsProfil = {
        ...persistedProfil,
        logo: uploadResult.url,
        logoWidth: persistedProfil.logoWidth ?? 200,
      };

      const success = await persistCompanyProfile(uppdateradProfil);
      if (!success.success || !success.data) {
        return;
      }

      setLocalForetagsProfil((prev) => ({ ...prev, logo: uploadResult.url ?? "" }));
      setCompanyMessage({ type: "success", text: "Logotyp uppdaterad!" });
    } catch (error) {
      console.error("Error uploading logo:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid uppladdning" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onRemoveLogo = async () => {
    if (!foretagsInfo?.logo) {
      setCompanyMessage({ type: "error", text: "Ingen logotyp att ta bort" });
      return;
    }

    setIsUploadingLogo(true);
    setCompanyMessage(null);
    try {
      const persistedProfil = foretagsInfo || TOM_FORETAG;
      const uppdateradProfil: ForetagsProfil = {
        ...persistedProfil,
        logo: "",
      };

      const success = await persistCompanyProfile(uppdateradProfil);
      if (!success.success) {
        return;
      }

      setLocalForetagsProfil((prev) => ({ ...prev, logo: "" }));
      setCompanyMessage({ type: "success", text: "Logotyp borttagen" });
    } catch (error) {
      console.error("Error removing logo:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid borttagning" });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Danger zone handlers
  const onConfirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const onCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const onDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      const result = await raderaForetag();

      if (result.success) {
        await signOut();
        window.location.href = "/";
      } else {
        console.error("Delete error:", result.error);
      }
    } catch (error) {
      console.error("Unexpected delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // User profile
    user: {
      state: {
        userInfo,
        editForm: isEditing ? localEditForm : editForm,
        isEditing,
        isSaving,
        message,
      },
      actions: {
        setEditForm: setLocalEditForm,
        setIsEditing,
        setIsSaving,
        setMessage,
      },
      handlers: {
        onEdit: onEditUser,
        onCancel: onCancelUser,
        onSave: onSaveUser,
        onChange: onChangeUser,
        clearMessage: clearUserMessage,
      },
    },

    // Company profile
    company: {
      state: {
        foretagsProfil: isEditingCompany ? localForetagsProfil : foretagsProfil,
        isEditingCompany,
        isSavingCompany,
        companyMessage,
        isUploadingLogo,
      },
      actions: {
        setForetagsProfil: setLocalForetagsProfil,
        setIsEditingCompany,
        setIsSavingCompany,
        setCompanyMessage,
        setIsUploadingLogo,
      },
      handlers: {
        onEditCompany,
        onCancelCompany,
        onSaveCompany,
        onChangeCompany,
        clearCompanyMessage,
        onUploadLogo,
        onRemoveLogo,
      },
    },

    // Danger zone
    dangerZone: {
      state: {
        showDeleteConfirm,
        isDeleting,
      },
      handlers: {
        onConfirm: onConfirmDelete,
        onCancel: onCancelDelete,
        onDeleteCompany,
      },
    },
  };
}

"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { uppdateraAnvändarInfo } from "../actions/anvandarprofilActions";
import { uppdateraFöretagsprofilAdmin } from "../actions/foretagsprofilActions";
import { raderaFöretag } from "../actions/farozonActions";
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
  const [editForm, setEditForm] = useState<AnvandarRedigeringsFormular>(() => ({
    name: initialUser?.name || "",
    email: initialUser?.email || "",
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MeddelandeTillstand | null>(null);

  // Company state
  const [foretagsInfo, setForetagsInfo] = useState<ForetagsProfil | null>(initialForetagsInfo);
  const [foretagsProfil, setForetagsProfil] = useState<ForetagsProfil>(
    initialForetagsInfo || TOM_FORETAG
  );
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState<MeddelandeTillstand | null>(null);

  // Danger zone state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update form when userInfo changes (but not during editing to preserve user changes)
  useEffect(() => {
    if (userInfo && !isEditing) {
      setEditForm({
        name: userInfo.name || "",
        email: userInfo.email || "",
      });
    }
  }, [userInfo, isEditing]);

  // Update local company state when initial data changes (but not during editing to preserve user changes)
  useEffect(() => {
    if (!isEditingCompany) {
      setForetagsProfil(foretagsInfo || TOM_FORETAG);
    }
  }, [foretagsInfo, isEditingCompany]);

  // User profile handlers
  const onEditUser = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const onCancelUser = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || "",
      email: userInfo?.email || "",
    });
    setMessage(null);
  };

  const onSaveUser = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage({ type: "error", text: "Namn och email far inte vara tomma" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await uppdateraAnvändarInfo({
        name: editForm.name.trim(),
        email: editForm.email.trim(),
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
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearUserMessage = () => setMessage(null);

  // Company profile handlers
  const onEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyMessage(null);
  };

  const onCancelCompany = () => {
    setIsEditingCompany(false);
    setForetagsProfil(foretagsInfo || TOM_FORETAG);
    setCompanyMessage(null);
  };

  const onSaveCompany = async () => {
    setIsSavingCompany(true);
    try {
      const result = await uppdateraFöretagsprofilAdmin({ ...foretagsProfil });
      if (result.success) {
        setForetagsInfo(foretagsProfil);
        setIsEditingCompany(false);
        setCompanyMessage({ type: "success", text: "Foretagsprofil uppdaterad!" });
      } else {
        setCompanyMessage({
          type: "error",
          text: result.error || "Kunde inte uppdatera foretagsprofil",
        });
      }
    } catch (error) {
      console.error("Error updating company profile:", error);
      setCompanyMessage({ type: "error", text: "Ett fel uppstod vid uppdatering" });
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
    setForetagsProfil((prev) => ({ ...prev, [field]: normalized }));
  };

  const clearCompanyMessage = () => setCompanyMessage(null);

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
      const result = await raderaFöretag();

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

  return {
    // User profile
    user: {
      state: {
        userInfo,
        editForm,
        isEditing,
        isSaving,
        message,
      },
      actions: {
        setEditForm,
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
        foretagsProfil,
        isEditingCompany,
        isSavingCompany,
        companyMessage,
      },
      actions: {
        setForetagsProfil,
        setIsEditingCompany,
        setIsSavingCompany,
        setCompanyMessage,
      },
      handlers: {
        onEditCompany,
        onCancelCompany,
        onSaveCompany,
        onChangeCompany,
        clearCompanyMessage,
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

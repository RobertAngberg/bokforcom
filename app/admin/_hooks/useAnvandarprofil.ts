"use client";

import { useState, useEffect } from "react";
import { uppdateraAnvandarInfo } from "../_actions/anvandarprofilActions";
import { useAdminStore } from "../_stores/adminStore";
import type { AnvandarRedigeringsFormular, MeddelandeTillstand } from "../_types/types";

export function useAnvandarprofil() {
  const { userInfo, setUserInfo } = useAdminStore();

  const [editForm, setEditForm] = useState<AnvandarRedigeringsFormular>(() => ({
    name: userInfo?.name || "",
    email: userInfo?.email || "",
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MeddelandeTillstand | null>(null);

  // Update form when userInfo changes (but not during editing to preserve user changes)
  useEffect(() => {
    if (userInfo && !isEditing) {
      setEditForm({
        name: userInfo.name || "",
        email: userInfo.email || "",
      });
    }
  }, [userInfo, isEditing]);

  const onEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const onCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || "",
      email: userInfo?.email || "",
    });
    setMessage(null);
  };

  const onSave = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage({ type: "error", text: "Namn och email far inte vara tomma" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await uppdateraAnvandarInfo({
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

  const onChange = (field: keyof AnvandarRedigeringsFormular, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const clearMessage = () => setMessage(null);

  return {
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
      onEdit,
      onCancel,
      onSave,
      onChange,
      clearMessage,
    },
  };
}

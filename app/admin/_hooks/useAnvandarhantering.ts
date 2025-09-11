"use client";

import { useState } from "react";
import { uppdateraAnvandarInfo } from "../_actions/anvandarActions";
import type {
  AnvandarInfo,
  AnvandarRedigeringsFormular,
  MeddelandeTillstand,
} from "../_types/types";

export function useAdminAnvandarhantering(initialUser: AnvandarInfo | null) {
  // State management (initial data injiceras server-side)
  const [userInfo, setUserInfo] = useState<AnvandarInfo | null>(initialUser);
  const [editForm, setEditForm] = useState<AnvandarRedigeringsFormular>(() => ({
    name: initialUser?.name || "",
    email: initialUser?.email || "",
  }));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MeddelandeTillstand | null>(null);

  // 🎯 Public API methods
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
    // Validation
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage({
        type: "error",
        text: "Namn och email far inte vara tomma",
      });
      return;
    }

    setIsSaving(true);

    try {
      const result = await uppdateraAnvandarInfo({
        name: editForm.name.trim(),
        email: editForm.email.trim(),
      });

      if (result.success) {
        // Optimistic update
        setUserInfo(result.user!);
        setIsEditing(false);
        setMessage({
          type: "success",
          text: "Anvandarinformation uppdaterad!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Kunde inte uppdatera information",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({
        type: "error",
        text: "Ett fel uppstod vid uppdatering",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onChange = (field: keyof AnvandarRedigeringsFormular, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearMessage = () => setMessage(null);

  return {
    // Data
    userInfo,
    editForm,

    // State
    isEditing,
    isSaving,
    message,

    // Actions
    onEdit,
    onCancel,
    onSave,
    onChange,
    clearMessage,
  };
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { hamtaAnvandarInfo, uppdateraAnvandarInfo } from "../_actions/anvandarActions";
import type {
  AnvandarInfo,
  AnvandarRedigeringsFormular,
  MeddelandeTillstand,
} from "../_types/types";

export function useAdminAnvandarhantering() {
  const { data: session } = useSession();

  // State management
  const [userInfo, setUserInfo] = useState<AnvandarInfo | null>(null);
  const [editForm, setEditForm] = useState<AnvandarRedigeringsFormular>({
    name: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<MeddelandeTillstand | null>(null);

  // 🚀 Data fetching effect
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserInfo();
    }
  }, [session]);

  // 🎯 Private methods
  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const data = await hamtaAnvandarInfo();

      if (data) {
        setUserInfo(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      setMessage({
        type: "error",
        text: "Kunde inte hamta anvandarinformation",
      });
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Public API methods
  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || "",
      email: userInfo?.email || "",
    });
    setMessage(null);
  };

  const handleSave = async () => {
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
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("email", editForm.email.trim());

      const result = await uppdateraAnvandarInfo(formData);

      if (result.success) {
        // Optimistic update
        setUserInfo(result.user!);
        setIsEditing(false);
        setMessage({
          type: "success",
          text: "Anvandarinformation uppdaterad!",
        });

        // Session refresh
        window.location.reload();
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

  const updateEditForm = (field: keyof AnvandarRedigeringsFormular, value: string) => {
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
    loading,
    message,

    // Actions
    handleEdit,
    handleCancel,
    handleSave,
    updateEditForm,
    clearMessage,
  };
}

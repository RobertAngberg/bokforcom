"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { hamtaAnvandarInfo, uppdateraAnvandarInfo } from "../_actions/anvandarActions";
import type { UserInfo, UserEditForm, MessageState } from "../_types/types";

export const useUserProfile = () => {
  const { data: session } = useSession();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [editForm, setEditForm] = useState<UserEditForm>({
    name: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async () => {
    try {
      const data = await hamtaAnvandarInfo();
      if (data) {
        setUserInfo(data);
        setEditForm({
          name: data.name || session?.user?.name || "",
          email: data.email || session?.user?.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
    });
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userInfo?.name || session?.user?.name || "",
      email: userInfo?.email || session?.user?.email || "",
    });
    setMessage(null);
  };

  const handleSave = async () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setMessage({ type: "error", text: "Alla fält måste fyllas i" });
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("email", editForm.email.trim());

      const result = await uppdateraAnvandarInfo(formData);

      if (result.success) {
        setUserInfo(result.user || null);
        setIsEditing(false);
        setMessage({ type: "success", text: "Användarinformation uppdaterad!" });
      } else {
        setMessage({ type: "error", text: result.error || "Ett fel uppstod" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ett oväntat fel uppstod" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditForm = (field: keyof UserEditForm, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  return {
    // Data
    userInfo,
    editForm,
    session,

    // State grupperat
    state: {
      isEditing,
      isSaving,
      message,
    },

    // Handlers grupperat
    handlers: {
      handleEdit,
      handleCancel,
      handleSave,
      updateEditForm,
    },

    // Intern state (för admin page)
    loading,
    fetchUserInfo,
    setMessage,
  };
};

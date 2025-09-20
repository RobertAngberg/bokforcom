"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { raderaFöretag } from "../_actions/farozonActions";

export const useFarozon = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCompany = async () => {
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

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return {
    showDeleteConfirm,
    isDeleting,
    onDeleteCompany: handleDeleteCompany,
    onConfirm: confirmDelete,
    onCancel: cancelDelete,
  };
};

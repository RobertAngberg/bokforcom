"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { raderaForetag } from "../_actions";

export const useDeleteConfirmation = () => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCompany = async () => {
    setIsDeleting(true);
    try {
      const result = await raderaForetag();

      if (result.success) {
        // Success - user will be logged out automatically
        await signOut({ callbackUrl: "/" });
      } else {
        console.error("Delete error:", result.error);
        // Keep modal open on error so user can try again
      }
    } catch (error) {
      console.error("Unexpected delete error:", error);
      // Keep modal open on error
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
    // State
    showDeleteConfirm,
    isDeleting,

    // Actions
    handleDeleteCompany,
    confirmDelete,
    cancelDelete,
    setShowDeleteConfirm,
  };
};

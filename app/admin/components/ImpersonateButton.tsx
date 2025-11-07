"use client";

import { impersonateUser } from "../actions/impersonation";
import { useState } from "react";

interface ImpersonateButtonProps {
  userId: string;
  userName: string;
}

export default function ImpersonateButton({ userId, userName }: ImpersonateButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!confirm(`Är du säker på att du vill impersonera ${userName}?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await impersonateUser(userId);
      if (result.success) {
        // Redirect to start page as the impersonated user
        window.location.href = result.redirectUrl || "/start";
      } else {
        alert(`Error: ${result.error}`);
        setLoading(false);
      }
    } catch (error) {
      alert("Failed to impersonate user");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      disabled={loading}
      className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      title="Impersonera användare"
    >
      {loading ? "..." : "👤 Impersonate"}
    </button>
  );
}

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
      className="text-white hover:text-slate-300 disabled:opacity-50"
    >
      {loading ? "..." : "Impersonate"}
    </button>
  );
}

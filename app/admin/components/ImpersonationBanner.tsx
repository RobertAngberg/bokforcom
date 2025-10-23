"use client";

import { stopImpersonation } from "../actions/impersonation";
import { useState } from "react";

interface ImpersonationBannerProps {
  targetUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

export default function ImpersonationBanner({ targetUser }: ImpersonationBannerProps) {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    try {
      const result = await stopImpersonation();
      if (result.success) {
        window.location.href = "/admin";
      } else {
        alert(`Error: ${result.error}`);
        setLoading(false);
      }
    } catch (error) {
      alert("Failed to stop impersonation");
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-3 rounded-lg shadow-lg z-[9999] max-w-xs">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">👤</span>
          <span className="font-semibold text-sm">
            Impersonating: {targetUser.name || targetUser.email}
          </span>
        </div>
        <button
          onClick={handleStop}
          disabled={loading}
          className="bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 disabled:opacity-50 font-medium"
        >
          {loading ? "..." : "Stop Impersonation"}
        </button>
      </div>
    </div>
  );
}

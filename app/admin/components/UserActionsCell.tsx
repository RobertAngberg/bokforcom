"use client";

import { useState } from "react";
import ImpersonateButton from "./ImpersonateButton";
import EmailModal from "./EmailModal";

interface UserActionsCellProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export default function UserActionsCell({ userId, userName, userEmail }: UserActionsCellProps) {
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setEmailModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors font-medium shadow-sm hover:shadow-md"
          title="Skicka email till användare"
        >
          📧 Email
        </button>
        <ImpersonateButton userId={userId} userName={userName || userEmail} />
      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
        userName={userName || undefined}
      />
    </>
  );
}

"use client";

import { signOut, useSession } from "next-auth/react";
import React from "react";

function LogoutButton() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="flex items-center justify-end text-white md:fixed md:right-0 md:top-1 md:m-4">
      <span className="hidden mr-6 md:inline md:-mt-1">{session.user?.name}</span>
      <button
        onClick={async () => {
          // FÖRST döda NextAuth sessionen
          await signOut({ redirect: false });
          // SEN tvinga redirect med cache-clearing
          window.location.replace("/login");
        }}
        className="px-4 py-2 font-bold text-white transition duration-300 bg-transparent border border-white rounded hover:bg-white hover:bg-opacity-20"
      >
        Logga ut
      </button>
    </div>
  );
}

export { LogoutButton };

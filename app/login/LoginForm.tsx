"use client";

import { signIn } from "next-auth/react";

export default function LoginForm() {
  const handleGoogleSignIn = () => {
    // Använd samma approach som fungerar på root-sidan
    signIn("google");
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full px-6 py-3 font-semibold text-black bg-white rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
    >
      🔒 Logga in med Google
    </button>
  );
}

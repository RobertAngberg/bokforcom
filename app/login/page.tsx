import { signIn } from "../../auth";
import React from "react";

// SÄKERHETSVALIDERING: Secure login component
export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-center">Säker Inloggning</h1>

        {/* SÄKERHET: Säker Google OAuth form */}
        <form
          action={async () => {
            "use server";
            try {
              console.log("🔐 Initierar säker Google OAuth inloggning");
              await signIn("google", {
                redirectTo: "/start", // SÄKERHET: Explicit redirect efter inloggning
                redirect: true,
              });
            } catch (error) {
              console.error("🚨 Inloggningsfel:", error);
              // I produktion: logga till säkerhetssystem
            }
          }}
        >
          <button
            type="submit"
            className="w-full px-6 py-3 font-semibold text-black bg-white rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            🔒 Logga in med Google
          </button>
        </form>

        {/* SÄKERHET: Säkerhetsinformation */}
        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>🔐 Säker OAuth 2.0 autentisering</p>
          <p>🛡️ Dina uppgifter skyddas med bankstandard</p>
        </div>
      </div>
    </div>
  );
}

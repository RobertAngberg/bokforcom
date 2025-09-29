"use client";

import { useState } from "react";
import TextFalt from "../../_components/TextFalt";
import { authClient } from "../../_lib/auth-client";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  // Form state for TextFalt
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/login/reset-password",
      });

      if (error) {
        setError(error.message || "Kunde inte skicka återställningsmall");
      } else {
        setSuccess(true);
        setMessage("Ett mail med återställningslänk har skickats till din email!");
      }
    } catch (err) {
      setError("Något gick fel. Försök igen.");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <h3 className="text-green-300 font-semibold mb-2">✅ Mail skickat!</h3>
          <p className="text-green-200 text-sm">{message}</p>
        </div>
        <button
          onClick={onBackToLogin}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Tillbaka till login
        </button>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <p className="text-slate-300 text-sm mb-4">
            Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord.
          </p>
          <TextFalt
            label="E-postadress"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-postadress"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input type="hidden" name="email" value={email} />
        </div>

        {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-md transition-all duration-200"
        >
          {loading ? "Skickar..." : "Skicka återställningslänk"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={onBackToLogin}
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          Tillbaka till login
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { requestPasswordReset } from "../actions";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await requestPasswordReset(formData);

      if (result.success) {
        setSuccess(true);
        setMessage(result.message || "");
      } else {
        setError(result.error || "Något gick fel");
      }
    } catch (error) {
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-slate-300 text-sm mb-4">
            Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord.
          </p>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-postadress"
            autoComplete="email"
            className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50"
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

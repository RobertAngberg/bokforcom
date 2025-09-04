"use client";

import { useState } from "react";

interface EmailSignupFormProps {
  onSuccess?: () => void;
}

export default function EmailSignupForm({ onSuccess }: EmailSignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setError("");
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || "Registrering misslyckades");
      }
    } catch (error) {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="p-4 bg-green-900/50 border border-green-500 rounded-lg">
          <h3 className="text-green-300 font-semibold mb-2">✅ Registrering lyckades!</h3>
          <p className="text-green-200 text-sm">
            Ett verifieringsmail har skickats till <strong>{email}</strong>.
            <br />
            Kontrollera din inkorg och klicka på länken för att verifiera ditt konto.
          </p>
        </div>
        <p className="text-slate-400 text-sm">
          Efter verifiering kan du logga in med dina uppgifter.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleEmailSignup} className="space-y-3">
      <div>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ditt namn"
          autoComplete="name"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-postadress"
          autoComplete="email"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord (minst 8 tecken)"
          autoComplete="new-password"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        {loading ? "Registrerar..." : "Registrera konto"}
      </button>
      <p className="text-slate-400 text-xs text-center">
        Genom att registrera dig godkänner du våra användarvillkor.
      </p>
    </form>
  );
}

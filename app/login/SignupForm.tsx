"use client";

import { useState } from "react";
import AnvändaravtalModal from "../start/AnvändaravtalModal";

interface SignupFormProps {
  onSuccess: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError("Du måste godkänna användaravtalet för att fortsätta");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Konto skapat! Du kan nu logga in.");
        onSuccess();
      } else {
        setError(data.error || "Något gick fel");
      }
    } catch (error) {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Företagsnamn"
          autoComplete="organization"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord (minst 6 tecken)"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Bekräfta lösenord"
          autoComplete="new-password"
          className="w-full px-4 py-3 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Användaravtal checkbox */}
      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="acceptTerms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          required
          className="mt-1 w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <label htmlFor="acceptTerms" className="text-sm text-slate-300">
          Jag godkänner{" "}
          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            användaravtalet
          </button>{" "}
          och bekräftar att jag har läst och förstått villkoren
        </label>
      </div>

      {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || !acceptedTerms}
        className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Skapar konto..." : "Skapa konto"}
      </button>

      {/* Användaravtal Modal */}
      <AnvändaravtalModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </form>
  );
}

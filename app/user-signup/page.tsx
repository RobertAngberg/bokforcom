"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UserSignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
        router.push("/login?message=Konto skapat! Logga in med dina uppgifter.");
      } else {
        setError(data.error || "Något gick fel");
      }
    } catch (error) {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-center">Skapa Användarkonto</h1>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fullständigt namn"
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
              className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord (minst 6 tecken)"
              className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Bekräfta lösenord"
              className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            {loading ? "Skapar konto..." : "📝 Skapa användarkonto"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Har du redan ett konto?{" "}
            <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
              Logga in här
            </a>
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>🔐 Dina uppgifter krypteras säkert</p>
          <p>🛡️ Vi sparar aldrig lösenord i klartext</p>
        </div>
      </div>
    </div>
  );
}

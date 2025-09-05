"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EpostRegistrering from "./SignUp";

function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowResendVerification(false);

    try {
      // Kolla först om användaren är verifierad
      const checkResponse = await fetch("/api/auth/check-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.error === "EMAIL_NOT_VERIFIED") {
          setError(
            "Din email är inte verifierad än. Kontrollera din inkorg och klicka på verifieringslänken."
          );
          setShowResendVerification(true);
          setLoading(false);
          return;
        } else if (checkResponse.status === 429) {
          setError("För många försök. Vänta en stund innan du försöker igen.");
          setLoading(false);
          return;
        } else if (checkData.error === "INVALID_CREDENTIALS") {
          setError("Fel e-post eller lösenord");
          setLoading(false);
          return;
        }
      }

      // Om verifierad, gör vanlig login
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/",
        redirect: false,
      });

      if (result?.error) {
        setError("Fel e-post eller lösenord");
      } else if (result?.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      setError("Något gick fel. Prova igen.");
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setError("Ett nytt verifieringsmail har skickats till din email!");
        setShowResendVerification(false);
      } else {
        setError(data.error || "Kunde inte skicka verifieringsmail");
      }
    } catch (error) {
      setError("Något gick fel. Försök igen.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-3">
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
          placeholder="Lösenord"
          autoComplete="current-password"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && (
        <div className="text-center text-sm text-red-400 mt-2">
          {error}
          {showResendVerification && (
            <div className="mt-2">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 underline text-sm"
              >
                Skicka nytt verifieringsmail
              </button>
            </div>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
      >
        {loading ? "Loggar in..." : "Logga in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [verificationMessage, setVerificationMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      router.push("/");
    }

    // Kolla för verified query parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") === "true") {
      setVerificationMessage("✅ Din email har verifierats! Du kan nu logga in.");
      // Ta bort query parameter från URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [session, router]);

  if (status === "loading" || session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Laddar...</div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-800 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="w-full max-w-md p-8 bg-slate-900/95 rounded-2xl shadow-2xl drop-shadow-2xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Välkommen!</h1>
        </div>

        {verificationMessage && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-green-300 text-sm text-center">
            {verificationMessage}
          </div>
        )}

        <div className="relative flex mb-8 bg-slate-700 rounded-xl p-1.5">
          <div
            className={`absolute top-1.5 bottom-1.5 w-1/2 bg-blue-500 rounded-lg transition-all duration-500 ease-in-out ${
              activeTab === "signup" ? "translate-x-[calc(100%-0.75rem)]" : ""
            }`}
          />

          <button
            onClick={() => setActiveTab("login")}
            className={`relative flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === "login" ? "text-white font-bold" : "text-slate-300 hover:text-white"
            }`}
          >
            Logga in
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`relative flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === "signup" ? "text-white font-bold" : "text-slate-300 hover:text-white"
            }`}
          >
            Registrera
          </button>
        </div>

        <div className="relative">
          <div
            className={`transition-all duration-400 ease-in-out ${
              activeTab === "login"
                ? "opacity-100 translate-y-0 delay-200"
                : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
            }`}
          >
            <h2 className="mb-6 text-xl font-bold text-center text-white">Välkommen!</h2>

            <div className="mb-6">
              <EmailLoginForm />
            </div>
          </div>

          <div
            className={`transition-all duration-400 ease-in-out ${
              activeTab === "signup"
                ? "opacity-100 translate-y-0 delay-200"
                : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
            }`}
          >
            <h2 className="mb-6 text-xl font-bold text-center text-white">Skapa konto</h2>
            <EpostRegistrering
              onSuccess={undefined}
              onSwitchToLogin={() => setActiveTab("login")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

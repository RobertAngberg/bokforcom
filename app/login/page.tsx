"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EpostRegistrering from "./SignUp";
import ForgotPassword from "./reset-password/ForgotPassword";
import { useRememberMe } from "./_utils/rememberMe";
import { authClient } from "../_lib/auth-client";
import TextFalt from "../_components/TextFalt";

function EmailLoginForm({ onShowForgotPassword }: { onShowForgotPassword: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { rememberMe, setRememberMe } = useRememberMe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowResendVerification(false);

    try {
      // Better Auth hanterar email verification automatiskt
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: "/",
      });

      if (error) {
        if (error.status === 403) {
          // Email inte verifierad
          setError(
            "Din email är inte verifierad än. Kontrollera din inkorg och klicka på verifieringslänken."
          );
          setShowResendVerification(true);
        } else if (error.status === 429) {
          setError("För många försök. Vänta en stund innan du försöker igen.");
        } else {
          setError("Fel e-post eller lösenord");
        }
      } else if (data) {
        // Lyckad inloggning - Better Auth hanterar redirect
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
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/",
      });

      if (error) {
        setError(error.message || "Kunde inte skicka verifieringsmail");
      } else {
        setError("Ett nytt verifieringsmail har skickats till din email!");
        setShowResendVerification(false);
      }
    } catch (error) {
      setError("Något gick fel. Försök igen.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleEmailSignIn} className="space-y-1">
      <div>
        <TextFalt
          label="E-postadress"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-postadress"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <TextFalt
          label="Lösenord"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Lösenord"
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center -mb-3 pb-8">
        <input
          type="checkbox"
          id="rememberMe"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-4 w-4 text-green-600 bg-slate-800 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
        />
        <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-300 cursor-pointer">
          Kom ihåg mig (30 dagar)
        </label>
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

      <div className="text-center">
        <button
          type="button"
          onClick={onShowForgotPassword}
          className="text-blue-400 hover:text-blue-300 underline text-sm"
        >
          Glömt lösenord?
        </button>
      </div>
    </form>
  );
}

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "forgot-password">("login");
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

    // Kolla för reset success parameter
    if (urlParams.get("reset") === "success") {
      setVerificationMessage(
        "✅ Ditt lösenord har uppdaterats! Du kan nu logga in med ditt nya lösenord."
      );
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
            <h2 className="mb-6 text-xl font-bold text-center text-white">
              Ange dina inloggningsuppgifter
            </h2>

            <div className="mb-6">
              <EmailLoginForm onShowForgotPassword={() => setActiveTab("forgot-password")} />
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

          <div
            className={`transition-all duration-400 ease-in-out ${
              activeTab === "forgot-password"
                ? "opacity-100 translate-y-0 delay-200"
                : "opacity-0 translate-y-4 pointer-events-none absolute inset-0"
            }`}
          >
            <h2 className="mb-6 text-xl font-bold text-center text-white">Återställ lösenord</h2>
            <ForgotPassword onBackToLogin={() => setActiveTab("login")} />
          </div>
        </div>
      </div>
    </div>
  );
}

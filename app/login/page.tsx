"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SignupForm from "./SignupForm";
import { useAnvändaravtalModal } from "../_components/AnvändaravtalModal";

function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
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
      {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
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
  const { openModal, AnvändaravtalModal } = useAnvändaravtalModal();

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  useEffect(() => {
    if (session?.user) {
      router.push("/");
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
      <div className="w-full max-w-md p-8 bg-slate-900/95 rounded-lg shadow-2xl drop-shadow-2xl backdrop-blur-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Välkommen tillbaka</h1>
        </div>

        <div className="relative flex mb-8 bg-slate-800 rounded-lg p-1">
          <div
            className={`absolute top-1 bottom-1 w-1/2 bg-blue-500 rounded-md transition-all duration-500 ease-in-out ${
              activeTab === "signup" ? "translate-x-full" : ""
            }`}
          />

          <button
            onClick={() => setActiveTab("login")}
            className={`relative z-10 flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === "login" ? "text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Logga in
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`relative z-10 flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === "signup" ? "text-white font-bold" : "text-gray-400 hover:text-white"
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
            <h2 className="mb-6 text-xl font-bold text-center text-white">Välkommen tillbaka</h2>

            <div className="mb-6">
              <EmailLoginForm />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900 text-gray-400">eller fortsätt med</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full px-6 py-3 font-semibold text-gray-800 bg-white rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                onClick={() => signIn("facebook", { callbackUrl: "/" })}
                className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
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
            <SignupForm onSuccess={() => setActiveTab("login")} />
          </div>
        </div>

        {/* Länk till användaravtal */}
        <div className="mt-6 text-center">
          <button
            onClick={openModal}
            className="text-sm text-gray-400 hover:text-white transition-colors underline"
          >
            📋 Användaravtal
          </button>
        </div>
      </div>

      <AnvändaravtalModal />
    </div>
  );
}

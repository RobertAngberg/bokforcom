"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// EmailLoginForm komponent
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
          className="w-full px-4 py-2 rounded-md bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {error && <div className="text-center text-sm text-red-400 mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
            clipRule="evenodd"
          />
        </svg>
        {loading ? "Loggar in..." : "� Logga in"}
      </button>
    </form>
  );
}

// SÄKERHETSVALIDERING: Secure login component
export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect om redan inloggad
  useEffect(() => {
    if (session?.user) {
      router.push("/");
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    // Använd samma approach som fungerar på root-sidan
    signIn("google", { callbackUrl: "/" });
  };

  // Visa loading om vi redirectar
  if (status === "loading" || session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <div className="w-full max-w-md p-8 bg-slate-900 rounded-lg shadow-xl">
        <h1 className="mb-6 text-3xl font-bold text-center">Säker Inloggning</h1>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {/* Google Login */}
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
            🔒 Fortsätt med Google
          </button>

          {/* Facebook Login */}
          <button
            onClick={() => signIn("facebook", { callbackUrl: "/" })}
            className="w-full px-6 py-3 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Fortsätt med Facebook
          </button>

          {/* Apple Login */}
          <EmailLoginForm />
        </div>

        {/* SÄKERHET: Säkerhetsinformation */}
        <div className="mt-6 text-sm text-gray-400 text-center">
          <p>🔐 Säker OAuth 2.0 autentisering</p>
          <p>🛡️ Dina uppgifter skyddas med bankstandard</p>
        </div>

        {/* Registreringslänk */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Har du inget konto?{" "}
            <a href="/user-signup" className="text-blue-400 hover:text-blue-300 underline">
              Registrera dig här
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

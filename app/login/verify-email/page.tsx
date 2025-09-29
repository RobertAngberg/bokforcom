"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Ingen verifieringstoken hittades i länken.");
      return;
    }

    const verifyEmail = async () => {
      try {
        // Better Auth hanterar verification via /api/auth/verify-email endpoint
        const response = await fetch(`/api/auth/verify-email?token=${token}`);

        if (response.ok) {
          setStatus("success");
          setMessage("Din email har verifierats! Du kommer att omdirigeras till login-sidan.");

          // Redirect efter 3 sekunder
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        } else {
          const data = await response.json();
          if (
            response.status === 400 &&
            (data.error?.includes("gått ut") || data.error?.includes("expired"))
          ) {
            setStatus("expired");
            setMessage("Verifieringslänken har gått ut. Du kan begära en ny länk nedan.");
          } else {
            setStatus("error");
            setMessage(data.error || "Verifieringen misslyckades.");
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("Ett fel uppstod vid verifiering. Försök igen.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    const email = prompt("Ange din email-adress för att få en ny verifieringslänk:");

    if (!email) return;

    try {
      // Använd Better Auth's send-verification-email endpoint
      const response = await fetch("/api/auth/send-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, callbackURL: "http://localhost:3000/test-auth" }),
      });

      if (response.ok) {
        setMessage("Ett nytt verifieringsmail har skickats!");
        setStatus("success");
      } else {
        const data = await response.json();
        setMessage(data.error || "Kunde inte skicka nytt mail.");
      }
    } catch (error) {
      setMessage("Ett fel uppstod. Försök igen.");
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-800 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <div className="w-full max-w-md p-8 bg-slate-900/95 rounded-2xl shadow-2xl backdrop-blur-sm">
        <div className="text-center">
          {status === "loading" && (
            <div>
              <div className="mb-4">
                <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
              <h2 className="text-2xl font-bold mb-4">Verifierar email...</h2>
              <p className="text-slate-300">Vänligen vänta medan vi verifierar din email-adress.</p>
            </div>
          )}

          {status === "success" && (
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">Email verifierad! ✅</h2>
              <p className="text-slate-300 mb-6">{message}</p>
              <Link
                href="/login?verified=true"
                className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              >
                Gå till login
              </Link>
            </div>
          )}

          {status === "expired" && (
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Länken har gått ut ⏰</h2>
              <p className="text-slate-300 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Skicka ny verifieringslänk
                </button>
                <Link
                  href="/login"
                  className="inline-block w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  Tillbaka till login
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div>
              <div className="mb-4">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Verifiering misslyckades ❌</h2>
              <p className="text-slate-300 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={handleResendVerification}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Skicka ny verifieringslänk
                </button>
                <Link
                  href="/login"
                  className="inline-block w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  Tillbaka till login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

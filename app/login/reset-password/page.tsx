"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ResetPassword from "./ResetPassword";

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");

    if (!tokenFromUrl) {
      setError("Ingen återställningstoken hittades i länken.");
      return;
    }

    setToken(tokenFromUrl);
  }, [searchParams]);

  const handleSuccess = () => {
    router.push("/login?reset=success");
  };

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-800 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        <div className="w-full max-w-md p-8 bg-slate-900/95 rounded-2xl shadow-2xl backdrop-blur-sm">
          <div className="text-center">
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
            <h2 className="text-2xl font-bold text-red-400 mb-4">Ogiltig länk</h2>
            <p className="text-slate-300 mb-6">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Tillbaka till login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
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
      <div className="w-full max-w-md p-8 bg-slate-900/95 rounded-2xl shadow-2xl backdrop-blur-sm">
        <ResetPassword token={token} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

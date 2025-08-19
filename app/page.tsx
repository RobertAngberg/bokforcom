"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Startsida from "./start/Startsida";
import { fetchRawYearData } from "./start/actions";
import { processYearData, getCurrentYear, YearSummary } from "./_utils/format";

export default function Page() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState<YearSummary | null>(null);

  // Ladda data när komponenten mountas (bara för inloggade)
  useEffect(() => {
    if (session?.user) {
      const loadData = async () => {
        const rawData = await fetchRawYearData(getCurrentYear());
        const processedData = processYearData(rawData);
        setInitialData(processedData);
      };
      loadData();
    }
  }, [session]);

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Laddar...</div>
      </div>
    );
  }

  // Icke-inloggad användare - visa bara Google login
  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <h1 className="mb-8 text-4xl font-bold text-center">Bokföringssystem</h1>
        <p className="mb-8 text-lg text-gray-300 text-center max-w-md">
          Välkommen till vårt professionella bokföringssystem. Logga in med ditt Google-konto för
          att komma igång.
        </p>
        <button
          onClick={() => signIn("google")}
          className="px-8 py-4 text-lg font-semibold text-black bg-white rounded-md hover:bg-gray-200 transition-colors"
        >
          Logga in med Google
        </button>
      </div>
    );
  }

  // Inloggad användare - visa dashboard
  return <>{initialData && <Startsida initialData={initialData} />}</>;
}

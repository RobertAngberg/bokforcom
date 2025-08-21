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

  // Icke-inloggad användare - redirecta till login-sida
  if (!session?.user) {
    window.location.href = "/login";
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-slate-950">
        <div className="text-xl">Redirectar till login...</div>
      </div>
    );
  }

  // Inloggad användare - visa dashboard
  return <>{initialData && <Startsida initialData={initialData} />}</>;
}

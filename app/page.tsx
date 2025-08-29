"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StartPage from "./start/page";
import LandingPage from "./LandingPage";
import { fetchRawYearData } from "./start/actions";
import { processYearData, getCurrentYear, YearSummary } from "./_utils/format";

export default function Page() {
  const { data: session, status } = useSession();
  const [initialData, setInitialData] = useState<YearSummary | null>(null);

  // Ladda data när komponenten mountas (bara för inloggade)
  useEffect(() => {
    if (session?.user) {
      const loadData = async () => {
        console.log("🔄 Loading initial data for current year:", getCurrentYear());
        const rawData = await fetchRawYearData(getCurrentYear());
        console.log("📊 Raw data received:", rawData?.length, "records");
        const processedData = processYearData(rawData);
        console.log("✅ Processed data:", processedData);
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

  // Icke-inloggad användare - visa landing page
  if (status === "unauthenticated" || !session) {
    return <LandingPage />;
  }

  // Inloggad användare - visa dashboard
  if (status === "authenticated" && session) {
    // Fallback data om initialData är null
    const fallbackData = initialData || {
      totalInkomst: 0,
      totalUtgift: 0,
      totalResultat: 0,
      yearData: [],
    };
    return <StartPage initialData={fallbackData} />;
  }

  return null;
}

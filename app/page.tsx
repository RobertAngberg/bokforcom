"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import Startsida from "./start/Startsida";
import { fetchRawYearData } from "./start/actions";

// Frontend data processing - samma som i Startsida.tsx
const processYearData = (rawData: any[]) => {
  const grouped: Record<string, { inkomst: number; utgift: number }> = {};
  let totalInkomst = 0;
  let totalUtgift = 0;

  rawData.forEach((row, i) => {
    const { transaktionsdatum, debet, kredit, kontonummer } = row;

    if (!transaktionsdatum || !kontonummer) {
      console.warn(`⚠️ Rad ${i + 1} saknar datum eller kontonummer:`, row);
      return;
    }

    const date = new Date(transaktionsdatum);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;

    const deb = Number(debet ?? 0);
    const kre = Number(kredit ?? 0);
    const prefix = kontonummer?.toString()[0];

    if (!grouped[key]) grouped[key] = { inkomst: 0, utgift: 0 };

    if (prefix === "3") {
      grouped[key].inkomst += kre;
      totalInkomst += kre;
    }

    if (["5", "6", "7", "8"].includes(prefix)) {
      grouped[key].utgift += deb;
      totalUtgift += deb;
    }
  });

  const yearData = Object.entries(grouped).map(([month, values]) => ({
    month,
    inkomst: values.inkomst,
    utgift: values.utgift,
  }));

  return {
    totalInkomst: +totalInkomst.toFixed(2),
    totalUtgift: +totalUtgift.toFixed(2),
    totalResultat: +(totalInkomst - totalUtgift).toFixed(2),
    yearData,
  };
};

export default function Page() {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

  // Ladda data när komponenten mountas (bara för inloggade)
  useEffect(() => {
    if (session?.user) {
      const loadData = async () => {
        const delayPromise = new Promise((resolve) => setTimeout(resolve, 400));
        const dataPromise = fetchRawYearData("2025");
        const [, rawData] = await Promise.all([delayPromise, dataPromise]);
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

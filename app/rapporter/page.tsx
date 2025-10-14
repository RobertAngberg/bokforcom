"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import MainLayout from "../_components/MainLayout";
import TillbakaPil from "../_components/TillbakaPil";
import LoadingSpinner from "../_components/LoadingSpinner";

const Huvudbok = dynamic(() => import("./components/Huvudbok/Huvudbok"), {
  loading: () => <LoadingSpinner />,
});

const Balansrapport = dynamic(() => import("./components/Balansrapport/Balansrapport"), {
  loading: () => <LoadingSpinner />,
});

const Resultatrapport = dynamic(() => import("./components/Resultatrapport/Resultatrapport"), {
  loading: () => <LoadingSpinner />,
});

const Momsrapport = dynamic(() => import("./components/Momsrapport/Momsrapport"), {
  loading: () => <LoadingSpinner />,
});

export default function Page() {
  const [activeRapport, setActiveRapport] = useState("overview");

  const renderRapport = () => {
    switch (activeRapport) {
      case "huvudbok":
        return <Huvudbok />;
      case "balansrapport":
        return <Balansrapport />;
      case "resultatrapport":
        return <Resultatrapport />;
      case "momsrapport":
        return <Momsrapport />;
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      {activeRapport === "overview" ? (
        <>
          <h1 className="text-3xl mb-10 text-center text-white">Rapporter</h1>
          <div className="grid gap-6 sm:grid-cols-2">
            <button
              onClick={() => setActiveRapport("huvudbok")}
              className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full text-left"
            >
              <h2 className="text-lg font-semibold text-white">📚 Huvudbok</h2>
            </button>
            <button
              onClick={() => setActiveRapport("balansrapport")}
              className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full text-left"
            >
              <h2 className="text-lg font-semibold text-white">🏦 Balansrapport</h2>
            </button>
            <button
              onClick={() => setActiveRapport("resultatrapport")}
              className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full text-left"
            >
              <h2 className="text-lg font-semibold text-white">📈 Resultatrapport</h2>
            </button>
            <button
              onClick={() => setActiveRapport("momsrapport")}
              className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition w-full text-left"
            >
              <h2 className="text-lg font-semibold text-white">📑 Momsrapport</h2>
            </button>
          </div>
        </>
      ) : (
        <>
          <TillbakaPil onClick={() => setActiveRapport("overview")}>Tillbaka</TillbakaPil>
          {renderRapport()}
        </>
      )}
    </MainLayout>
  );
}

"use client";

import { useState } from "react";
import MainLayout from "../_components/MainLayout";
import TillbakaPil from "../_components/TillbakaPil";
import Balansrapport from "./components/Balansrapport/Balansrapport";
import Momsrapport from "./components/Momsrapport/Momsrapport";
import Resultatrapport from "./components/Resultatrapport/Resultatrapport";
import Huvudbok from "./components/Huvudbok/Huvudbok";

export default function Page() {
  const [activeRapport, setActiveRapport] = useState("overview");

  if (activeRapport === "huvudbok")
    return (
      <MainLayout>
        <TillbakaPil onClick={() => setActiveRapport("overview")}>Tillbaka</TillbakaPil>
        <Huvudbok />
      </MainLayout>
    );
  if (activeRapport === "balansrapport")
    return (
      <MainLayout>
        <TillbakaPil onClick={() => setActiveRapport("overview")}>Tillbaka</TillbakaPil>
        <Balansrapport />
      </MainLayout>
    );
  if (activeRapport === "resultatrapport")
    return (
      <MainLayout>
        <TillbakaPil onClick={() => setActiveRapport("overview")}>Tillbaka</TillbakaPil>
        <Resultatrapport />
      </MainLayout>
    );
  if (activeRapport === "momsrapport")
    return (
      <MainLayout>
        <TillbakaPil onClick={() => setActiveRapport("overview")}>Tillbaka</TillbakaPil>
        <Momsrapport />
      </MainLayout>
    );

  return (
    <MainLayout>
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
    </MainLayout>
  );
}

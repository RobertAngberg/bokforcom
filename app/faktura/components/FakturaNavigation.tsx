"use client";

import { useState } from "react";
import MainLayout from "../../_components/MainLayout";
import Knapp from "../../_components/Knapp";
import Toast from "../../_components/Toast";
import NyFaktura from "./NyFaktura/NyFaktura";
import Sparade from "./Sparade/Sparade";
import LeverantorsfakturorInline from "./LeverantorsfakturorInline";
import { useFaktura } from "../hooks/useFaktura";

type ActiveView = "overview" | "ny" | "sparade" | "leverantorer";

export default function FakturaNavigation() {
  const [activeView, setActiveView] = useState<ActiveView>("overview");
  const [editFakturaId, setEditFakturaId] = useState<number | undefined>(undefined);
  const { toastState, clearToast } = useFaktura();

  const handleEditFaktura = (fakturaId: number) => {
    setEditFakturaId(fakturaId);
    setActiveView("ny");
  };

  const handleBackToOverview = () => {
    setEditFakturaId(undefined);
    setActiveView("overview");
  };

  if (activeView === "overview") {
    return (
      <MainLayout>
        <h1 className="text-3xl font-bold text-slate-100 mb-8">Faktura</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📄 Ny Faktura
            </h2>
            <Knapp text="Skapa Faktura" onClick={() => setActiveView("ny")} className="w-full" />
          </div>

          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📂 Sparade Fakturor
            </h2>
            <Knapp
              text="Visa Sparade"
              onClick={() => setActiveView("sparade")}
              className="w-full"
            />
          </div>

          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📋 Leverantörsfakturor
            </h2>
            <Knapp
              text="Visa Leverantörsfakturor"
              onClick={() => setActiveView("leverantorer")}
              className="w-full"
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Renderera specifika vyer
  return (
    <MainLayout>
      {toastState.isVisible && (
        <Toast message={toastState.message} type={toastState.type} onClose={clearToast} />
      )}

      {activeView === "ny" && (
        <NyFaktura onBackToMenu={handleBackToOverview} editFakturaId={editFakturaId} />
      )}
      {activeView === "sparade" && (
        <Sparade onBackToMenu={handleBackToOverview} onEditFaktura={handleEditFaktura} />
      )}
      {activeView === "leverantorer" && (
        <LeverantorsfakturorInline onBackToMenu={handleBackToOverview} />
      )}
    </MainLayout>
  );
}

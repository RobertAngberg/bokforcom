"use client";

import Knapp from "../../_components/Knapp";
import NyFaktura from "./NyFaktura/NyFaktura";
import Sparade from "./Sparade/Sparade";
import Leverantorsfakturor from "./Leverantorsfakturor/Leverantorsfakturor";
import { useFakturaClient } from "../context/FakturaContextProvider";

export default function FakturaNavigation() {
  const { navigationState, navigateToView, navigateToEdit, navigateBack } = useFakturaClient();
  const activeView = navigationState.currentView;
  const editFakturaId = navigationState.editFakturaId;

  const handleCreateNew = () => {
    navigateToEdit("ny");
  };

  const handleShowSparade = () => {
    navigateToView("sparade");
  };

  const handleShowLeverantorsfakturor = () => {
    navigateToView("leverantorsfakturor");
  };

  const handleEditFaktura = (fakturaId: number) => {
    navigateToEdit("ny", fakturaId);
  };

  const handleBackToOverview = () => {
    navigateBack();
  };

  if (activeView === "menu") {
    return (
      <>
        <h1 className="text-3xl text-center text-slate-100 mb-8">Faktura</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📄 Ny Faktura
            </h2>
            <Knapp text="Skapa Faktura" onClick={handleCreateNew} className="w-full" />
          </div>

          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📂 Sparade Fakturor
            </h2>
            <Knapp text="Visa Sparade" onClick={handleShowSparade} className="w-full" />
          </div>

          <div className="bg-slate-800 rounded-lg shadow p-6 border border-slate-600">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center justify-center gap-3">
              📋 Leverantörsfakturor
            </h2>
            <Knapp
              text="Visa Leverantörsfakturor"
              onClick={handleShowLeverantorsfakturor}
              className="w-full"
            />
          </div>
        </div>
      </>
    );
  }

  // Renderera specifika vyer
  return (
    <>
      {activeView === "ny" && (
        <NyFaktura onBackToMenu={handleBackToOverview} editFakturaId={editFakturaId} />
      )}
      {activeView === "sparade" && (
        <Sparade onBackToMenu={handleBackToOverview} onEditFaktura={handleEditFaktura} />
      )}
      {activeView === "leverantorsfakturor" && (
        <Leverantorsfakturor onBackToMenu={handleBackToOverview} />
      )}
    </>
  );
}

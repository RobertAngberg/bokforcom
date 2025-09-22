"use client";

import MainLayout from "../_components/MainLayout";
import { useFakturaContext } from "./context/FakturaContext";
import { FakturaProvider } from "./context/FakturaContext";
import SparadeFakturorPage from "./components/Sparade/page";
import NyFakturaPage from "./components/NyFaktura/page";

function FakturaContent() {
  const { state, navigateToView, navigateToEdit, navigateBack } = useFakturaContext();
  const { currentView, editFakturaId } = state.navigationState;

  if (currentView === "sparade") {
    return (
      <SparadeFakturorPage
        onNavigateToEdit={(fakturaId) => navigateToEdit("ny", fakturaId)}
        onBackToMenu={navigateBack}
      />
    );
  }

  if (currentView === "ny") {
    return <NyFakturaPage onBackToMenu={navigateBack} editFakturaId={editFakturaId} />;
  }

  return (
    <MainLayout>
      <h1 className="text-3xl mb-10 text-center text-white">Fakturor</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <button
          onClick={() => navigateToView("sparade")}
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition text-left w-full"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📄</span> Sparade fakturor
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">
            Visa och hantera tidigare skapade fakturor.
          </p>
        </button>

        <button
          onClick={() => navigateToView("leverantorsfakturor")}
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition text-left w-full"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📋</span> Leverantörsfakturor
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">
            Hantera inkommande fakturor från leverantörer.
          </p>
        </button>

        <button
          onClick={() => navigateToView("ny")}
          className="block p-5 rounded-lg bg-gray-900 hover:bg-gray-800 transition text-left w-full"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📝</span> Ny faktura
          </h2>
          <p className="text-sm italic text-gray-400 mt-1">Skapa en helt ny faktura från början.</p>
        </button>
      </div>
    </MainLayout>
  );
}

export default function FakturaPage() {
  return (
    <FakturaProvider>
      <FakturaContent />
    </FakturaProvider>
  );
}

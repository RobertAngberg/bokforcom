"use client";

import dynamic from "next/dynamic";
import Knapp from "../../_components/Knapp";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { useFakturaClient } from "../context/hooks/FakturaContext";
import { invalidateLeverantorsfakturaCaches } from "../hooks/useLeverantorer";

// Ladda de tyngre vyerna vid behov så vi slipper skeppa all fakturalogik direkt på första rendern.
// Med ssr: false hålls vyerna helt klientrenderade och klipps bort från initiala serverresponsen.
const NyFaktura = dynamic(() => import("./NyFaktura/NyFaktura"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Sparade = dynamic(() => import("./Sparade/Sparade"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

const Leverantorsfakturor = dynamic(() => import("./Leverantorsfakturor/Leverantorsfakturor"), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export default function FakturaNavigation() {
  const {
    formData,
    navigateToView,
    navigateToEdit,
    navigateBack,
    resetFormData,
    resetKund,
    setFormData,
    navigationState,
  } = useFakturaClient();
  const activeView = navigationState.currentView;

  const handleCreateNew = () => {
    const preservedCompanyFields = {
      företagsnamn: formData.företagsnamn || "",
      adress: formData.adress || "",
      postnummer: formData.postnummer || "",
      stad: formData.stad || "",
      organisationsnummer: formData.organisationsnummer || "",
      momsregistreringsnummer: formData.momsregistreringsnummer || "",
      telefonnummer: formData.telefonnummer || "",
      bankinfo: formData.bankinfo || "",
      epost: formData.epost || "",
      webbplats: formData.webbplats || "",
      logo: formData.logo || "",
      logoWidth:
        typeof formData.logoWidth === "number" && Number.isFinite(formData.logoWidth)
          ? formData.logoWidth
          : 200,
    };

    const preservedPaymentFields = {
      betalningsvillkor: formData.betalningsvillkor || "30",
      drojsmalsranta: formData.drojsmalsranta || "12",
      betalningsmetod: formData.betalningsmetod || "",
    };

    resetFormData();
    resetKund();
    setFormData({
      ...preservedCompanyFields,
      ...preservedPaymentFields,
      id: "",
      artiklar: [],
      fakturanummer: "",
      fakturadatum: "",
      forfallodatum: "",
      nummer: "",
      rotRutAktiverat: false,
      rotRutTyp: "ROT",
      rotRutKategori: "",
      avdragProcent: 0,
      avdragBelopp: 0,
      arbetskostnadExMoms: 0,
      materialkostnadExMoms: 0,
      rotRutBeskrivning: "",
      rotRutStartdatum: "",
      rotRutSlutdatum: "",
    });
    navigateToEdit("ny");
  };

  const handleShowSparade = () => {
    navigateToView("sparade");
  };

  const handleShowLeverantorsfakturor = () => {
    invalidateLeverantorsfakturaCaches();
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
      {activeView === "ny" && <NyFaktura onBackToMenu={handleBackToOverview} />}
      {activeView === "sparade" && (
        <Sparade onBackToMenu={handleBackToOverview} onEditFaktura={handleEditFaktura} />
      )}
      {activeView === "leverantorsfakturor" && (
        <Leverantorsfakturor onBackToMenu={handleBackToOverview} />
      )}
    </>
  );
}

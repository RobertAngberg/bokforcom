"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import Knapp from "../../_components/Knapp";
import LoadingSpinner from "../../_components/LoadingSpinner";
import AnimeradFlik from "../../_components/AnimeradFlik";
import { useFakturaClient } from "../context/hooks/FakturaContext";

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

export default function FakturaClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOffert = searchParams.get("type") === "offert";

  const {
    formData,
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

  const handleCreateNewOffert = () => {
    router.push("/faktura?type=offert");
    handleCreateNew();
  };

  const handleEditFaktura = (fakturaId: number, isOffert?: boolean) => {
    if (isOffert) {
      router.push("/faktura?type=offert");
    }
    navigateToEdit("ny", fakturaId);
  };

  const handleBackToOverview = () => {
    navigateBack();
  };

  if (activeView === "menu") {
    return (
      <>
        <div className="flex items-center justify-center mb-8 relative">
          <h1 className="text-3xl text-slate-100">Faktura</h1>
          <div className="absolute right-0 flex gap-2">
            <Knapp text="+ Ny Faktura" onClick={handleCreateNew} />
            <Knapp text="+ Ny Offert" onClick={handleCreateNewOffert} />
          </div>
        </div>

        {/* Visa sparade fakturor direkt på sidan */}
        <AnimeradFlik title="Sparade Fakturor" icon="📂" forcedOpen={false}>
          <Sparade
            onBackToMenu={undefined}
            onEditFaktura={handleEditFaktura}
            isOffertView={false}
          />
        </AnimeradFlik>

        {/* Visa sparade offerter direkt på sidan */}
        <div className="mt-6">
          <AnimeradFlik title="Sparade Offerter" icon="📄" forcedOpen={false}>
            <Sparade
              onBackToMenu={undefined}
              onEditFaktura={handleEditFaktura}
              isOffertView={true}
            />
          </AnimeradFlik>
        </div>

        {/* Visa leverantörsfakturor direkt på sidan */}
        <div className="mt-6">
          <AnimeradFlik title="Leverantörsfakturor" icon="📋" forcedOpen={false}>
            <Leverantorsfakturor onBackToMenu={undefined} />
          </AnimeradFlik>
        </div>
      </>
    );
  }

  // Renderera specifika vyer
  return (
    <>
      {activeView === "ny" && <NyFaktura onBackToMenu={handleBackToOverview} isOffert={isOffert} />}
      {activeView === "sparade" && (
        <Sparade onBackToMenu={handleBackToOverview} onEditFaktura={handleEditFaktura} />
      )}
      {activeView === "leverantorsfakturor" && (
        <Leverantorsfakturor onBackToMenu={handleBackToOverview} />
      )}
    </>
  );
}

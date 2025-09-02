// Sparade fakturor komponent

//#region Import
"use client";

import { useEffect, useState } from "react";
import { FakturaProvider } from "../FakturaProvider";
import { useFakturaContext } from "../FakturaProvider";
import { useSession } from "next-auth/react";
import KundUppgifter from "../KundUppgifter";
import ProdukterTjanster from "../ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import SparadeFakturor from "../SparadeFakturor";
import AnimeradFlik from "../../_components/AnimeradFlik";
import TillbakaPil from "../../_components/TillbakaPil";
import Knapp from "../../_components/Knapp";
import MainLayout from "../../_components/MainLayout";
import Alternativ from "../Alternativ/Alternativ";
import Betalning from "../Betalning";
import Avsandare from "../Avsandare";
import Link from "next/link";
import {
  saveInvoice,
  hämtaFakturaMedRader,
  deleteFaktura,
  hämtaSparadeFakturor,
  hämtaFöretagsprofil,
  hämtaSparadeKunder,
  hämtaSparadeArtiklar,
} from "../actions";
//#endregion

function FakturorComponent({
  fakturor: initialFakturor,
  kunder,
  artiklar,
}: {
  fakturor: any[];
  kunder: any[];
  artiklar: any[];
}) {
  // State för att styra flikarnas synlighet
  const [showAllFlikar, setShowAllFlikar] = useState(false);
  //#region Context och state
  const { formData, setFormData, setKundStatus } = useFakturaContext();
  // Funktion för att hantera när en faktura väljs
  const hanteraValdFaktura = async (fakturaId: number) => {
    const data = await hämtaFakturaMedRader(fakturaId);
    if (!data || !data.faktura) {
      alert("❌ Kunde inte hämta faktura");
      return;
    }
    const { faktura, artiklar, rotRut } = data;

    setFormData((prev: any) => ({
      ...prev,
      id: faktura.id,
      fakturanummer: faktura.fakturanummer ?? "",
      fakturadatum: faktura.fakturadatum?.toISOString
        ? faktura.fakturadatum.toISOString().slice(0, 10)
        : (faktura.fakturadatum ?? ""),
      forfallodatum: faktura.forfallodatum?.toISOString
        ? faktura.forfallodatum.toISOString().slice(0, 10)
        : (faktura.forfallodatum ?? ""),
      betalningsmetod: faktura.betalningsmetod ?? "",
      betalningsvillkor: faktura.betalningsvillkor ?? "",
      drojsmalsranta: faktura.drojsmalsranta ?? "",
      kundId: faktura.kundId?.toString() ?? "",
      nummer: faktura.nummer ?? "",
      kundmomsnummer: faktura.kundmomsnummer ?? "",
      kundnamn: faktura.kundnamn ?? "",
      kundnummer: faktura.kundnummer ?? "",
      kundorganisationsnummer: faktura.kundorganisationsnummer ?? "",
      kundadress: faktura.kundadress ?? "",
      kundpostnummer: faktura.kundpostnummer ?? "",
      kundstad: faktura.kundstad ?? "",
      kundemail: faktura.kundemail ?? "",
      företagsnamn: faktura.företagsnamn ?? "",
      epost: faktura.epost ?? "",
      adress: faktura.adress ?? "",
      postnummer: faktura.postnummer ?? "",
      stad: faktura.stad ?? "",
      organisationsnummer: faktura.organisationsnummer ?? "",
      momsregistreringsnummer: faktura.momsregistreringsnummer ?? "",
      telefonnummer: faktura.telefonnummer ?? "",
      bankinfo: faktura.bankinfo ?? "",
      webbplats: faktura.webbplats ?? "",
      logo: faktura.logo ?? "",
      logoWidth: faktura.logo_width ?? 200,
      artiklar: artiklar.map((rad: any) => ({
        beskrivning: rad.beskrivning,
        antal: Number(rad.antal),
        prisPerEnhet: Number(rad.prisPerEnhet),
        moms: Number(rad.moms),
        valuta: rad.valuta ?? "SEK",
        typ: rad.typ === "tjänst" ? "tjänst" : "vara",
        rotRutTyp: rad.rotRutTyp,
        rotRutKategori: rad.rotRutKategori,
        avdragProcent: rad.avdragProcent,
        arbetskostnadExMoms: rad.arbetskostnadExMoms,
        rotRutBeskrivning: rad.rotRutBeskrivning,
        rotRutStartdatum: rad.rotRutStartdatum,
        rotRutSlutdatum: rad.rotRutSlutdatum,
        rotRutPersonnummer: rad.rotRutPersonnummer,
        rotRutFastighetsbeteckning: rad.rotRutFastighetsbeteckning,
        rotRutBoendeTyp: rad.rotRutBoendeTyp,
        rotRutBrfOrg: rad.rotRutBrfOrg,
        rotRutBrfLagenhet: rad.rotRutBrfLagenhet,
      })),
      // ROT/RUT-fält från rot_rut-tabellen eller första artikeln med ROT/RUT-data
      rotRutAktiverat:
        !!(rotRut.typ && rotRut.typ !== "") || artiklar.some((a: any) => a.rotRutTyp),
      rotRutTyp: rotRut.typ || artiklar.find((a: any) => a.rotRutTyp)?.rotRutTyp || undefined,
      rotRutKategori:
        (rotRut as any).rotRutKategori ||
        artiklar.find((a: any) => a.rotRutKategori)?.rotRutKategori ||
        undefined,
      avdragProcent:
        rotRut.avdrag_procent ||
        artiklar.find((a: any) => a.avdragProcent)?.avdragProcent ||
        undefined,
      arbetskostnadExMoms:
        rotRut.arbetskostnad_ex_moms ||
        artiklar.find((a: any) => a.arbetskostnadExMoms)?.arbetskostnadExMoms ||
        undefined,
      avdragBelopp: rotRut.avdrag_belopp || undefined,
      personnummer:
        rotRut.personnummer ||
        artiklar.find((a: any) => a.rotRutPersonnummer)?.rotRutPersonnummer ||
        "",
      fastighetsbeteckning:
        rotRut.fastighetsbeteckning ||
        artiklar.find((a: any) => a.rotRutFastighetsbeteckning)?.rotRutFastighetsbeteckning ||
        "",
      rotBoendeTyp: rotRut.rot_boende_typ || undefined,
      brfOrganisationsnummer:
        rotRut.brf_organisationsnummer ||
        artiklar.find((a: any) => a.rotRutBrfOrg)?.rotRutBrfOrg ||
        "",
      brfLagenhetsnummer:
        rotRut.brf_lagenhetsnummer ||
        artiklar.find((a: any) => a.rotRutBrfLagenhet)?.rotRutBrfLagenhet ||
        "",
      // Nya ROT/RUT-fält från rot_rut-tabellen eller första artikeln
      rotRutBeskrivning:
        (rotRut as any).rotRutBeskrivning ||
        artiklar.find((a: any) => a.rotRutBeskrivning)?.rotRutBeskrivning ||
        "",
      rotRutStartdatum:
        (rotRut as any).rotRutStartdatum ||
        artiklar.find((a: any) => a.rotRutStartdatum)?.rotRutStartdatum ||
        "",
      rotRutSlutdatum:
        (rotRut as any).rotRutSlutdatum ||
        artiklar.find((a: any) => a.rotRutSlutdatum)?.rotRutSlutdatum ||
        "",
    }));
    setShowAllFlikar(true);
  };
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  const [fakturor, setFakturor] = useState(initialFakturor);
  //#endregion

  // Spåra aktiv faktura
  const currentInvoiceId = formData.id ? parseInt(formData.id) : undefined;

  //#region Ladda företagsdata centralt när session är tillgänglig
  useEffect(() => {
    if (session?.user?.id && !formData.företagsnamn) {
      hämtaFöretagsprofil(session.user.id).then((profil: any) => {
        if (profil) {
          setFormData((prev: any) => ({
            ...prev,
            företagsnamn: profil.företagsnamn ?? "",
            adress: profil.adress ?? "",
            postnummer: profil.postnummer ?? "",
            stad: profil.stad ?? "",
            organisationsnummer: profil.organisationsnummer ?? "",
            momsregistreringsnummer: profil.momsregistreringsnummer ?? "",
            telefonnummer: profil.telefonnummer ?? "",
            epost: profil.epost ?? "",
            bankinfo: profil.bankinfo ?? "",
            webbplats: profil.webbplats ?? "",
          }));
        }
      });
    }
  }, [session?.user?.id, formData.företagsnamn, setFormData]);
  //#endregion

  //#region Lyssna på reloadFakturor event
  useEffect(() => {
    const reload = async () => {
      const nyaFakturor = await hämtaSparadeFakturor();
      setFakturor(nyaFakturor);
    };

    const handler = () => reload();
    window.addEventListener("reloadFakturor", handler);
    return () => window.removeEventListener("reloadFakturor", handler);
  }, []);
  //#endregion

  // Funktion för att hantera tillbaka-klick
  const hanteraTillbaka = async () => {
    setShowAllFlikar(false);
    // Uppdatera fakturaslistan när vi går tillbaka
    try {
      const nyaFakturor = await hämtaSparadeFakturor();
      setFakturor(nyaFakturor);
    } catch (error) {
      console.error("Fel vid uppdatering av fakturaslista:", error);
    }
  };

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          {showAllFlikar && (
            <div className="absolute left-0 top-1">
              <TillbakaPil onClick={hanteraTillbaka} className="">
                Tillbaka
              </TillbakaPil>
            </div>
          )}
          {!showAllFlikar && (
            <div className="absolute left-0 top-1">
              <Link
                href="/faktura"
                className="flex items-center gap-2 text-white font-bold px-3 py-2 rounded hover:bg-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Tillbaka
              </Link>
            </div>
          )}
          {!showAllFlikar ? (
            <h1 className="text-3xl text-center w-full">Sparade Fakturor</h1>
          ) : (
            <h1 className="text-2xl text-center w-full">
              {formData.fakturanummer && formData.kundnamn
                ? `🧾 Faktura #${formData.fakturanummer} - ${formData.kundnamn}`
                : "Faktura"}
            </h1>
          )}
        </div>

        {!showAllFlikar && (
          <>
            <SparadeFakturor
              fakturor={fakturor}
              activeInvoiceId={currentInvoiceId}
              onSelectInvoice={hanteraValdFaktura}
            />
          </>
        )}

        {showAllFlikar && (
          <>
            <AnimeradFlik title="Avsändare" icon="🧑‍💻">
              <Avsandare />
            </AnimeradFlik>

            <AnimeradFlik title="Kunduppgifter" icon="🧑‍💼">
              <KundUppgifter />
            </AnimeradFlik>

            <AnimeradFlik title="Produkter & Tjänster" icon="📦">
              <ProdukterTjanster />
            </AnimeradFlik>

            <AnimeradFlik title="Betalning" icon="💰">
              <Betalning />
            </AnimeradFlik>

            <AnimeradFlik title="Alternativ" icon="⚙️">
              <Alternativ
                onReload={() => {
                  if (confirm("🔄 Vill du verkligen återställa? All ifylld data försvinner.")) {
                    window.location.reload();
                  }
                }}
                onPreview={() => setShowPreview(true)}
              />
            </AnimeradFlik>
          </>
        )}
      </MainLayout>

      <div id="print-area" className="hidden print:block">
        <Forhandsgranskning />
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl border border-gray-300 rounded-none">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={() => setShowPreview(false)} text="❌ Stäng" />
            </div>
            <div className="p-6 flex justify-center">
              <div className="w-[210mm] h-[297mm] bg-white shadow border rounded">
                <Forhandsgranskning />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Data-loading wrapper för att hålla server-side funktionaliteten
async function DataLoader() {
  const [kunder, fakturor, artiklar] = await Promise.all([
    hämtaSparadeKunder(),
    hämtaSparadeFakturor(),
    hämtaSparadeArtiklar(),
  ]);

  return { kunder, fakturor, artiklar };
}

export default function SparadeFakturorPage() {
  const [data, setData] = useState<{ kunder: any[]; fakturor: any[]; artiklar: any[] } | null>(
    null
  );

  useEffect(() => {
    DataLoader().then(setData);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 overflow-x-hidden px-4 py-10 text-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="w-full p-8 bg-cyan-950 border border-cyan-800 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                <p className="text-slate-100 text-lg">Laddar fakturor...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FakturaProvider>
      <FakturorComponent fakturor={data.fakturor} kunder={data.kunder} artiklar={data.artiklar} />
    </FakturaProvider>
  );
}

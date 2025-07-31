// Kom ihåg; loggan sparas i localStorage

//#region Imports och types
"use client";

import { useEffect, useState } from "react";
import { FakturaProvider } from "../FakturaProvider";
import { useFakturaContext } from "../FakturaProvider";
import { useSession } from "next-auth/react";
import KundUppgifter from "../KundUppgifter";
import ProdukterTjanster from "../ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import AnimeradFlik from "../../_components/AnimeradFlik";
import BakåtPil from "../../_components/BakåtPil";
import Knapp from "../../_components/Knapp";
import MainLayout from "../../_components/MainLayout";
import Alternativ from "../Alternativ/Alternativ";
import Betalning from "../Betalning";
import Avsandare from "../Avsandare";
import { hämtaFöretagsprofil, hämtaSparadeKunder, hämtaSparadeArtiklar } from "../actions";
import Link from "next/link";
//#endregion

function NyFakturaComponent({ kunder, artiklar }: { kunder: any[]; artiklar: any[] }) {
  //#region Context och state
  const { formData, setFormData } = useFakturaContext();
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  //#endregion

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

  // Nollställ formData när komponenten laddas (ny faktura)
  useEffect(() => {
    setFormData((prev: any) => ({
      ...prev,
      id: "",
      fakturanummer: "",
      fakturadatum: "",
      forfallodatum: "",
      kundnamn: "",
      kundId: "",
      kundnummer: "",
      kundorganisationsnummer: "",
      kundadress: "",
      kundpostnummer: "",
      kundstad: "",
      kundemail: "",
      artiklar: [],
    }));
  }, [setFormData]);
  //#endregion

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
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
          <h1 className="text-2xl text-center w-full">Ny Faktura</h1>
        </div>

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
            onReload={() => window.location.reload()}
            onPreview={() => setShowPreview(true)}
          />
        </AnimeradFlik>
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
  const [_, kunder, artiklar] = await Promise.all([
    new Promise((r) => setTimeout(r, 400)),
    hämtaSparadeKunder(),
    hämtaSparadeArtiklar(),
  ]);

  return { kunder, artiklar };
}

export default function NyFakturaPage() {
  const [data, setData] = useState<{ kunder: any[]; artiklar: any[] } | null>(null);

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
                <p className="text-slate-100 text-lg">Laddar...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FakturaProvider>
      <NyFakturaComponent kunder={data.kunder} artiklar={data.artiklar} />
    </FakturaProvider>
  );
}

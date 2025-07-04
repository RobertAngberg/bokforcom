// Kom ihåg; loggan sparas i localStorage

//#region Imports och types
"use client";

import { useEffect, useState } from "react";
import { useFakturaContext } from "./FakturaProvider";
import { useSession } from "next-auth/react";
import KundUppgifter from "./KundUppgifter";
import ProdukterTjanster from "./ProdukterTjänster/ProdukterTjänster";
import Förhandsgranskning from "./Förhandsgranskning/Förhandsgranskning";
import SparadeFakturor from "./SparadeFakturor";
import AnimeradFlik from "../_components/AnimeradFlik";
import Knapp from "../_components/Knapp";
import MainLayout from "../_components/MainLayout";
import Alternativ from "./Alternativ/Alternativ";
import Betalning from "./Betalning";
import Avsandare from "./Avsandare";
import {
  saveInvoice,
  hämtaFakturaMedRader,
  deleteFaktura,
  hämtaSparadeFakturor,
  hämtaFöretagsprofil,
} from "./actions";

type Props = {
  fakturor: any[];
};
//#endregion

export default function Fakturor({ fakturor: initialFakturor }: Props) {
  //#region Context och state
  const { formData, setFormData, setKundStatus } = useFakturaContext();
  const { data: session } = useSession();
  const [showPreview, setShowPreview] = useState(false);
  const [fakturor, setFakturor] = useState(initialFakturor);
  //#endregion

  // Spåra aktiv faktura
  const currentInvoiceId = formData.id ? parseInt(formData.id) : undefined;

  //#region Ladda företagsdata centralt när session är tillgänglig
  useEffect(() => {
    if (session?.user?.id && !formData.företagsnamn) {
      hämtaFöretagsprofil(session.user.id).then((profil) => {
        if (profil) {
          setFormData((prev) => ({
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

  return (
    <>
      <MainLayout>
        <h1 className="text-3xl text-center mb-8">Fakturor</h1>

        <AnimeradFlik title="Sparade fakturor" icon="📂">
          <SparadeFakturor
            // onSelectInvoice={hanteraValdFaktura}
            fakturor={fakturor}
            activeInvoiceId={currentInvoiceId}
          />
        </AnimeradFlik>

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
            // onSave={hanteraSpara}
            onReload={() => window.location.reload()}
            // onPrint={() => window.print()}
            onPreview={() => setShowPreview(true)}
          />
        </AnimeradFlik>
      </MainLayout>

      <div id="print-area" className="hidden print:block">
        <Förhandsgranskning />
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl border border-gray-300 rounded-none">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={() => setShowPreview(false)} text="❌ Stäng" />
            </div>
            <div className="p-6 flex justify-center">
              <div className="w-[210mm] h-[297mm] bg-white shadow border rounded">
                <Förhandsgranskning />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

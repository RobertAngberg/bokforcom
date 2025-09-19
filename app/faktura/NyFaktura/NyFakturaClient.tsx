"use client";

import KundUppgifter from "../_components/KundUppgifter";
import ProdukterTjanster from "../ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "../Forhandsgranskning/Forhandsgranskning";
import AnimeradFlik from "../../_components/AnimeradFlik";
import Knapp from "../../_components/Knapp";
import MainLayout from "../../_components/MainLayout";
import Alternativ from "../Alternativ/Alternativ";
import Betalning from "../_components/Betalning";
import Avsandare from "../_components/Avsandare";
import { FakturaProvider } from "../_context/FakturaContext";
import { useNyFaktura } from "../_hooks/useFakturaClient";
import type { NyFakturaClientProps } from "../_types/types";
import TillbakaPil from "../../_components/TillbakaPil";
import { useRouter } from "next/navigation";

function NyFakturaContent({ initialData }: NyFakturaClientProps) {
  const router = useRouter();
  const { formData, showPreview, closePreview, openPreview, reloadFaktura } =
    useNyFaktura(initialData);

  return (
    <>
      <MainLayout>
        <div className="relative mb-8 flex items-center justify-center">
          <TillbakaPil onClick={() => router.push("/faktura")} />
          <h1 className="text-2xl text-center w-full">
            {formData.fakturanummer && formData.kundnamn
              ? `🧾 Faktura #${formData.fakturanummer} - ${formData.kundnamn}`
              : formData.fakturanummer
                ? `🧾 Faktura #${formData.fakturanummer}`
                : "Ny Faktura"}
          </h1>
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
          <Alternativ onReload={reloadFaktura} onPreview={openPreview} />
        </AnimeradFlik>
      </MainLayout>

      <div id="print-area" className="hidden print:block">
        <Forhandsgranskning />
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative bg-white max-w-[95vw] max-h-[95vh] overflow-auto shadow-2xl border border-gray-300 rounded-none">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={closePreview} text="❌ Stäng" />
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

export default function NyFakturaClient({ initialData }: NyFakturaClientProps) {
  return (
    <FakturaProvider initialData={initialData}>
      <NyFakturaContent initialData={initialData} />
    </FakturaProvider>
  );
}

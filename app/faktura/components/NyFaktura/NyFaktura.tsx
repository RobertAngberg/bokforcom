"use client";

import KundUppgifter from "./KundUppgifter";
import ProdukterTjanster from "./ProdukterTjanster/ProdukterTjanster";
import Forhandsgranskning from "./Forhandsgranskning/Forhandsgranskning";
import AnimeradFlik from "../../../_components/AnimeradFlik";
import Knapp from "../../../_components/Knapp";
import Alternativ from "./Alternativ/Alternativ";
import Betalning from "./Betalning";
import Avsandare from "./Avsandare";
import { useFaktura } from "../../hooks/useFaktura";
import { NyFakturaProps } from "../../types/types";
import TillbakaPil from "../../../_components/TillbakaPil";

export default function NyFaktura({ onBackToMenu, editFakturaId }: NyFakturaProps) {
  const { formData, showPreview, openPreview, closePreview, reloadFaktura, isLoadingFaktura } =
    useFaktura();

  return (
    <>
      <div className="relative mb-8 flex items-center justify-center">
        <TillbakaPil onClick={onBackToMenu} />
        <h1 className="text-2xl text-center w-full">
          {isLoadingFaktura ? (
            <span className="text-blue-400">🔄 Laddar faktura...</span>
          ) : formData.fakturanummer && formData.kundnamn ? (
            `🧾 Faktura #${formData.fakturanummer} - ${formData.kundnamn}`
          ) : formData.fakturanummer ? (
            `🧾 Faktura #${formData.fakturanummer}`
          ) : (
            "Ny Faktura"
          )}
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

      <div id="print-area" className="hidden print:block">
        {!isLoadingFaktura && <Forhandsgranskning />}
      </div>

      {showPreview && !isLoadingFaktura && (
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

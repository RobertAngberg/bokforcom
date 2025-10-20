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

export default function NyFaktura({ onBackToMenu }: NyFakturaProps) {
  const { showPreview, openPreview, closePreview, isLoadingFaktura, fakturaTitle } = useFaktura();

  const titleContent = isLoadingFaktura ? (
    <span className="text-blue-400">🔄 Laddar faktura...</span>
  ) : (
    fakturaTitle
  );

  return (
    <>
      <div className="relative mb-8 flex items-center justify-center">
        <TillbakaPil onClick={onBackToMenu} ariaLabel="Tillbaka" className="gap-0 px-2 py-2">
          {null}
        </TillbakaPil>
        <h1 className="text-2xl text-center w-full">{titleContent}</h1>
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
        <Alternativ onPreview={openPreview} />
      </AnimeradFlik>

      <div id="print-area" className="hidden print:block">
        {!isLoadingFaktura && <Forhandsgranskning />}
      </div>

      {showPreview && !isLoadingFaktura && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3">
          <div className="relative max-h-[95vh] w-full max-w-5xl overflow-auto rounded-none border border-gray-300 bg-white shadow-2xl">
            <div className="absolute top-4 right-4 z-50">
              <Knapp onClick={closePreview} text="❌ Stäng" />
            </div>
            <div className="flex justify-center p-6">
              <div className="w-full max-w-[210mm] bg-white">
                <Forhandsgranskning />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

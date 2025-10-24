import { useState } from "react";
import { useFaktura } from "../../../hooks/useFaktura";
import Modal from "../../../../_components/Modal";
import type { Artikel, FavoritArtikel } from "../../../types/types";

export default function ArtiklarList() {
  const {
    formData,
    produkterTjansterState,
    taBortArtikel,
    startRedigeraArtikel,
    setVisaArtikelModal,
    setValtArtikel,
  } = useFaktura();
  const { blinkIndex } = produkterTjansterState;

  // Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteArtikelIndex, setDeleteArtikelIndex] = useState<number | null>(null);
  const [deleteArtikelName, setDeleteArtikelName] = useState<string>("");

  // Handler functions
  const handleRemove = (index: number, artikelName: string) => {
    setDeleteArtikelIndex(index);
    setDeleteArtikelName(artikelName);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deleteArtikelIndex !== null) {
      taBortArtikel(deleteArtikelIndex);
    }
    setShowDeleteModal(false);
    setDeleteArtikelIndex(null);
    setDeleteArtikelName("");
  };

  const handleEdit = (artikel: Artikel, index: number) => {
    startRedigeraArtikel(artikel, index);
  };

  const handleShowArtikelDetaljer = (artikel: Artikel) => {
    setValtArtikel(artikel as FavoritArtikel);
    setVisaArtikelModal(true);
  };

  const artiklar = formData.artiklar || [];
  if (artiklar.length === 0) return null;

  return (
    <div className="mt-6">
      {/* Header för tillagda artiklar */}
      <div className="mb-4">
        <h3 className="text-white font-bold text-center text-lg">
          Tillagda artiklar ({artiklar.length})
        </h3>
      </div>

      {/* Artikellista - Grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {artiklar.map((a, idx) => {
          const isRotRutMaterial = typeof a.rotRutMaterial === "boolean" ? a.rotRutMaterial : false;

          return (
            <div
              key={idx}
              className={`relative bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg p-3 hover:bg-slate-700 hover:border-slate-500 transition-all ${
                blinkIndex === idx ? "background-pulse" : ""
              }`}
            >
              {/* Checkmark badge */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleEdit(a, idx)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-slate-600 p-1.5 rounded transition-colors"
                  title="Redigera artikel"
                >
                  ✏️
                </button>
                <button
                  onClick={() => {
                    handleRemove(idx, a.beskrivning);
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-slate-600 p-1.5 rounded transition-colors"
                  title="Ta bort artikel"
                >
                  🗑️
                </button>
              </div>

              <div
                className="cursor-pointer pr-16"
                onClick={() => {
                  handleShowArtikelDetaljer(a);
                }}
                title="Klicka för att visa detaljer"
              >
                {/* Beskrivning */}
                <div className="text-white font-semibold mb-2 flex items-start">
                  <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
                  <span className="line-clamp-2">{a.beskrivning}</span>
                </div>

                {/* Info */}
                <div className="text-sm space-y-1">
                  <div className="text-slate-300">
                    <span className="text-slate-400">Antal:</span> {a.antal} •{" "}
                    <span className="text-slate-400">Pris:</span> {a.prisPerEnhet} {a.valuta}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">Exkl. moms:</span>{" "}
                    {(a.antal * a.prisPerEnhet).toFixed(2)} {a.valuta}
                  </div>
                  <div className="text-slate-300">
                    <span className="text-slate-400">Inkl. moms ({a.moms}%):</span>{" "}
                    {(a.antal * a.prisPerEnhet * (1 + a.moms / 100)).toFixed(2)} {a.valuta}
                  </div>
                  {isRotRutMaterial && (
                    <div className="text-purple-400 text-xs font-semibold mt-1">
                      🏠 ROT/RUT-material
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mt-2 pt-2 border-t border-slate-600">
                  <div className="text-white font-bold">
                    {(a.antal * a.prisPerEnhet * (1 + a.moms / 100)).toFixed(2)} {a.valuta}
                  </div>
                  <div className="text-slate-400 text-xs">inkl. moms</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Bekräfta borttagning"
        maxWidth="sm"
        containerClassName="w-full"
      >
        <p className="text-gray-300 mb-4">
          Är du säker på att du vill ta bort artikeln &quot;{deleteArtikelName}&quot;?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-cyan-700 text-white rounded hover:bg-cyan-800"
          >
            Avbryt
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Ta bort
          </button>
        </div>
      </Modal>
    </div>
  );
}

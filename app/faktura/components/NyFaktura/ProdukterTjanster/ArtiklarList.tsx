import { useState } from "react";
import { useFaktura } from "../../../hooks/useFaktura";
import Modal from "../../../../_components/Modal";

// Type for artikel based on usage in component
type ArtikelType = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  valuta: string;
  moms: number;
  typ: string;
  rotRutMaterial?: boolean;
  rotRutTyp?: string;
};

export default function ArtiklarList() {
  const { formData, produkterTjansterState, taBortArtikel } = useFaktura();
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

  const handleEdit = (artikel: ArtikelType, index: number) => {
    // TODO: Implement edit functionality
    console.log("Edit artikel not implemented yet", artikel, index);
  };

  const handleShowArtikelDetaljer = (artikel: ArtikelType) => {
    // TODO: Implement show artikel detaljer functionality
    console.log("Show artikel detaljer not implemented yet", artikel);
  };

  const artiklar = formData.artiklar || [];
  if (artiklar.length === 0) return null;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
      {/* Header för tillagda artiklar */}
      <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
        <h3 className="text-white font-medium">Tillagda artiklar ({artiklar.length})</h3>
      </div>

      {/* Artikellista */}
      <div className="divide-y divide-slate-600">
        {artiklar.map((a, idx) => (
          <div
            key={idx}
            className={`flex justify-between items-center p-4 hover:bg-slate-700 transition-colors ${
              blinkIndex === idx ? "background-pulse" : ""
            }`}
          >
            <div
              className="flex-1 cursor-pointer"
              onClick={() => {
                console.log("🔍 ArtiklarList: Klick registrerat på artikel:", a);
                console.log(
                  "🔍 ArtiklarList: handleShowArtikelDetaljer finns?",
                  !!handleShowArtikelDetaljer
                );
                handleShowArtikelDetaljer(a);
              }}
              title="Klicka för att visa detaljer"
            >
              <div className="text-white font-semibold flex items-center">
                <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                {a.beskrivning}
              </div>
              <div className="text-gray-400 text-sm">
                {a.antal} × {a.prisPerEnhet} {a.valuta} ({a.moms}% moms) — {a.typ}
                {a.rotRutMaterial ? " — ROT/RUT-material" : ""}
                {formData.rotRutAktiverat && a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(a, idx)}
                className="text-blue-400 hover:text-blue-600 p-1"
                title="Redigera artikel"
              >
                ✏️
              </button>
              <button
                onClick={() => {
                  handleRemove(idx, a.beskrivning);
                }}
                className="text-red-400 hover:text-red-600 p-1"
                title="Ta bort artikel"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Bekräfta borttagning"
      >
        <p className="text-gray-300 mb-4">
          Är du säker på att du vill ta bort artikeln &quot;{deleteArtikelName}&quot;?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
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

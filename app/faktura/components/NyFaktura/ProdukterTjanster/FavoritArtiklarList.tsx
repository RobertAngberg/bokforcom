import Modal from "../../../../_components/Modal";
import AnimeradFlik from "../../../../_components/AnimeradFlik";
import { useProdukterTjanster } from "../../../hooks/useProdukterTjanster/useProdukterTjanster";
import { Artikel } from "../../../types/types";

export default function FavoritArtiklarList() {
  const {
    favoritArtiklar,
    ursprungligFavoritId,
    taBortFavoritArtikel,
    laddaFavoritArtikel,
    showDeleteFavoritModal,
    setShowDeleteFavoritModal,
    deleteFavoritId,
    confirmDeleteFavorit,
  } = useProdukterTjanster();

  // Handler functions
  const handleSelectFavorit = (artikel: Artikel) => {
    // Convert string fields to numbers if needed
    const cleanedArtikel: Artikel = {
      ...artikel,
      arbetskostnadExMoms:
        typeof artikel.arbetskostnadExMoms === "string"
          ? parseFloat(artikel.arbetskostnadExMoms)
          : artikel.arbetskostnadExMoms,
    };
    laddaFavoritArtikel(cleanedArtikel);
  };

  const handleDeleteFavorit = (id: number) => {
    taBortFavoritArtikel(id);
  };

  if (!favoritArtiklar || favoritArtiklar.length === 0) return null;
  return (
    <>
      <AnimeradFlik title="Ladda in sparade artiklar" icon="📂">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {favoritArtiklar.map((a) => (
            <div
              key={a.id}
              className="bg-slate-700/50 p-3 rounded-lg border-2 border-dashed border-slate-600 flex flex-col justify-between relative transition-colors hover:bg-slate-700 hover:border-slate-500 cursor-pointer"
            >
              <button
                onClick={() => a.id && handleDeleteFavorit(a.id)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                title="Ta bort favoritartikel"
                disabled={!a.id}
              >
                🗑️
              </button>
              <div onClick={() => handleSelectFavorit(a as Artikel)} className="flex-1">
                <div className="text-white font-semibold">
                  📌 {a.beskrivning}
                  {ursprungligFavoritId === a.id && (
                    <span className="text-green-400 ml-2">— Inladdad</span>
                  )}
                </div>
                <div className="text-gray-400 text-sm mt-1">
                  {a.antal} × {a.prisPerEnhet} {a.valuta} ={" "}
                  {(a.antal * a.prisPerEnhet).toLocaleString("sv-SE")} {a.valuta}
                </div>
                <div className="text-gray-400 text-sm">({a.moms}% moms)</div>
              </div>
            </div>
          ))}
        </div>
      </AnimeradFlik>

      <Modal
        isOpen={showDeleteFavoritModal}
        onClose={() => setShowDeleteFavoritModal(false)}
        title="🗑️ Ta bort favoritartikel"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-white">
            Vill du ta bort favoritartikeln{" "}
            <span className="font-semibold">
              {favoritArtiklar.find((f) => f.id === deleteFavoritId)?.beskrivning ||
                "denna artikel"}
            </span>
            ? Detta kan inte ångras.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteFavoritModal(false)}
              className="px-4 py-2 bg-cyan-700 text-white rounded hover:bg-cyan-800"
            >
              Avbryt
            </button>
            <button
              onClick={() => confirmDeleteFavorit()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Ta bort
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

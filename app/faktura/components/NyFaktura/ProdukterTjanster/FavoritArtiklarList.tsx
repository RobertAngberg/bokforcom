import Knapp from "../../../../_components/Knapp";
import { useProdukterTjanster } from "../../../hooks/useProdukterTjanster";
import { Artikel } from "../../../types/types";

export default function FavoritArtiklarList() {
  const {
    favoritArtiklar,
    showFavoritArtiklar,
    ursprungligFavoritId,
    setShowFavoritArtiklar,
    taBortFavoritArtikel,
    laddaFavoritArtikel,
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
    <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
      {/* Knapp som header */}
      <div className="border-b border-slate-600">
        <Knapp
          onClick={() => setShowFavoritArtiklar(!showFavoritArtiklar)}
          text={showFavoritArtiklar ? "🔼 Dölj sparade artiklar" : "📂 Ladda in sparade artiklar"}
          className="w-full rounded-none border-none"
        />
      </div>

      {/* Artiklar som expanderar nedåt */}
      {showFavoritArtiklar && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritArtiklar.map((a) => (
              <div
                key={a.id}
                className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-3 rounded border border-slate-500 flex flex-col justify-between relative"
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
                  <div className="text-gray-400 text-sm">
                    ({a.moms}% moms) — {a.typ}
                    {a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

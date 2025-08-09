//#region
import Knapp from "../../_components/Knapp";

type FavoritArtikel = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  arbetskostnadExMoms?: number | string;
  id?: number;
};

interface Props {
  favoritArtiklar: FavoritArtikel[];
  showFavoritArtiklar: boolean;
  onToggle: (v: boolean) => void;
  onSelect: (a: FavoritArtikel) => void;
  onDelete: (id?: number) => void;
  inladdadFavoritId?: number | null;
}
//#endregion

export default function FavoritArtiklarList({
  favoritArtiklar,
  showFavoritArtiklar,
  onToggle,
  onSelect,
  onDelete,
  inladdadFavoritId,
}: Props) {
  if (!favoritArtiklar || favoritArtiklar.length === 0) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg overflow-hidden">
      {/* Knapp som header */}
      <div className="border-b border-slate-600">
        <Knapp
          onClick={() => onToggle(!showFavoritArtiklar)}
          text={showFavoritArtiklar ? "🔼 Dölj sparade artiklar" : "📂 Ladda in sparade artiklar"}
          className="w-full rounded-none border-none transition-all duration-200 hover:bg-slate-700"
        />
      </div>

      {/* Artiklar som expanderar nedåt med animation */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${
          showFavoritArtiklar ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          transitionProperty: "max-height, opacity",
        }}
      >
        <div
          className={`p-4 transition-transform duration-300 ${showFavoritArtiklar ? "translate-y-0" : "-translate-y-4"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoritArtiklar.map((a, index) => (
              <div
                key={a.id}
                className="bg-slate-700 hover:bg-slate-600 cursor-pointer p-3 rounded border border-slate-500 flex flex-col justify-between relative transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                style={{
                  transitionDelay: showFavoritArtiklar ? `${index * 50}ms` : "0ms",
                }}
              >
                <button
                  onClick={() => onDelete(a.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                  title="Ta bort favoritartikel"
                >
                  🗑️
                </button>
                <div onClick={() => onSelect(a)} className="flex-1">
                  <div className="text-white font-semibold">
                    📌 {a.beskrivning}
                    {inladdadFavoritId === a.id && (
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
      </div>
    </div>
  );
}

type Artikel = {
  beskrivning: string;
  antal: number;
  prisPerEnhet: number;
  moms: number;
  valuta: string;
  typ: "vara" | "tjänst";
  rotRutTyp?: "ROT" | "RUT";
  rotRutKategori?: string;
  avdragProcent?: number;
  arbetskostnadExMoms?: number;
};

interface ArtiklarListProps {
  artiklar: Artikel[];
  blinkIndex: number | null;
  onRemove: (idx: number) => void;
}

export default function ArtiklarList({ artiklar, blinkIndex, onRemove }: ArtiklarListProps) {
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
            <div>
              <div className="text-white font-semibold flex items-center">
                <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                {a.beskrivning}
              </div>
              <div className="text-gray-400 text-sm">
                {a.antal} × {a.prisPerEnhet} {a.valuta} ({a.moms}% moms) — {a.typ}
                {a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
              </div>
            </div>
            <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600 p-1">
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

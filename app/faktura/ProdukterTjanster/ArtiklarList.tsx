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
  return (
    <ul className="space-y-3">
      {artiklar.map((a, idx) => (
        <li
          key={idx}
          className={`flex justify-between items-center p-3 bg-slate-900 border border-slate-700 rounded ${
            blinkIndex === idx ? "background-pulse" : ""
          }`}
        >
          <div>
            <div className="text-white font-semibold">{a.beskrivning}</div>
            <div className="text-gray-400 text-sm">
              {a.antal} × {a.prisPerEnhet} {a.valuta} ({a.moms}% moms) — {a.typ}
              {a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
            </div>
          </div>
          <button onClick={() => onRemove(idx)} className="text-red-400 hover:text-red-600">
            🗑️
          </button>
        </li>
      ))}
    </ul>
  );
}

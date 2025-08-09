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
  rotRutAntalTimmar?: number;
  rotRutPrisPerTimme?: number;
  rotRutBeskrivning?: string;
  rotRutStartdatum?: string;
  rotRutSlutdatum?: string;
  rotRutPersonnummer?: string;
  rotRutFastighetsbeteckning?: string;
  rotRutBoendeTyp?: string;
  rotRutBrfOrg?: string;
  rotRutBrfLagenhet?: string;
};

interface ArtiklarListProps {
  artiklar: Artikel[];
  blinkIndex: number | null;
  onRemove: (idx: number) => void;
  onEdit?: (artikel: Artikel, idx: number) => void;
  onShow?: (artikel: Artikel) => void;
}

export default function ArtiklarList({
  artiklar,
  blinkIndex,
  onRemove,
  onEdit,
  onShow,
}: ArtiklarListProps) {
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
                console.log("🔍 ArtiklarList: onShow finns?", !!onShow);
                onShow?.(a);
              }}
              title="Klicka för att visa detaljer"
            >
              <div className="text-white font-semibold flex items-center">
                <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                {a.beskrivning}
              </div>
              <div className="text-gray-400 text-sm">
                {a.antal} × {a.prisPerEnhet} {a.valuta} ({a.moms}% moms) — {a.typ}
                {a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirm(`Ta bort "${a.beskrivning}"?`)) {
                    onRemove(idx);
                  }
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
    </div>
  );
}

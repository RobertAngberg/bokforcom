import { useFaktura } from "../_hooks/useFaktura";

export default function ArtiklarList() {
  const { formData, produkterTjansterState, taBortArtikel } = useFaktura();
  const { blinkIndex } = produkterTjansterState;

  // Handler functions
  const handleRemove = (index: number) => {
    taBortArtikel(index);
  };

  const handleEdit = (artikel: any, index: number) => {
    // TODO: Implement edit functionality
    console.log("Edit artikel not implemented yet", artikel, index);
  };

  const handleShowArtikelDetaljer = (artikel: any) => {
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
                {a.rotRutTyp ? ` — ${a.rotRutTyp}` : ""}
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
                  if (confirm(`Ta bort "${a.beskrivning}"?`)) {
                    handleRemove(idx);
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

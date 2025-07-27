//#region Huvud
import { sparaExtrarad, uppdateraUtläggStatus } from "../actions";

interface UtläggProps {
  lönespecUtlägg: any[];
  getStatusBadge: (status: string) => React.ReactElement;
  lönespecId?: number;
}

export default function Utlägg({ lönespecUtlägg, getStatusBadge, lönespecId }: UtläggProps) {
  //#endregion

  if (lönespecUtlägg.length === 0) return null;

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        Utlägg asdf 🎯 VI ÄR HÄR 🎯
      </h4>
      {/* Lägg till utlägg knapp i mitten */}
      <div className="flex justify-center mb-4">
        <button
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          onClick={async () => {
            if (!lönespecId) {
              console.error("❌ Ingen lönespecId tillgänglig!");
              alert("❌ Fel: Ingen lönespec ID hittades");
              return;
            }

            console.log("🎯 LÄGG TILL UTLÄGG KLICKAD!");
            console.log("📋 LönespecId:", lönespecId);
            console.log("📋 Befintliga utlägg:", lönespecUtlägg);

            // Hitta väntande utlägg i UI-datan
            const väntandeUtlägg = lönespecUtlägg.filter((u) => u.status === "Väntande");
            console.log("📋 Väntande utlägg:", väntandeUtlägg);

            if (väntandeUtlägg.length === 0) {
              alert("✅ 0 utlägg tillagda i lönespecen!");
              return;
            }

            try {
              // Lägg till varje väntande utlägg som extrarad direkt
              for (const utlägg of väntandeUtlägg) {
                console.log("🔍 RAW UTLÄGG OBJECT:", utlägg);
                console.log("🔍 utlägg.belopp:", utlägg.belopp, "typeof:", typeof utlägg.belopp);
                console.log("🔍 utlägg.beskrivning:", utlägg.beskrivning);

                const extraradData = {
                  lönespecifikation_id: lönespecId, // Rätt kolumnnamn!
                  kolumn1: utlägg.beskrivning || `Utlägg - ${utlägg.datum}`,
                  kolumn2: "1", // Antal = 1
                  kolumn3: utlägg.belopp.toString(), // Belopp per enhet
                  kolumn4: utlägg.kommentar || "",
                  typ: "manuellPost",
                };

                console.log("📋 EXTRARAD DATA INNAN SPARANDE:", extraradData);
                const result = await sparaExtrarad(extraradData);
                console.log("📋 RESULTAT FRÅN SPARANDE:", result);

                // Uppdatera utlägg status
                await uppdateraUtläggStatus(utlägg.id, "Inkluderat i lönespec");
                console.log("📋 STATUS UPPDATERAD för utlägg", utlägg.id);
              }

              alert(`✅ ${väntandeUtlägg.length} utlägg tillagda i lönespecen!`);
              window.location.reload();
            } catch (error) {
              console.error("❌ Fel vid tillägg:", error);
              alert("❌ Något gick fel!");
            }
          }}
        >
          💰 Lägg till väntande utlägg
        </button>
      </div>{" "}
      <div className="space-y-3">
        {lönespecUtlägg.map((utläggItem) => (
          <div key={utläggItem.id} className="bg-slate-800 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="text-white font-medium">{utläggItem.beskrivning}</h5>
                <p className="text-gray-400 text-sm">
                  {new Date(utläggItem.datum).toLocaleDateString("sv-SE")}
                  {utläggItem.kategori && ` • ${utläggItem.kategori}`}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-bold">
                  {parseFloat(utläggItem.belopp).toLocaleString("sv-SE")} kr
                </div>
                {getStatusBadge(utläggItem.status)}
              </div>
            </div>

            {utläggItem.kommentar && (
              <div className="text-gray-400 text-sm mb-2">{utläggItem.kommentar}</div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>ID: #{utläggItem.id}</span>
              <div className="flex gap-3">
                {utläggItem.kvitto_fil && <span>📎 Kvitto: {utläggItem.kvitto_fil}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

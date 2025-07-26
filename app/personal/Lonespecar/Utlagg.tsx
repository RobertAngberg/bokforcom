//#region Huvud
import { läggTillUtläggILönespec } from "../actions";

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
            
            try {
              const result = await läggTillUtläggILönespec(lönespecId);
              if (result.success) {
                console.log("✅ Utlägg tillagda:", result.count);
                if (result.count === 0) {
                  alert("ℹ️ Inga väntande utlägg hittades för denna anställd. Alla utlägg är redan inkluderade eller bokförda.");
                } else {
                  alert(`✅ ${result.count} utlägg tillagda i lönespecen!`);
                  // Ladda om sidan för att visa uppdateringen
                  window.location.reload();
                }
              } else {
                console.error("❌ Fel:", result.error);
                alert(`❌ Fel: ${result.error}`);
              }
            } catch (error) {
              console.error("❌ Fel vid tillägg:", error);
              alert("❌ Något gick fel!");
            }
          }}
        >
          💰 Lägg till väntande utlägg
        </button>
      </div>      <div className="space-y-3">
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

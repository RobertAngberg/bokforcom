//#region Huvud
import { läggTillUtläggSomExtrarad, uppdateraUtläggStatus } from "../actions";

interface UtläggProps {
  lönespecUtlägg: any[];
  getStatusBadge: (status: string) => React.ReactElement;
  lönespecId?: number;
  onUtläggAdded?: (tillagdaUtlägg: any[], extraradResults: any[]) => Promise<void>; // Uppdaterad callback
}

export default function Utlägg({
  lönespecUtlägg,
  getStatusBadge,
  lönespecId,
  onUtläggAdded,
}: UtläggProps) {
  //#endregion

  const handleLäggTillUtlägg = async () => {
    if (!lönespecId) {
      alert("❌ Fel: Ingen lönespec ID hittades");
      return;
    }

    const väntandeUtlägg = lönespecUtlägg.filter((u) => u.status === "Väntande");

    if (väntandeUtlägg.length === 0) {
      alert("Inga väntande utlägg att lägga till");
      return;
    }

    try {
      const extraradResults = [];
      for (const utlägg of väntandeUtlägg) {
        // Enkel, tydlig funktion - spara resultatet
        const result = await läggTillUtläggSomExtrarad(lönespecId, utlägg);
        extraradResults.push(result);
        await uppdateraUtläggStatus(utlägg.id, "Inkluderat i lönespec");
      }
      alert(`${väntandeUtlägg.length} utlägg tillagda!`);

      // Uppdatera UI genom callback - skicka både utlägg och resultat
      if (onUtläggAdded) {
        await onUtläggAdded(väntandeUtlägg, extraradResults);
      }
    } catch (error) {
      console.error("Fel:", error);
      alert("Något gick fel!");
    }
  };

  if (lönespecUtlägg.length === 0) return null;

  // Visa bara komponenten om det finns väntande utlägg
  const väntandeUtlägg = lönespecUtlägg.filter((u) => u.status === "Väntande");
  if (väntandeUtlägg.length === 0) return null;

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        💰 Väntande utlägg
      </h4>
      {/* Lägg till utlägg knapp i mitten */}
      <div className="flex justify-center mb-4">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          onClick={handleLäggTillUtlägg}
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
                  {utläggItem.belopp.toLocaleString("sv-SE")} kr
                </div>
                {getStatusBadge(utläggItem.status)}
              </div>
            </div>

            {utläggItem.kommentar && (
              <div className="text-gray-400 text-sm mb-2">{utläggItem.kommentar}</div>
            )}

            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>ID: #{utläggItem.id}</span>
              {utläggItem.kvitto_fil && <span>📎 Kvitto: {utläggItem.kvitto_fil}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

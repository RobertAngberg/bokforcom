//#region Huvud
import { läggTillUtläggSomExtrarad, uppdateraUtläggStatus } from "../actions";
import { useEffect, useState } from "react";
import Knapp from "../../_components/Knapp";

interface UtläggProps {
  lönespecUtlägg: any[];
  getStatusBadge: (status: string) => React.ReactElement;
  lönespecId?: number;
  onUtläggAdded?: (tillagdaUtlägg: any[], extraradResults: any[]) => Promise<void>; // Uppdaterad callback
  extrarader?: any[]; // Lägg till extrarader för synkronisering
}

export default function Utlägg({
  lönespecUtlägg,
  getStatusBadge,
  lönespecId,
  onUtläggAdded,
  extrarader = [],
}: UtläggProps) {
  //#endregion

  const [synkroniseradeUtlägg, setSynkroniseradeUtlägg] = useState<any[]>(lönespecUtlägg);
  const [läggerTillUtlägg, setLäggerTillUtlägg] = useState(false);

  // Synkronisera utläggstatus med faktiska extrarader
  useEffect(() => {
    const synkronisera = async () => {
      const uppdateradeUtlägg = await Promise.all(
        lönespecUtlägg.map(async (utlägg) => {
          // Kolla om utlägget faktiskt finns i extrarader
          const finnsIExtrarader = extrarader.some((extrarad) => {
            // Matcha baserat på beskrivning och belopp
            const beskrivningsMatch =
              extrarad.kolumn1?.includes(utlägg.beskrivning) ||
              extrarad.kolumn1?.includes(`Utlägg - ${utlägg.datum}`);
            const beloppMatch = Math.abs(parseFloat(extrarad.kolumn3) - utlägg.belopp) < 0.01;

            return beskrivningsMatch && beloppMatch;
          });

          // Om utlägget är markerat som "Inkluderat" men inte finns i extrarader
          if (utlägg.status === "Inkluderat i lönespec" && !finnsIExtrarader) {
            // Återställ till "Väntande" i databasen
            await uppdateraUtläggStatus(utlägg.id, "Väntande");
            return { ...utlägg, status: "Väntande" };
          }

          return utlägg;
        })
      );

      setSynkroniseradeUtlägg(uppdateradeUtlägg);
    };

    if (lönespecUtlägg.length > 0 && extrarader.length >= 0) {
      synkronisera();
    }
  }, [lönespecUtlägg, extrarader]);

  const handleLäggTillUtlägg = async () => {
    if (!lönespecId) {
      alert("❌ Fel: Ingen lönespec ID hittades");
      return;
    }

    const väntandeUtlägg = synkroniseradeUtlägg.filter((u) => u.status === "Väntande");

    if (väntandeUtlägg.length === 0) {
      alert("Inga väntande utlägg att lägga till");
      return;
    }

    setLäggerTillUtlägg(true);
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
    } finally {
      setLäggerTillUtlägg(false);
    }
  };

  if (synkroniseradeUtlägg.length === 0) return null;

  // Visa komponenten om det finns utlägg (väntande eller inkluderade)
  const väntandeUtlägg = synkroniseradeUtlägg.filter((u) => u.status === "Väntande");
  const inkluderadeUtlägg = synkroniseradeUtlägg.filter(
    (u) => u.status === "Inkluderat i lönespec"
  );

  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        💰 Väntande utlägg
      </h4>
      {/* Lägg till utlägg knapp i mitten */}
      {väntandeUtlägg.length > 0 && (
        <div className="flex justify-center mb-4">
          <Knapp
            text="💰 Lägg till väntande utlägg"
            onClick={handleLäggTillUtlägg}
            loading={läggerTillUtlägg}
            loadingText="Lägger till utlägg..."
            disabled={läggerTillUtlägg}
          />
        </div>
      )}
      <div className="space-y-3">
        {synkroniseradeUtlägg.map((utläggItem) => (
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

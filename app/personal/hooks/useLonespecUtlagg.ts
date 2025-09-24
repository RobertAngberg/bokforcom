import { useEffect, useState } from "react";
import { läggTillUtläggSomExtrarad } from "../actions/lonespecarActions";
import { uppdateraUtläggStatus, hämtaUtlägg } from "../actions/utlaggActions";
import { showToast } from "../../_components/Toast";

export const useLonespecUtlagg = (
  lönespecUtlägg: any[],
  lönespecId?: number,
  extrarader: any[] = [],
  anställdId?: number,
  onUtläggAdded?: (utlägg: any[], extraradResults: any[]) => Promise<void>
) => {
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

  // Hämta alla anställdens utlägg för att visa väntande utlägg
  useEffect(() => {
    const hämtaAllaUtlägg = async () => {
      if (!anställdId) return;

      try {
        const allUtlägg = await hämtaUtlägg(anställdId);

        // Kombinera lönespec-specifika utlägg med alla väntande utlägg
        const kombineradeUtlägg = [
          ...lönespecUtlägg,
          ...allUtlägg.filter(
            (u: any) => u.status === "Väntande" && !lönespecUtlägg.some((lu: any) => lu.id === u.id)
          ),
        ];

        setSynkroniseradeUtlägg(kombineradeUtlägg);
      } catch (error) {
        console.error("Fel vid hämtning av utlägg:", error);
      }
    };

    hämtaAllaUtlägg();
  }, [anställdId, lönespecUtlägg]);

  const handleLäggTillUtlägg = async () => {
    if (!lönespecId) {
      showToast("Fel: Ingen lönespec ID hittades", "error");
      return;
    }

    const väntandeUtlägg = synkroniseradeUtlägg.filter((u) => u.status === "Väntande");

    if (väntandeUtlägg.length === 0) {
      showToast("Inga väntande utlägg att lägga till", "info");
      return;
    }

    setLäggerTillUtlägg(true);
    try {
      const extraradResults: any[] = [];
      for (const utlägg of väntandeUtlägg) {
        // Enkel, tydlig funktion - spara resultatet
        const result = await läggTillUtläggSomExtrarad(lönespecId, utlägg);
        extraradResults.push(result);
        await uppdateraUtläggStatus(utlägg.id, "Inkluderat i lönespec");
      }
      showToast(`${väntandeUtlägg.length} utlägg tillagda!`, "success");

      // Uppdatera UI genom callback - skicka både utlägg och resultat
      if (onUtläggAdded) {
        await onUtläggAdded(väntandeUtlägg, extraradResults);
      }
    } catch (error) {
      console.error("Fel:", error);
      showToast("Något gick fel!", "error");
    } finally {
      setLäggerTillUtlägg(false);
    }
  };

  // Computed values
  const väntandeUtlägg = synkroniseradeUtlägg.filter((u) => u.status === "Väntande");
  const inkluderadeUtlägg = synkroniseradeUtlägg.filter(
    (u) => u.status === "Inkluderat i lönespec"
  );

  return {
    // State
    synkroniseradeUtlägg,
    läggerTillUtlägg,
    // Computed values
    väntandeUtlägg,
    inkluderadeUtlägg,
    // Functions
    handleLäggTillUtlägg,
  };
};

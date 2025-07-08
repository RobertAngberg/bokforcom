"use client";

//#region Huvud
import LönespecCard from "./LönespecView";
import { taBortLönespec } from "../actions";
import { useState } from "react";

interface LönespecListProps {
  lönespecar: any[];
  anställd: any;
  utlägg: any[];
  onBeräkningarUppdaterade: (lönespecId: string, beräkningar: any) => void;
  beräknadeVärden: any;
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  extrarader: any[];
  setExtrarader: React.Dispatch<React.SetStateAction<any[]>>;
  onLönespecUppdaterad?: () => void; // Nytt callback för att uppdatera listan
  visaExtraRader?: boolean; // NY PROP
}

export default function LönespecList({
  lönespecar,
  anställd,
  utlägg,
  onBeräkningarUppdaterade,
  beräknadeVärden,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  onLönespecUppdaterad,
  extrarader,
  setExtrarader,
  visaExtraRader = false, // default false
}: LönespecListProps) {
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});

  const handleTaBortLönespec = async (lönespecId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) {
      return;
    }

    setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: true }));
    try {
      const resultat = await taBortLönespec(parseInt(lönespecId));
      if (resultat.success) {
        alert("✅ Lönespecifikation borttagen!");
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        alert(`❌ Kunde inte ta bort lönespec: ${resultat.message}`);
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      alert("❌ Kunde inte ta bort lönespec");
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: false }));
    }
  };
  //#endregion

  //#region Render
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {lönespecar.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Inga lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}.
          <br />
          <span className="text-sm text-gray-500">
            Skapa lönespecar under "Lönekörning" när det är dags för utbetalning.
          </span>
        </div>
      ) : (
        lönespecar.map((lönespec) => (
          <LönespecCard
            key={lönespec.id}
            lönespec={lönespec}
            anställd={anställd}
            utlägg={utlägg}
            onBeräkningarUppdaterade={onBeräkningarUppdaterade}
            beräknadeVärden={beräknadeVärden}
            ingenAnimering={ingenAnimering}
            onTaBortLönespec={() => handleTaBortLönespec(lönespec.id)}
            taBortLoading={taBortLaddning[lönespec.id] || false}
            extrarader={extrarader}
            visaExtraRader={visaExtraRader} // Skicka vidare
          />
        ))
      )}
    </div>
  );
  //#endregion
}

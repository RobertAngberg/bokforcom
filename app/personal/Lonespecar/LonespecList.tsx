"use client";

//#region Huvud
import LönespecCard from "./LonespecView";
import { taBortLönespec } from "../actions";
import { useState } from "react";
import { useLonespecContext } from "./LonespecContext";

interface LonespecListProps {
  anställd: any;
  utlägg: any[];
  ingenAnimering?: boolean;
  onTaBortLönespec?: () => void;
  taBortLoading?: boolean;
  onLönespecUppdaterad?: () => void;
  visaExtraRader?: boolean;
}

export default function LonespecList({
  anställd,
  utlägg,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  onLönespecUppdaterad,
  visaExtraRader = false,
}: LonespecListProps) {
  const { lönespecar } = useLonespecContext();
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
            Skapa lönespecar under "Lonekorning" när det är dags för utbetalning.
          </span>
        </div>
      ) : (
        lönespecar.map((lönespec) => (
          <LönespecCard
            key={lönespec.id}
            lönespec={lönespec}
            anställd={anställd}
            utlägg={utlägg}
            ingenAnimering={ingenAnimering}
            onTaBortLönespec={() => handleTaBortLönespec(lönespec.id)}
            taBortLoading={taBortLaddning[lönespec.id] || false}
            visaExtraRader={visaExtraRader}
          />
        ))
      )}
    </div>
  );
  //#endregion
}

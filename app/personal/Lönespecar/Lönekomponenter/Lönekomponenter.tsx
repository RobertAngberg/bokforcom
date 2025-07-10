//#region Huvud
"use client";

import { useEffect, useState, useMemo } from "react";
import { hämtaExtrarader, taBortExtrarad } from "../../actions";
import ExtraRader from "../Extrarader/Extrarader";
import LöneTabell from "./LöneTabell";
import { beräknaLönekomponenter } from "../löneberäkningar";

type LönekomponenterProps = {
  lönespec: any;
  grundlön?: number;
  övertid?: number;
  bruttolön?: number;
  socialaAvgifter?: number;
  skatt?: number;
  onBeräkningarUppdaterade?: (lönespecId: string, beräkningar: any) => void;
  onExtraradUppdaterade?: (lönespecId: string, extrarader: any[]) => void;
  visaExtraRader?: boolean; // NY PROP
};

export default function Lönekomponenter({
  lönespec,
  grundlön,
  övertid,
  onBeräkningarUppdaterade,
  onExtraradUppdaterade,
  visaExtraRader = false,
}: LönekomponenterProps) {
  //#endregion

  //#region State
  const [extrarader, setExtrarader] = useState<any[]>([]);
  //#endregion

  //#region Beräkningar
  const beräknadeVärden = useMemo(() => {
    // Från löneberäkningar.ts
    return beräknaLönekomponenter(grundlön ?? 0, övertid ?? 0, lönespec, extrarader);
  }, [grundlön, övertid, lönespec, extrarader]);
  //#endregion

  //#region Effects
  useEffect(() => {
    if (lönespec?.id) {
      hämtaExtrarader(lönespec.id).then(setExtrarader);
    }
  }, [lönespec?.id]);

  useEffect(() => {
    if (onBeräkningarUppdaterade && lönespec?.id && beräknadeVärden) {
      onBeräkningarUppdaterade(lönespec.id, beräknadeVärden);
    }
  }, [beräknadeVärden, onBeräkningarUppdaterade, lönespec?.id]);

  useEffect(() => {
    if (onExtraradUppdaterade && lönespec?.id) {
      onExtraradUppdaterade(lönespec.id, extrarader);
    }
  }, [extrarader, onExtraradUppdaterade, lönespec?.id]);
  //#endregion

  //#region Handlers
  const handleTaBortExtrarad = async (extraradId: number) => {
    if (confirm("Är du säker på att du vill ta bort denna rad?")) {
      try {
        await taBortExtrarad(extraradId);
        if (lönespec?.id) {
          hämtaExtrarader(lönespec.id).then(setExtrarader);
        }
      } catch (error) {
        console.error("Fel vid borttagning av extrarad:", error);
        alert("Kunde inte ta bort raden");
      }
    }
  };

  const handleNyRad = async () => {
    if (lönespec?.id) {
      try {
        const nyaExtrarader = await hämtaExtrarader(lönespec.id);

        setExtrarader(nyaExtrarader);

        // ✅ TVINGA OMBERÄKNING DIREKT
        setTimeout(() => {
          const nyaBeräkningar = beräknaLönekomponenter(
            grundlön ?? 0,
            övertid ?? 0,
            lönespec,
            nyaExtrarader
          );

          if (onBeräkningarUppdaterade && lönespec?.id) {
            onBeräkningarUppdaterade(lönespec.id, nyaBeräkningar);
          }
        }, 100);
      } catch (error) {
        console.error("❌ Fel vid omladdning av extrarader:", error);
      }
    }
  };
  //#endregion

  return (
    // för att lägga till i commit git....
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Lönekomponenter</h3>

      <LöneTabell
        beräknadeVärden={beräknadeVärden}
        extrarader={extrarader}
        onTaBortExtrarad={handleTaBortExtrarad}
      />

      {visaExtraRader && (
        <ExtraRader
          lönespecId={lönespec?.id}
          grundlön={beräknadeVärden.grundlön}
          onNyRad={handleNyRad}
        />
      )}
    </div>
  );
}

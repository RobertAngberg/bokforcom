//#region Huvud
"use client";

import { useEffect, useMemo } from "react";
import { hämtaExtrarader, taBortExtrarad } from "../../../../actions/lonespecarActions";
import ExtraRader from "../Extrarader/Extrarader";
import LöneTabell from "./LoneTabell";
import { beräknaLonekomponenter } from "../../../../utils/loneberakningar";
import { useLonespec } from "../../../../hooks/useLonespecar";
import type { LonekomponenterProps } from "../../../../types/types";

export default function Lonekomponenter({
  lönespec,
  grundlön,
  övertid,
  visaExtraRader = false,
  anstalldId,
}: LonekomponenterProps) {
  const { extrarader, setExtrarader, setBeräknadeVärden } = useLonespec();
  const lönespecNumeriskId = lönespec?.id;
  const lönespecKey = lönespecNumeriskId !== undefined ? lönespecNumeriskId.toString() : undefined;
  const currentExtrarader = lönespecKey ? extrarader[lönespecKey] : undefined;

  //#region Effects
  // Hämta extrarader från context
  useEffect(() => {
    if (lönespecNumeriskId === undefined || currentExtrarader) return;

    let isMounted = true;
    hämtaExtrarader(lönespecNumeriskId).then((rader) => {
      if (isMounted) {
        setExtrarader(lönespecNumeriskId.toString(), rader);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lönespecNumeriskId, currentExtrarader, setExtrarader]);

  // Beräkna värden
  const beräknadeVärden = useMemo(() => {
    return beräknaLonekomponenter(grundlön ?? 0, övertid ?? 0, lönespec, currentExtrarader ?? []);
  }, [grundlön, övertid, lönespec, currentExtrarader]);

  // Spara i context när beräknadeVärden ändras
  useEffect(() => {
    if (lönespecKey) setBeräknadeVärden(lönespecKey, beräknadeVärden);
  }, [lönespecKey, beräknadeVärden, setBeräknadeVärden]);
  //#endregion

  return (
    // för att lägga till i commit git....
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Lonekomponenter</h3>

      <LöneTabell
        beräknadeVärden={beräknadeVärden}
        extrarader={currentExtrarader ?? []}
        grundlön={grundlön}
        onTaBortExtrarad={async (extraradId) => {
          await taBortExtrarad(extraradId);
          if (lönespecNumeriskId === undefined || !lönespecKey) return;
          hämtaExtrarader(lönespecNumeriskId).then((rader) => setExtrarader(lönespecKey, rader));
        }}
      />

      {visaExtraRader && (
        <ExtraRader
          lönespecId={lönespec.id}
          onNyRad={async () => {
            if (lönespecNumeriskId === undefined || !lönespecKey) return;
            hämtaExtrarader(lönespecNumeriskId).then((rader) => setExtrarader(lönespecKey, rader));
          }}
          grundlön={grundlön}
          anstalldId={anstalldId}
        />
      )}
    </div>
  );
}

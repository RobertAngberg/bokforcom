//#region Huvud
"use client";

import { useEffect, useMemo } from "react";
import { hamtaExtrarader, taBortExtrarad } from "../../../../actions/lonespecarActions";
import ExtraRader from "../Extrarader/Extrarader";
import LöneTabell from "./LoneTabell";
import { beräknaLonekomponenter } from "../../../../utils/loneberakningar";
import type { LonekomponenterProps } from "../../../../types/types";

export default function Lonekomponenter({
  lönespec,
  grundlön,
  övertid,
  visaExtraRader = false,
  anstalldId,
  skattetabell,
  skattekolumn,
  extrarader,
  onExtraraderChange,
  setBeräknadeVärden,
}: LonekomponenterProps) {
  const lönespecNumeriskId = lönespec?.id;
  const lönespecKey = lönespecNumeriskId !== undefined ? lönespecNumeriskId.toString() : undefined;
  const currentExtrarader = useMemo(() => extrarader ?? [], [extrarader]);

  //#region Effects
  // Hämta extrarader från context
  useEffect(() => {
    if (lönespecNumeriskId === undefined || extrarader !== undefined) return;

    let isMounted = true;
    hamtaExtrarader(lönespecNumeriskId).then((rader) => {
      if (isMounted) {
        onExtraraderChange(rader);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [lönespecNumeriskId, extrarader, onExtraraderChange]);

  // Beräkna värden
  const beräknadeVärden = useMemo(() => {
    return beräknaLonekomponenter(grundlön ?? 0, övertid ?? 0, lönespec, currentExtrarader, {
      skattetabell,
      skattekolumn,
    });
  }, [grundlön, övertid, lönespec, currentExtrarader, skattetabell, skattekolumn]);

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
        extrarader={currentExtrarader}
        grundlön={grundlön}
        onTaBortExtrarad={async (extraradId) => {
          await taBortExtrarad(extraradId);
          if (lönespecNumeriskId === undefined) return;
          const rader = await hamtaExtrarader(lönespecNumeriskId);
          onExtraraderChange(rader);
        }}
      />

      {visaExtraRader && (
        <ExtraRader
          lönespecId={lönespec.id}
          onNyRad={async () => {
            if (lönespecNumeriskId === undefined) return;
            const rader = await hamtaExtrarader(lönespecNumeriskId);
            onExtraraderChange(rader);
          }}
          grundlön={grundlön}
          anstalldId={anstalldId}
        />
      )}
    </div>
  );
}

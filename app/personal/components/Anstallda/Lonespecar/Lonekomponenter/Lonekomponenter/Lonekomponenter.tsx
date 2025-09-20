//#region Huvud
"use client";

import { useEffect, useMemo } from "react";
import { hämtaExtrarader, taBortExtrarad } from "../../../../../actions/lonespecarActions";
import ExtraRader from "../../Extrarader/Extrarader";
import LöneTabell from "./LoneTabell";
import { beräknaLonekomponenter } from "../../loneberakningar";
import { useLonespec } from "../../../../../hooks/useLonespecar";

type LonekomponenterProps = {
  lönespec: any;
  grundlön?: number;
  övertid?: number;
  visaExtraRader?: boolean; // NY PROP
  anstalldId?: number;
};

export default function Lonekomponenter({
  lönespec,
  grundlön,
  övertid,
  visaExtraRader = false,
  anstalldId,
}: LonekomponenterProps) {
  const { extrarader, setExtrarader, setBeräknadeVärden } = useLonespec();

  //#region Effects
  // Hämta extrarader från context
  useEffect(() => {
    if (lönespec?.id && !extrarader[lönespec.id]) {
      hämtaExtrarader(lönespec.id).then((rader) => setExtrarader(lönespec.id, rader));
    }
  }, [lönespec?.id]);

  // Beräkna värden
  const beräknadeVärden = useMemo(() => {
    return beräknaLonekomponenter(
      grundlön ?? 0,
      övertid ?? 0,
      lönespec,
      extrarader[lönespec.id] || []
    );
  }, [grundlön, övertid, lönespec, extrarader]);

  // Spara i context när beräknadeVärden ändras
  useEffect(() => {
    if (lönespec?.id) setBeräknadeVärden(lönespec.id, beräknadeVärden);
  }, [lönespec?.id, beräknadeVärden, setBeräknadeVärden]);
  //#endregion

  return (
    // för att lägga till i commit git....
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Lonekomponenter</h3>

      <LöneTabell
        beräknadeVärden={beräknadeVärden}
        extrarader={extrarader[lönespec.id] || []}
        grundlön={grundlön}
        onTaBortExtrarad={async (extraradId) => {
          await taBortExtrarad(extraradId);
          hämtaExtrarader(lönespec.id).then((rader) => setExtrarader(lönespec.id, rader));
        }}
      />

      {visaExtraRader && (
        <ExtraRader
          lönespecId={lönespec.id}
          onNyRad={async () => {
            hämtaExtrarader(lönespec.id).then((rader) => setExtrarader(lönespec.id, rader));
          }}
          grundlön={grundlön}
          anstalldId={anstalldId}
        />
      )}
    </div>
  );
}

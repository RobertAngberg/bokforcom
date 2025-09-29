"use client";

//#region Huvud
import LönespecView from "./LonespecView";
import Knapp from "../../../../_components/Knapp";
import type { LonespecListProps } from "../../../types/types";

export default function LonespecList({
  anställd,
  utlägg,
  ingenAnimering,
  // onTaBortLönespec,
  // taBortLoading,
  // onLönespecUppdaterad,
  visaExtraRader = false,
}: LonespecListProps) {
  // TODO: Get this data from props instead of useAnstallda to avoid multiple hook instances
  // const { state, handlers } = useAnstallda({
  //   enableLonespecMode: true,
  //   onLönespecUppdaterad,
  // });

  // const { lönespecar, taBortLaddning } = state;
  // const { handleTaBortLönespec, handleNavigateToLonekorning } = handlers;

  // Temporary fix - use empty arrays to prevent crashes
  const lönespecar: Array<{ id: number }> = [];
  const taBortLaddning: Record<number, boolean> = {};
  const handleTaBortLönespec = async () => {};
  const handleNavigateToLonekorning = () => {};
  //#endregion

  //#region Render
  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {lönespecar.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="mb-4">
            Inga slutförda lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}.
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Lönespecifikationer kopplade till ej slutförda lönekörningar kan finnas.
          </div>
          <div className="flex justify-center">
            <Knapp text="Gå till Lönekörningar" onClick={handleNavigateToLonekorning} />
          </div>
        </div>
      ) : (
        lönespecar.map((lönespec) => (
          <LönespecView
            key={lönespec.id}
            lönespec={lönespec}
            anställd={anställd}
            utlägg={utlägg}
            ingenAnimering={ingenAnimering}
            onTaBortLönespec={() => handleTaBortLönespec()}
            taBortLoading={taBortLaddning[lönespec.id] || false}
            visaExtraRader={visaExtraRader}
          />
        ))
      )}
    </div>
  );
  //#endregion
}

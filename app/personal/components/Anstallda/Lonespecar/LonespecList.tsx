"use client";

//#region Huvud
import LönespecView from "./LonespecView";
import { useLonespecList } from "../../../hooks/useLonespecList";
import Toast from "../../../../_components/Toast";
import Knapp from "../../../../_components/Knapp";
import type { LonespecListProps } from "../../../types/types";

export default function LonespecList({
  anställd,
  utlägg,
  ingenAnimering,
  onTaBortLönespec,
  taBortLoading,
  onLönespecUppdaterad,
  visaExtraRader = false,
}: LonespecListProps) {
  const {
    lönespecar,
    taBortLaddning,
    toast,
    setToast,
    handleTaBortLönespec,
    handleNavigateToLonekorning,
  } = useLonespecList(onLönespecUppdaterad);
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
            onTaBortLönespec={() => handleTaBortLönespec(lönespec.id)}
            taBortLoading={taBortLaddning[lönespec.id] || false}
            visaExtraRader={visaExtraRader}
          />
        ))
      )}

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
  //#endregion
}

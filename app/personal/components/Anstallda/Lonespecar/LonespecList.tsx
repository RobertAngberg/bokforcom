"use client";

//#region Huvud
import LönespecView from "./LonespecView";
import { taBortLönespec } from "../../../actions/lonespecarActions";
import { useState } from "react";
import { useLonespec } from "../../../hooks/useLonespec";
import Toast from "../../../../_components/Toast";
import Knapp from "../../../../_components/Knapp";

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
  const { lönespecar } = useLonespec();
  const [taBortLaddning, setTaBortLaddning] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  const handleTaBortLönespec = async (lönespecId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) {
      return;
    }

    setTaBortLaddning((prev) => ({ ...prev, [lönespecId]: true }));
    try {
      const resultat = await taBortLönespec(parseInt(lönespecId));
      if (resultat.success) {
        setToast({
          message: "Lönespecifikation borttagen!",
          type: "success",
          isVisible: true,
        });
        onLönespecUppdaterad?.(); // Uppdatera listan
      } else {
        setToast({
          message: `Kunde inte ta bort lönespec: ${resultat.message}`,
          type: "error",
          isVisible: true,
        });
      }
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      setToast({
        message: "Kunde inte ta bort lönespec",
        type: "error",
        isVisible: true,
      });
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
          <div className="mb-4">
            Inga slutförda lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}.
          </div>
          <div className="text-sm text-gray-500 mb-4">
            Lönespecifikationer kopplade till ej slutförda lönekörningar kan finnas.
          </div>
          <div className="flex justify-center">
            <Knapp
              text="Gå till Lönekörningar"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/personal/Lonekorning";
                }
              }}
            />
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
          isVisible={toast.isVisible}
          onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        />
      )}
    </div>
  );
  //#endregion
}

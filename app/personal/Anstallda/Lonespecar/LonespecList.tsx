"use client";

//#region Huvud
import LönespecView from "./LonespecView";
import { taBortLönespec } from "../../_actions/lonespecarActions";
import { kollaAktivLönespecFörAnställd } from "../../_actions/checkPagaendeLonespec";
import { useState, useEffect } from "react";
import { useLonespec } from "../../_hooks/useLonespec";
import Toast from "../../../_components/Toast";
import Knapp from "../../../_components/Knapp";

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
  const [aktivLönespecInfo, setAktivLönespecInfo] = useState<{
    harAktivLönespec: boolean;
    lönekörningPeriod?: string;
    lönekörningStatus?: string;
  } | null>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "info" as "success" | "error" | "info",
    isVisible: false,
  });

  // Kolla efter pågående lönespecar när komponenten laddas
  useEffect(() => {
    const kollaPågåendeLönespec = async () => {
      if (anställd?.id) {
        const result = await kollaAktivLönespecFörAnställd(anställd.id);
        if (result.success && result.data) {
          setAktivLönespecInfo(result.data);
        }
      }
    };
    kollaPågåendeLönespec();
  }, [anställd?.id]);

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
            Inga historiska lönespecifikationer hittades för {anställd.förnamn} {anställd.efternamn}
            .
          </div>

          {aktivLönespecInfo?.harAktivLönespec ? (
            <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 mb-4">
              <div className="text-gray-300 mb-4">
                Det finns en oavslutad lönespec för{" "}
                <strong className="text-white">{anställd.förnamn}</strong> i lönekörning{" "}
                <strong className="text-white">{aktivLönespecInfo.lönekörningPeriod}</strong>
              </div>
              <div className="flex justify-center">
                <Knapp
                  text="Gå till Lönekörningar"
                  onClick={() => (window.location.href = "/personal/lonekorning")}
                  className="bg-blue-600 hover:bg-blue-700"
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-600 border border-slate-500 rounded-lg p-4">
              <div className="text-gray-300 text-sm">
                Skapa lönespecar under <strong className="text-white">"Lönekörning"</strong> när det
                är dags för utbetalning.
              </div>
              <div className="mt-3 flex justify-center">
                <Knapp
                  text="Gå till Lönekörningar"
                  onClick={() => (window.location.href = "/personal/lonekorning")}
                  className="bg-slate-500 hover:bg-slate-400"
                />
              </div>
            </div>
          )}
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

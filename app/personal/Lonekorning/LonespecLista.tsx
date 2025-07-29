"use client";

import { useState } from "react";
import LönespecView from "../Lonespecar/LonespecView";
import Knapp from "../../_components/Knapp";

interface LonespecListaProps {
  valdaSpecar: any[];
  anstallda: any[];
  utlaggMap: Record<number, any[]>;
  onTaBortSpec: (specId: number) => Promise<void>;
  onHämtaBankgiro: () => void;
  onMailaSpecar: () => void;
  onBokför: () => void;
  onGenereraAGI: () => void;
  onBokförSkatter: () => void;
}

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
}: LonespecListaProps) {
  const [taBortLaddning, setTaBortLaddning] = useState<Record<number, boolean>>({});

  if (valdaSpecar.length === 0) return null;

  const handleTaBortLönespec = async (spec: any) => {
    if (!confirm("Är du säker på att du vill ta bort denna lönespecifikation?")) return;
    setTaBortLaddning((prev) => ({ ...prev, [spec.id]: true }));
    try {
      await onTaBortSpec(spec.id);
    } catch (error) {
      console.error("❌ Fel vid borttagning av lönespec:", error);
      alert("❌ Kunde inte ta bort lönespec");
    } finally {
      setTaBortLaddning((prev) => ({ ...prev, [spec.id]: false }));
    }
  };

  return (
    <div className="space-y-2">
      {/* Lönespecar */}
      <>
        {valdaSpecar.map((spec) => {
          const anstalld = anstallda.find((a) => a.id === spec.anställd_id);
          const utlagg = anstalld ? utlaggMap[anstalld.id] || [] : [];

          return (
            <LönespecView
              key={spec.id}
              lönespec={spec}
              anställd={anstalld}
              utlägg={utlagg}
              ingenAnimering={false}
              taBortLoading={taBortLaddning[spec.id] || false}
              visaExtraRader={true}
              onTaBortLönespec={() => handleTaBortLönespec(spec)}
            />
          );
        })}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Knapp text="🏦 Hämta bankgirofil" onClick={onHämtaBankgiro} />
          <Knapp text="✉️ Maila lönespecar" onClick={onMailaSpecar} />
          <Knapp text="📖 Bokför" onClick={onBokför} />
          <Knapp text="📊 Generera AGI" onClick={onGenereraAGI} />
          <Knapp text="💰 Bokför skatter" onClick={onBokförSkatter} />
        </div>
      </>
    </div>
  );
}

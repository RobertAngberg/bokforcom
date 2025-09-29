"use client";

import LönespecView from "../../Anstallda/Lonespecar/LonespecView";
import Wizard from "../../Wizard/Wizard";
import { LonespecListaProps } from "../../../types/types";
import { useLonekorning } from "../../../hooks/useLonekorning";
import { useWizard } from "../../../hooks/useWizard";
import { markeraStegFärdigt } from "../../../actions/lonekorningActions";

export default function LonespecLista({
  valdaSpecar,
  anstallda,
  utlaggMap,
  lönekörning,
  onTaBortSpec,
  onHämtaBankgiro,
  onMailaSpecar,
  onBokför,
  onGenereraAGI,
  onBokförSkatter,
  onLönekörningUppdaterad,
}: LonespecListaProps) {
  console.log("🔍 DEBUG LonespecLista: valdaSpecar =", valdaSpecar);
  console.log("🔍 DEBUG LonespecLista: anstallda =", anstallda);
  console.log("🔍 DEBUG LonespecLista: lönekörning =", lönekörning);
  // Behåll bara logiken för att ta bort lönespecar från gamla hooken
  const {
    specListTaBortLaddning: taBortLaddning,
    specListHandleTaBortLönespec: handleTaBortLönespec,
  } = useLonekorning({
    enableSpecListMode: true,
    specListValdaSpecar: valdaSpecar,
    specListLönekörning: lönekörning,
    onSpecListTaBortSpec: onTaBortSpec,
    onSpecListHämtaBankgiro: onHämtaBankgiro,
  });

  // Använd nya wizard-hooken
  const wizard = useWizard({
    lönekörning,
    onMaila: onMailaSpecar,
    onBokför,
    onGenereraAGI,
    onBokförSkatter,
  });

  // Hantera "Markera färdig"-klick
  const handleMarkeraFärdig = async (lönekörningId: number) => {
    try {
      const result = await markeraStegFärdigt(lönekörningId);
      if (!result.success) {
        console.error("Kunde inte markera steg som färdigt:", result.error);
      } else if (result.data && onLönekörningUppdaterad) {
        // Uppdatera parent component med ny data
        onLönekörningUppdaterad(result.data);
      }
    } catch (error) {
      console.error("Fel vid markering av steg som färdigt:", error);
    }
  };

  if (valdaSpecar.length === 0) return null;

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
      </>

      {/* Extra spacing */}
      <div className="h-4"></div>

      {/* Wizard */}
      <Wizard
        steps={wizard.steps}
        isComplete={wizard.isComplete}
        lönekörningId={lönekörning?.id}
        onMarkeraFärdig={handleMarkeraFärdig}
      />
    </div>
  );
}
